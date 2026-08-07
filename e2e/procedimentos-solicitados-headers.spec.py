"""
E2E: garante que os títulos das colunas da tabela "Procedimentos solicitados"
(campos 25 a 28) nunca truncam, em diferentes larguras de tela e níveis de
zoom do navegador.

Estratégia:
  1. Abre /emitir e seleciona a guia "Ambulatorial / SADT".
  2. Zoom de página: o navegador reduz o viewport lógico. Simulamos isso
     definindo viewport = largura_física / zoom (equivalente ao comportamento
     real do Chrome).
  3. Zoom apenas de texto: aumentamos o font-size da raiz, que é o caso capaz
     de quebrar colunas com largura fixa em px.
  4. Para cada combinação:
     - layout de tabela (rótulos visíveis): compara scrollWidth vs clientWidth
       de cada rótulo, e recusa `text-overflow: ellipsis` ou quebra de linha;
     - layout de cards (rótulos ocultos): valida que os rótulos completos
       aparecem dentro dos cards;
     - valida que a tabela não gera rolagem horizontal.

Uso:
    python3 e2e/procedimentos-solicitados-headers.spec.py
    BASE_URL=http://localhost:8080 python3 e2e/procedimentos-solicitados-headers.spec.py
"""

import asyncio
import os
import sys

from playwright.async_api import async_playwright

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8080").rstrip("/")

# Larguras físicas representativas: mobile, tablet, laptop, desktop, wide.
WIDTHS = [390, 768, 1024, 1280, 1440, 1920]

# Zoom de página do navegador.
PAGE_ZOOMS = [1.0, 1.25, 1.5, 2.0]

# Zoom apenas de texto (font-size da raiz em px; 16 = padrão).
TEXT_SIZES = [16, 20, 24]

# Rótulos completos esperados no fallback de cards (telas estreitas).
CARD_LABELS = [
    "26 - Descrição",
    "25 - Código",
    "27 - Qtde.",
    "28 - Qtde. Aut.",
]

HEADER_TESTIDS = [
    "proc-solic-header-26",
    "proc-solic-header-25",
    "proc-solic-header-27",
    "proc-solic-header-28",
]

MEASURE_JS = """
(testids) => testids.map((id) => {
  const el = document.querySelector(`[data-testid="${id}"]`);
  if (!el) return { id, missing: true };
  const style = getComputedStyle(el);
  return {
    id,
    text: (el.textContent || "").replace(/\\s+/g, " ").trim(),
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
    lineHeight: parseFloat(style.lineHeight) || 0,
    height: el.getBoundingClientRect().height,
    overflow: style.textOverflow,
    whiteSpace: style.whiteSpace,
  };
})
"""

OVERFLOW_JS = """
() => {
  const hdr = document.querySelector('[data-testid="proc-solic-headers"]');
  if (!hdr) return 0;
  const rows = hdr.nextElementSibling;
  const targets = [hdr, rows].filter(Boolean);
  return Math.max(0, ...targets.map((el) => el.scrollWidth - el.clientWidth));
}
"""


async def open_form(page) -> None:
    """Abre /emitir e seleciona o tipo de guia 'Ambulatorial / SADT'."""
    await page.goto(f"{BASE_URL}/emitir", wait_until="domcontentloaded")
    sadt = page.get_by_role("heading", name="Ambulatorial / SADT").first
    await sadt.wait_for(state="visible", timeout=20_000)

    # Retenta o clique até a hidratação do React registrar o handler do card.
    for _ in range(20):
        await sadt.evaluate("(el) => el.closest('button')?.click()")
        try:
            await page.wait_for_selector(
                '[data-testid="proc-solic-headers"]', state="attached", timeout=1_500
            )
            return
        except Exception:
            continue
    raise AssertionError("Formulário SP/SADT não renderizou após selecionar o tipo de guia")


async def check_case(page, width: int, zoom: float, text_size: int, browser_name: str) -> list[str]:
    failures: list[str] = []
    label = f"{browser_name} · {width}px @ zoom {int(zoom * 100)}% / texto {text_size}px"


    # Zoom de página reduz o viewport lógico (comportamento real do navegador).
    await page.set_viewport_size({"width": max(320, round(width / zoom)), "height": 1000})
    await page.evaluate("(size) => { document.documentElement.style.fontSize = size + 'px'; }", text_size)
    await page.wait_for_timeout(200)

    headers = page.locator('[data-testid="proc-solic-headers"]')
    layout = "tabela" if await headers.is_visible() else "cards "

    if layout == "tabela":
        for r in await page.evaluate(MEASURE_JS, HEADER_TESTIDS):
            if r.get("missing"):
                failures.append(f"[{label}] rótulo ausente: {r['id']}")
                continue
            # 1px de tolerância para arredondamento de subpixel.
            if r["scrollWidth"] > r["clientWidth"] + 1:
                failures.append(
                    f"[{label}] '{r['text']}' truncado "
                    f"(scroll {r['scrollWidth']} > client {r['clientWidth']})"
                )
            if r["overflow"] == "ellipsis":
                failures.append(f"[{label}] '{r['text']}' usa text-overflow: ellipsis")
            if r["whiteSpace"] != "nowrap":
                failures.append(f"[{label}] '{r['text']}' deveria usar white-space: nowrap")
            if r["lineHeight"] and r["height"] > r["lineHeight"] * 1.6:
                failures.append(f"[{label}] '{r['text']}' quebrou em múltiplas linhas")
    else:
        for text in CARD_LABELS:
            if await page.get_by_text(text, exact=False).count() == 0:
                failures.append(f"[{label}] fallback em cards sem o rótulo '{text}'")

    overflow = await page.evaluate(OVERFLOW_JS)
    if overflow > 1:
        failures.append(f"[{label}] rolagem horizontal na tabela ({overflow}px)")

    print(f"  {layout}  {label}: {'OK' if not failures else 'FALHOU'}")
    return failures


async def run_browser(p, name: str) -> list[str]:
    print(f"\n== {name} ==")
    browser = await p[name].launch(headless=True)
    context = await browser.new_context(viewport={"width": 1280, "height": 1000})
    page = await context.new_page()
    failures: list[str] = []
    try:
        await open_form(page)
        for text_size in TEXT_SIZES:
            for zoom in PAGE_ZOOMS:
                for width in WIDTHS:
                    failures += await check_case(page, width, zoom, text_size, name)
    finally:
        await browser.close()
    return failures


async def main() -> int:
    all_failures: list[str] = []
    async with async_playwright() as p:
        for name in BROWSERS:
            all_failures += await run_browser(p, name)

    if all_failures:
        print("\nFALHAS:")
        for f in all_failures:
            print(f" - {f}")
        return 1
    print(
        "\nTodos os rótulos de 'Procedimentos solicitados' exibidos por completo em "
        + ", ".join(BROWSERS)
        + "."
    )
    return 0



if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
