import asyncio, json, sys
from playwright.async_api import async_playwright

ROUTES = ["/", "/dashboard", "/guias", "/emitir", "/prescricao", "/opme", "/documentos", "/cid", "/procedimentos"]
WIDTHS = [320, 360, 390, 414, 768, 820, 1024, 1280]

JS = """() => {
  const docW = document.documentElement.clientWidth;
  const out = [];
  const path = (el) => { const p=[]; let c=el; while(c && c!==document.body && p.length<4){ p.push(c.tagName.toLowerCase()+(c.className?'.'+String(c.className).split(' ').slice(0,3).join('.'):'')); c=c.parentElement;} return p.join(' < '); };
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display==='none' || cs.visibility==='hidden' || cs.position==='fixed') continue;
    const cls = String(el.className||'');
    if (cls.includes('sr-only')) continue;
    let inScroller = false;
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const acs = getComputedStyle(a);
      if (['auto','scroll','hidden'].includes(acs.overflowX)) { inScroller = true; break; }
    }
    const r = el.getBoundingClientRect();
    if (r.width===0 && r.height===0) continue;
    if (!inScroller && (r.right > docW+1 || r.left < -1))
      out.push({kind:'out-of-viewport', path:path(el), left:Math.round(r.left), right:Math.round(r.right)});
    const scrollable = ['auto','scroll','hidden'].includes(cs.overflowX);
    const isTextClip = cs.textOverflow==='ellipsis' || cs.whiteSpace==='nowrap';
    if (!scrollable && !isTextClip && el.children.length===0 && el.scrollWidth > el.clientWidth+1 && !['INPUT','TEXTAREA','SELECT'].includes(el.tagName))
      out.push({kind:'inner-overflow', path:path(el), scrollW:el.scrollWidth, clientW:el.clientWidth, text:(el.textContent||'').trim().slice(0,40)});
  }
  return {hscroll: document.documentElement.scrollWidth > docW+1, issues: out.slice(0,8)};
}"""


async def main():
    bad = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        for w in WIDTHS:
            ctx = await b.new_context(viewport={"width": w, "height": 1200})
            pg = await ctx.new_page()
            for route in ROUTES:
                await pg.goto(f"http://localhost:8080{route}", wait_until="networkidle", timeout=30000)
                await pg.wait_for_timeout(200)
                res = await pg.evaluate(JS)
                if res["hscroll"] or res["issues"]:
                    bad[f"{w}px {route}"] = res
            await ctx.close()
        await b.close()
    if bad:
        print(json.dumps(bad, indent=1))
        sys.exit(1)
    print("OK: sem rolagem horizontal e sem overflow em listas/campos")

asyncio.run(main())
