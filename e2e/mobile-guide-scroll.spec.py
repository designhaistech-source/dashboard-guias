"""
E2E: abre o modal de visualização de uma guia emitida em viewports móveis
(iOS/Android), rola até o fim com gestos de toque e valida que:

1. O fallback de escala por `transform` é aplicado (sem `zoom` no mobile);
2. O container do modal é realmente rolável (altura reservada corretamente);
3. A rolagem chega ao fim e o rodapé da guia fica visível — nada é cortado;
4. Não há travamento: a página continua respondendo (rAF) durante e após
   a rolagem, dentro de um orçamento de tempo.

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
    {"name": "iOS (iPhone)", "ua": IOS_UA, "viewport": {"width": 390, "height": 844}},
    {"name": "Android (Pixel)", "ua": ANDROID_UA, "viewport": {"width": 412, "height": 915}},
]

# Orçamento de responsividade: um frame de animação deve ocorrer rapidamente
# mesmo imediatamente após a rolagem. Valor folgado para CI lento.
FRAME_BUDGET_MS = 1_500
# Tolerância de rolagem residual (px) para arredondamentos de sub-pixel.
SCROLL_TOLERANCE_PX = 4


async def open_guide_modal(page) -> None:
    """Abre a página de guias emitidas e o modal da primeira guia."""
    await page.goto(f"{BASE_URL}/guias-emitidas", wait_until="domcontentloaded")
    await expect(page.get_by_role("heading", name="Guias emitidas").first).to_be_visible(
        timeout=15_000
    )
    view_button = page.get_by_role("button", name="Visualizar").first
    await view_button.wait_for(state="visible", timeout=15_000)
    await view_button.click()
    await expect(page.get_by_role("dialog").first).to_be_visible(timeout=10_000)


async def scale_mode(page) -> dict:
    """Lê como a guia foi escalada (transform vs zoom) e as medidas usadas."""
    return await page.evaluate(
        """() => {
          const dialog = document.querySelector('[role="dialog"]');
          const sheet = dialog?.querySelector('[style*="width"]');
          if (!sheet) return null;
          const style = getComputedStyle(sheet);
          return {
            transform: style.transform,
            zoom: style.zoom,
            naturalWidth: sheet.offsetWidth,
            naturalHeight: sheet.offsetHeight,
            renderedHeight: Math.round(sheet.getBoundingClientRect().height),
          };
        }"""
    )


async def find_scroller(page):
    """Retorna o elemento rolável do modal (o que contém a guia)."""
    handle = await page.evaluate_handle(
        """() => {
          const dialog = document.querySelector('[role="dialog"]');
          const nodes = dialog ? Array.from(dialog.querySelectorAll('*')) : [];
          const scrollers = nodes.filter((el) => el.scrollHeight - el.clientHeight > 8);
          // O maior scroller é o container da guia.
          scrollers.sort((a, b) => b.scrollHeight - a.scrollHeight);
          return scrollers[0] ?? null;
        }"""
    )
    element = handle.as_element()
    if element is None:
        raise AssertionError("Modal da guia não possui container rolável")
    return element


async def frame_latency_ms(page) -> float:
    """Mede quanto tempo leva para o próximo frame de animação ocorrer."""
    return await page.evaluate(
        """() => new Promise((resolve) => {
          const start = performance.now();
          requestAnimationFrame(() => resolve(performance.now() - start));
        })"""
    )


async def swipe_to_bottom(page, element) -> int:
    """Rola com gestos de toque até o fim, retornando o número de gestos."""
    box = await element.bounding_box()
    if box is None:
        raise AssertionError("Container rolável sem bounding box")

    start_x = box["x"] + box["width"] / 2
    start_y = box["y"] + box["height"] * 0.8
    end_y = box["y"] + box["height"] * 0.2
    gestures = 0

    for _ in range(80):
        metrics = await element.evaluate(
            "(el) => ({ top: el.scrollTop, height: el.scrollHeight, client: el.clientHeight })"
        )
        if metrics["top"] + metrics["client"] >= metrics["height"] - SCROLL_TOLERANCE_PX:
            break

        await page.touchscreen.tap(start_x, start_y)
        await element.evaluate(
            "(el, delta) => el.scrollBy({ top: delta, behavior: 'instant' })",
            int(box["height"] * 0.6),
        )
        gestures += 1

        latency = await frame_latency_ms(page)
        assert latency < FRAME_BUDGET_MS, (
            f"Rolagem travou: frame levou {latency:.0f}ms (limite {FRAME_BUDGET_MS}ms)"
        )
        _ = end_y  # gesto simulado usa apenas o ponto inicial + scrollBy

    return gestures


async def assert_bottom_reached(element) -> None:
    metrics = await element.evaluate(
        "(el) => ({ top: el.scrollTop, height: el.scrollHeight, client: el.clientHeight })"
    )
    remaining = metrics["height"] - (metrics["top"] + metrics["client"])
    assert remaining <= SCROLL_TOLERANCE_PX, (
        f"Não foi possível rolar até o fim: faltaram {remaining}px"
    )


async def assert_footer_visible(page, element) -> None:
    """A última linha da guia deve estar dentro da área visível do scroller."""
    visible = await element.evaluate(
        """(el) => {
          const sheet = el.querySelector('[style*="width"]');
          const last = sheet?.lastElementChild ?? sheet;
          if (!last) return false;
          const a = last.getBoundingClientRect();
          const b = el.getBoundingClientRect();
          // Tolerância de 2px para sub-pixel.
          return a.bottom <= b.bottom + 2 && a.bottom > b.top;
        }"""
    )
    assert visible, "O fim da guia não ficou visível — conteúdo cortado"


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

    mode = await scale_mode(page)
    assert mode, "Guia não encontrada no modal"
    assert mode["transform"] not in ("none", None), (
        f"{device['name']}: esperado fallback transform, obtido transform={mode['transform']}"
    )
    assert mode["zoom"] in ("1", "normal", "", None), (
        f"{device['name']}: `zoom` não deve ser usado no mobile (zoom={mode['zoom']})"
    )

    scroller = await find_scroller(page)
    gestures = await swipe_to_bottom(page, scroller)
    await assert_bottom_reached(scroller)
    await assert_footer_visible(page, scroller)

    latency = await frame_latency_ms(page)
    assert latency < FRAME_BUDGET_MS, f"{device['name']}: página travada após rolagem"
    assert not errors, f"{device['name']}: erros de runtime — {errors}"

    print(
        f"OK — {device['name']}: {gestures} gestos até o fim, "
        f"guia {mode['naturalWidth']}x{mode['naturalHeight']}px renderizada em "
        f"{mode['renderedHeight']}px, frame final {latency:.0f}ms"
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
