#!/usr/bin/env python3
"""Valida o alinhamento óptico ícone/texto nas telas.

Regras verificadas em cada elemento que tem exatamente um <svg> direto + texto:
  1. line-height precisa ser 1 (leading-none / text-*/none) — evita que o centro
     da caixa de texto mude conforme o tamanho da fonte.
  2. o deslocamento vertical do ícone em relação ao centro do texto precisa ser
     o mesmo valor em `em` (utilitário `icon-optical`), em text-xs, text-sm e
     text-base.

Uso: python3 scripts/visual/check-icon-alignment.py
Exit code 1 quando algum componente foge do padrão.
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent
CONFIG = json.loads((ROOT / "targets.json").read_text())

# Deslocamento óptico padrão aplicado pelo utilitário `icon-optical`.
EXPECTED_SHIFT_EM = -0.075
# Tolerância em px para arredondamento de subpixel do navegador.
TOLERANCE_PX = 0.15

JS = """
() => {
  const out = [];
  const sel = 'button, a, span, [role="tab"], [role="menuitem"], [role="combobox"]';
  document.querySelectorAll(sel).forEach((el) => {
    const svgs = el.querySelectorAll(':scope > svg');
    if (svgs.length !== 1) return;
    const node = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
    if (!node) return;
    const r = el.getBoundingClientRect();
    if (!r.height) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    const tr = range.getBoundingClientRect();
    const sr = svgs[0].getBoundingClientRect();
    const cs = getComputedStyle(el);
    out.push({
      text: node.textContent.trim().slice(0, 28),
      fontSize: parseFloat(cs.fontSize),
      lineHeight: cs.lineHeight === 'normal' ? null : parseFloat(cs.lineHeight),
      delta: (sr.top + sr.height / 2) - (tr.top + tr.height / 2),
    });
  });
  return out;
}
"""


async def main() -> int:
    failures: list[str] = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await (await browser.new_context(viewport={"width": 1280, "height": 1800})).new_page()

        for target in CONFIG["targets"]:
            await page.goto(CONFIG["baseUrl"] + target["path"], wait_until="networkidle")
            await page.wait_for_timeout(500)
            samples = await page.evaluate(JS)
            for s in samples:
                size = s["fontSize"]
                where = f"{target['name']} · \"{s['text']}\" ({size:.0f}px)"
                if s["lineHeight"] is None or abs(s["lineHeight"] - size) > 0.5:
                    failures.append(
                        f"{where}: line-height {s['lineHeight']} != {size:.0f} "
                        "(use text-xs/none, text-sm/none…)"
                    )
                expected = EXPECTED_SHIFT_EM * size
                if abs(s["delta"] - expected) > TOLERANCE_PX:
                    failures.append(
                        f"{where}: deslocamento {s['delta']:.2f}px "
                        f"(esperado {expected:.2f}px — falta `icon-optical`?)"
                    )
            print(f"[ok] {target['name']} — {len(samples)} pares ícone/texto verificados")

        await browser.close()

    if failures:
        print("\nDesvios de alinhamento ícone/texto:")
        for f in failures:
            print(f"  - {f}")
        return 1

    print("\nAlinhamento ícone/texto consistente em text-xs, text-sm e text-base.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
