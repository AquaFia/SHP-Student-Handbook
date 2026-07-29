import fs from 'node:fs/promises';
import path from 'node:path';

const token = String(process.env.NOTION_ACCESS_TOKEN || '').trim();
const version = String(process.env.NOTION_VERSION || '2026-03-11').trim();
const rawIds = String(process.env.NOTION_RESOURCE_IDS || '').split(',').map(v => v.trim()).filter(Boolean);
const output = path.resolve('knowledge/notion/index.json');
if (!token) throw new Error('NOTION_ACCESS_TOKEN is missing. Add it as a GitHub Actions repository secret.');
if (!rawIds.length) throw new Error('NOTION_RESOURCE_IDS is missing. Add a comma-separated repository variable or secret.');

function cleanId(value = '') {
  const input = String(value).trim();
  const matches = [...input.matchAll(/([0-9a-fA-F]{32})/g)];
  const compact = matches.at(-1)?.[1] || input.replace(/-/g, '').match(/^[0-9a-fA-F]{32}$/)?.[0] || '';
  if (!compact) return '';
  const id = compact.toLowerCase();
  return `${id.slice(0,8)}-${id.slice(8,12)}-${id.slice(12,16)}-${id.slice(16,20)}-${id.slice(20)}`;
}
function richText(items = []) { return (items || []).map(v => v?.plain_text || v?.text?.content || '').join(''); }
function propertyText(prop) {
  if (!prop) return '';
  if (prop.type === 'title') return richText(prop.title);
  if (prop.type === 'rich_text') return richText(prop.rich_text);
  if (prop.type === 'select') return prop.select?.name || '';
  if (prop.type === 'multi_select') return (prop.multi_select || []).map(v => v.name).join(', ');
  if (prop.type === 'status') return prop.status?.name || '';
  if (prop.type === 'number') return prop.number == null ? '' : String(prop.number);
  if (prop.type === 'checkbox') return prop.checkbox ? 'Yes' : 'No';
  if (prop.type === 'url') return prop.url || '';
  if (prop.type === 'date') return [prop.date?.start, prop.date?.end].filter(Boolean).join(' — ');
  return '';
}
function pageTitle(page) {
  for (const prop of Object.values(page?.properties || {})) if (prop?.type === 'title') return richText(prop.title) || 'Untitled Notion Page';
  return 'Untitled Notion Page';
}
async function api(endpoint, options = {}) {
  const response = await fetch(`https://api.notion.com/v1${endpoint}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Notion-Version': version, 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  if (!response.ok) throw new Error(`${response.status} ${endpoint}: ${await response.text()}`);
  return response.json();
}
async function blockText(blockId, depth = 0) {
  if (depth > 3) return [];
  const lines = []; let cursor;
  do {
    const q = new URLSearchParams({ page_size: '100' }); if (cursor) q.set('start_cursor', cursor);
    const data = await api(`/blocks/${blockId}/children?${q}`);
    for (const block of data.results || []) {
      const payload = block?.[block.type] || {};
      const line = richText(payload.rich_text) || payload.title || payload.url || payload.expression || '';
      if (line.trim()) lines.push(line.trim());
      if (block.has_children) lines.push(...await blockText(block.id, depth + 1));
    }
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);
  return lines;
}
async function pageDocument(page) {
  const properties = Object.entries(page.properties || {}).map(([name, prop]) => {
    const value = propertyText(prop); return value ? `${name}: ${value}` : '';
  }).filter(Boolean);
  let blocks = [];
  try { blocks = await blockText(page.id); } catch (error) { console.warn(`Blocks skipped for ${page.id}: ${error.message}`); }
  return { id: page.id, title: pageTitle(page), url: page.url || null, text: [...properties, ...blocks].join('\n').trim(), source: 'notion', lastEditedTime: page.last_edited_time || null };
}
async function databasePages(databaseId) {
  const pages = []; let cursor;
  do {
    const data = await api(`/databases/${databaseId}/query`, { method: 'POST', body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }) });
    pages.push(...(data.results || [])); cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);
  return pages;
}

const documents = [];
for (const raw of rawIds) {
  const id = cleanId(raw); if (!id) { console.warn(`Skipped invalid Notion ID: ${raw}`); continue; }
  let object;
  try { object = await api(`/pages/${id}`); }
  catch {
    try { object = await api(`/databases/${id}`); }
    catch (error) { console.warn(`Skipped inaccessible resource ${id}: ${error.message}`); continue; }
  }
  if (object.object === 'page') documents.push(await pageDocument(object));
  else if (object.object === 'database') {
    for (const page of await databasePages(id)) documents.push(await pageDocument(page));
  }
}
const unique = [...new Map(documents.filter(d => d.text).map(d => [d.id, d])).values()];
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), documents: unique }, null, 2) + '\n');
console.log(`Wrote ${unique.length} Notion documents to ${output}`);
