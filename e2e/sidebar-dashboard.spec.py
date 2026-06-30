"""
E2E: valida a navegação da sidebar até /dashboard no build publicado.

Uso:
    BASE_URL=https://<seu-projeto>.lovable.app python3 e2e/sidebar-dashboard.spec.py

Se BASE_URL não for definido, usa http://localhost:8080 (preview local).
Requer Playwright (`pip install playwright && playwright install chromium`).
"""

import asyncio
import os
import sys
from playwright.async_api import async_playwright, expect

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8080").rstrip("/")


async def main() -> int:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await context.new_page()

        # 1. Abre a home (sidebar é visível em todas as rotas).
        await page.goto(f"{BASE_URL}/", wait_until="domcontentloaded")

        # 2. Localiza o item "Dashboard" do sidebar e clica.
        dashboard_link = page.get_by_role("link", name="Dashboard").first
        await expect(dashboard_link).toBeVisible() if False else await dashboard_link.wait_for(state="visible")
        await dashboard_link.click()

        # 3. Aguarda a navegação client-side concluir.
        await page.wait_for_url(f"{BASE_URL}/dashboard", timeout=10_000)

        # 4. Valida que a página de Dashboard carregou (heading "Início" presente).
        heading = page.get_by_role("heading", name="Início").first
        await heading.wait_for(state="visible", timeout=10_000)

        # 5. Valida que recarregar /dashboard direto também funciona (SPA fallback no build publicado).
        await page.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
        await page.get_by_role("heading", name="Início").first.wait_for(state="visible")


        print(f"OK — navegação da sidebar para /dashboard funcionando em {BASE_URL}")
        await browser.close()
        return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
