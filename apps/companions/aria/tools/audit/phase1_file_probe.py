import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[2]
async def inspect(page,url,label):
 c=[];e=[]
 page.on('console',lambda m:c.append({'type':m.type,'text':m.text[:500]}));page.on('pageerror',lambda x:e.append(str(x)[:1000]))
 r={'label':label,'url':url}
 try:
  resp=await page.goto(url,wait_until='domcontentloaded',timeout=30000);await page.wait_for_timeout(3000)
  r.update(ok=True,status=resp.status if resp else None,finalUrl=page.url,title=await page.title(),bodyTextSample=(await page.locator('body').inner_text())[:500],console=c,pageErrors=e,localStorageKeys=await page.evaluate('Object.keys(localStorage)'),globals=await page.evaluate("() => ({AriaGitHubBackend:typeof window.AriaGitHubBackend,ARIA_V3_APP:typeof window.ARIA_V3_APP})"))
 except Exception as x:r.update(ok=False,error=repr(x),finalUrl=page.url,console=c,pageErrors=e)
 return r
async def main():
 out=[]
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--allow-file-access-from-files'])
  for f in ['index.html','aria_companion.html','aria_knowledge_studio.html']:
   ctx=await b.new_context();pg=await ctx.new_page();out.append(await inspect(pg,(ROOT/f).as_uri(),'file-'+f));await ctx.close()
  await b.close()
 (ROOT/'docs/audit/phase1-file-browser-probe.json').write_text(json.dumps({'results':out},indent=2))
 print(json.dumps([{'label':x['label'],'ok':x['ok'],'finalUrl':x.get('finalUrl'),'errors':len(x.get('pageErrors',[]))} for x in out],indent=2))
asyncio.run(main())
