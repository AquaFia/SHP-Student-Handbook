from pathlib import Path
root=Path(__file__).resolve().parents[2]
b=(root/'github-runtime/static-backend.js').read_text(encoding='utf-8')
c=(root/'aria_companion.html').read_text(encoding='utf-8')
checks={
"revision map":"activeRevisions: new Map()" in b,
"rotation invalidation":"function clearTopicRotation" in b,
"revision observation":"function observeActiveRevision" in b,
"broadcast channel":"aria-knowledge-revisions-v1" in b and "BroadcastChannel" in b,
"activation broadcast":"broadcastRevisionChange" in b and "revision-${action}" in b,
"trace metadata":"revisionRefresh" in b,
"diagnostics fields":"Rotation keys invalidated" in c and "Refresh source" in c,
}
for name,ok in checks.items(): print(("PASS" if ok else "FAIL")+" - "+name)
raise SystemExit(0 if all(checks.values()) else 1)
