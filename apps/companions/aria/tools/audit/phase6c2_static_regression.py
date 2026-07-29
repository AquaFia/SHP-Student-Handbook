from pathlib import Path
root=Path(__file__).resolve().parents[2]
h=(root/'aria_companion.html').read_text(encoding='utf-8')
b=(root/'github-runtime/static-backend.js').read_text(encoding='utf-8')
checks={
'ResponseHistory service':'const ResponseHistory = (() =>' in h,
'bounded history':'const MAX_ENTRIES = 16' in h,
'backend signatures payload':'recentResponseSignatures: ResponseHistory.recentSignatures(8)' in h,
'backend exclusion':'excludedSignatures' in b,
'diagnostics':'debugResponseHistory' in h and 'duplicatePrevented' in h,
}
for k,v in checks.items(): print(('PASS' if v else 'FAIL'),'-',k)
raise SystemExit(0 if all(checks.values()) else 1)
