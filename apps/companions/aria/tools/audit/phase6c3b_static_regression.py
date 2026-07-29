from pathlib import Path
import sys
root=Path(__file__).resolve().parents[2]
text=(root/'aria_knowledge_studio.html').read_text(encoding='utf-8')
checks={
'button':'id="exportRepoBundleBtn"' in text,
'handler':'exportRepositoryBundle' in text,
'zip_writer':'createStoredZip' in text and '0x06054b50' in text,
'stable_topic_path':'knowledge/topics/${id}.json' in text,
'manifest_path':'knowledge/topics/${id}.manifest.json' in text,
'catalog_path':"name:'knowledge/catalog.json'" in text,
'active_guard':'This topic has no active revision' in text,
}
for k,v in checks.items(): print(('PASS' if v else 'FAIL'),k)
sys.exit(0 if all(checks.values()) else 1)
