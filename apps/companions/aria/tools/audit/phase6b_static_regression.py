from pathlib import Path
import sys
root=Path(__file__).resolve().parents[2]
comp=(root/"aria_companion.html").read_text(encoding="utf-8")
backend=(root/"github-runtime/static-backend.js").read_text(encoding="utf-8")
checks={
 "no-match uses HTTP success": "responseMode: 'no-match'" in backend and "No static backend match.' }, 404" not in backend,
 "explicit matched false": "matched: false" in backend,
 "apiReply recognizes no-match": 'data?.matched === false || data?.responseMode === "no-match"' in comp,
 "route outcomes separated": "routeOutcomes:[]" in comp and "lastRoutingOutcome" in comp,
 "typed HTTP error": 'error.name = "BackendHttpError"' in comp,
 "typed protocol error": 'error.name = "BackendProtocolError"' in comp,
 "typed timeout error": 'timeoutError.name = "BackendTimeoutError"' in comp,
 "offline continuation": 'outcome: "no-match"' in comp and 'return null;' in comp,
}
failed=[]
for name,ok in checks.items():
 print(("PASS" if ok else "FAIL"), "-", name)
 if not ok: failed.append(name)
sys.exit(1 if failed else 0)
