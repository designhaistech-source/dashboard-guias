"""
E2E: abre o modal de visualização de uma guia emitida em viewports móveis
(iOS/Android), rola até o fim com gestos de toque e valida que:

1. O fallback de escala por `transform` é aplicado (sem `zoom` no mobile);
2. O container do modal rola de fato quando a guia excede a altura disponível;
3. A rolagem chega ao fim e o rodapé da guia fica visível — nada é cortado;
4. Não há travamento: a página continua respondendo (rAF) durante e após a
   rolagem, dentro de um orçamento de tempo.

Uso:
    BASE_URL=https://<seu-projeto>.lovable.app python3 e2e/mobile-guide-scroll.spec.py

Se BASE_URL não for definido, usa http://localhost:8080.
"""

import asyncio
import os
import sys

from playwright.async_api import async_playwright, expect

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8080").rstrip("/")

IOS_UA = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
)
ANDROID_UA = (
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36"
)

DEVICES = [
    {"name": "iOS (iPhone 14)", "ua": IOS_UA, "viewport": {"width": 390, "height": 844}},
    {"name": "Android (Pixel 8)", "ua": ANDROID_UA, "viewport": {"width": 412, "height": 915}},
    # Altura reduzida: força a guia a exceder o modal e exercita a rolagem.
    {"name": "iOS (tela curta)", "ua": IOS_UA, "viewport": {"width": 390, "height": 520}},
]

# Orçamento de responsividade: um frame de animação deve ocorrer rapidamente
# mesmo imediatamente após a rolagem. Valor folgado para ambientes de CI lentos.
FRAME_BUDGET_MS = 1_500
# Tolerância (px) para arredondamentos de sub-pixel na rolagem/medidas.
TOLERANCE_PX = 4

# Localiza o container rolável do modal e a folha escalada da guia.
MODAL_METRICS_JS = """() => {
  const scroller = document.querySelector('.overflow-y-auto section')?.closest('.overflow-y-auto')
    ?? Array.from(document.querySelectorAll('.overflow-y-auto')).pop();
  if (!scroller) return null;
  // A folha é o filho com largura fixa dentro do container de escala.
  const sheet = scroller.querySelector('[style*="width"]');
  if (!sheet) return null;
  const style = getComputedStyle(sheet);
  const rect = sheet.getBoundingClientRect();
  return {
    transform: style.transform,
    zoom: style.zoom,
    naturalWidth: sheet.offsetWidth,
    naturalHeight: sheet.offsetHeight,
    renderedHeight: Math.round(rect.height),
    scrollHeight: scroller.scrollHeight,
    clientHeight: scroller.clientHeight,
  };
}"""


async def open_guide_modal(page) -> None:
    """Abre a página de guias emitidas e o modal da primeira guia."""
    await page.goto(f"{BASE_URL}/guias-emitidas", wait_until="domcontentloaded")
    await expect(page.get_by_role("heading", name="Guias emitidas").first).to_be_visible(
        timeout=15_000
    )
    view_button = page.get_by_role("button", name="Visualizar").first
    await view_button.wait_for(state="visible", timeout=15_000)
    await view_button.click()
    # O botão de download só existe dentro do modal aberto.
    await expect(page.get_by_role("button", name="Baixar PDF").first).to_be_visible(
        timeout=10_000
    )
    # Aguarda a medição/escala inicial da folha (ResizeObserver + layout effect).
    await page.wait_for_function(
        """() => {
          const s = document.querySelector('.overflow-y-auto section')?.closest('.overflow-y-auto');
          const sheet = s?.querySelector('[style*="width"]');
          return !!sheet && sheet.offsetWidth > 0;
        }""",
        timeout=10_000,
    )


async def scroller_handle(page):
    """Retorna o elemento rolável do modal."""
    handle = await page.evaluate_handle(
        """() => document.querySelector('.overflow-y-auto section')?.closest('.overflow-y-auto')
             ?? Array.from(document.querySelectorAll('.overflow-y-auto')).pop() ?? null"""
    )
    element = handle.as_element()
    if element is None:
        raise AssertionError("Modal da guia não possui container de rolagem")
    return element


async def frame_latency_ms(page) -> float:
    """Mede quanto tempo leva para o próximo frame de animação ocorrer."""
    return await page.evaluate(
        """() => new Promise((resolve) => {
          const start = performance.now();
          requestAnimationFrame(() => resolve(performance.now() - start));
        })"""
    )


async def swipe_to_bottom(page, scroller) -> int:
    """Rola com toque + scroll incremental até o fim; retorna gestos usados."""
    box = await scroller.bounding_box()
    if box is None:
        raise AssertionError("Container de rolagem sem bounding box")

    touch_x = box["x"] + box["width"] / 2
    touch_y = box["y"] + box["height"] * 0.6
    step = max(80, int(box["height"] * 0.6))
    gestures = 0

    for _ in range(120):
        metrics = await scroller.evaluate(
            "(el) => ({ top: el.scrollTop, height: el.scrollHeight, client: el.clientHeight })"
        )
        if metrics["top"] + metrics["client"] >= metrics["height"] - TOLERANCE_PX:
            break

        # Toque real (ativa o caminho de scroll móvel) + deslocamento determinístico.
        await page.touchscreen.tap(touch_x, touch_y)
        await scroller.evaluate(
            "(el, delta) => el.scrollBy({ top: delta, behavior: 'instant' })", step
        )
        gestures += 1

        latency = await frame_latency_ms(page)
        assert latency < FRAME_BUDGET_MS, (
            f"Rolagem travou: frame levou {latency:.0f}ms (limite {FRAME_BUDGET_MS}ms)"
        )

    return gestures


async def assert_bottom_reached(scroller) -> None:
    metrics = await scroller.evaluate(
        "(el) => ({ top: el.scrollTop, height: el.scrollHeight, client: el.clientHeight })"
    )
    remaining = metrics["height"] - (metrics["top"] + metrics["client"])
    assert remaining <= TOLERANCE_PX, (
        f"Não foi possível rolar até o fim: faltaram {remaining}px"
    )


async def assert_end_of_guide_visible(scroller) -> None:
    """O fim da folha da guia deve estar dentro da área visível do scroller."""
    result = await scroller.evaluate(
        """(el) => {
          const sheet = el.querySelector('[style*="width"]');
          if (!sheet) return { ok: false, reason: 'folha não encontrada' };
          const a = sheet.getBoundingClientRect();
          const b = el.getBoundingClientRect();
          return {
            ok: a.bottom <= b.bottom + 2 && a.bottom > b.top,
            overflowBottom: Math.round(a.bottom - b.bottom),
            overflowRight: Math.round(a.right - b.right),
          };
        }"""
    )
    assert result["ok"], (
        f"O fim da guia não ficou visível — conteúdo cortado ({result})"
    )
    assert result["overflowRight"] <= TOLERANCE_PX, (
        f"Guia cortada na lateral: {result['overflowRight']}px além do container"
    )


async def run_device(browser, device) -> None:
    context = await browser.new_context(
        viewport=device["viewport"],
        user_agent=device["ua"],
        is_mobile=True,
        has_touch=True,
        device_scale_factor=2,
    )
    page = await context.new_page()
    errors: list[str] = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    await open_guide_modal(page)

    metrics = await page.evaluate(MODAL_METRICS_JS)
    assert metrics, f"{device['name']}: guia não encontrada no modal"
    assert metrics["transform"] not in ("none", None), (
        f"{device['name']}: esperado fallback transform no mobile, "
        f"obtido transform={metrics['transform']}"
    )
    assert metrics["zoom"] in ("1", "normal", "", None), (
        f"{device['name']}: `zoom` não deve ser usado no mobile (zoom={metrics['zoom']})"
    )
    # A altura reservada precisa acompanhar a escala, senão o pai não rola.
    assert metrics["scrollHeight"] >= metrics["renderedHeight"] - TOLERANCE_PX, (
        f"{device['name']}: altura reservada insuficiente "
        f"({metrics['scrollHeight']}px para {metrics['renderedHeight']}px de guia)"
    )

    scroller = await scroller_handle(page)
    gestures = await swipe_to_bottom(page, scroller)
    await assert_bottom_reached(scroller)
    await assert_end_of_guide_visible(scroller)

    latency = await frame_latency_ms(page)
    assert latency < FRAME_BUDGET_MS, f"{device['name']}: página travada após a rolagem"
    assert not errors, f"{device['name']}: erros de runtime — {errors}"

    scrollable = metrics["scrollHeight"] - metrics["clientHeight"]
    print(
        f"OK — {device['name']}: guia {metrics['naturalWidth']}x{metrics['naturalHeight']}px "
        f"renderizada em {metrics['renderedHeight']}px, {scrollable}px roláveis, "
        f"{gestures} gestos até o fim, frame final {latency:.0f}ms"
    )
    await context.close()


async def main() -> int:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            for device in DEVICES:
                await run_device(browser, device)
        finally:
            await browser.close()
    print(f"OK — rolagem da guia escalada validada no mobile em {BASE_URL}")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
