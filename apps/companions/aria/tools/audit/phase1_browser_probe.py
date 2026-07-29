import asyncio, json, subprocess, time, os, signal
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs'/'audit'/'phase1-browser-probe.json'
BASE='http://127.0.0.1:8765/aria_v0_3_16_phase1_audit_working/'

async def inspect_page(page,url,label,wait=2500):
    console=[]; errors=[]; requests=[]
    page.on('console',lambda m: console.append({'type':m.type,'text':m.text[:500]}))
    page.on('pageerror',lambda e: errors.append(str(e)[:1000]))
    page.on('request',lambda r: requests.append(r.url))
    result={'label':label,'url':url}
    try:
        resp=await page.goto(url,wait_until='domcontentloaded',timeout=30000)
        await page.wait_for_timeout(wait)
        result.update({
          'ok':True,'status':resp.status if resp else None,'finalUrl':page.url,'title':await page.title(),
          'readyState':await page.evaluate('document.readyState'),
          'bodyTextSample':(await page.locator('body').inner_text())[:500],
          'console':console,'pageErrors':errors,'requestCount':len(requests),
          'localStorageKeys':await page.evaluate('Object.keys(localStorage)'),
          'sessionStorageKeys':await page.evaluate('Object.keys(sessionStorage)'),
          'indexedDBDatabases':await page.evaluate('indexedDB.databases ? indexedDB.databases() : []'),
          'globals':await page.evaluate('''() => ({AriaGitHubBackend:typeof window.AriaGitHubBackend,ARIA_V3_APP:typeof window.ARIA_V3_APP,fetch:typeof window.fetch})''')
        })
    except Exception as e:
        result.update({'ok':False,'error':repr(e),'finalUrl':page.url,'console':console,'pageErrors':errors,'requestCount':len(requests)})
    return result

async def main():
    server=subprocess.Popen(['python3','-m','http.server','8765','--bind','127.0.0.1','--directory','/mnt/data'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    await asyncio.sleep(1)
    results=[]
    try:
      async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        # empty storage
        ctx=await browser.new_context()
        page=await ctx.new_page(); results.append(await inspect_page(page,BASE+'index.html','http-index-empty-storage'))
        await ctx.close()
        ctx=await browser.new_context(); page=await ctx.new_page(); results.append(await inspect_page(page,BASE+'aria_companion.html','http-companion-empty-storage',4000)); await ctx.close()
        ctx=await browser.new_context(); page=await ctx.new_page(); results.append(await inspect_page(page,BASE+'aria_knowledge_studio.html','http-studio-empty-storage',3500)); await ctx.close()
        # existing storage + reload
        ctx=await browser.new_context(); page=await ctx.new_page(); await page.goto(BASE+'aria_companion.html',wait_until='domcontentloaded'); await page.evaluate("localStorage.setItem('audit.existingStorage','present')"); await page.reload(wait_until='domcontentloaded'); await page.wait_for_timeout(2500)
        results.append({'label':'http-companion-existing-storage','ok':True,'finalUrl':page.url,'marker':await page.evaluate("localStorage.getItem('audit.existingStorage')"),'pageErrors':[]})
        await ctx.close()
        # companion and studio together
        ctx=await browser.new_context(); companion=await ctx.new_page(); studio=await ctx.new_page(); r1=await inspect_page(companion,BASE+'aria_companion.html','http-companion-concurrent',2500); r2=await inspect_page(studio,BASE+'aria_knowledge_studio.html','http-studio-concurrent',2500); results += [r1,r2]; await ctx.close()
        # direct file entry points
        ctx=await browser.new_context(); page=await ctx.new_page(); results.append(await inspect_page(page,(ROOT/'index.html').as_uri(),'file-index',2000)); await ctx.close()
        ctx=await browser.new_context(); page=await ctx.new_page(); results.append(await inspect_page(page,(ROOT/'aria_companion.html').as_uri(),'file-companion',3000)); await ctx.close()
        ctx=await browser.new_context(); page=await ctx.new_page(); results.append(await inspect_page(page,(ROOT/'aria_knowledge_studio.html').as_uri(),'file-studio',3000)); await ctx.close()
        # offline after a warm HTTP load
        ctx=await browser.new_context(); page=await ctx.new_page(); await page.goto(BASE+'aria_companion.html',wait_until='domcontentloaded'); await page.wait_for_timeout(2000); await ctx.set_offline(True)
        try:
          await page.reload(wait_until='domcontentloaded',timeout=15000); await page.wait_for_timeout(2000)
          results.append({'label':'http-companion-offline-reload','ok':True,'finalUrl':page.url,'title':await page.title(),'bodyTextSample':(await page.locator('body').inner_text())[:300]})
        except Exception as e: results.append({'label':'http-companion-offline-reload','ok':False,'error':repr(e),'finalUrl':page.url})
        await ctx.close(); await browser.close()
    finally:
      server.terminate(); server.wait(timeout=5)
    OUT.write_text(json.dumps({'base':BASE,'results':results},indent=2),encoding='utf-8')
    print(json.dumps([{'label':r['label'],'ok':r.get('ok'),'status':r.get('status'),'finalUrl':r.get('finalUrl'),'errors':len(r.get('pageErrors',[]))} for r in results],indent=2))
asyncio.run(main())
