#!/usr/bin/env python3
"""Regressão visual dos títulos das etapas da Guia SP/SADT (desktop + mobile).

Captura o bloco "Etapas preenchidas" do formulário SP/SADT em viewports
desktop e mobile, compara com baselines versionados e falha quando:
  - o screenshot diverge do baseline acima do limiar (mudança de layout);
  - algum título trunca (scrollWidth > clientWidth ou reticências);
  - algum título quebra em 2+ linhas;
  - o bloco gera rolagem horizontal.

Uso:
  python3 scripts/visual/check-sadt-steps-visual.py
  python3 scripts/visual/check-sadt-steps-visual.py --update   # regrava baselines

Baselines: scripts/visual/baselines/sadt-steps__<caso>.png
Diffs:     scripts/visual/output/
Exit code 1 em qualquer falha (usado como gate em validate.sh).
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

ROUTE = "/emitir"
STEPS_SELECTOR = '[data-testid="form-steps"]'
FORM_READY_SELECTOR = '[data-testid="proc-solic-headers"], [data-testid="form-steps"]'

# Desktop e mobile: larguras reais de uso, incluindo o menor viewport suportado.
CASES = [
    {"name": "desktop-1440", "width": 1440, "height": 1000, "mobile": False},
    {"name": "desktop-1280", "width": 1280, "height": 1000, "mobile": False},
    {"name": "mobile-390", "width": 390, "height": 900, "mobile": True},
    {"name": "mobile-320", "width": 320, "height": 900, "mobile": True},
]

THRESHOLD = 0.4
CHANNEL_TOLERANCE = 12
FREEZE_CSS = (
    "*,*::before,*::after{animation:none!important;transition:none!important;"
    "caret-color:transparent!important}"
)

MEASURE = """
() => {
  const block = document.querySelector('[data-testid="form-steps"]');
  if (!block) return { missing: true };
  const labels = Array.from(
    block.querySelectorAll('[data-testid="status-pill-label"]')
  ).map((el) => {
    const cs = getComputedStyle(el);
    const lh = parseFloat(cs.lineHeight || '0');
    const rect = el.getBoundingClientRect();
    return {
      text: (el.textContent || '').replace(/\\s+/g, ' ').trim(),
      width: Math.round(rect.width),
      truncated:
        el.scrollWidth > el.clientWidth + 1 || cs.textOverflow === 'ellipsis',
      lines: lh ? rect.height / lh : 1,
    };
  });
  return {
    labels,
    count: labels.length,
    overflow: block.scrollWidth - block.clientWidth,
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


async def open_sadt_form(page, base: str) -> None:
    """Abre /emitir e seleciona o tipo de guia 'Ambulatorial / SADT'."""
    await page.goto(f"{base}{ROUTE}", wait_until="domcontentloaded")
    sadt = page.get_by_role("heading", name="Ambulatorial / SADT").first
    await sadt.wait_for(state="visible", timeout=20_000)

    # Retenta até a hidratação do React registrar o handler do card.
    for _ in range(20):
        await sadt.evaluate("(el) => el.closest('button')?.click()")
        try:
            await page.wait_for_selector(
                STEPS_SELECTOR, state="attached", timeout=1_500
            )
            return
        except Exception:
            continue
    raise AssertionError(
        "Formulário SP/SADT não renderizou após selecionar o tipo de guia"
    )


async def run_case(browser, base: str, case: dict, update: bool) -> list[str]:
    failures: list[str] = []
    label = case["name"]

    context = await browser.new_context(
        viewport={"width": case["width"], "height": case["height"]},
        is_mobile=case["mobile"],
        has_touch=case["mobile"],
    )
    page = await context.new_page()
    try:
        await open_sadt_form(page, base)
        await page.add_style_tag(content=FREEZE_CSS)
        await page.wait_for_timeout(250)

        steps = page.locator(STEPS_SELECTOR).first
        await steps.scroll_into_view_if_needed()
        if not await steps.is_visible():
            failures.append(f"{label}: bloco de etapas não visível")
            print(f"[FALHOU]  {label} — bloco de etapas ausente")
            return failures

        m = await page.evaluate(MEASURE)
        if m.get("missing") or not m.get("count"):
            failures.append(f"{label}: nenhuma etapa encontrada")
            return failures

        for item in m["labels"]:
            if item["truncated"]:
                failures.append(f'{label}: etapa "{item["text"]}" truncada')
            if item["lines"] > 1.5:
                failures.append(f'{label}: etapa "{item["text"]}" quebrou em 2+ linhas')
        if m["overflow"] > 1:
            failures.append(
                f"{label}: rolagem horizontal no bloco de etapas ({m['overflow']}px)"
            )

        key = f"sadt-steps__{label}"
        baseline = BASELINES / f"{key}.png"
        target = baseline if (update or not baseline.exists()) else OUTPUT / f"{key}.png"
        target.parent.mkdir(parents=True, exist_ok=True)
        await steps.screenshot(path=str(target))

        if target == baseline:
            print(f"[baseline] {key} — {m['count']} etapas")
            return failures

        pct, note = compare(baseline, target, OUTPUT / f"{key}.diff.png")
        if pct > THRESHOLD:
            failures.append(f"{key}: {pct:.2f}% diferente {note}".strip())
            print(f"[FALHOU]  {key} — {pct:.2f}% de pixels alterados {note}".strip())
        else:
            print(f"[ok]      {key} — {pct:.2f}% ({m['count']} etapas)")
        return failures
    finally:
        await context.close()


async def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://localhost:8080")
    parser.add_argument("--update", action="store_true", help="regrava os baselines")
    args = parser.parse_args()

    base = args.base.rstrip("/")
    failures: list[str] = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            for case in CASES:
                failures += await run_case(browser, base, case, args.update)
        finally:
            await browser.close()

    print()
    if failures:
        print("Falhas nos títulos das etapas da Guia SP/SADT:")
        for f in failures:
            print(f"  - {f}")
        print(f"\nDiffs em {OUTPUT}/. Se a mudança é intencional, rode com --update.")
        return 1
    print("Títulos das etapas da Guia SP/SADT estáveis em desktop e mobile.")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
