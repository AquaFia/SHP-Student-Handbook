from pathlib import Path
import sys
root=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parents[2]
s=(root/"aria_companion.html").read_text(encoding="utf-8")
checks={
"response mode field": 'id="debugResponseMode"' in s,
"routing outcome field": 'id="debugLastRoutingOutcome"' in s,
"response mode normalized": 'responseMode:result.responseMode' in s,
"explicit no-match trace": '`${route.id}: ${routeOutcome.outcome} (continued)`' in s,
"current mode preserved": '<b>Current mode</b>' in s,
}
failed=False
for name,ok in checks.items():
 print(("PASS" if ok else "FAIL")+" - "+name)
 failed |= not ok
raise SystemExit(1 if failed else 0)
