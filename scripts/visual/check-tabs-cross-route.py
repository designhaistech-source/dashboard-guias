#!/usr/bin/env python3
"""Testes visuais cruzados das abas do sistema.

Navega para Relatórios e documentos (`/documentos`), Busca CID-10 (`/cid`) e
Emitir guia (`/emitir`), seleciona a última aba de cada rota (em `/documentos`
é "Comparecimento") e:

  - captura screenshot do conjunto de abas e do painel ativo;
  - compara com os baselines versionados;
  - falha se algum rótulo truncar ou quebrar em 2+ linhas;
  - falha se largura, altura ou topo das abas divergirem dentro da rota;
  - falha se a altura das abas divergir ENTRE as rotas (mesmo viewport),
    garantindo alinhamento idêntico em todas as telas.

Uso:
  python3 scripts/visual/check-tabs-cross-route.py
  python3 scripts/visual/check-tabs-cross-route.py --update
  python3 scripts/visual/check-tabs-cross-route.py --base http://localhost:8080

Baselines: scripts/visual/baselines/tabs-<rota>-<shot>__<viewport>.png
Diffs:     scripts/visual/output/
Exit code 1 em qualquer falha (gate de build em validate.sh).
"""

from __future__ import annotations

import argparse
import asyncio
from pathlib import Path

from PIL import Image, ImageChops
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent
BASELINES = ROOT / "baselines"
OUTPUT = ROOT / "output"

ROUTES = [
    {"name": "documentos", "path": "/documentos", "label": "Relatórios e documentos"},
    {"name": "cid", "path": "/cid", "label": "Busca CID-10"},
    {"name": "emitir", "path": "/emitir", "label": "Emitir guia"},
]

VIEWPORTS = [
    {"name": "mobile", "width": 390, "height": 1200},
    {"name": "desktop", "width": 1280, "height": 1000},
]

SHOTS = [
    {"name": "tabs", "selector": '[role="tablist"]'},
    {"name": "panel", "selector": '[role="tabpanel"][data-state="active"]'},
]

THRESHOLD = 0.4
CHANNEL_TOLERANCE = 12
FREEZE_CSS = (
    "*,*::before,*::after{animation:none!important;transition:none!important;"
    "caret-color:transparent!important}"
)

MEASURE = """
() => {
  const lines = (el) => {
    const lh = parseFloat(getComputedStyle(el).lineHeight || '0');
    return lh ? el.getBoundingClientRect().height / lh : 1;
  };
  const tabs = Array.from(document.querySelectorAll('[role="tab"]')).map((tab) => {
    const label = tab.querySelector('span') ?? tab;
    const rect = tab.getBoundingClientRect();
    return {
      text: (label.innerText || '').trim(),
      width: rect.width,
      height: rect.height,
      top: rect.top,
      truncated: label.scrollWidth > label.clientWidth + 1,
      lines: lines(label),
    };
  });
  return {
    tabs,
    horizontalOverflow: document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1,
  };
}
"""


def compare(baseline: Path, current: Path, diff_path: Path) -> tuple[float, str]:
    a = Image.open(baseline).convert("RGB")
    b = Image.open(current).convert("RGB")
    if a.size != b.size:
        return 100.0, f"tamanho mudou {a.size} -> {b.size}"

    mask = ImageChops.difference(a, b).convert("L").point(
        lambda v: 255 if v > CHANNEL_TOLERANCE else 0
    )
    changed = sum(mask.histogram()[1:])
    pct = (changed / (a.size[0] * a.size[1])) * 100
    if pct > THRESHOLD:
        diff_path.parent.mkdir(parents=True, exist_ok=True)
        overlay = b.copy()
        overlay.paste(Image.new("RGB", a.size, (255, 0, 0)), mask=mask)
        Image.blend(b, overlay, 0.6).save(diff_path)
    return pct, ""


async def run_route(browser, base: str, route: dict, viewport: dict, update: bool):
    """Retorna (falhas, altura das abas) para uma rota/viewport."""
    failures: list[str] = []
    vp = viewport["name"]
    tag = f'{route["name"]}/{vp}'
    context = await browser.new_context(
        viewport={"width": viewport["width"], "height": viewport["height"]}
    )
    page = await context.new_page()
    try:
        await page.goto(f"{base}{route['path']}", wait_until="networkidle")
        tabs_locator = page.locator('[role="tab"]')
        count = await tabs_locator.count()
        if count == 0:
            return [f"{tag}: nenhuma aba encontrada em {route['path']}"], None
        # Última aba: em /documentos corresponde a "Comparecimento".
        await tabs_locator.nth(count - 1).click()
        await page.add_style_tag(content=FREEZE_CSS)
        await page.wait_for_timeout(400)

        m = await page.evaluate(MEASURE)
        tabs = m["tabs"]
        for tab in tabs:
            if tab["truncated"]:
                failures.append(f'{tag}: rótulo "{tab["text"]}" truncado')
            if tab["lines"] > 1.5:
                failures.append(f'{tag}: rótulo "{tab["text"]}" quebrou em 2+ linhas')
        for key, desc in (("width", "larguras"), ("height", "alturas"), ("top", "topos")):
            values = sorted({round(tab[key]) for tab in tabs})
            if len(values) > 1:
                failures.append(f"{tag}: {desc} de aba desalinhadas {values}")
        if m["horizontalOverflow"]:
            failures.append(f"{tag}: rolagem horizontal na página")

        for shot in SHOTS:
            key = f"tabs-{route['name']}-{shot['name']}__{vp}"
            baseline = BASELINES / f"{key}.png"
            target = baseline if (update or not baseline.exists()) else OUTPUT / f"{key}.png"
            target.parent.mkdir(parents=True, exist_ok=True)
            element = page.locator(shot["selector"]).first
            if await element.count() == 0:
                failures.append(f"{key}: seletor {shot['selector']} não encontrado")
                continue
            await element.screenshot(path=str(target))
            if target == baseline:
                print(f"[baseline] {key}")
                continue
            pct, note = compare(baseline, target, OUTPUT / f"{key}.diff.png")
            if pct > THRESHOLD:
                failures.append(f"{key}: {pct:.2f}% diferente {note}".strip())
                print(f"[FALHOU]  {key} — {pct:.2f}% de pixels alterados {note}".strip())
            else:
                print(f"[ok]      {key} — {pct:.2f}%")

        height = round(tabs[0]["height"]) if tabs else None
        return failures, height
    finally:
        await context.close()


async def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://localhost:8080")
    parser.add_argument("--update", action="store_true", help="regrava os baselines")
    parser.add_argument("--only", help="filtra por nome da rota")
    args = parser.parse_args()

    routes = [r for r in ROUTES if not args.only or r["name"] == args.only]
    if not routes:
        print("Nenhuma rota corresponde ao filtro informado.")
        return 1

    failures: list[str] = []
    heights: dict[str, dict[str, int]] = {v["name"]: {} for v in VIEWPORTS}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for viewport in VIEWPORTS:
            for route in routes:
                route_failures, height = await run_route(
                    browser, args.base, route, viewport, args.update
                )
                failures += route_failures
                if height is not None:
                    heights[viewport["name"]][route["name"]] = height
        await browser.close()

    # Alinhamento entre rotas: mesma altura de aba no mesmo viewport.
    for vp, by_route in heights.items():
        distinct = sorted(set(by_route.values()))
        if len(distinct) > 1:
            failures.append(
                f"{vp}: altura de aba diverge entre rotas {by_route}"
            )
        elif by_route:
            print(f"[ok]      alinhamento entre rotas ({vp}) — {distinct[0]}px")

    print()
    if failures:
        print("Falhas visuais nas abas:")
        for f in failures:
            print(f"  - {f}")
        print(f"\nDiffs em {OUTPUT}/. Se a mudança é intencional, rode com --update.")
        return 1
    print("Abas alinhadas em Relatórios e documentos, Busca CID-10 e Emitir guia.")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
