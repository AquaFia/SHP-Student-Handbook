from pathlib import Path
import json, csv, hashlib, datetime, shutil, subprocess, zipfile
root=Path('/mnt/data/phase4_work')
work=root/'aria_v0_3_16_phase1_audit_working'
ref=root/'aria_v0_3_15_2_reference'
audit=work/'docs/audit'; audit.mkdir(parents=True,exist_ok=True)
tools=work/'tools/audit'; tools.mkdir(parents=True,exist_ok=True)

def edge(src,dst,kind,phase,risk,evidence,note=''):
 return dict(source=src,target=dst,kind=kind,phase=phase,risk=risk,evidence=evidence,note=note)

init_nodes=[
 ('I01','static-backend shim','Browser prelude','github-runtime/static-backend.js','High','Runs before Companion/Studio application code and replaces window.fetch.'),
 ('I02','inline declarations','Construction','aria_companion.html','Critical','Most providers, runtimes, stores, registries, and UI helpers are constructed in source order.'),
 ('I03','ARIA_V3_APP assembly','Application facade','aria_companion.html','High','Exposes previously constructed runtimes and public methods.'),
 ('I04','CompanionModules registry','Lifecycle','aria_companion.html','High','Registers ordered modules and validates existing runtime objects.'),
 ('I05','AppLifecycle','Lifecycle','aria_companion.html','High','Calls initializeAll(), handles ready/error state, restart, and destruction.'),
 ('I06','configuration','Lifecycle module','aria_companion.html','Medium','First registered lifecycle module.'),
 ('I07','shared-utilities','Lifecycle module','aria_companion.html','High','Validates DialogueText, DialoguePool, DataSchema, and RenderScheduler.'),
 ('I08','state','Lifecycle module','aria_companion.html','High','Validates StateStore.'),
 ('I09','commands','Lifecycle module','aria_companion.html','High','Validates CommandBus.'),
 ('I10','panels','Lifecycle module','aria_companion.html','Medium','Validates panel manager.'),
 ('I11','character-engine','Lifecycle module','aria_companion.html','High','Initializes expression, rapport, and character UI.'),
 ('I12','knowledge-routing','Lifecycle module','aria_companion.html','Critical','Renders knowledge index but does not own all router construction.'),
 ('I13','special-mode','Lifecycle module','aria_companion.html','High','Initializes investigation/selection/debate systems.'),
 ('I14','event-bindings','Lifecycle module','aria_companion.html','High','Binds application DOM and delegated events.'),
 ('I15','diagnostics','Lifecycle module','aria_companion.html','High','Initializes diagnostics and flushes scheduled rendering.'),
 ('I16','backend compatibility','Lifecycle module','aria_companion.html','High','Initializes backend-shaped browser contract and reconnect listeners.'),
 ('I17','knowledge-sync','Lifecycle module','aria_companion.html','Critical','Starts KnowledgeSyncRuntime after backend compatibility.'),
 ('I18','ready','Lifecycle module','aria_companion.html','Medium','Final focus/ready transition.'),
 ('I19','Studio script initialization','Studio','aria_knowledge_studio.html','High','Creates Studio state, binds controls, and loads catalog independently.'),
]
init_edges=[
 edge('I01','I02','loads-before','construction','Critical','HTML script order','The shim must exist before backend-shaped fetch calls.'),
 edge('I02','I03','constructs-before','construction','Critical','aria_companion.html source order'),
 edge('I03','I04','precedes','construction','High','ARIA_V3_APP appears before lifecycle registry'),
 edge('I04','I05','controlled-by','lifecycle','High','AppLifecycle.initialize calls CompanionModules.initializeAll'),
 edge('I05','I06','initializes','lifecycle','Medium','module order 10'),
 edge('I06','I07','dependency','lifecycle','High','shared-utilities depends on configuration'),
 edge('I07','I08','dependency','lifecycle','High','state depends on shared-utilities'),
 edge('I08','I09','dependency','lifecycle','High','commands depends on state'),
 edge('I09','I10','dependency','lifecycle','Medium','panels depends on commands'),
 edge('I08','I11','dependency','lifecycle','High','character-engine depends on state'),
 edge('I06','I12','dependency','lifecycle','High','knowledge-routing depends on configuration'),
 edge('I07','I12','dependency','lifecycle','High','knowledge-routing depends on shared-utilities'),
 edge('I11','I12','dependency','lifecycle','Critical','knowledge-routing depends on character-engine'),
 edge('I08','I13','dependency','lifecycle','High','special-mode depends on state'),
 edge('I09','I13','dependency','lifecycle','High','special-mode depends on commands'),
 edge('I10','I13','dependency','lifecycle','High','special-mode depends on panels'),
 edge('I09','I14','dependency','lifecycle','High','event-bindings depends on commands'),
 edge('I10','I14','dependency','lifecycle','High','event-bindings depends on panels'),
 edge('I13','I14','dependency','lifecycle','High','event-bindings depends on special-mode'),
 edge('I08','I15','dependency','lifecycle','High','diagnostics depends on state'),
 edge('I09','I15','dependency','lifecycle','High','diagnostics depends on commands'),
 edge('I14','I15','dependency','lifecycle','High','diagnostics depends on event-bindings'),
 edge('I15','I16','dependency','lifecycle','High','backend depends on diagnostics'),
 edge('I16','I17','dependency','lifecycle','Critical','knowledge-sync depends on backend'),
 edge('I12','I18','dependency','lifecycle','High','ready depends on knowledge-routing'),
 edge('I13','I18','dependency','lifecycle','High','ready depends on special-mode'),
 edge('I14','I18','dependency','lifecycle','High','ready depends on event-bindings'),
 edge('I16','I18','dependency','lifecycle','High','ready depends on backend'),
 edge('I17','I18','dependency','lifecycle','Critical','ready depends on knowledge-sync'),
 edge('I01','I19','loads-before','studio construction','High','Studio includes static-backend.js before its inline script'),
]

run_nodes=[
 ('R01','User input','UI','aria_companion.html','High','Message submission entry.'),
 ('R02','Identity/onboarding gate','Routing plane','aria_companion.html','Critical','May consume input before ordinary dialogue.'),
 ('R03','Episode/special-mode gate','Routing plane','aria_companion.html','High','Mode-specific processing can bypass normal chat routing.'),
 ('R04','ResponseRegistry','Routing plane 1','aria_companion.html','Critical','Preprogrammed response matching and route registration.'),
 ('R05','KnowledgeQueryRouter','Routing plane 2','aria_companion.html','Critical','Provider-based knowledge query routing.'),
 ('R06','apiReply','Compatibility boundary','aria_companion.html','Critical','Builds server-era request and calls /api/aria-chat.'),
 ('R07','fetch interception','Browser boundary','github-runtime/static-backend.js','Critical','Intercepts API-shaped request in browser.'),
 ('R08','routeTopic','Routing plane 3','github-runtime/static-backend.js','Critical','Matches active dynamic topics and selects rapport response.'),
 ('R09','Notion static search','Knowledge source','github-runtime/static-backend.js','High','Searches generated static Notion index.'),
 ('R10','offline/personality fallback','Dialogue','aria_companion.html','High','Handles no-match and failed compatibility responses.'),
 ('R11','Response selection/rotation','Dialogue','both','Critical','Multiple selectors currently exist across Companion and shim.'),
 ('R12','Rapport state','Character state','aria_companion.html','High','Influences topic availability and response pool.'),
 ('R13','Portrait/expression selection','Presentation','aria_companion.html','Medium','Maps resulting response/emotion to visual state.'),
 ('R14','Chat renderer','UI','aria_companion.html','High','Displays answer and updates visible state.'),
 ('R15','Diagnostics trace','Diagnostics','aria_companion.html','High','Records route, backend fallback, errors, and response details.'),
 ('R16','KnowledgeProvider','Knowledge','aria_companion.html','High','Resolves registered local/legacy knowledge objects.'),
 ('R17','DynamicKnowledgeRuntime','Knowledge','aria_companion.html','High','Resolves overrides/cache/provider sources.'),
]
run_edges=[
 edge('R01','R02','submit','runtime','Critical','message submission path'),
 edge('R02','R03','passes-if-complete','runtime','High','identity completion gate'),
 edge('R03','R04','passes-if-normal-chat','runtime','High','mode gate'),
 edge('R04','R11','selects-preprogrammed','runtime','Critical','ResponseRegistry response pools'),
 edge('R04','R05','delegates-knowledge','runtime','Critical','registered knowledge route'),
 edge('R05','R16','queries','runtime','High','provider-based lookup'),
 edge('R16','R17','feeds/overrides','runtime','High','DynamicKnowledgeRuntime uses KnowledgeProvider'),
 edge('R05','R11','selects-knowledge-response','runtime','Critical','knowledge answer resolution'),
 edge('R04','R06','fallback-to-api','runtime','Critical','apiReply fallback'),
 edge('R06','R07','fetch','runtime','Critical','/api/aria-chat intercepted by shim'),
 edge('R07','R08','dispatch','runtime','Critical','intercept handler'),
 edge('R12','R08','rapport-input','runtime','High','chooseTopicResponse uses rapport band'),
 edge('R08','R11','dynamic-response','runtime','Critical','shim rotation logic'),
 edge('R08','R09','falls-through','runtime','High','no dynamic topic match'),
 edge('R09','R10','no-match','runtime','High','404/no knowledge result leads Companion fallback'),
 edge('R11','R13','suggests-expression','runtime','Medium','response metadata/character behavior'),
 edge('R13','R14','renders-with','runtime','Medium','portrait plus message'),
 edge('R11','R14','response-text','runtime','High','selected answer displayed'),
 edge('R04','R15','route-trace','diagnostics','High','registry trace'),
 edge('R05','R15','knowledge-trace','diagnostics','High','query trace'),
 edge('R06','R15','backend-fallback-trace','diagnostics','High','404 recorded as backend error'),
 edge('R08','R15','shim-trace-via-response','diagnostics','Medium','dynamic trace returned in envelope'),
]

store_nodes=[
 ('S01','Knowledge Studio UI','Application','aria_knowledge_studio.html','High','Creates, reviews, approves, activates, rolls back topics.'),
 ('S02','Studio API-shaped fetch','Compatibility boundary','aria_knowledge_studio.html','High','Calls /api/knowledge routes.'),
 ('S03','static-backend intercept','Browser boundary','github-runtime/static-backend.js','Critical','Shared execution boundary for Companion and Studio.'),
 ('S04','IndexedDB objects','Storage','github-runtime/static-backend.js','Critical','Stores knowledge objects and local records.'),
 ('S05','IndexedDB manifests/revisions','Storage','github-runtime/static-backend.js','Critical','Stores publication lifecycle and active revision metadata.'),
 ('S06','repository catalog.json','Static storage','knowledge/catalog.json','High','Lists repository topics.'),
 ('S07','repository topic JSON','Static storage','knowledge/topics','High','Baseline topic records and manifests.'),
 ('S08','Notion static index','Static storage','knowledge/notion/index.json','Medium','Generated optional knowledge source.'),
 ('S09','GitHub Action sync','Build-time sync','.github/workflows/sync-notion.yml','Medium','Runs script and commits generated index.'),
 ('S10','BroadcastChannel','Synchronization','browser','High','Notifies open Companion about Studio publication changes.'),
 ('S11','KnowledgeSyncRuntime','Companion synchronization','aria_companion.html','Critical','Listens/polls/refreshes knowledge state.'),
 ('S12','DynamicKnowledgeRuntime cache','Memory cache','aria_companion.html','High','Caches and overrides resolved knowledge.'),
 ('S13','KnowledgeProvider registry/cache','Memory registry','aria_companion.html','High','Local provider objects and lookup cache.'),
 ('S14','Companion dynamic router catalog','Memory catalog','github-runtime/static-backend.js','Critical','Refreshes active topic catalog before routing.'),
 ('S15','localStorage/session state','Browser storage','aria_companion.html','High','Stores rapport, settings, and other Companion state.'),
]
store_edges=[
 edge('S01','S02','lifecycle-command','runtime','High','Studio publish/review/activate functions'),
 edge('S02','S03','intercepted-fetch','runtime','Critical','browser shim replaces server endpoint'),
 edge('S03','S04','read/write','runtime','Critical','knowledge object persistence'),
 edge('S03','S05','read/write','runtime','Critical','revision/manifest persistence'),
 edge('S06','S03','baseline-load','startup','High','catalog loaded by shim'),
 edge('S07','S03','baseline-load','startup','High','topic/manifests loaded by shim'),
 edge('S08','S03','optional-search-source','runtime','Medium','notionSearch reads generated index'),
 edge('S09','S08','generates/commits','build-time','Medium','sync-notion workflow'),
 edge('S03','S10','publication-ack','runtime','High','activation emits synchronization message'),
 edge('S10','S11','notifies','runtime','Critical','Companion listener'),
 edge('S11','S12','invalidates/refreshes','runtime','Critical','knowledge refresh clears/reloads runtime cache'),
 edge('S11','S13','refreshes','runtime','High','provider refresh hooks'),
 edge('S04','S14','catalog-refresh','runtime','Critical','active IndexedDB topics enumerated before route'),
 edge('S05','S14','active-revision-selection','runtime','Critical','manifest controls active revision'),
 edge('S06','S14','repository-baseline','startup','High','catalog baseline'),
 edge('S15','S12','context-input','runtime','High','rapport/session may influence resolution'),
]

# potential hazards/cycles
hazards=[
 {'id':'H01','type':'pre-lifecycle construction','severity':'Critical','path':['static-backend shim','inline declarations','ARIA_V3_APP assembly','CompanionModules','AppLifecycle'],'finding':'The lifecycle does not own construction of most runtime globals. Source order and temporal-dead-zone failures remain possible before initializeAll().','target':'v0.4.0'},
 {'id':'H02','type':'multi-plane routing','severity':'Critical','path':['ResponseRegistry','KnowledgeQueryRouter','apiReply','static-backend routeTopic'],'finding':'Three decision planes can disagree on match/no-match and response metadata.','target':'v0.3.17'},
 {'id':'H03','type':'diagnostic feedback risk','severity':'High','path':['runtime failure','recordDiagnosticError','RenderScheduler','developer diagnostics'],'finding':'A previous recursive diagnostics loop shows that observer paths must remain one-way. Current hotfix prevents the known loop, but the dependency remains sensitive.','target':'v0.4.4'},
 {'id':'H04','type':'synchronization ownership','severity':'Critical','path':['Studio activation','IndexedDB','BroadcastChannel','KnowledgeSyncRuntime','DynamicKnowledgeRuntime/KnowledgeProvider'],'finding':'Publication state crosses two applications and several caches; no single service owns the transaction end-to-end.','target':'v0.4.1/v0.4.2'},
 {'id':'H05','type':'backend-shaped no-match','severity':'High','path':['apiReply','shim /api/aria-chat','no topic match','HTTP 404','offline fallback'],'finding':'Normal knowledge absence is encoded as transport failure and pollutes diagnostics.','target':'v0.3.17'},
 {'id':'H06','type':'reconnect compatibility loop','severity':'Medium','path':['backend lifecycle','focus listener','reconnect timer','health/API-shaped probes'],'finding':'Browser-only deployment retains server reconnection behavior, creating unnecessary state transitions and diagnostics.','target':'v0.3.19'},
]

out={'audit':'v0.3.16 Phase 4 Dependency Graph','generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baseline':'v0.3.15.2 production files, Phase 3 source map','graphs':{
 'initialization':{'nodes':[dict(id=a,name=b,category=c,location=d,risk=e,notes=f) for a,b,c,d,e,f in init_nodes],'edges':init_edges},
 'runtimeInteraction':{'nodes':[dict(id=a,name=b,category=c,location=d,risk=e,notes=f) for a,b,c,d,e,f in run_nodes],'edges':run_edges},
 'storageSynchronization':{'nodes':[dict(id=a,name=b,category=c,location=d,risk=e,notes=f) for a,b,c,d,e,f in store_nodes],'edges':store_edges}},
 'hazards':hazards,
 'summary':{'initializationNodes':len(init_nodes),'initializationEdges':len(init_edges),'runtimeNodes':len(run_nodes),'runtimeEdges':len(run_edges),'storageNodes':len(store_nodes),'storageEdges':len(store_edges),'hazards':len(hazards)}}
(audit/'phase4-dependency-graph.json').write_text(json.dumps(out,indent=2),encoding='utf-8')

# CSV edges
with (audit/'phase4-dependency-edges.csv').open('w',newline='',encoding='utf-8') as f:
 w=csv.writer(f); w.writerow(['graph','source','target','kind','phase','risk','evidence','note'])
 for g,edges in [('initialization',init_edges),('runtimeInteraction',run_edges),('storageSynchronization',store_edges)]:
  for e in edges:w.writerow([g,e['source'],e['target'],e['kind'],e['phase'],e['risk'],e['evidence'],e['note']])

# Markdown report
md='''# v0.3.16 Phase 4 — Dependency Graph\n\n## Scope\n\nThis phase converts the Phase 2 inventory and Phase 3 source map into three evidence-based dependency views. Production behavior was not changed.\n\n## Executive findings\n\n1. **The lifecycle begins too late to prevent construction-order failures.** `CompanionModules` and `AppLifecycle` are useful foundations, but most runtimes already exist by the time they run.\n2. **Routing has three independent decision planes.** `ResponseRegistry`, `KnowledgeQueryRouter`, and the GitHub shim's `routeTopic()` can each match, reject, or select a response.\n3. **Knowledge publication is a cross-application transaction without one owner.** Studio, IndexedDB, BroadcastChannel, `KnowledgeSyncRuntime`, provider caches, and the shim catalog all participate.\n4. **The GitHub Edition is browser-only in execution but still server-shaped in contract.** `/api/*`, health checks, reconnect timers, and HTTP 404 no-match semantics remain compatibility dependencies.\n5. **No confirmed hard dependency on a live Node/Express server was found.** The remaining concern is internal architectural coupling, not hosting capability.\n\n## Graph 1 — Initialization ownership\n\n```mermaid\ngraph TD\n  Shim[static-backend shim] --> Decl[inline declarations and IIFEs]\n  Decl --> App[ARIA_V3_APP assembly]\n  App --> Mods[CompanionModules registry]\n  Mods --> Life[AppLifecycle.initialize]\n  Life --> Config[configuration]\n  Config --> Util[shared-utilities]\n  Util --> State[state]\n  State --> Commands[commands]\n  Commands --> Panels[panels]\n  State --> Char[character-engine]\n  Config --> KR[knowledge-routing]\n  Util --> KR\n  Char --> KR\n  State --> Special[special-mode]\n  Commands --> Special\n  Panels --> Special\n  Commands --> Events[event-bindings]\n  Panels --> Events\n  Special --> Events\n  State --> Diag[diagnostics]\n  Commands --> Diag\n  Events --> Diag\n  Diag --> Backend[backend compatibility]\n  Backend --> Sync[knowledge-sync]\n  KR --> Ready[ready]\n  Special --> Ready\n  Events --> Ready\n  Backend --> Ready\n  Sync --> Ready\n```\n\n### Interpretation\n\nThe lifecycle dependency list itself is mostly acyclic and ordered. The critical weakness is outside that list: the shim and nearly all inline runtime declarations are constructed before lifecycle ownership begins. Future v0.4.0 work should move construction behind module factories gradually instead of replacing the registry.\n\n## Graph 2 — Runtime interaction\n\n```mermaid\ngraph TD\n  Input[User input] --> Identity[Identity/onboarding gate]\n  Identity --> Mode[Episode/special-mode gate]\n  Mode --> Registry[ResponseRegistry]\n  Registry --> Selector[Response selector]\n  Registry --> KQR[KnowledgeQueryRouter]\n  KQR --> Provider[KnowledgeProvider]\n  Provider --> Dynamic[DynamicKnowledgeRuntime]\n  KQR --> Selector\n  Registry --> API[apiReply]\n  API --> Fetch[static-backend fetch intercept]\n  Fetch --> Topic[routeTopic]\n  Rapport[Rapport state] --> Topic\n  Topic --> Selector\n  Topic --> Notion[Notion static search]\n  Notion --> Fallback[Offline/personality fallback]\n  Selector --> Portrait[Portrait/expression]\n  Selector --> Render[Chat renderer]\n  Portrait --> Render\n  Registry --> Diagnostics[Diagnostics trace]\n  KQR --> Diagnostics\n  API --> Diagnostics\n```\n\n### Interpretation\n\nThe main routing problem is not merely duplicate helpers. It is **split authority**. Preprogrammed dialogue, provider knowledge, and GitHub dynamic topics can each select an answer through different code and response contracts. v0.3.17 should establish one route result envelope and explicit precedence before any router is removed.\n\n## Graph 3 — Storage and synchronization\n\n```mermaid\ngraph LR\n  Studio[Knowledge Studio] --> API[Studio API-shaped fetch]\n  API --> Shim[static-backend intercept]\n  Shim --> Objects[IndexedDB objects]\n  Shim --> Revisions[IndexedDB manifests/revisions]\n  Catalog[repository catalog.json] --> Shim\n  Topics[repository topic JSON] --> Shim\n  Action[GitHub Action sync] --> Notion[Notion static index]\n  Notion --> Shim\n  Shim --> Broadcast[BroadcastChannel]\n  Broadcast --> Sync[KnowledgeSyncRuntime]\n  Sync --> Dynamic[DynamicKnowledgeRuntime cache]\n  Sync --> Provider[KnowledgeProvider registry/cache]\n  Objects --> RouterCatalog[shim active-topic catalog]\n  Revisions --> RouterCatalog\n  Catalog --> RouterCatalog\n```\n\n### Interpretation\n\nA topic activation is successful only when persistence, active-revision metadata, in-memory catalog refresh, and Companion cache invalidation all agree. The current design has safeguards, but it lacks a single transactional owner. This is the principal dependency to preserve during v0.4.1 and v0.4.2.\n\n## Confirmed dependency hazards\n\n| ID | Severity | Hazard | Target |\n|---|---|---|---|\n| H01 | Critical | Pre-lifecycle construction and source-order dependency | v0.4.0 |\n| H02 | Critical | Three independent routing planes | v0.3.17 |\n| H03 | High | Diagnostics can form observer-feedback paths | v0.4.4 |\n| H04 | Critical | Distributed knowledge synchronization ownership | v0.4.1/v0.4.2 |\n| H05 | High | No-match encoded as HTTP/backend failure | v0.3.17 |\n| H06 | Medium | Obsolete browser reconnect lifecycle | v0.3.19 |\n\n## Cycle assessment\n\nNo explicit cycle was found in the declared `CompanionModules` dependency list. The dangerous loops are **behavioral feedback loops**, not declared module cycles:\n\n- Diagnostics render failure → diagnostic recording → diagnostics render scheduling. The known recursion is currently guarded by the prior hotfix.\n- Studio activation → notification → refresh → cache/catalog update. This is intended, but duplicated acknowledgements or reconnect refreshes can cause redundant work.\n- Backend reconnect state → focus/timer health probe → diagnostics/update. This is unnecessary in the eventual browser-native design.\n\n## Phase 4 conclusions\n\n- Preserve and expand `CompanionModules`/`AppLifecycle`.\n- Do not merge routers until v0.3.17 has a tested route envelope and precedence table.\n- Do not change storage schema until Phase 5 documents every store/key/record owner.\n- Treat Studio and Companion as separate applications sharing storage and synchronization contracts.\n- Keep the static-backend shim until direct browser services replace every API-shaped caller.\n\n## Next phase\n\nPhase 5 should audit storage ownership in detail: IndexedDB stores, local/session storage keys, static repository records, active revision rules, cache invalidation, reset/import/export behavior, and future companion isolation requirements.\n'''
(audit/'04-dependency-graph.md').write_text(md,encoding='utf-8')
readme='''# Phase 4 README\n\nPhase 4 maps initialization, runtime interaction, and storage/synchronization dependencies. It is an audit-only release: no production file was intentionally modified.\n\nPrimary files:\n\n- `04-dependency-graph.md`\n- `phase4-dependency-graph.json`\n- `phase4-dependency-edges.csv`\n- `phase4-runtime-integrity.json`\n- `tools/audit/dependency_graph_builder.py`\n'''
(audit/'PHASE_4_README.md').write_text(readme,encoding='utf-8')

# Save reproducible copy of script
shutil.copy2('/mnt/data/build_phase4.py',tools/'dependency_graph_builder.py')

# integrity hashes principal files
files=['aria_companion.html','aria_knowledge_studio.html','github-runtime/static-backend.js','index.html','scripts/sync-notion.mjs','knowledge/catalog.json']
integ=[]
for rel in files:
 a=ref/rel;b=work/rel
 ha=hashlib.sha256(a.read_bytes()).hexdigest(); hb=hashlib.sha256(b.read_bytes()).hexdigest()
 integ.append({'file':rel,'referenceSha256':ha,'workingSha256':hb,'identical':ha==hb})
(audit/'phase4-runtime-integrity.json').write_text(json.dumps({'audit':'Phase 4 runtime integrity','allIdentical':all(x['identical'] for x in integ),'files':integ},indent=2),encoding='utf-8')

# validate
subprocess.run(['node','--check',str(work/'github-runtime/static-backend.js')],check=True)
subprocess.run(['node','--check',str(work/'scripts/sync-notion.mjs')],check=True)
for p in work.rglob('*.json'): json.load(p.open(encoding='utf-8'))

# zip
zip_path=Path('/mnt/data/aria_runtime_v0_3_16_phase4_dependency_graph.zip')
if zip_path.exists():zip_path.unlink()
with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED) as z:
 for folder in [ref,work]:
  for p in folder.rglob('*'):
   if p.is_file():z.write(p,p.relative_to(root))
print(zip_path, zip_path.stat().st_size)
print(json.dumps(out['summary'],indent=2))
