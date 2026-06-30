"""
E2E: clica em "Dashboard" no sidebar e valida que /dashboard renderiza os
elementos esperados (heading, KPIs e botão de relatório).

Uso:
    BASE_URL=https://<seu-projeto>.lovable.app python3 e2e/sidebar-dashboard.spec.py

Se BASE_URL não for definido, usa http://localhost:8080.
"""

import asyncio
import os
import sys
from playwright.async_api import async_playwright, expect

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8080").rstrip("/")


async def assert_dashboard_rendered(page) -> None:
    """Valida elementos-chave da /dashboard."""
    # Heading principal
    await expect(page.get_by_role("heading", name="Início").first).to_be_visible(timeout=10_000)
    # KPIs
    for label in ["Total extraídas", "Extraídas hoje", "Média por dia", "Tipos diferentes"]:
        await expect(page.get_by_text(label, exact=True).first).to_be_visible(timeout=10_000)
    # Botão de gerar relatório
    await expect(page.get_by_role("button", name="Gerar relatório")).to_be_visible()
    # Seção de procedimentos
    await expect(page.get_by_text("Procedimentos mais realizados").first).to_be_visible()


async def main() -> int:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        # 1. Abre a home.
        await page.goto(f"{BASE_URL}/", wait_until="domcontentloaded")

        # 2. Clica em "Dashboard" no sidebar.
        dashboard_link = page.get_by_role("link", name="Dashboard").first
        await dashboard_link.wait_for(state="visible", timeout=10_000)
        await dashboard_link.click()

        # 3. Aguarda a navegação client-side.
        await page.wait_for_url(f"{BASE_URL}/dashboard", timeout=10_000)

        # 4. Valida elementos esperados.
        await assert_dashboard_rendered(page)

        # 5. Recarrega a URL diretamente (SPA fallback) e revalida.
        await page.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
        await assert_dashboard_rendered(page)

        print(f"OK — /dashboard renderiza os elementos esperados em {BASE_URL}")
        await browser.close()
        return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
