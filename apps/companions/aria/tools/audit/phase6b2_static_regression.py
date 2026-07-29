from pathlib import Path
import sys
root=Path(__file__).resolve().parents[2]
h=(root/'aria_companion.html').read_text(encoding='utf-8')
b=(root/'github-runtime/static-backend.js').read_text(encoding='utf-8')
checks={
 'contract present':'PHASE 6B.2 — SHARED ROUTING DECISION CONTRACT' in h,
 'five outcomes':all(f'"{x}"' in h for x in ['matched','no-match','blocked','unavailable','error']),
 'knowledge router decision':'fromKnowledgeRouter(status, selected)' in h,
 'context decisions':'routeDecisions:[]' in h,
 'backend unavailable':'backend-health-check-unavailable' in h,
 'backend error decision':'backend-route-error' in h,
 'dynamic backend envelope':"reason: 'dynamic-topic'" in b,
 'static backend envelope':"reason: 'extractive-static'" in b,
 'no-match backend envelope':"outcome: 'no-match'" in b
}
for name,ok in checks.items(): print(('PASS' if ok else 'FAIL')+' - '+name)
sys.exit(0 if all(checks.values()) else 1)
