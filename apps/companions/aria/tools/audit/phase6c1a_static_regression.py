#!/usr/bin/env python3
from pathlib import Path
import re, sys
root=Path(__file__).resolve().parents[2]
backend=(root/'github-runtime/static-backend.js').read_text(encoding='utf-8')
companion=(root/'aria_companion.html').read_text(encoding='utf-8')
checks={
 'dynamic rotate function': 'function rotate(values, key)' in backend,
 'dynamic revision key': '`${id}:${revisionId}:${name}`' in backend,
 'dynamic cycle boundary exclusion': 'bag[0] === last' in backend,
 'offline shuffle bag': 'const offlineResponseRotation = new WeakMap()' in companion,
 'weighted dialogue selector': 'const totalWeight = selectionPool.reduce' in companion,
 'weighted immediate exclusion': 'const nonRepeatingPool = pool.filter' in companion,
}
failed=[]
for name,ok in checks.items():
 print(('PASS' if ok else 'FAIL')+' - '+name)
 if not ok: failed.append(name)
sys.exit(1 if failed else 0)
