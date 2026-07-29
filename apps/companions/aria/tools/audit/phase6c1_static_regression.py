from pathlib import Path
import sys
root=Path(__file__).resolve().parents[2]
h=(root/'aria_companion.html').read_text(encoding='utf-8')
b=(root/'github-runtime/static-backend.js').read_text(encoding='utf-8')
checks=[
 ('normalized response identity','function normalizedResponseIdentity' in h),
 ('offline duplicate collapse','const uniqueIndexes = []' in h),
 ('offline previous exclusion','bag[0] === lastIndex' in h),
 ('dialogue last selection','dialoguePoolLastSelection' in h),
 ('weighted non-repeating pool','const nonRepeatingPool = pool.filter' in h),
 ('single pool fallback','nonRepeatingPool.length ? nonRepeatingPool : pool' in h),
 ('revision-scoped dynamic key',"${id}:${revisionId}:${name}" in b),
]
failed=False
for name,ok in checks:
 print(('PASS' if ok else 'FAIL')+' - '+name)
 failed |= not ok
sys.exit(1 if failed else 0)
