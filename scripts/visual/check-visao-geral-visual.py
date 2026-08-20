#!/usr/bin/env python3
"""Regressão visual da página "Visão geral" em vários tamanhos de viewport.

Captura a página inteira do dashboard (/) nas larguras reais de uso, compara
com baselines versionados e falha quando:
  - o screenshot diverge do baseline acima do limiar (mudança de layout);
  - a página gera rolagem horizontal;
  - o número de colunas dos cards de indicadores foge do esperado
    (1 no mobile, 2 em larguras intermediárias, 4 no desktop largo);
  - alguma seção dividida (procedimentos / qualidade) fica lado a lado com
    largura insuficiente para leitura confortável.

Uso:
  python3 scripts/visual/check-visao-geral-visual.py
  python3 scripts/visual/check-visao-geral-visual.py --update    # regrava baselines
  python3 scripts/visual/check-visao-geral-visual.py --only 768

Baselines: scripts/visual/baselines/visao-geral__<caso>.png
Diffs:     scripts/visual/output/
Exit code 1 em qualquer falha (usado como gate em validate.sh).
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

from PIL import Image, ImageChops
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent
BASELINES = ROOT / "baselines"
OUTPUT = ROOT / "output"

BASE_URL = "http://localhost:8080"
ROUTE = "/"
# Aguarda os KPIs renderizarem (a página tem skeleton inicial).
READY_SELECTOR = '[data-chart="daily"], [data-chart="types"]'

# Larguras escolhidas pelo espaço que o conteúdo precisa, não por categorias
# fixas: menor viewport suportado, celulares comuns, tablets retrato/paisagem,
# notebooks e desktop largo.
CASES = [
    {"name": "320", "width": 320, "height": 1600, "kpi_cols": 1},
    {"name": "390", "width": 390, "height": 1600, "kpi_cols": 1},
    {"name": "414", "width": 414, "height": 1600, "kpi_cols": 1},
    {"name": "640", "width": 640, "height": 1600, "kpi_cols": 2},
    {"name": "768", "width": 768, "height": 1600, "kpi_cols": 2},
    {"name": "1024", "width": 1024, "height": 1600, "kpi_cols": 2},
    {"name": "1280", "width": 1280, "height": 1600, "kpi_cols": 4},
    {"name": "1440", "width": 1440, "height": 1600, "kpi_cols": 4},
    {"name": "1920", "width": 1920, "height": 1600, "kpi_cols": 4},
]

# Percentual máximo de pixels alterados tolerado por caso.
THRESHOLD = 0.4
# Diferença por canal ignorada (antialias/subpixel).
CHANNEL_TOLERANCE = 12
# Largura mínima confortável de leitura para cada metade de uma seção dividida.
MIN_SPLIT_HALF_WIDTH = 330

# Mede colunas de grid e larguras das seções divididas direto no DOM.
LAYOUT_JS = """() => {
  const docW = document.documentElement.clientWidth;
  const cols = (el) => el
    ? getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length
    : 0;

  // Grid dos KPIs: primeiro grid que contém os cards de indicador.
  const kpi = document.querySelector('[data-testid="kpi-grid"]')
    ?? [...document.querySelectorAll('main div.grid')].find(
        (g) => g.querySelectorAll(':scope > *').length === 4
          && /guias/i.test(g.textContent || ''));

  const splits = [...document.querySelectorAll('main div.grid')]
    .filter((g) => g.querySelector('[data-chart="procedures"], [data-chart="quality-status"]'))
    .map((g) => {
      const kids = [...g.children].map((c) => Math.round(c.getBoundingClientRect().width));
      const top = kids.length > 1
        ? new Set([...g.children].map((c) => Math.round(c.getBoundingClientRect().top)))
        : new Set([0]);
      return { widths: kids, sideBySide: top.size === 1 && kids.length > 1 };
    });

  return {
    hscroll: document.documentElement.scrollWidth > docW + 1,
    docW,
    kpiCols: cols(kpi),
    splits,
  };
}"""


async def capture(page, case, dest: Path) -> dict:
    await page.set_viewport_size({"width": case["width"], "height": case["height"]})
    await page.goto(BASE_URL + ROUTE, wait_until="networkidle")
    await page.wait_for_selector(READY_SELECTOR, timeout=20000)
    # Neutraliza animações/caret para screenshots determinísticos.
    await page.add_style_tag(
        content="*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}"
    )
    await page.wait_for_timeout(500)
    layout = await page.evaluate(LAYOUT_JS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    await page.screenshot(path=str(dest))
    return layout


def compare(baseline: Path, current: Path, diff_path: Path) -> tuple[float, str]:
    a = Image.open(baseline).convert("RGB")
    b = Image.open(current).convert("RGB")
    if a.size != b.size:
        return 100.0, f"tamanho mudou {a.size} -> {b.size}"

    diff = ImageChops.difference(a, b).convert("L").point(
        lambda v: 255 if v > CHANNEL_TOLERANCE else 0
    )
    changed = sum(diff.histogram()[1:])
    pct = (changed / (a.size[0] * a.size[1])) * 100
    if pct > THRESHOLD:
        diff_path.parent.mkdir(parents=True, exist_ok=True)
        overlay = b.copy()
        overlay.paste(Image.new("RGB", a.size, (255, 0, 0)), mask=diff)
        Image.blend(b, overlay, 0.6).save(diff_path)
    return pct, ""


def check_layout(case, layout) -> list[str]:
    problems: list[str] = []
    if layout["hscroll"]:
        problems.append("gera rolagem horizontal")
    if layout["kpiCols"] and layout["kpiCols"] != case["kpi_cols"]:
        problems.append(
            f"cards de indicadores em {layout['kpiCols']} coluna(s), esperado {case['kpi_cols']}"
        )
    for i, split in enumerate(layout["splits"]):
        if split["sideBySide"] and min(split["widths"]) < MIN_SPLIT_HALF_WIDTH:
            problems.append(
                f"seção dividida #{i + 1} lado a lado com metade de {min(split['widths'])}px "
                f"(mínimo {MIN_SPLIT_HALF_WIDTH}px) — deveria empilhar"
            )
    return problems


async def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--update", action="store_true", help="regrava os baselines")
    parser.add_argument("--only", help="filtra por nome do caso (ex.: 768)")
    args = parser.parse_args()

    cases = [c for c in CASES if not args.only or c["name"] == args.only]
    if not cases:
        print("Nenhum caso corresponde ao filtro informado.")
        return 1

    failures: list[str] = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        for case in cases:
            key = f"visao-geral__{case['name']}"
            baseline = BASELINES / f"{key}.png"
            current = OUTPUT / f"{key}.png"
            dest = baseline if (args.update or not baseline.exists()) else current

            layout = await capture(page, case, dest)
            problems = check_layout(case, layout)

            if dest is baseline:
                print(f"[baseline] {key}")
            else:
                pct, note = compare(baseline, current, OUTPUT / f"{key}.diff.png")
                if pct > THRESHOLD:
                    problems.append(f"{pct:.2f}% de pixels alterados {note}".strip())
                else:
                    print(f"[ok]      {key} — {pct:.2f}%")

            for problem in problems:
                failures.append(f"{key}: {problem}")
                print(f"[FALHOU]  {key} — {problem}")

        await browser.close()

    if failures:
        print("\nProblemas de responsividade/visual na Visão geral:")
        for f in failures:
            print(f"  - {f}")
        print(f"\nVeja os diffs em {OUTPUT}/ (pixels alterados em vermelho).")
        print("Se a mudança é intencional, rode com --update para atualizar os baselines.")
        return 1

    print("\nVisão geral confere com os baselines em todos os viewports.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
