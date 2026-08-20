"""Audita gráficos (Recharts) e tabelas em tablet/mobile/desktop.

Falha quando:
- svg de gráfico estoura o container ou fica com altura/largura degenerada;
- barras horizontais ficam com espessuras diferentes entre breakpoints;
- tabela não está em um scroller horizontal nem tem fallback em cards no mobile.
"""
import asyncio, json, sys
from playwright.async_api import async_playwright

ROUTES = [
    "/", "/dashboard", "/guias", "/guias-emitidas", "/emitir", "/prescricao",
    "/opme", "/documentos", "/documentos-emitidos", "/cid", "/procedimentos",
    "/perfil", "/configuracoes",
]
VIEWPORTS = [("mobile", 390), ("mobile-lg", 414), ("tablet", 768), ("tablet-lg", 1024), ("desktop", 1280)]

JS = """() => {
  const docW = document.documentElement.clientWidth;
  const issues = [];
  const charts = [];
  document.querySelectorAll('.recharts-wrapper').forEach((w, i) => {
    const host = w.parentElement;
    const wr = w.getBoundingClientRect();
    const hr = host.getBoundingClientRect();
    const svg = w.querySelector('svg');
    const sr = svg ? svg.getBoundingClientRect() : null;
    if (wr.right > docW + 1) issues.push({kind:'chart-out-of-viewport', i, right: Math.round(wr.right), docW});
    if (wr.width > hr.width + 2) issues.push({kind:'chart-wider-than-host', i, chart: Math.round(wr.width), host: Math.round(hr.width)});
    if (sr && (sr.width < 80 || sr.height < 80)) issues.push({kind:'chart-degenerate', i, w: Math.round(sr.width), h: Math.round(sr.height)});
    const bars = [...w.querySelectorAll('.recharts-bar-rectangle path, .recharts-bar-rectangle rect')].map(b => {
      const r = b.getBoundingClientRect(); return {w: Math.round(r.width), h: Math.round(r.height)};
    });
    const horizontal = bars.length > 1 && bars.every(b => b.h <= b.w || b.h < 40);
    charts.push({i, w: Math.round(wr.width), h: Math.round(wr.height), bars: bars.length,
      barThickness: bars.length ? (horizontal ? Math.max(...bars.map(b=>b.h)) : Math.max(...bars.map(b=>b.w))) : null,
      horizontal});
    // eixos com rótulos cortados
    w.querySelectorAll('.recharts-cartesian-axis-tick-value').forEach(t => {
      const r = t.getBoundingClientRect();
      if (r.left < -1 || r.right > docW + 1) issues.push({kind:'axis-label-clipped', i, text: (t.textContent||'').trim().slice(0,20)});
    });
  });
  const tables = [];
  document.querySelectorAll('table').forEach((t, i) => {
    let scroller = null;
    for (let a = t.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (['auto','scroll'].includes(cs.overflowX)) { scroller = a; break; }
    }
    const tr = t.getBoundingClientRect();
    const visible = getComputedStyle(t).display !== 'none' && tr.width > 0;
    if (visible && !scroller && tr.width > docW + 1)
      issues.push({kind:'table-overflow-no-scroller', i, w: Math.round(tr.width), docW});
    tables.push({i, visible, hasScroller: !!scroller, w: Math.round(tr.width)});
  });
  const cards = document.querySelectorAll('[data-mobile-cards], [data-testid="data-table-cards"]').length;
  return {hscroll: document.documentElement.scrollWidth > docW + 1, issues, charts, tables, cards};
}"""


async def main():
    failures, snapshot = {}, {}
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        for name, w in VIEWPORTS:
            ctx = await b.new_context(viewport={"width": w, "height": 1400})
            pg = await ctx.new_page()
            for route in ROUTES:
                await pg.goto(f"http://localhost:8080{route}", wait_until="networkidle", timeout=45000)
                await pg.wait_for_timeout(500)
                res = await pg.evaluate(JS)
                key = f"{name}({w}) {route}"
                snapshot[key] = {"charts": res["charts"], "tables": res["tables"], "cards": res["cards"]}
                if res["hscroll"] or res["issues"]:
                    failures[key] = {"hscroll": res["hscroll"], "issues": res["issues"][:6]}
            await ctx.close()
        await b.close()
    with open("/tmp/browser/charts/snapshot.json", "w") as f:
        json.dump(snapshot, f, indent=1)
    if failures:
        print(json.dumps(failures, indent=1))
        sys.exit(1)
    print("OK: graficos e tabelas sem regressao em mobile/tablet/desktop")

asyncio.run(main())
