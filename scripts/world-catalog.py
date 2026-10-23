"""Writes src/lib/world-catalog.json: every house, plot of land and shop in IlmWorld, so the
server knows what each one is and what it costs. Run it after changing the map:
  npm run dev   (in another terminal, port 5173)
  python3 scripts/world-catalog.py src/lib/world-catalog.json
Needs Python Playwright with Chromium."""
import json, sys
save = {}
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=swiftshader","--enable-webgl","--ignore-gpu-blocklist"])
    pg=b.new_page(viewport={"width":400,"height":300})
    pg.add_init_script("if(!sessionStorage.getItem('x')){sessionStorage.setItem('x',1);localStorage.setItem('ilmcity-3d-v1', JSON.stringify(%s))}" % json.dumps(save))
    pg.goto("http://127.0.0.1:5173/world?time=10:00",timeout=200000, wait_until="domcontentloaded")
    pg.wait_for_function("!!window.__ilmcity", timeout=250000); pg.wait_for_timeout(1000)
    r=pg.evaluate("""()=>{const e=window.__ilmcity; cancelAnimationFrame(e.raf); e.disposed=true;
       for(const id of [...e.placeholders.keys()]) e.buildLater(id);
       const plots={}; for(const p of e.plots){ const o={d:p.district,k:p.kind[0]}; if(p.kind==='house'){o.f=p.floors; if(p.type) o.t=p.type;} plots[p.id]=o; }
       const shops={}; for(const id of e.shopIds()){ const s=e.shopInfo(id); shops[id]={d:s.district,k:s.kind}; }
       return {plots, shops}}""")
    json.dump(r, open(sys.argv[1],'w'), separators=(',',':'))
    print(len(r['plots']), len(r['shops']))
    b.close()
