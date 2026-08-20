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
    {"name": "320", "width": 320, "height": 1600},
    {"name": "390", "width": 390, "height": 1600},
    {"name": "414", "width": 414, "height": 1600},
    {"name": "640", "width": 640, "height": 1600},
    {"name": "768", "width": 768, "height": 1600},
    {"name": "1024", "width": 1024, "height": 1600},
    {"name": "1280", "width": 1280, "height": 1600},
    {"name": "1440", "width": 1440, "height": 1600},
    {"name": "1920", "width": 1920, "height": 1600},
]

# Percentual máximo de pixels alterados tolerado por caso.
THRESHOLD = 0.4
# Diferença por canal ignorada (antialias/subpixel).
CHANNEL_TOLERANCE = 12
# Largura mínima confortável de leitura para cada metade de uma seção dividida.
MIN_SPLIT_HALF_WIDTH = 330
# Breakpoints de container (px) usados pela página, espelhando src/routes/index.tsx.
KPI_2_COLS_AT = 480    # @[30rem]
KPI_4_COLS_AT = 1088   # @[68rem]
CHARTS_ROW_SPLIT_AT = 992  # @[62rem]
SECTION_SPLIT_AT = 704     # @[44rem]

# Mede rolagem horizontal, colunas dos KPIs, empilhamento das seções divididas,
# a linha "por dia + por tipo" e elementos que estourem a viewport.
LAYOUT_JS = """() => {
  const docW = document.documentElement.clientWidth;
  const round = (n) => Math.round(n);
  const cols = (el) => el
    ? getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length
    : 0;

  const measure = (grid) => {
    if (!grid) return null;
    const kids = [...grid.children];
    const widths = kids.map((c) => round(c.getBoundingClientRect().width));
    const tops = new Set(kids.map((c) => round(c.getBoundingClientRect().top)));
    return { widths, sideBySide: kids.length > 1 && tops.size === 1 };
  };

  const grids = [...document.querySelectorAll('main div.grid')];
  const gridWith = (sel) => grids.find((g) => g.querySelector(sel));

  const kpi = document.querySelector('[data-testid="kpi-grid"]');
  const chartsRow = gridWith('[data-chart="daily"]');
  const splitGrids = grids.filter(
    (g) => g.querySelector('[data-chart="procedures"], [data-chart="quality-status"]')
      && g !== chartsRow,
  );

  // Qualquer elemento visível fora da viewport (fora de scrollers legítimos).
  const overflowing = [];
  for (const el of document.querySelectorAll('main *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') continue;
    if (String(el.className || '').includes('sr-only')) continue;
    let inScroller = false;
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      if (['auto', 'scroll', 'hidden'].includes(getComputedStyle(a).overflowX)) { inScroller = true; break; }
    }
    if (inScroller) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > docW + 1 || r.left < -1) {
      overflowing.push({
        tag: el.tagName.toLowerCase(),
        cls: String(el.className || '').slice(0, 60),
        left: round(r.left),
        right: round(r.right),
      });
    }
  }

  // Gráficos: svg nunca deve exceder o container nem degenerar.
  const charts = [...document.querySelectorAll('[data-chart]')].map((host) => {
    const svg = host.querySelector('svg');
    const hr = host.getBoundingClientRect();
    const sr = svg ? svg.getBoundingClientRect() : null;
    return {
      id: host.getAttribute('data-chart'),
      hostW: round(hr.width),
      svgW: sr ? round(sr.width) : 0,
      svgH: sr ? round(sr.height) : 0,
    };
  });

  return {
    hscroll: document.documentElement.scrollWidth > docW + 1,
    docW,
    contentW: (() => {
      const c = [...document.querySelectorAll('main div')]
        .find((d) => getComputedStyle(d).containerType !== 'normal');
      if (!c) return docW;
      const cs = getComputedStyle(c);
      return round(c.getBoundingClientRect().width
        - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
    })(),
    kpiCols: cols(kpi),
    chartsRow: measure(chartsRow),
    splits: splitGrids.map(measure),
    overflowing: overflowing.slice(0, 6),
    charts,
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
    content_w = layout["contentW"]
    expected_kpi_cols = (
        4 if content_w >= KPI_4_COLS_AT else 2 if content_w >= KPI_2_COLS_AT else 1
    )

    if layout["hscroll"]:
        problems.append("gera rolagem horizontal na página")
    for el in layout["overflowing"]:
        problems.append(
            f"elemento fora da viewport: <{el['tag']} class=\"{el['cls']}\"> "
            f"({el['left']}–{el['right']}px em {layout['docW']}px)"
        )

    if layout["kpiCols"] and layout["kpiCols"] != expected_kpi_cols:
        problems.append(
            f"cards de indicadores em {layout['kpiCols']} coluna(s), esperado "
            f"{expected_kpi_cols} para {content_w}px de conteúdo"
        )

    sections = [
        ("por dia + por tipo", layout["chartsRow"], CHARTS_ROW_SPLIT_AT),
    ] + [
        (f"seção dividida #{i + 1}", s, SECTION_SPLIT_AT)
        for i, s in enumerate(layout["splits"])
    ]
    for label, section, split_at in sections:
        expected_side_by_side = content_w >= split_at
        if not section:
            problems.append(f"{label}: seção não encontrada no DOM")
            continue
        if section["sideBySide"] != expected_side_by_side:
            estado = "lado a lado" if section["sideBySide"] else "empilhada"
            esperado = "lado a lado" if expected_side_by_side else "empilhada"
            problems.append(f"{label}: {estado}, esperado {esperado}")
        if not section["sideBySide"] and any(
            w < content_w * 0.9 for w in section["widths"]
        ):
            problems.append(f"{label}: empilhada mas sem ocupar a largura disponível")
        if section["sideBySide"] and min(section["widths"]) < MIN_SPLIT_HALF_WIDTH:
            problems.append(
                f"{label}: metade com {min(section['widths'])}px "
                f"(mínimo {MIN_SPLIT_HALF_WIDTH}px) — deveria empilhar"
            )

    for chart in layout["charts"]:
        if chart["svgW"] > chart["hostW"] + 2:
            problems.append(
                f"gráfico '{chart['id']}' mais largo que o container "
                f"({chart['svgW']}px > {chart['hostW']}px)"
            )
        if chart["svgW"] < 80 or chart["svgH"] < 80:
            problems.append(
                f"gráfico '{chart['id']}' degenerado ({chart['svgW']}x{chart['svgH']}px)"
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
