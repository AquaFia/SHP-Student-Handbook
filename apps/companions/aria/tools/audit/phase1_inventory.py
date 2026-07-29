from pathlib import Path
from bs4 import BeautifulSoup
import hashlib, json, re, os
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs'/'audit'
OUT.mkdir(parents=True,exist_ok=True)
ignore={'docs/audit/01-baseline-report.md','docs/audit/phase1-inventory.json','docs/audit/reference-sha256.json'}
rows=[]
for p in sorted(ROOT.rglob('*')):
    if p.is_file():
        rel=p.relative_to(ROOT).as_posix()
        if rel in ignore: continue
        b=p.read_bytes()
        rows.append({'path':rel,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'extension':p.suffix.lower() or '[none]'})
summary={'fileCount':len(rows),'totalBytes':sum(x['bytes'] for x in rows),'extensions':{},'directories':{}}
for x in rows:
    summary['extensions'].setdefault(x['extension'],{'count':0,'bytes':0}); summary['extensions'][x['extension']]['count']+=1; summary['extensions'][x['extension']]['bytes']+=x['bytes']
    top=x['path'].split('/')[0] if '/' in x['path'] else '[root]'; summary['directories'].setdefault(top,{'count':0,'bytes':0}); summary['directories'][top]['count']+=1; summary['directories'][top]['bytes']+=x['bytes']
entries={}
for name in ['index.html','aria_companion.html','aria_knowledge_studio.html']:
    p=ROOT/name; text=p.read_text('utf-8',errors='replace'); soup=BeautifulSoup(text,'html.parser')
    scripts=[]
    for i,s in enumerate(soup.find_all('script'),1):
        scripts.append({'order':i,'src':s.get('src'),'inlineBytes':len((s.string or s.get_text() or '').encode()) if not s.get('src') else 0,'type':s.get('type') or 'classic'})
    entries[name]={
      'title':soup.title.string.strip() if soup.title and soup.title.string else None,
      'scripts':scripts,
      'stylesheets':[l.get('href') for l in soup.find_all('link',rel=lambda v:v and 'stylesheet' in v)],
      'metaRefresh':[m.get('content') for m in soup.find_all('meta') if (m.get('http-equiv') or '').lower()=='refresh'],
      'signals':{
        'fetchCalls':len(re.findall(r'\bfetch\s*\(',text)),
        'addEventListenerCalls':len(re.findall(r'\baddEventListener\s*\(',text)),
        'indexedDBMentions':len(re.findall(r'\bindexedDB\b',text)),
        'localStorageMentions':len(re.findall(r'\blocalStorage\b',text)),
        'sessionStorageMentions':len(re.findall(r'\bsessionStorage\b',text)),
        'BroadcastChannelMentions':len(re.findall(r'\bBroadcastChannel\b',text)),
        'DOMContentLoadedMentions':len(re.findall(r'DOMContentLoaded',text)),
      }
    }
report={'generatedFrom':'Aria GitHub Edition v0.3.15.2','summary':summary,'files':rows,'entryPoints':entries}
(OUT/'phase1-inventory.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
(OUT/'reference-sha256.json').write_text(json.dumps({x['path']:x['sha256'] for x in rows},indent=2),encoding='utf-8')

def fmtbytes(n):
    for u in ['B','KB','MB','GB']:
        if n<1024 or u=='GB': return f'{n:.1f} {u}' if u!='B' else f'{n} B'
        n/=1024
lines=['# Phase 1 Baseline Report','','## Baseline','','- Source release: `aria_runtime_v0_3_15_2_dynamic_routing_response_rotation.zip`','- Audit strategy: untouched reference copy plus behavior-equivalent working copy','- Behavioral code changes in Phase 1: **none**',f"- Inventory: **{summary['fileCount']} files**, **{fmtbytes(summary['totalBytes'])}** excluding generated audit reports",'', '## Package structure','', '```text']
# tree compact
for top,d in sorted(summary['directories'].items()): lines.append(f'{top}  ({d["count"]} files, {fmtbytes(d["bytes"])})')
lines += ['```','','## File-type inventory','','| Type | Files | Size |','|---|---:|---:|']
for ext,d in sorted(summary['extensions'].items()): lines.append(f'| `{ext}` | {d["count"]} | {fmtbytes(d["bytes"])} |')
lines += ['','## Entry points']
for name,data in entries.items():
    lines += ['',f'### `{name}`','',f'- Document title: `{data["title"]}`',f'- Script blocks: **{len(data["scripts"])}**',f'- External stylesheets: **{len(data["stylesheets"])}**',f'- Meta refresh: `{data["metaRefresh"] or "none"}`','', '| Order | Script | Type | Inline size |','|---:|---|---|---:|']
    for s in data['scripts']: lines.append(f'| {s["order"]} | `{s["src"] or "inline"}` | `{s["type"]}` | {s["inlineBytes"]} bytes |')
    lines += ['','Static signals:']
    for k,v in data['signals'].items(): lines.append(f'- {k}: **{v}**')
lines += ['','## Entry behavior established','','- `index.html` immediately redirects to `aria_companion.html` using both a meta refresh and `location.replace()`.','- `aria_companion.html` loads `github-runtime/static-backend.js` before the main Companion runtime.','- `aria_knowledge_studio.html` loads the same browser backend shim, then initializes its Studio runtime and calls `loadCatalog()`.','- Knowledge Studio retains `ariaKnowledgeStudio.baseUrl` in `localStorage`, defaulting to `http://localhost:3000`; the GitHub browser shim intercepts supported API calls.','','## Baseline preservation','','- `/mnt/data/aria_v0_3_15_2_reference` is the frozen, untouched extraction.','- `/mnt/data/aria_v0_3_16_phase1_audit_working` contains Phase 1 documentation and tooling only.','- `reference-sha256.json` records hashes for comparison during later phases.','','## Phase 1 boundary','','This report records structure and startup evidence only. It does not classify runtime ownership, duplicates, legacy code, or architectural risks; those belong to later audit phases.']
(OUT/'01-baseline-report.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(json.dumps(summary,indent=2))
