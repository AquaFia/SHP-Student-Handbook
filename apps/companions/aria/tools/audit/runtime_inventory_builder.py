from pathlib import Path
import re,json,hashlib,csv,zipfile,shutil,datetime
root=Path('/mnt/data/v0316_phase2/aria_v0_3_16_phase1_audit_working')
comp=(root/'aria_companion.html').read_text(errors='replace')
studio=(root/'aria_knowledge_studio.html').read_text(errors='replace')
backend=(root/'github-runtime/static-backend.js').read_text(errors='replace')

def lineof(text, needle):
    i=text.find(needle)
    return None if i<0 else text.count('\n',0,i)+1

def count(text, pattern): return len(re.findall(pattern,text,re.M))

systems=[
("Startup and application assembly","Companion","aria_companion.html",["ARIA_V3_APP","KnowledgeSyncRuntime.start()"],"Builds the global application facade, registers late runtimes, starts synchronization, and binds startup behavior.",["UI","SHARED-CANDIDATE","RISKY"],"High","Initialization is distributed through a very large inline script; late const declarations and startup ordering caused prior handshake defects.","v0.4.0"),
("GitHub static backend compatibility shim","Browser backend","github-runtime/static-backend.js",["async function intercept","window.AriaGitHubBackend"],"Intercepts backend-shaped fetch requests and serves GitHub/IndexedDB/static-JSON behavior entirely in the browser.",["COMPATIBILITY","STORAGE","KNOWLEDGE","ROUTING","SHARED-CANDIDATE"],"High","Required by current Companion and Studio, but preserves old localhost/API contracts and no-match HTTP semantics.","v0.3.17/v0.3.19"),
("Knowledge provider registry","Companion","aria_companion.html",["const KnowledgeProvider"],"Registers knowledge providers, resolves canonical objects, caches results, and exposes inspection/refresh hooks.",["KNOWLEDGE","SHARED-CANDIDATE"],"High","Central provider abstraction; future unified knowledge layer should preserve its useful behavior while reducing overlapping runtimes.","v0.4.2"),
("Dynamic knowledge runtime","Companion","aria_companion.html",["const DynamicKnowledgeRuntime"],"Fetches and validates dynamic objects, manages overrides/cache, checks health, compares sources, and exposes self-tests.",["KNOWLEDGE","COMPATIBILITY","SHARED-CANDIDATE","RISKY"],"High","Still contains backend-fetch language and overlaps static-backend catalog/cache responsibilities.","v0.4.2"),
("Knowledge aliases","Companion","aria_companion.html",["const KnowledgeAliasRegistry"],"Builds and validates aliases used to resolve identities and canonical knowledge IDs.",["KNOWLEDGE","SHARED-CANDIDATE"],"Medium","Potentially reusable, but must be checked for Aria-specific assumptions and collision behavior.","v0.3.17/v0.4.2"),
("Knowledge revision runtime","Companion","aria_companion.html",["const KnowledgeRevisionRuntime"],"Previews, compares, activates, rejects, and rolls back knowledge revisions in the Companion runtime.",["KNOWLEDGE","STORAGE","SHARED-CANDIDATE","RISKY"],"High","May duplicate Studio/static-backend revision lifecycle; source of truth needs clarification.","v0.4.1/v0.4.2"),
("Runtime state schema","Companion","aria_companion.html",["const RuntimeStateSchema"],"Defines and normalizes runtime state structures including episode state and memory.",["SHARED-CANDIDATE","STORAGE","EPISODES"],"Medium","Useful framework candidate but currently embedded beside Aria-specific state.","v0.4.0/v0.5.3"),
("Character engine and identity knowledge","Companion","aria_companion.html",["const characterEngine","const LegacyCharacterKnowledgeProvider","const CharacterKnowledgeRuntime"],"Provides Aria identity/character knowledge through legacy and newer provider layers.",["ARIA-SPECIFIC","KNOWLEDGE","IDENTITY","LEGACY","RISKY"],"High","Legacy provider appears migration-sensitive; character facts must eventually move into an Aria package rather than shared runtime code.","v0.5.0/v0.5.1"),
("Relationship knowledge","Companion","aria_companion.html",["const LegacyRelationshipKnowledgeProvider","const RelationshipKnowledgeRuntime"],"Resolves relationship knowledge and makes it available to the query router.",["ARIA-SPECIFIC","KNOWLEDGE","RAPPORT","LEGACY","RISKY"],"High","Legacy and modern layers coexist; relationship content and engine responsibilities are interleaved.","v0.5.2"),
("Topic knowledge","Companion","aria_companion.html",["const LegacyTopicKnowledgeProvider","const TopicKnowledgeRuntime"],"Provides built-in topic knowledge and participates in canonical knowledge routing.",["ARIA-SPECIFIC","KNOWLEDGE","LEGACY","RISKY"],"High","Overlaps Studio dynamic topics and repository topics; exact precedence must be audited in Phase 6.","v0.3.17/v0.4.2"),
("Knowledge query router and bootstrap","Companion","aria_companion.html",["const KnowledgeQueryRouter","const KnowledgeRuntimeBootstrap"],"Routes knowledge queries among character, relationship, topic, and dynamic providers and initializes them.",["ROUTING","KNOWLEDGE","SHARED-CANDIDATE","RISKY"],"Critical","Core knowledge route exists alongside ResponseRegistry and static-backend routing, creating multiple routing planes.","v0.3.17"),
("Discussion manager","Companion","aria_companion.html",["const DiscussionManager"],"Tracks or coordinates ongoing discussion/topic state.",["DIALOGUE","SHARED-CANDIDATE"],"Medium","Needs deeper source-map review to determine whether it remains active and whether it overlaps session/episode state.","Phase 3/v0.4.3"),
("Expression registry and emotion controller","Companion","aria_companion.html",["const expressionRegistry","const EmotionController"],"Normalizes portrait definitions, infers mood/expression, resolves expression state, and schedules settling.",["UI","PORTRAITS","ARIA-SPECIFIC","SHARED-CANDIDATE"],"Medium","Engine is reusable; portrait IDs, assets, and emotional style are Aria-specific.","v0.5.4"),
("Rapport state and rendering","Companion","aria_companion.html",["character.rapport","currentKnowledgeRapportBand"],"Stores rapport, derives rapport bands, gates response pools, updates UI, and affects dialogue outcomes.",["RAPPORT","ARIA-SPECIFIC","STORAGE","SHARED-CANDIDATE","RISKY"],"High","Rapport thresholds are spread through dialogue/routes rather than centralized policy.","v0.5.2"),
("Episode runtime and repository","Companion","aria_companion.html",["const EpisodeRuntimeSchema","EpisodeRepository"],"Normalizes, validates, instantiates, isolates, and runs episode definitions and state.",["EPISODES","SHARED-CANDIDATE","RISKY"],"High","Strong framework candidate, but embedded with investigation/court systems and requires compatibility testing against current episode JSON.","v0.5.3"),
("Investigation and case runtime","Companion","aria_companion.html",["const CaseRuntimeSchema","const InvestigationCaseRegistry","const InvestigationRuntime","const TheoryEngine"],"Supports investigation cases, evidence, theories, contradictions, and court-oriented interactions.",["EPISODES","UI","ARIA-SPECIFIC","SHARED-CANDIDATE","RISKY"],"High","May be a specialized feature layer rather than universal framework core; dependencies on Episode Mode need mapping.","Phase 3/v0.5.3"),
("Preprogrammed dialogue library","Companion","aria_companion.html",["const offlineDialogue","function pick("],"Contains Aria-specific conversational pools and shuffle-bag selection for common questions and fallbacks.",["DIALOGUE","ARIA-SPECIFIC"],"High","Content belongs in Aria package; selection mechanism belongs in shared dialogue service.","v0.3.18/v0.5.0"),
("Response registry and response router","Companion","aria_companion.html",["const ResponseRegistry","backend-fallback","generic-offline-fallback"],"Registers ordered message routes, executes route handlers, and guarantees emergency fallback behavior.",["ROUTING","DIALOGUE","SHARED-CANDIDATE","RISKY"],"Critical","Primary chat routing plane overlaps KnowledgeQueryRouter and browser-backend routeTopic; backend-fallback misclassifies no-match as an error.","v0.3.17"),
("Backend-shaped API reply adapter","Companion","aria_companion.html",["async function apiReply"],"Builds a large request payload, calls `/api/aria-chat`, interprets knowledge trace, and reports backend status.",["COMPATIBILITY","ROUTING","LEGACY","RISKY"],"High","Not a real-server dependency on GitHub, but preserves obsolete contract terminology and scattered responsibility.","v0.3.17/v0.3.19"),
("Render scheduler","Companion","aria_companion.html",["const RenderScheduler"],"Queues and flushes UI rendering jobs while containing failures.",["UI","SHARED-CANDIDATE","RISKY"],"High","Previously caused diagnostics recursion; should remain isolated and receive regression coverage.","v0.4.0/v0.4.4"),
("State store and transactions","Companion","aria_companion.html",["const StateStore","const TransactionManager"],"Registers state keys, applies transactional updates, refreshes dependent UI regions, and exposes state access.",["STORAGE","SHARED-CANDIDATE","RISKY"],"High","Useful abstraction, but ownership boundaries with localStorage/IndexedDB/static backend are unclear.","v0.4.1"),
("Developer diagnostics and portal","Companion","aria_companion.html",["const developerDiagnostics","developer-diagnostics"],"Collects runtime/route/sync errors and renders developer-facing status and self-test information.",["DIAGNOSTICS","UI","SHARED-CANDIDATE","RISKY"],"High","Must not mutate production behavior or recursively schedule itself; terminology still reflects backend architecture.","v0.4.4"),
("Knowledge synchronization runtime","Companion","aria_companion.html",["const KnowledgeSyncRuntime","BroadcastChannel"],"Watches knowledge objects, refreshes active revisions, receives Studio broadcasts, acknowledges changes, and handles focus/visibility refresh behavior.",["KNOWLEDGE","SYNC","SHARED-CANDIDATE","RISKY"],"Critical","Late declaration previously broke startup; reconnect/polling logic retains server-era assumptions and overlaps catalog refresh.","v0.4.0/v0.4.2"),
("Knowledge Studio editor UI","Studio","aria_knowledge_studio.html",["function newTopic","function openDraftEditor","function syncDraft"],"Creates/imports/edits topic drafts and presents validation, JSON, catalog, and revision UI.",["UI","KNOWLEDGE","SHARED-CANDIDATE"],"High","Currently minified into one script and directly understands transport endpoints and topic schema.","v0.6.0"),
("Knowledge Studio publication lifecycle","Studio","aria_knowledge_studio.html",["function publishDraft","function revisionLifecycle","function showHistory"],"Publishes inactive drafts and performs review, approval, rejection, activation, rollback, and active-status operations.",["KNOWLEDGE","STORAGE","SHARED-CANDIDATE","RISKY"],"Critical","Lifecycle behavior is split between Studio, static backend, and Companion revision runtime.","v0.4.2/v0.6.0"),
("Companion–Studio broadcast bridge","Studio + Companion","aria_knowledge_studio.html / aria_companion.html",["broadcastKnowledgeChange","BroadcastChannel"],"Sends activation/rollback notifications and receives acknowledgements from an open Companion.",["SYNC","SHARED-CANDIDATE","RISKY"],"High","Same-origin/browser-only; acknowledgement timeout and refresh semantics need formal contract.","v0.4.2/v0.4.4"),
("IndexedDB static repository","Browser backend","github-runtime/static-backend.js",["openDb","dbGet","dbPut","dbEntries"],"Stores knowledge objects, manifests, revisions, snapshots, and locally authored Studio content.",["STORAGE","SHARED-CANDIDATE","RISKY"],"Critical","Single generic record store with version 1 and no formal migration layer yet.","v0.4.1"),
("Static knowledge catalog and Notion index","Browser backend + repository","knowledge/ and static-backend.js",["knowledge/catalog.json","knowledge/notion/index.json","staticJson"],"Loads repository topics and optional GitHub Actions-generated Notion documents as browser-readable static data.",["KNOWLEDGE","SHARED-CANDIDATE"],"High","Repository-vs-local revision precedence is custom logic and needs a unified source policy.","v0.4.2"),
("Dynamic topic matcher and response rotation","Browser backend","github-runtime/static-backend.js",["topicScore","routeTopic","rotate","chooseTopicResponse"],"Scores Studio/repository topics, applies rapport gates, and rotates responses through shuffle bags.",["ROUTING","DIALOGUE","KNOWLEDGE","SHARED-CANDIDATE","RISKY"],"Critical","Duplicates matching/selection responsibilities found in Companion; currently separate in-memory rotation from preprogrammed dialogue.","v0.3.17/v0.3.18"),
("GitHub Pages deployment","Publishing",".github/workflows/deploy-pages.yml",["deploy-pages.yml"],"Publishes the static package to GitHub Pages.",["PUBLISHING","SHARED-CANDIDATE"],"Low","Appropriate for framework reuse; must eventually validate subfolder paths and production exclusions.","v0.3.19/v0.6.2"),
("GitHub Actions Notion synchronization","Publishing","scripts/sync-notion.mjs / .github/workflows/sync-notion.yml",["sync-notion.mjs","sync-notion.yml"],"Uses GitHub secrets to generate a static Notion index and commit updates without exposing credentials to the browser.",["PUBLISHING","KNOWLEDGE","SHARED-CANDIDATE"],"Medium","Optional build-time integration; must fail safely and remain independent from local knowledge.","v0.6.3"),
("Portrait assets and manifest","Repository assets","portraits/manifest.json",["portraits/manifest.json"],"Defines Aria portrait assets and metadata used by expression/emotion presentation.",["PORTRAITS","ARIA-SPECIFIC"],"Low","Content should move intact into Aria character package later.","v0.5.0/v0.5.4"),
]

texts={'aria_companion.html':comp,'aria_knowledge_studio.html':studio,'github-runtime/static-backend.js':backend}
records=[]
for idx,s in enumerate(systems,1):
    name,area,location,needles,purpose,labels,risk,notes,target=s
    evidence=[]
    for needle in needles:
        found=[]
        for fn,text in texts.items():
            ln=lineof(text,needle)
            if ln: found.append({'file':fn,'line':ln,'symbol':needle})
        if not found and '/' in location:
            for part in [x.strip() for x in location.split('/')]:
                p=root/part
                if p.exists(): found.append({'file':part,'line':None,'symbol':needle})
        evidence.extend(found)
    records.append({'id':f'RT-{idx:02d}','name':name,'area':area,'location':location,'purpose':purpose,'labels':labels,'risk':risk,'notes':notes,'recommended_target':target,'evidence':evidence,'confidence':'High' if evidence else 'Medium'})

# symbol maps
patterns={
 'functions':r'\b(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(',
 'classes':r'\bclass\s+([A-Za-z_$][\w$]*)',
 'runtime_like_constants':r'\bconst\s+([A-Za-z_$][\w$]*(?:Runtime|Manager|Provider|Router|Controller|Service|Registry|Scheduler|Engine|Store|Schema))\s*=',
 'window_exports':r'\bwindow\.([A-Za-z_$][\w$]*)\s*=',
}
source_stats={}
for fn,text in texts.items():
    source_stats[fn]={'bytes':len(text.encode()),'lines':text.count('\n')+1}
    for k,p in patterns.items(): source_stats[fn][k]=sorted(set(re.findall(p,text)))
    source_stats[fn]['fetch_calls']=count(text,r'\bfetch\s*\(')
    source_stats[fn]['localStorage_refs']=count(text,r'\blocalStorage\b')
    source_stats[fn]['indexedDB_refs']=count(text,r'\bindexedDB\b')
    source_stats[fn]['broadcastChannel_refs']=count(text,r'\bBroadcastChannel\b')
    source_stats[fn]['math_random_refs']=count(text,r'Math\.random\s*\(')

outdir=root/'docs/audit'; outdir.mkdir(parents=True,exist_ok=True)
json_data={'audit':'v0.3.16 Phase 2 Runtime Inventory','generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baseline':'v0.3.15.2 GitHub Edition with Phase 1/1.5 audit-only additions','systemCount':len(records),'systems':records,'sourceStatistics':source_stats}
(outdir/'phase2-runtime-inventory.json').write_text(json.dumps(json_data,indent=2)+'\n')
with (outdir/'phase2-runtime-inventory.csv').open('w',newline='') as f:
    w=csv.writer(f); w.writerow(['ID','System','Area','Location','Labels','Risk','Confidence','Recommended target','Evidence'])
    for r in records:w.writerow([r['id'],r['name'],r['area'],r['location'],'; '.join(r['labels']),r['risk'],r['confidence'],r['recommended_target'],'; '.join(f"{e['file']}:{e['line'] or '-'} {e['symbol']}" for e in r['evidence'])])

from collections import Counter
label_counts=Counter(x for r in records for x in r['labels']); risk_counts=Counter(r['risk'] for r in records)

def evstr(r):
    return ', '.join(f"`{e['file']}:{e['line']}` (`{e['symbol']}`)" if e['line'] else f"`{e['file']}`" for e in r['evidence']) or 'No direct named symbol; classification based on package structure.'
md=[]
md += ['# v0.3.16 Phase 2 — Runtime Inventory','', '## Scope','', 'This phase inventories the current GitHub Edition without changing production runtime behavior. It identifies functional ownership, locations, reuse potential, legacy layers, and modernization risk. It does **not** declare uncertain code safe to delete.','',f'**Systems inventoried:** {len(records)}', '', '## Executive findings','',
'- Aria currently has **three overlapping routing planes**: `KnowledgeQueryRouter`, `ResponseRegistry`, and the GitHub shim’s `routeTopic()`. Their precedence and failure contracts must be unified in v0.3.17.',
'- Character, relationship, and topic knowledge each retain a `Legacy…KnowledgeProvider` beside a newer runtime. These are migration-sensitive compatibility layers, not confirmed dead code.',
'- Knowledge revision ownership is distributed across `KnowledgeRevisionRuntime`, Knowledge Studio lifecycle functions, and `static-backend.js` IndexedDB records.',
'- The GitHub Edition is browser-only in deployment, but still presents localhost/API/backend-shaped interfaces internally. These are compatibility contracts rather than proof of a live Node dependency.',
'- Aria-specific dialogue, portrait IDs, identity, relationships, and rapport thresholds remain embedded in shared-looking runtime code. They must be extracted only after behavior is stabilized.',
'- The most reusable existing foundations are the provider registry, response registry, render scheduler, state store, episode schemas, IndexedDB shim, broadcast synchronization, and GitHub publishing workflows.',
'', '## Classification summary','',
'| Label | Count |','|---|---:|']
for k,v in label_counts.most_common(): md.append(f'| {k} | {v} |')
md += ['', '## Risk summary','', '| Risk | Count |','|---|---:|']
for k in ['Critical','High','Medium','Low']: md.append(f'| {k} | {risk_counts[k]} |')
md += ['', '## Runtime inventory','']
for r in records:
    md += [f"### {r['id']} — {r['name']}", '', f"**Area:** {r['area']}  ", f"**Location:** `{r['location']}`  ", f"**Labels:** {', '.join(r['labels'])}  ", f"**Risk:** {r['risk']}  ", f"**Recommended target:** {r['recommended_target']}", '', r['purpose'], '', f"**Evidence:** {evstr(r)}", '', f"**Audit note:** {r['notes']}", '']
md += ['## Ownership boundary conclusions','',
'### Clearly Aria-specific', '- Identity facts and voice', '- Relationship content', '- Preprogrammed dialogue text', '- Portrait assets and expression naming', '- Character-specific rapport thresholds and reactions', '- Aria-specific topic defaults and emergency lines','',
'### Strong shared-framework candidates','- Runtime lifecycle and module registration', '- Storage adapters and migration service', '- Knowledge catalog/revision service', '- Message routing and response selection mechanics', '- Rapport engine with character-provided policy', '- Episode schema/repository/validator', '- Portrait/audio/theme engines', '- Diagnostics and error boundaries', '- Studio publication lifecycle', '- GitHub Pages and optional Notion publishing','',
'### Compatibility or legacy layers requiring evidence before removal','- `LegacyCharacterKnowledgeProvider`', '- `LegacyRelationshipKnowledgeProvider`', '- `LegacyTopicKnowledgeProvider`', '- localhost-shaped API base URLs', '- `backend-fallback` and `apiReply()`', '- backend reconnection/focus polling language', '- duplicate revision/catalog refresh paths','',
'## Phase 2 conclusion','', 'The current system is functional but layered: newer browser-first services were added around older server-era and Aria-specific structures. The correct next step is the Phase 3 source map, not deletion. Phase 3 should trace exact functions, exports, callers, and initialization regions for every Critical and High-risk inventory item.','']
(outdir/'02-runtime-inventory.md').write_text('\n'.join(md))
(outdir/'PHASE_2_README.md').write_text('''# Phase 2 Runtime Inventory\n\nThis folder contains the v0.3.16 Phase 2 inventory. Production runtime files were not intentionally modified.\n\nPrimary files:\n\n- `02-runtime-inventory.md` — complete human-readable inventory\n- `phase2-runtime-inventory.json` — machine-readable system records and source statistics\n- `phase2-runtime-inventory.csv` — sortable inventory index\n- `phase2-runtime-integrity.json` — baseline hash comparison\n''')
# integrity against frozen reference inside sibling directory
ref=root.parent/'aria_v0_3_15_2_reference'
core=['aria_companion.html','aria_knowledge_studio.html','github-runtime/static-backend.js','index.html','scripts/sync-notion.mjs','knowledge/catalog.json']
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
integ={'allCoreFilesIdentical':True,'files':[]}
for f in core:
    a=ref/f;b=root/f; same=a.exists() and b.exists() and sha(a)==sha(b)
    integ['files'].append({'file':f,'referenceSha256':sha(a) if a.exists() else None,'workingSha256':sha(b) if b.exists() else None,'identical':same})
    integ['allCoreFilesIdentical'] &= same
(outdir/'phase2-runtime-integrity.json').write_text(json.dumps(integ,indent=2)+'\n')
# changelog append
ch=root/'CHANGELOG.md'
old=ch.read_text()
entry='''\n## v0.3.16 Phase 2 — Runtime Inventory\n\n- Added a 32-system runtime inventory with evidence, ownership labels, risk levels, and modernization targets.\n- Added machine-readable JSON and CSV inventories.\n- Identified three overlapping routing planes and distributed revision ownership as priority risks.\n- Classified legacy knowledge providers as migration-sensitive rather than safe deletions.\n- Confirmed core production runtime files remain byte-for-byte identical to the frozen v0.3.15.2 baseline.\n'''
if 'v0.3.16 Phase 2' not in old: ch.write_text(old.rstrip()+entry+'\n')
print(json.dumps({'systems':len(records),'labels':label_counts,'risks':risk_counts,'integrity':integ['allCoreFilesIdentical']},default=dict,indent=2))
