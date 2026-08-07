#!/usr/bin/env python3
"""Regressão visual do cabeçalho da tabela "Procedimentos solicitados".

Captura screenshots apenas da faixa de cabeçalho (campos 26, 25, 27 e 28) do
formulário SP/SADT em larguras e zooms críticos, compara com baselines
versionados e falha quando:
  - o screenshot diverge do baseline acima do limiar (mudança de layout);
  - as dimensões do cabeçalho mudam (colunas redimensionadas);
  - algum rótulo trunca (scrollWidth > clientWidth) ou quebra em 2+ linhas;
  - o cabeçalho gera rolagem horizontal.

Combinações críticas (largura física x zoom de página x zoom de texto) são as
que já quebraram o layout no passado: 1280px é o ponto de virada tabela/cards e
o zoom de texto expõe colunas com largura fixa.

Uso:
  python3 scripts/visual/check-proc-headers-visual.py
  python3 scripts/visual/check-proc-headers-visual.py --update   # regrava baselines
  python3 scripts/visual/check-proc-headers-visual.py --base http://localhost:8080

Baselines: scripts/visual/baselines/proc-headers__<caso>.png
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
HEADERS_SELECTOR = '[data-testid="proc-solic-headers"]'
HEADER_TESTIDS = [
    "proc-solic-header-26",
    "proc-solic-header-25",
    "proc-solic-header-27",
    "proc-solic-header-28",
]

# Casos críticos: largura física, zoom de página e font-size da raiz (px).
# Só larguras onde o layout de tabela (com cabeçalho) é renderizado.
CASES = [
    {"name": "1280-zoom100-texto16", "width": 1280, "zoom": 1.0, "text": 16},
    {"name": "1280-zoom100-texto20", "width": 1280, "zoom": 1.0, "text": 20},
    {"name": "1366-zoom100-texto16", "width": 1366, "zoom": 1.0, "text": 16},
    {"name": "1440-zoom125-texto16", "width": 1440, "zoom": 1.25, "text": 16},
    {"name": "1920-zoom150-texto16", "width": 1920, "zoom": 1.5, "text": 16},
    {"name": "1920-zoom100-texto24", "width": 1920, "zoom": 1.0, "text": 24},
]

THRESHOLD = 0.4
CHANNEL_TOLERANCE = 12
FREEZE_CSS = (
    "*,*::before,*::after{animation:none!important;transition:none!important;"
    "caret-color:transparent!important}"
)

MEASURE = """
(testids) => {
  const header = document.querySelector('[data-testid="proc-solic-headers"]');
  const labels = testids.map((id) => {
    const el = document.querySelector(`[data-testid="${id}"]`);
    if (!el) return { id, missing: true };
    const lh = parseFloat(getComputedStyle(el).lineHeight || '0');
    const rect = el.getBoundingClientRect();
    return {
      id,
      text: (el.textContent || '').replace(/\\s+/g, ' ').trim(),
      width: Math.round(rect.width),
      truncated: el.scrollWidth > el.clientWidth + 1,
      lines: lh ? rect.height / lh : 1,
    };
  });
  return {
    labels,
    headerWidth: header ? Math.round(header.getBoundingClientRect().width) : 0,
    overflow: header ? header.scrollWidth - header.clientWidth : 0,
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
                HEADERS_SELECTOR, state="attached", timeout=1_500
            )
            return
        except Exception:
            continue
    raise AssertionError("Formulário SP/SADT não renderizou após selecionar o tipo de guia")


async def run_case(page, case: dict, update: bool) -> list[str]:
    failures: list[str] = []
    label = case["name"]

    # Zoom de página reduz o viewport lógico (comportamento real do navegador).
    await page.set_viewport_size(
        {"width": max(320, round(case["width"] / case["zoom"])), "height": 1000}
    )
    await page.evaluate(
        "(size) => { document.documentElement.style.fontSize = size + 'px'; }",
        case["text"],
    )
    await page.add_style_tag(content=FREEZE_CSS)
    await page.wait_for_timeout(250)

    headers = page.locator(HEADERS_SELECTOR).first
    if not await headers.is_visible():
        failures.append(f"{label}: cabeçalho da tabela não visível (layout de cards)")
        print(f"[FALHOU]  {label} — cabeçalho ausente")
        return failures

    m = await page.evaluate(MEASURE, HEADER_TESTIDS)
    for item in m["labels"]:
        if item.get("missing"):
            failures.append(f"{label}: rótulo ausente ({item['id']})")
            continue
        if item["truncated"]:
            failures.append(f'{label}: rótulo "{item["text"]}" truncado')
        if item["lines"] > 1.5:
            failures.append(f'{label}: rótulo "{item["text"]}" quebrou em 2+ linhas')
    if m["overflow"] > 1:
        failures.append(f"{label}: rolagem horizontal no cabeçalho ({m['overflow']}px)")

    key = f"proc-headers__{label}"
    baseline = BASELINES / f"{key}.png"
    target = baseline if (update or not baseline.exists()) else OUTPUT / f"{key}.png"
    target.parent.mkdir(parents=True, exist_ok=True)
    await headers.screenshot(path=str(target))

    if target == baseline:
        print(f"[baseline] {key}")
        return failures

    pct, note = compare(baseline, target, OUTPUT / f"{key}.diff.png")
    if pct > THRESHOLD:
        failures.append(f"{key}: {pct:.2f}% diferente {note}".strip())
        print(f"[FALHOU]  {key} — {pct:.2f}% de pixels alterados {note}".strip())
    else:
        print(f"[ok]      {key} — {pct:.2f}%")
    return failures


async def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://localhost:8080")
    parser.add_argument("--update", action="store_true", help="regrava os baselines")
    args = parser.parse_args()

    failures: list[str] = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1000})
        page = await context.new_page()
        try:
            await open_sadt_form(page, args.base.rstrip("/"))
            for case in CASES:
                failures += await run_case(page, case, args.update)
        finally:
            await browser.close()

    print()
    if failures:
        print("Falhas visuais no cabeçalho de 'Procedimentos solicitados':")
        for f in failures:
            print(f"  - {f}")
        print(f"\nDiffs em {OUTPUT}/. Se a mudança é intencional, rode com --update.")
        return 1
    print("Cabeçalho de 'Procedimentos solicitados' estável em todas as larguras e zooms.")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
