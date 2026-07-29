#!/usr/bin/env python3
from pathlib import Path
import re, sys

root = Path(__file__).resolve().parents[2]
html = (root / "aria_companion.html").read_text(encoding="utf-8")
checks = {
    "ready promise exported": "window.ARIA_COMPANION_READY = AppLifecycle.initialize();" in html,
    "lifecycle event emitted": 'new CustomEvent("aria:lifecycle"' in html,
    "cycle detection present": "dependency cycle:" in html,
    "rollback present": "destroyInitialized(initializedThisRun)" in html,
    "module status exposed": "get status()" in html,
    "readiness gate present": "whenReady()" in html,
    "diagnostic snapshot present": "describe()" in html,
    "restart checks teardown": "if (!destroyed) return false;" in html,
}
failed = [name for name, ok in checks.items() if not ok]
for name, ok in checks.items():
    print(("PASS" if ok else "FAIL") + " - " + name)
if failed:
    sys.exit(1)
