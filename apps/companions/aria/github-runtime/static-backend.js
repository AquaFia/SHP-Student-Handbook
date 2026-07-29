(() => {
  'use strict';

  const NATIVE_FETCH = window.fetch.bind(window);
  const ROOT = new URL('../', document.currentScript?.src || location.href);
  const DB_NAME = 'aria-github-edition';
  const DB_VERSION = 1;
  const STORE = 'records';
  const API_HOSTS = new Set(['localhost:3000', '127.0.0.1:3000']);
  const DEFAULT_LIES_TOPIC = {
    id: 'topic.liesdefine',
    type: 'topic',
    version: 1,
    identity: { displayName: 'Lies Definition' },
    content: {
      summary: 'What are lies?',
      keywords: ['what are lies', 'lies', 'lie definition', 'definition of a lie'],
      prompts: ['What are lies?', "What's the definition of a lie?", 'What is a lie to you?'],
      guardedResponses: [
        'A lie is a modification of evidence intended to produce an incorrect conclusion. Some lies are malicious. Others are protective. Both still corrupt the chain of custody.',
        'A lie is just an unverified claim that got comfortable.',
        'A lie is an intentional distortion of reality designed to alter another person’s conclusion. Whatever the motive, it contaminates the evidence available to the next observer.',
        'Lies are false statements told deliberately, usually to conceal, manipulate, or deceive.'
      ],
      comfortableResponses: [
        "The difference between a lie and a hypothesis is whether you're willing to test it. Most people aren't.",
        "The worst lies aren't the ones people tell me. They're the ones people tell themselves and then log as facts."
      ],
      fondResponses: [
        "A comfortable lie is just an unlogged risk. And I don't do unlogged risks.",
        "A lie is a bittersweet comfort, one I can't afford to fall for. I don't trust comfort. Comfort is usually just a lie that's stopped trying."
      ]
    },
    revision: { revisionId: 'draft-001', schemaVersion: 1 },
    publication: { status: 'active' },
    merge: { mode: 'extend', appliedMode: 'extend' }
  };
  const state = {
    ready: null,
    catalog: [],
    notion: [],
    rotation: new Map(),
    lastRotation: new Map(),
    activeRevisions: new Map(),
    revisionChannel: null,
    revisionRefresh: {
      lastCanonicalId: null,
      previousRevisionId: null,
      activeRevisionId: null,
      cacheToken: null,
      source: null,
      changed: false,
      invalidatedKeys: 0,
      observedAt: null
    }
  };

  function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
  function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'X-Aria-Backend': 'github-static' } });
  }
  function normalizeId(value) { return String(value || '').trim().toLowerCase().replace(/\s+/g, '_'); }
  function recordKey(kind, id) { return `${kind}:${id}`; }
  function now() { return new Date().toISOString(); }

  const REVISION_CHANNEL_NAME = 'aria-knowledge-revisions-v1';

  function clearTopicRotation(canonicalId, activeRevisionId = null) {
    const id = normalizeId(canonicalId);
    if (!id) return 0;
    let removed = 0;
    for (const key of [...state.rotation.keys()]) {
      if (!String(key).startsWith(`${id}:`)) continue;
      if (activeRevisionId && String(key).startsWith(`${id}:${activeRevisionId}:`)) continue;
      state.rotation.delete(key);
      state.lastRotation.delete(key);
      removed += 1;
    }
    return removed;
  }

  function observeActiveRevision(canonicalId, revisionId, cacheToken = null, source = 'runtime-read') {
    const id = normalizeId(canonicalId);
    const active = String(revisionId || 'unversioned');
    const previous = state.activeRevisions.get(id) || null;
    const changed = Boolean(previous && previous !== active);
    const invalidatedKeys = changed ? clearTopicRotation(id, active) : 0;
    state.activeRevisions.set(id, active);
    state.revisionRefresh = {
      lastCanonicalId: id,
      previousRevisionId: previous,
      activeRevisionId: active,
      cacheToken: cacheToken || null,
      source,
      changed,
      invalidatedKeys,
      observedAt: now()
    };
    return { ...state.revisionRefresh };
  }

  function broadcastRevisionChange(detail = {}) {
    try { state.revisionChannel?.postMessage({ type: 'active-revision-changed', ...detail, sentAt: now() }); } catch {}
  }

  function initializeRevisionChannel() {
    if (state.revisionChannel || typeof BroadcastChannel === 'undefined') return;
    try {
      state.revisionChannel = new BroadcastChannel(REVISION_CHANNEL_NAME);
      state.revisionChannel.onmessage = event => {
        const detail = event?.data || {};
        if (detail.type !== 'active-revision-changed') return;
        const id = normalizeId(detail.canonicalId);
        if (!id) return;
        const previous = state.activeRevisions.get(id) || detail.previousRevisionId || null;
        const active = String(detail.activeRevisionId || 'unversioned');
        const invalidatedKeys = clearTopicRotation(id, active);
        state.activeRevisions.set(id, active);
        state.revisionRefresh = {
          lastCanonicalId: id,
          previousRevisionId: previous,
          activeRevisionId: active,
          cacheToken: detail.cacheToken || null,
          source: 'broadcast-channel',
          changed: previous !== active,
          invalidatedKeys,
          observedAt: now()
        };
      };
    } catch { state.revisionChannel = null; }
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function dbGet(key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(clone(req.result));
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  }
  async function dbPut(key, value) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(clone(value), key);
      tx.oncomplete = () => { db.close(); resolve(value); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  }
  async function dbEntries(prefix = '') {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const output = [];
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        if (String(cursor.key).startsWith(prefix)) output.push([String(cursor.key), clone(cursor.value)]);
        cursor.continue();
      };
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => { db.close(); resolve(output); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  }

  async function staticJson(path, fallback) {
    try {
      const response = await NATIVE_FETCH(new URL(path, ROOT), { cache: 'no-store' });
      if (!response.ok) return fallback;
      return await response.json();
    } catch { return fallback; }
  }

  async function initialize() {
    if (state.ready) return state.ready;
    state.ready = (async () => {
      initializeRevisionChannel();
      const catalog = await staticJson('knowledge/catalog.json', { objects: [] });
      state.catalog = Array.isArray(catalog.objects) ? catalog.objects : [];
      const notion = await staticJson('knowledge/notion/index.json', { documents: [] });
      state.notion = Array.isArray(notion.documents) ? notion.documents : [];
      if (!state.catalog.some(entry => normalizeId(entry.id) === DEFAULT_LIES_TOPIC.id)) {
        state.catalog.unshift({ id: DEFAULT_LIES_TOPIC.id, type: 'topic', status: 'resolved', publicationStatus: 'active', revisionId: 'draft-001', path: 'knowledge/topics/topic.liesdefine.json' });
      }
      for (const entry of state.catalog) {
        const id = normalizeId(entry.id);
        if (!id) continue;
        const repositoryObject = await staticJson(entry.path || `knowledge/topics/${id}.json`, id === DEFAULT_LIES_TOPIC.id ? DEFAULT_LIES_TOPIC : null);
        const cachedObject = await dbGet(recordKey('object', id));
        const repositoryRevision = repositoryObject?.revision?.revisionId || entry.revisionId || null;
        const cachedRevision = cachedObject?.revision?.revisionId || null;
        const cachedIsActive = String(cachedObject?.publication?.status || '').toLowerCase() === 'active';
        const shouldRefreshFromRepository = repositoryObject && (!cachedObject || cachedRevision === repositoryRevision || !cachedIsActive);
        const object = shouldRefreshFromRepository ? repositoryObject : cachedObject;
        if (!object) continue;
        if (shouldRefreshFromRepository) await dbPut(recordKey('object', id), object);
        const revisionId = object?.revision?.revisionId || repositoryRevision || 'static-001';
        let manifest = await staticJson(`knowledge/topics/${id}.manifest.json`, null);
        if (!manifest) manifest = await dbGet(recordKey('manifest', id));
        if (!manifest || shouldRefreshFromRepository) manifest = manifest || {
          id, activeRevisionId: revisionId, previousActiveRevisionId: null,
          latestRevisionId: revisionId, updatedAt: now(), cacheToken: `${revisionId}:static`,
          revisions: [{ revisionId, status: 'active', createdAt: now() }]
        };
        manifest.activeRevisionId = manifest.activeRevisionId || revisionId;
        manifest.latestRevisionId = manifest.latestRevisionId || revisionId;
        await dbPut(recordKey('manifest', id), manifest);
        await dbPut(recordKey('revision', `${id}:${revisionId}`), object);
        await dbPut(recordKey('snapshot', `${id}:${revisionId}`), object);
      }
      for (const [key, object] of await dbEntries('object:')) {
        const id = key.slice('object:'.length);
        if (!state.catalog.some(item => normalizeId(item.id) === id)) {
          state.catalog.push({
            id,
            type: object?.type || id.split('.')[0],
            status: 'resolved',
            publicationStatus: object?.publication?.status || 'draft',
            revisionId: object?.revision?.revisionId || null,
            source: 'indexeddb'
          });
        }
      }
      return true;
    })();
    return state.ready;
  }

  function upsertCatalogEntry(id, object = null, overrides = {}) {
    const canonicalId = normalizeId(id || object?.id);
    if (!canonicalId) return null;
    let entry = state.catalog.find(item => normalizeId(item?.id) === canonicalId);
    const next = {
      id: canonicalId,
      type: object?.type || entry?.type || canonicalId.split('.')[0],
      status: overrides.status || entry?.status || 'resolved',
      publicationStatus: overrides.publicationStatus || object?.publication?.status || entry?.publicationStatus || 'draft',
      revisionId: overrides.revisionId || object?.revision?.revisionId || entry?.revisionId || null,
      source: overrides.source || entry?.source || 'indexeddb'
    };
    if (entry) Object.assign(entry, next);
    else { entry = next; state.catalog.push(entry); }
    return entry;
  }

  async function refreshRuntimeCatalogFromStorage() {
    for (const [key, object] of await dbEntries('object:')) {
      const id = key.slice('object:'.length);
      upsertCatalogEntry(id, object);
    }
    return state.catalog;
  }

  function normalizeText(value) {
    return String(value || '').toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9'\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function rapportBand(payload = {}) {
    const explicit = String(payload.rapportBand || payload.sessionContext?.rapportBand || '').toLowerCase();
    if (['guarded', 'comfortable', 'fond'].includes(explicit)) return explicit;
    const value = Number(payload.rapport);
    return Number.isFinite(value) && value >= 72 ? 'fond' : Number.isFinite(value) && value >= 25 ? 'comfortable' : 'guarded';
  }
  function topicScore(message, object) {
    const input = normalizeText(message); const content = object?.content || {};
    for (const prompt of content.prompts || []) if (normalizeText(prompt) === input) return { score: 1000, matchType: 'exact-prompt', matchedValue: prompt };
    let best = null;
    for (const prompt of content.prompts || []) {
      const p = normalizeText(prompt); if (p.length >= 8 && input.includes(p)) best = { score: 700 + p.length, matchType: 'prompt-contains', matchedValue: prompt };
    }
    for (const keyword of content.keywords || []) {
      const k = normalizeText(keyword); if (!k) continue;
      const hit = k.includes(' ') ? input.includes(k) : new RegExp(`(^|\\s)${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$)`).test(input);
      const candidate = hit ? { score: (k.includes(' ') ? 500 : 300) + k.length, matchType: k.includes(' ') ? 'keyword-phrase' : 'keyword', matchedValue: keyword } : null;
      if (candidate && (!best || candidate.score > best.score)) best = candidate;
    }
    return best;
  }
  function shuffled(values) {
    const output = [...values];
    for (let i = output.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [output[i], output[j]] = [output[j], output[i]];
    }
    return output;
  }
  function responseSignature(value) { return normalizeText(value); }
  function rotate(values, key, excludedSignatures = []) {
    const unique = [...new Set((values || []).map(String).map(v => v.trim()).filter(Boolean))];
    if (!unique.length) return null;
    if (unique.length === 1) {
      state.lastRotation.set(key, unique[0]);
      return unique[0];
    }
    let bag = (state.rotation.get(key) || []).filter(value => unique.includes(value));
    if (!bag.length) {
      bag = shuffled(unique);
      const last = state.lastRotation.get(key);
      if (last && bag[0] === last) {
        const swapIndex = bag.findIndex(value => value !== last);
        if (swapIndex > 0) [bag[0], bag[swapIndex]] = [bag[swapIndex], bag[0]];
      }
    }
    const excluded = new Set((excludedSignatures || []).map(responseSignature).filter(Boolean));
    let selectedIndex = bag.findIndex(value => !excluded.has(responseSignature(value)));
    if (selectedIndex < 0) selectedIndex = 0;
    const [selected] = bag.splice(selectedIndex, 1);
    state.rotation.set(key, bag);
    state.lastRotation.set(key, selected);
    return selected;
  }
  function chooseTopicResponse(object, band, id, excludedSignatures = []) {
    const c = object?.content || {};
    const pools = band === 'fond'
      ? [['fond', c.fondResponses], ['comfortable', c.comfortableResponses], ['guarded', c.guardedResponses]]
      : band === 'comfortable'
        ? [['comfortable', c.comfortableResponses], ['guarded', c.guardedResponses]]
        : [['guarded', c.guardedResponses]];
    for (const [name, pool] of pools) {
      const unique = [...new Set((pool || []).map(String).map(value => value.trim()).filter(Boolean))];
      const revisionId = String(object?.revision?.revisionId || 'unversioned');
      const rotationKey = `${id}:${revisionId}:${name}`;
      const result = rotate(unique, rotationKey, excludedSignatures);
      if (result) return {
        text: result,
        responseRotation: {
          rotationKey,
          pool: name,
          availableResponses: unique.length,
          usedInCycle: unique.length - (state.rotation.get(rotationKey)?.length || 0),
          remainingInCycle: state.rotation.get(rotationKey)?.length || 0,
          immediateRepeatProtection: unique.length > 1
        }
      };
    }
    const summary = String(c.summary || '').trim();
    const revisionId = String(object?.revision?.revisionId || 'unversioned');
    return summary ? { text: summary, responseRotation: { rotationKey: `${id}:${revisionId}:summary`, pool: 'summary', availableResponses: 1, usedInCycle: 1, remainingInCycle: 0, immediateRepeatProtection: false } } : null;
  }
  async function routeTopic(message, payload) {
    await refreshRuntimeCatalogFromStorage();
    let best = null;
    for (const entry of state.catalog) {
      const id = normalizeId(entry.id); const object = await dbGet(recordKey('object', id));
      if (!object || String(object.publication?.status || entry.publicationStatus) !== 'active') continue;
      const band = rapportBand(payload); const required = String(object.access?.minimumRapportBand || 'guarded');
      if ({ guarded: 0, comfortable: 1, fond: 2 }[band] < ({ guarded: 0, comfortable: 1, fond: 2 }[required] ?? 0)) continue;
      const score = topicScore(message, object); if (!score) continue;
      if (!best || score.score > best.score) best = { id, object, band, ...score };
    }
    if (!best) {
      const normalized = normalizeText(message);
      const liesIntent = /(^|\s)lies?(?=\s|$)/.test(normalized) && /(what|define|definition|mean|explain|are|is)/.test(normalized);
      if (liesIntent) {
        best = { id: DEFAULT_LIES_TOPIC.id, object: DEFAULT_LIES_TOPIC, band: rapportBand(payload), score: 250, matchType: 'built-in-intent-fallback', matchedValue: 'lie/lies definition' };
      }
    }
    if (!best) return null;
    const manifest = await dbGet(recordKey('manifest', best.id));
    const revisionRefresh = observeActiveRevision(
      best.id,
      best.object?.revision?.revisionId || manifest?.activeRevisionId || null,
      manifest?.cacheToken || null,
      'route-topic'
    );
    const selected = chooseTopicResponse(best.object, best.band, best.id, payload?.recentResponseSignatures || []); if (!selected?.text) return null;
    return { text: selected.text, canonicalId: best.id, revisionId: best.object?.revision?.revisionId || null, cacheToken: manifest?.cacheToken || null, rapportBand: best.band, matchType: best.matchType, matchedValue: best.matchedValue, score: best.score, responseRotation: selected.responseRotation, revisionRefresh };
  }
  function notionSearch(query) {
    const terms = normalizeText(query).split(' ').filter(t => t.length > 2);
    return state.notion.map(doc => {
      const haystack = normalizeText(`${doc.title || ''} ${doc.text || ''}`);
      return { ...doc, score: terms.reduce((n, term) => n + (haystack.includes(term) ? 1 : 0), 0) };
    }).filter(doc => doc.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);
  }

  async function parseBody(init) { try { return JSON.parse(init?.body || '{}'); } catch { return {}; } }
  function segments(pathname) { return pathname.split('/').filter(Boolean).map(decodeURIComponent); }
  async function handleKnowledge(method, path, body) {
    const parts = segments(path); // api, knowledge, ...
    if (method === 'GET' && parts.length === 2) {
      const objects = [];
      for (const entry of state.catalog) {
        const object = await dbGet(recordKey('object', normalizeId(entry.id)));
        if (object) objects.push({ id: object.id, type: object.type, status: 'resolved', publicationStatus: object.publication?.status || 'active', revisionId: object.revision?.revisionId || null });
      }
      return jsonResponse({ objects, source: 'github-static', schemaVersion: 1 });
    }
    if (method === 'GET' && parts[2] === 'health') return jsonResponse({ ok: true, storage: 'indexeddb', responseMode: 'github-static' });
    if (method === 'POST' && parts[2] === 'preview') return jsonResponse({ ok: true, summary: { conflicts: 0 }, object: body, mode: 'local-preview' });
    if (method === 'POST' && parts[2] === 'publish-draft') {
      const id = normalizeId(body.id); if (!id) return jsonResponse({ ok: false, error: 'Canonical ID required.' }, 400);
      const revisionId = body?.revision?.revisionId || `draft-${Date.now()}`;
      const object = { ...body, id, revision: { ...(body.revision || {}), revisionId }, publication: { ...(body.publication || {}), status: 'draft' } };
      await dbPut(recordKey('revision', `${id}:${revisionId}`), object);
      const manifest = await dbGet(recordKey('manifest', id)) || { id, activeRevisionId: null, previousActiveRevisionId: null, revisions: [] };
      manifest.latestRevisionId = revisionId; manifest.updatedAt = now();
      manifest.revisions = (manifest.revisions || []).filter(r => r.revisionId !== revisionId).concat({ revisionId, status: 'draft', createdAt: now() });
      await dbPut(recordKey('manifest', id), manifest);
      upsertCatalogEntry(id, object, { publicationStatus: 'draft', revisionId, source: 'indexeddb' });
      return jsonResponse({ ok: true, id, revisionId, status: 'draft', stored: true }, 201);
    }
    const id = normalizeId(parts[2]);
    if (!id) return jsonResponse({ error: 'Invalid canonical ID.' }, 400);
    if (method === 'GET' && parts.length === 3) {
      const object = await dbGet(recordKey('object', id)); return object ? jsonResponse({ object, source: 'github-indexeddb', schemaVersion: 1 }) : jsonResponse({ error: 'Knowledge object not found.' }, 404);
    }
    if (method === 'GET' && parts[3] === 'status') {
      const m = await dbGet(recordKey('manifest', id)); return m ? jsonResponse({ ok: true, id, activeRevisionId: m.activeRevisionId || null, previousActiveRevisionId: m.previousActiveRevisionId || null, cacheToken: m.cacheToken || null, updatedAt: m.updatedAt || null }) : jsonResponse({ error: 'Knowledge not found.' }, 404);
    }
    if (method === 'GET' && parts[3] === 'revisions' && parts.length === 4) {
      const m = await dbGet(recordKey('manifest', id)); return m ? jsonResponse({ status: 'resolved', ...m }) : jsonResponse({ error: 'Revision history not found.' }, 404);
    }
    if (method === 'GET' && parts[3] === 'revisions' && parts.length === 5) {
      const object = await dbGet(recordKey('revision', `${id}:${parts[4]}`)); return object ? jsonResponse({ object, active: (await dbGet(recordKey('manifest', id)))?.activeRevisionId === parts[4] }) : jsonResponse({ error: 'Revision not found.' }, 404);
    }
    if (method === 'POST' && parts[3] === 'revisions' && parts.length === 6) {
      const revisionId = parts[4], action = parts[5];
      const m = await dbGet(recordKey('manifest', id)); const revision = await dbGet(recordKey('revision', `${id}:${revisionId}`));
      if (!m || !revision) return jsonResponse({ ok: false, error: 'Revision not found.' }, 404);
      const entry = (m.revisions || []).find(r => r.revisionId === revisionId); if (!entry) return jsonResponse({ ok: false, error: 'Revision metadata not found.' }, 404);
      if (action === 'review') entry.status = 'reviewed';
      else if (action === 'approve') entry.status = 'approved';
      else if (action === 'reject') { entry.status = 'rejected'; entry.rejectionReason = String(body.reason || '').slice(0, 500) || null; }
      else if (action === 'activate' || action === 'rollback') {
        if (action === 'activate' && entry.status !== 'approved') return jsonResponse({ ok: false, code: 'revision-not-approved', status: entry.status }, 409);
        const previous = m.activeRevisionId || null;
        const active = { ...revision, publication: { ...(revision.publication || {}), status: 'active', activatedAt: now() }, revision: { ...(revision.revision || {}), revisionId, previousRevisionId: previous } };
        await dbPut(recordKey('object', id), active); await dbPut(recordKey('snapshot', `${id}:${revisionId}`), active);
        upsertCatalogEntry(id, active, { publicationStatus: 'active', revisionId, source: 'indexeddb' });
        for (const item of m.revisions || []) if (item.status === 'active') item.status = 'superseded';
        entry.status = 'active'; m.previousActiveRevisionId = previous; m.activeRevisionId = revisionId; m.cacheToken = `${revisionId}:${Date.now()}`;
      } else return jsonResponse({ ok: false, error: 'Unsupported lifecycle action.' }, 400);
      m.updatedAt = now(); await dbPut(recordKey('manifest', id), m);
      if (action === 'activate' || action === 'rollback') {
        const refresh = observeActiveRevision(id, revisionId, m.cacheToken || null, `revision-${action}`);
        broadcastRevisionChange({ canonicalId: id, previousRevisionId: refresh.previousRevisionId, activeRevisionId: revisionId, cacheToken: m.cacheToken || null, action });
      }
      return jsonResponse({ ok: true, id, revisionId, status: entry.status, cacheToken: m.cacheToken || null, revisionRefresh: state.revisionRefresh });
    }
    return jsonResponse({ error: 'Unknown knowledge route.' }, 404);
  }

  async function intercept(input, init = {}) {
    await initialize();
    const raw = input instanceof Request ? input.url : String(input);
    let url; try { url = new URL(raw, location.href); } catch { return NATIVE_FETCH(input, init); }
    const isLocalBackend = API_HOSTS.has(url.host) || url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    const isSameOriginApi = url.origin === location.origin && url.pathname.startsWith('/api/');
    const isConfiguredBackend = isLocalBackend || isSameOriginApi || url.protocol === 'aria-static:';
    if (!isConfiguredBackend) return NATIVE_FETCH(input, init);
    const method = String(init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const body = await parseBody(init);
    if (url.pathname === '/' || url.pathname === '/health') return jsonResponse({ service: 'Aria GitHub Static Backend', ok: true, responseMode: 'github-static' });
    if (url.pathname.startsWith('/api/knowledge')) return handleKnowledge(method, url.pathname, body);
    if (url.pathname === '/api/notion/search' && method === 'POST') return jsonResponse({ documents: notionSearch(body.query || '') });
    if (url.pathname === '/api/brain/status') return jsonResponse({ enabled: true, milestone: 'github-static-v1', modules: ['dynamic-topics', 'indexeddb', 'notion-static-index'] });
    if (url.pathname === '/api/aria-chat' && method === 'POST') {
      const dynamic = await routeTopic(body.message || '', body);
      if (dynamic) return jsonResponse({ matched: true, routeDecision: { outcome: 'matched', plane: 'github-static-backend', reason: 'dynamic-topic', responseMode: 'dynamic-topic', canonicalId: dynamic.canonicalId || null }, text: dynamic.text, emotion: { mood: 'analytical', intensity: 0.55 }, mood: 'analytical', expression: null, expressionOverride: null, responseMode: 'dynamic-topic', retrieved: [], knowledgeTrace: { ...dynamic, notionSkipped: true }, brainTrace: { milestone: 'github-static-v1', dynamicTopicMatched: true, notionSkipped: true } });
      const docs = notionSearch(body.message || ''); const best = docs[0];
      if (best) return jsonResponse({ matched: true, routeDecision: { outcome: 'matched', plane: 'github-static-backend', reason: 'extractive-static', responseMode: 'extractive-static', canonicalId: best.id || null }, text: `I found relevant records in “${best.title || 'Notion export'}.” ${String(best.text || '').slice(0, 900)}${String(best.text || '').length > 900 ? '…' : ''}`, emotion: { mood: 'analytical', intensity: 0.45 }, mood: 'analytical', expression: null, expressionOverride: null, responseMode: 'extractive-static', retrieved: docs.map(({ id, title, url }) => ({ id, title, url })), brainTrace: { milestone: 'github-static-v1', staticNotionDocuments: docs.length } });
      return jsonResponse({
        ok: true,
        matched: false,
        text: null,
        responseMode: 'no-match',
        routeDecision: { outcome: 'no-match', plane: 'github-static-backend', reason: 'no-static-knowledge-match', responseMode: 'no-match', canonicalId: null },
        knowledgeTrace: {
          matched: false,
          reason: 'no-static-knowledge-match',
          dynamicTopicMatched: false,
          notionDocuments: 0
        },
        brainTrace: {
          milestone: 'github-static-v1',
          dynamicTopicMatched: false,
          staticNotionDocuments: 0,
          fallbackAllowed: true
        }
      });
    }
    return jsonResponse({ error: 'Unknown static API route.' }, 404);
  }

  window.fetch = intercept;
  window.AriaGitHubBackend = {
    initialize,
    inspect: () => ({ catalog: state.catalog.length, notionDocuments: state.notion.length, storage: 'indexeddb', activeRevisions: Object.fromEntries(state.activeRevisions), revisionRefresh: { ...state.revisionRefresh } }),
    invalidateTopic: (canonicalId, revisionId = null) => ({ invalidatedKeys: clearTopicRotation(canonicalId, revisionId), canonicalId: normalizeId(canonicalId), revisionId }),
    reset: async () => { indexedDB.deleteDatabase(DB_NAME); state.ready = null; state.catalog = []; state.notion = []; state.rotation.clear(); state.lastRotation.clear(); state.activeRevisions.clear(); await initialize(); return true; }
  };
  initialize().catch(error => console.error('[Aria GitHub Backend]', error));
})();
