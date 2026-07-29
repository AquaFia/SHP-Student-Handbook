from pathlib import Path
root = Path(__file__).resolve().parents[2]
html = (root / 'aria_companion.html').read_text(encoding='utf-8')
checks = {
    'targeted response rotation selector': '#debugResponseRotation {' in html,
    'horizontal overflow enabled': 'overflow-x: auto;' in html,
    'no-wrap identifier display': 'white-space: pre;' in html,
    'two-axis touch gesture': 'touch-action: pan-x pan-y;' in html,
}
failed = False
for name, ok in checks.items():
    print(('PASS' if ok else 'FAIL') + ' - ' + name)
    failed |= not ok
raise SystemExit(1 if failed else 0)
