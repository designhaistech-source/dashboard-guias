"""Verificação automática de layout das abas de Relatórios e documentos.

Garante que os rótulos das abas — em especial "Comparecimento" — nunca
truncam nem quebram em linha, e que todas as abas mantêm a mesma largura,
altura e alinhamento vertical nas larguras críticas.

Uso:
    python scripts/check-comparecimento-tabs.py [--base http://localhost:8080]
Saída: exit code 0 quando aprovado, 1 quando há falha (com relatório).
"""

from __future__ import annotations

import argparse
import asyncio
import sys

from playwright.async_api import async_playwright

WIDTHS = [280, 320, 375, 414, 768]
ROUTE = "/documentos"
TAB_NAMES = ["Relatórios", "Atestados"]
# < 360px usa o rótulo curto para não truncar
COMPARECIMENTO_LABELS = {"Comparecimento", "Compar."}

MEASURE_TABS = """
() => {
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  return tabs.map((tab) => {
    const label = tab.querySelector('span') ?? tab;
    const rect = tab.getBoundingClientRect();
    const labelRect = label.getBoundingClientRect();
    const style = getComputedStyle(label);
    return {
      text: (label.textContent || '').trim(),
      width: rect.width,
      height: rect.height,
      top: rect.top,
      truncated: label.scrollWidth > label.clientWidth + 1,
      // uma linha = altura do rótulo próxima da altura de linha
      lines: Math.round(labelRect.height / parseFloat(style.lineHeight || '0')) || 1,
      lineHeight: parseFloat(style.lineHeight || '0'),
      labelHeight: labelRect.height,
    };
  });
}
"""


async def check_width(browser, base: str, width: int) -> list[str]:
    failures: list[str] = []
    context = await browser.new_context(viewport={"width": width, "height": 900})
    page = await context.new_page()
    try:
        await page.goto(f"{base}{ROUTE}", wait_until="networkidle")
        await page.locator('[role="tab"]').nth(2).click()
        await page.wait_for_timeout(250)

        tabs = await page.evaluate(MEASURE_TABS)
        found = [tab["text"] for tab in tabs]
        if found[:2] != TAB_NAMES or found[2:] and found[2] not in COMPARECIMENTO_LABELS:
            failures.append(f"{width}px: abas inesperadas {found}")
            return failures

        for tab in tabs:
            if tab["truncated"]:
                failures.append(f"{width}px: rótulo \"{tab['text']}\" truncado")
            if tab["lineHeight"] and tab["labelHeight"] > tab["lineHeight"] * 1.5:
                failures.append(f"{width}px: rótulo \"{tab['text']}\" quebrou em 2+ linhas")

        widths = {round(tab["width"]) for tab in tabs}
        if len(widths) > 1:
            failures.append(f"{width}px: larguras de aba diferentes {sorted(widths)}")

        heights = {round(tab["height"]) for tab in tabs}
        if len(heights) > 1:
            failures.append(f"{width}px: alturas de aba diferentes {sorted(heights)}")

        tops = {round(tab["top"]) for tab in tabs}
        if len(tops) > 1:
            failures.append(f"{width}px: abas desalinhadas verticalmente {sorted(tops)}")

        overflow = await page.evaluate(
            "document.documentElement.scrollWidth > window.innerWidth + 1"
        )
        if overflow:
            failures.append(f"{width}px: rolagem horizontal na página")

        clipped = await page.evaluate(
            """
            () => Array.from(document.querySelectorAll('label, .truncate, [role="tab"] span'))
              .filter((el) => el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0)
              .map((el) => (el.textContent || '').trim().slice(0, 48))
            """
        )
        if clipped:
            failures.append(f"{width}px: textos cortados no formulário {clipped}")

        if not failures:
            print(f"  ok {width}px — abas {sorted(widths)[0]}px x {sorted(heights)[0]}px, sem cortes")
    finally:
        await context.close()
    return failures


async def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://localhost:8080")
    args = parser.parse_args()

    print("Verificando abas de Comparecimento em", ", ".join(f"{w}px" for w in WIDTHS))
    failures: list[str] = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        try:
            for width in WIDTHS:
                failures.extend(await check_width(browser, args.base, width))
        finally:
            await browser.close()

    if failures:
        print("\nFALHAS:")
        for failure in failures:
            print(" -", failure)
        return 1
    print("\nAprovado: nenhum truncamento, quebra ou desalinhamento.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
