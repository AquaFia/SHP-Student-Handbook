#!/usr/bin/env python3
from pathlib import Path
import re, json, csv, hashlib, datetime
ROOT=Path(__file__).resolve().parents[2]
AUD=ROOT/'docs'/'audit'
FILES=['aria_companion.html','aria_knowledge_studio.html','github-runtime/static-backend.js','scripts/sync-notion.mjs','index.html']
texts={f:(ROOT/f).read_text(encoding='utf-8',errors='replace') for f in FILES if (ROOT/f).exists()}
lines={f:t.splitlines() for f,t in texts.items()}

def line_of(text,pos): return text.count('\n',0,pos)+1

decl_patterns=[
 ('function',re.compile(r'(?m)^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(')),
 ('class',re.compile(r'(?m)^\s*class\s+([A-Za-z_$][\w$]*)\b')),
 ('const-object',re.compile(r'(?m)^\s*const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:Object\.freeze\s*\()?\s*\{')),
 ('const-iife',re.compile(r'(?m)^\s*const\s+([A-Za-z_$][\w$]*)\s*=\s*\(\s*(?:async\s*)?\(.*?\)\s*=>')),
 ('const-function',re.compile(r'(?m)^\s*const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^\n;]*?\)\s*=>')),
 ('const-value',re.compile(r'(?m)^\s*const\s+([A-Z][A-Za-z0-9_$]{2,})\s*=')),
]
all_decls=[]
seen=set()
for f,t in texts.items():
 for kind,pat in decl_patterns:
  for m in pat.finditer(t):
   name=m.group(1); key=(f,name,line_of(t,m.start()))
   if key in seen: continue
   seen.add(key)
   all_decls.append({'name':name,'kind':kind,'file':f,'line':key[2]})

inventory=json.load(open(AUD/'phase2-runtime-inventory.json',encoding='utf-8'))
# Symbols explicitly evidenced by Phase 2 plus important named functions around those regions.
targets=[]
for sys in inventory['systems']:
 for ev in sys.get('evidence',[]):
  sym=ev.get('symbol','')
  m=re.search(r'(?:const|function|class)\s+([A-Za-z_$][\w$]*)',sym)
  if m: targets.append((m.group(1),sys['id'],sys['name'],sys['risk']))
# Add known lifecycle and route names found in code.
extra=['routeTopic','apiReply','pick','manualRefresh','loadCatalog','openDatabase','publishDraft','activateRevision','rollbackRevision','recordDiagnosticError','buildCommandContext','initializeRuntime','init','bootstrap','sendMessage','handleMessage','query','route','respond','renderDeveloperDiagnostics']
for n in extra: targets.append((n,'CROSS','Cross-system helper','High'))
# dedupe by symbol preserving attached systems
symbol_systems={}
for name,sid,sname,risk in targets:
 symbol_systems.setdefault(name,[]).append({'id':sid,'name':sname,'risk':risk})

symbols=[]
for name,systems in symbol_systems.items():
 decls=[d for d in all_decls if d['name']==name]
 refs=[]
 pattern=re.compile(r'(?<![\w$])'+re.escape(name)+r'(?![\w$])')
 for f,t in texts.items():
  for m in pattern.finditer(t):
   ln=line_of(t,m.start())
   if any(d['file']==f and d['line']==ln for d in decls): continue
   snippet=lines[f][ln-1].strip()[:260]
   refs.append({'file':f,'line':ln,'snippet':snippet})
 # Limit repeated references but retain first/last spread
 if len(refs)>30:
  refs=refs[:20]+refs[-10:]
 symbols.append({'name':name,'declarations':decls,'references':refs,'referenceCount':sum(len(list(re.finditer(pattern,t))) for t in texts.values())-len(decls),'systems':systems})

# Script blocks and entrypoint details
script_blocks=[]
for f in ['aria_companion.html','aria_knowledge_studio.html','index.html']:
 t=texts.get(f,'')
 for i,m in enumerate(re.finditer(r'<script\b([^>]*)>([\s\S]*?)</script>',t,re.I),1):
  attrs=m.group(1); body=m.group(2)
  srcm=re.search(r'\bsrc=["\']([^"\']+)',attrs,re.I)
  script_blocks.append({'file':f,'index':i,'startLine':line_of(t,m.start()),'endLine':line_of(t,m.end()),'src':srcm.group(1) if srcm else None,'inlineBytes':len(body.encode()) if not srcm else 0})

# Global/storage/network/event scans
scan_patterns={
 'storage':r'\b(?:localStorage|sessionStorage|indexedDB|IDBDatabase|IDBObjectStore)\b',
 'network':r'\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b',
 'events':r'\b(?:addEventListener|dispatchEvent|BroadcastChannel|postMessage)\b',
 'timers':r'\b(?:setTimeout|setInterval|requestAnimationFrame)\b',
 'globals':r'\b(?:window\.|globalThis\.|ARIA_V3_APP\b)'
}
scans={}
for cat,p in scan_patterns.items():
 pat=re.compile(p)
 scans[cat]=[]
 for f,t in texts.items():
  matches=list(pat.finditer(t))
  scans[cat].append({'file':f,'count':len(matches),'sampleLines':sorted(set(line_of(t,m.start()) for m in matches))[:25]})

# Build system-to-symbol map using evidence and nearby declarations (+/- 180 lines)
system_maps=[]
for sys in inventory['systems']:
 locations=[]
 for ev in sys.get('evidence',[]):
  f=ev['file']; ln=ev['line']
  near=[d for d in all_decls if d['file']==f and abs(d['line']-ln)<=180]
  locations.append({'file':f,'anchorLine':ln,'anchorSymbol':ev.get('symbol'),'nearbyDeclarations':near[:40]})
 system_maps.append({k:sys.get(k) for k in ['id','name','area','location','purpose','labels','risk','recommended_target','confidence']}|{'anchors':locations})

out={
 'audit':'v0.3.16 Phase 3 Source Map',
 'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'baseline':'v0.3.16 Phase 2 working copy; production runtime unchanged',
 'files':FILES,
 'declarationCount':len(all_decls),
 'declarations':sorted(all_decls,key=lambda x:(x['file'],x['line'],x['name'])),
 'targetSymbols':symbols,
 'scriptBlocks':script_blocks,
 'systemMaps':system_maps,
 'crossCuttingScans':scans,
}
(AUD/'phase3-source-map.json').write_text(json.dumps(out,indent=2),encoding='utf-8')
with open(AUD/'phase3-symbol-index.csv','w',newline='',encoding='utf-8') as fh:
 w=csv.writer(fh); w.writerow(['symbol','kind','file','line','reference_count','systems'])
 for s in symbols:
  if s['declarations']:
   for d in s['declarations']: w.writerow([s['name'],d['kind'],d['file'],d['line'],s['referenceCount'],'; '.join(x['id'] for x in s['systems'])])
  else: w.writerow([s['name'],'unresolved','','',s['referenceCount'],'; '.join(x['id'] for x in s['systems'])])

# Integrity
critical=['aria_companion.html','aria_knowledge_studio.html','github-runtime/static-backend.js','index.html','scripts/sync-notion.mjs','knowledge/catalog.json']
ref=ROOT.parent/'aria_v0_3_15_2_reference'
integ=[]
for f in critical:
 a=ROOT/f; b=ref/f
 def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None
 integ.append({'file':f,'workingSha256':sha(a),'referenceSha256':sha(b),'identical':sha(a)==sha(b)})
(AUD/'phase3-runtime-integrity.json').write_text(json.dumps({'allIdentical':all(x['identical'] for x in integ),'files':integ},indent=2),encoding='utf-8')
print('declarations',len(all_decls),'symbols',len(symbols),'scripts',len(script_blocks))
