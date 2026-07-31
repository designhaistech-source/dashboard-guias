#!/usr/bin/env python3
"""Testes visuais da aba "Comparecimento" (Relatórios e documentos).

Captura screenshots do conjunto de abas e do formulário de comparecimento em
mobile e desktop, compara com os baselines versionados e falha quando:
  - algum rótulo de aba trunca (ellipsis) ou quebra em 2+ linhas;
  - as abas divergem em largura, altura ou alinhamento de topo;
  - algum rótulo/campo do formulário trunca;
  - a página tem rolagem horizontal;
  - o screenshot diverge do baseline acima do limiar.

Uso:
  python3 scripts/visual/check-comparecimento-visual.py
  python3 scripts/visual/check-comparecimento-visual.py --update   # regrava baselines
  python3 scripts/visual/check-comparecimento-visual.py --base http://localhost:8080

Baselines: scripts/visual/baselines/comparecimento-<shot>__<viewport>.png
Diffs:     scripts/visual/output/
Exit code 1 em qualquer falha (usado como gate de build em validate.sh).
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

ROUTE = "/documentos"
VIEWPORTS = [
    {"name": "mobile", "width": 390, "height": 1200},
    {"name": "desktop", "width": 1280, "height": 1000},
]
SHOTS = [
    {"name": "tabs", "selector": '[role="tablist"]'},
    {"name": "form", "selector": '[role="tabpanel"][data-state="active"]'},
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
  const panel = document.querySelector('[role="tabpanel"][data-state="active"]');
  const texts = panel
    ? Array.from(panel.querySelectorAll('label, span, button, p'))
        .filter((el) => (el.innerText || '').trim().length > 0)
        .filter((el) => el.scrollWidth > el.clientWidth + 1)
        .map((el) => (el.innerText || '').trim().slice(0, 40))
    : [];
  return {
    tabs,
    clippedTexts: [...new Set(texts)],
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


async def run_viewport(browser, base: str, viewport: dict, update: bool) -> list[str]:
    failures: list[str] = []
    label = viewport["name"]
    context = await browser.new_context(
        viewport={"width": viewport["width"], "height": viewport["height"]}
    )
    page = await context.new_page()
    try:
        await page.goto(f"{base}{ROUTE}", wait_until="networkidle")
        # Terceira aba = Comparecimento
        await page.locator('[role="tab"]').nth(2).click()
        await page.add_style_tag(content=FREEZE_CSS)
        await page.wait_for_timeout(400)

        m = await page.evaluate(MEASURE)
        tabs = m["tabs"]
        for tab in tabs:
            if tab["truncated"]:
                failures.append(f'{label}: rótulo "{tab["text"]}" truncado')
            if tab["lines"] > 1.5:
                failures.append(f'{label}: rótulo "{tab["text"]}" quebrou em 2+ linhas')
        for key, desc in (("width", "larguras"), ("height", "alturas"), ("top", "topos")):
            values = sorted({round(tab[key]) for tab in tabs})
            if len(values) > 1:
                failures.append(f"{label}: {desc} de aba desalinhadas {values}")
        if m["clippedTexts"]:
            failures.append(f"{label}: textos cortados no formulário {m['clippedTexts']}")
        if m["horizontalOverflow"]:
            failures.append(f"{label}: rolagem horizontal na página")

        for shot in SHOTS:
            key = f"comparecimento-{shot['name']}__{label}"
            baseline = BASELINES / f"{key}.png"
            target = baseline if (update or not baseline.exists()) else OUTPUT / f"{key}.png"
            target.parent.mkdir(parents=True, exist_ok=True)
            await page.locator(shot["selector"]).first.screenshot(path=str(target))
            if target is baseline:
                print(f"[baseline] {key}")
                continue
            pct, note = compare(baseline, target, OUTPUT / f"{key}.diff.png")
            if pct > THRESHOLD:
                failures.append(f"{key}: {pct:.2f}% diferente {note}".strip())
                print(f"[FALHOU]  {key} — {pct:.2f}% de pixels alterados {note}".strip())
            else:
                print(f"[ok]      {key} — {pct:.2f}%")
    finally:
        await context.close()
    return failures


async def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://localhost:8080")
    parser.add_argument("--update", action="store_true", help="regrava os baselines")
    args = parser.parse_args()

    failures: list[str] = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for viewport in VIEWPORTS:
            failures += await run_viewport(browser, args.base, viewport, args.update)
        await browser.close()

    print()
    if failures:
        print("Falhas visuais na aba Comparecimento:")
        for f in failures:
            print(f"  - {f}")
        print(f"\nDiffs em {OUTPUT}/. Se a mudança é intencional, rode com --update.")
        return 1
    print("Aba Comparecimento aprovada em mobile e desktop.")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
