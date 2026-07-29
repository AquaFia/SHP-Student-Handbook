#!/usr/bin/env python3
from pathlib import Path
import re, csv, sys
ROOT=Path(sys.argv[1] if len(sys.argv)>1 else '.')
PATTERNS={
'indexeddb_open':r'indexedDB\.open\s*\(', 'indexeddb_delete':r'indexedDB\.deleteDatabase\s*\(',
'local_get':r'localStorage\.getItem\s*\(', 'local_set':r'localStorage\.setItem\s*\(',
'session_storage':r'sessionStorage\.', 'broadcast_channel':r'BroadcastChannel\s*\(',
'file_reader':r'new\s+FileReader\s*\(', 'blob_export':r'new\s+Blob\s*\('
}
rows=[]
for p in ROOT.rglob('*'):
 if p.is_file() and p.suffix.lower() in {'.html','.js','.mjs'}:
  for n,line in enumerate(p.read_text(errors='replace').splitlines(),1):
   for name,pat in PATTERNS.items():
    if re.search(pat,line): rows.append((str(p.relative_to(ROOT)),n,name,line.strip()[:240]))
w=csv.writer(sys.stdout); w.writerow(['file','line','operation','excerpt']); w.writerows(rows)
