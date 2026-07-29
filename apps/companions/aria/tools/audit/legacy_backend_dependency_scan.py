#!/usr/bin/env python3
from pathlib import Path
import re, json, csv, hashlib
ROOT=Path(__file__).resolve().parents[2]
TARGETS=[ROOT/'aria_companion.html',ROOT/'aria_knowledge_studio.html',ROOT/'github-runtime/static-backend.js',ROOT/'README.md',ROOT/'START_HERE.txt',ROOT/'docs/GITHUB_EDITION_ARCHITECTURE.md']
patterns={
 'localhost':re.compile(r'localhost|127\.0\.0\.1',re.I),
 'api_route':re.compile(r'/api/[A-Za-z0-9_./:${}\-]+'),
 'fetch':re.compile(r'\bfetch\s*\('),
 'backend_term':re.compile(r'\bbackend\b',re.I),
 'express_term':re.compile(r'\bexpress\b',re.I),
 'node_term':re.compile(r'\bnode(?:_modules)?\b',re.I),
}
rows=[]
for p in TARGETS:
    if not p.exists(): continue
    for n,line in enumerate(p.read_text('utf-8',errors='replace').splitlines(),1):
        hits=[name for name,rx in patterns.items() if rx.search(line)]
        if hits:
            rows.append({'file':str(p.relative_to(ROOT)),'line':n,'categories':hits,'text':line.strip()[:500]})
out=ROOT/'docs/audit'
out.mkdir(parents=True,exist_ok=True)
with (out/'phase1_5_backend_reference_hits.csv').open('w',newline='',encoding='utf-8') as f:
    w=csv.DictWriter(f,fieldnames=['file','line','categories','text']);w.writeheader()
    for r in rows:w.writerow({**r,'categories':';'.join(r['categories'])})
summary={
 'scanVersion':'1.0',
 'scope':[str(p.relative_to(ROOT)) for p in TARGETS if p.exists()],
 'totalMatchingLines':len(rows),
 'countsByCategory':{k:sum(k in r['categories'] for r in rows) for k in patterns},
 'countsByFile':{},
}
for r in rows:summary['countsByFile'][r['file']]=summary['countsByFile'].get(r['file'],0)+1
(out/'phase1_5_backend_reference_summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print(json.dumps(summary,indent=2))
