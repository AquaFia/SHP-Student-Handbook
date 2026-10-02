(function(){
  'use strict';

  const WORKER_BASE = 'https://dorm-mail.aquafia1247.workers.dev';
  const ROOM_CHARACTERS = Object.freeze({
    'ruby-dorm':'Ruby', 'fate-dorm':'Fate', 'adair-dorm':'Adair', 'alice-dorm':'Alice',
    'milo-dorm':'Milo', 'meggie-dorm':'Meggie', 'ludo-dorm':'Ludo', 'juno-dorm':'Juno',
    'hikari-dorm':'Hikari', 'damian-dorm':'Damian', 'aria-dorm':'Aria', 'luxi-dorm':'Luxi',
    'daika-dorm':'Daika', 'tokiko-dorm':'Tokiko', 'kouji-dorm':'Kouji', 'jacey-dorm':'Jacey',
    'tyler-dorm':'Tyler'
  });

  const roomId = getRoomId();
  let character = ROOM_CHARACTERS[roomId] || '';
  let mailboxButton = null;
  let ui = null;

  // Shared API: the Student Handbook Dorm Map can open the exact same mailbox
  // viewer without duplicating the Notion/Worker rendering code.
  window.SHPDormMailbox = Object.freeze({
    characters: ROOM_CHARACTERS,
    characterForRoom(roomId){ return ROOM_CHARACTERS[String(roomId || '').toLowerCase()] || ''; },
    openForRoom(roomId){ return openForCharacter(ROOM_CHARACTERS[String(roomId || '').toLowerCase()] || ''); },
    openForCharacter
  });

  // When this script is loaded inside an actual dorm room, keep the existing
  // room-topbar Mailbox button behavior.
  const topGroup = character ? document.querySelector('.room-topbar .group:last-child') : null;
  if (topGroup) {
    injectStyles();
    mailboxButton = document.createElement('button');
    mailboxButton.type = 'button';
    mailboxButton.id = 'dormMailboxButton';
    mailboxButton.className = 'shp-mailbox-button';
    mailboxButton.textContent = '✉ Mailbox';
    mailboxButton.setAttribute('aria-haspopup','dialog');
    topGroup.insertBefore(mailboxButton, topGroup.firstChild);
    mailboxButton.addEventListener('click', openMailbox);
  }

  function ensureUI(){
    injectStyles();
    if (ui) return ui;
    ui = buildMailboxUI(character || 'Dorm');
    document.body.appendChild(ui.root);
    ui.close.addEventListener('click', closeMailbox);
    ui.back.addEventListener('click', showList);
    ui.root.addEventListener('click', e => { if (e.target === ui.root) closeMailbox(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !ui.root.hidden) {
        if (!ui.reader.hidden) showList(); else closeMailbox();
      }
    });
    return ui;
  }

  function openForCharacter(nextCharacter){
    nextCharacter = String(nextCharacter || '').trim();
    if (!nextCharacter) return false;
    character = nextCharacter;
    ensureUI();
    ui.heading.textContent = `${character}'s Mailbox`;
    openMailbox();
    return true;
  }

  async function openMailbox(){
    ensureUI();
    ui.heading.textContent = `${character}'s Mailbox`;
    ui.root.hidden = false;
    ui.list.hidden = false;
    ui.reader.hidden = true;
    ui.close.focus();
    await loadLetters();
  }

  function closeMailbox(){
    ui.root.hidden = true;
    if (mailboxButton) mailboxButton.focus();
  }

  function showList(){
    ui.reader.hidden = true;
    ui.list.hidden = false;
    ui.back.hidden = true;
    ui.heading.textContent = `${character}'s Mailbox`;
  }

  async function loadLetters(){
    const now = new Date();
    const month = now.getMonth()+1;
    const day = now.getDate();
    ui.status.textContent = `Checking mail for ${month}/${day}…`;
    ui.cards.replaceChildren();
    try {
      const data = await fetchJson(`${WORKER_BASE}/api/letters?month=${month}&day=${day}`);
      const letters = (Array.isArray(data.letters) ? data.letters : [])
        .filter(letter => sameCharacter(letter.character, character));
      ui.status.textContent = letters.length ? `${letters.length} letter${letters.length===1?'':'s'} available.` : `No letters are available for ${character} today.`;
      for (const letter of letters) ui.cards.appendChild(makeLetterCard(letter, month, day));
    } catch (error) {
      ui.status.textContent = `Could not load mail. ${friendlyError(error)}`;
    }
  }

  function makeLetterCard(letter, month, day){
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'shp-mail-card';
    const date = monthDayLabel(letter.deliveryDate);
    button.innerHTML = `
      <span class="shp-mail-card-date"></span>
      <strong class="shp-mail-card-subject"></strong>
      <span class="shp-mail-card-meta shp-mail-from"></span>
      <span class="shp-mail-card-meta shp-mail-to"></span>`;
    button.querySelector('.shp-mail-card-date').textContent = date;
    button.querySelector('.shp-mail-card-subject').textContent = letter.subject || 'Untitled letter';
    button.querySelector('.shp-mail-from').textContent = `From: ${letter.sender || 'Unknown'}`;
    button.querySelector('.shp-mail-to').textContent = `To: ${letter.recipient || character}`;
    button.addEventListener('click', () => readLetter(letter, month, day));
    return button;
  }

  async function readLetter(letter, month, day){
    ui.list.hidden = true;
    ui.reader.hidden = false;
    ui.back.hidden = false;
    ui.heading.textContent = letter.subject || 'Letter';
    ui.letterMeta.replaceChildren();
    appendMeta('Date', monthDayLabel(letter.deliveryDate));
    appendMeta('From', letter.sender || 'Unknown');
    appendMeta('To', letter.recipient || character);
    ui.body.innerHTML = '<p class="shp-mail-loading">Opening letter…</p>';
    try {
      const data = await fetchJson(`${WORKER_BASE}/api/letters/${encodeURIComponent(letter.id)}?month=${month}&day=${day}`);
      ui.body.replaceChildren();
      renderBlocks(data.blocks || [], ui.body);
      if (!ui.body.childNodes.length) {
        const p = document.createElement('p');
        p.className = 'shp-mail-empty-body';
        p.textContent = 'This letter has no body text.';
        ui.body.appendChild(p);
      }
      if (data.truncated) {
        const note = document.createElement('p');
        note.className = 'shp-mail-truncated';
        note.textContent = 'This letter is very long; the Worker returned a shortened version.';
        ui.body.appendChild(note);
      }
    } catch (error) {
      ui.body.replaceChildren();
      const p = document.createElement('p');
      p.className = 'shp-mail-error';
      p.textContent = `Could not open letter. ${friendlyError(error)}`;
      ui.body.appendChild(p);
    }
  }

  function appendMeta(label, value){
    const span = document.createElement('span');
    const strong = document.createElement('strong');
    strong.textContent = `${label}: `;
    span.append(strong, document.createTextNode(value || '—'));
    ui.letterMeta.appendChild(span);
  }

  async function fetchJson(url){
    const response = await fetch(url, { method:'GET', cache:'no-store' });
    let payload = null;
    try { payload = await response.json(); } catch (_) {}
    if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP ${response.status}`);
    return payload || {};
  }

  function renderBlocks(blocks, parent){
    let list = null, listType = null;
    for (const block of blocks) {
      if (!block || !block.type) continue;
      const isBullet = block.type === 'bulleted_list_item';
      const isNumber = block.type === 'numbered_list_item';
      if (isBullet || isNumber) {
        const wanted = isBullet ? 'ul' : 'ol';
        if (!list || listType !== wanted) {
          list = document.createElement(wanted);
          list.className = 'shp-mail-list';
          parent.appendChild(list);
          listType = wanted;
        }
        const li = document.createElement('li');
        appendRichText(li, block.richText);
        list.appendChild(li);
        if (block.children?.length) renderBlocks(block.children, li);
        continue;
      }
      list = null; listType = null;
      const node = renderBlock(block);
      if (!node) continue;
      parent.appendChild(node);
      if (block.children?.length) {
        const childWrap = document.createElement('div');
        childWrap.className = 'shp-mail-children';
        renderBlocks(block.children, childWrap);
        node.appendChild(childWrap);
      }
    }
  }

  function renderBlock(block){
    let el;
    switch(block.type){
      case 'paragraph': el = document.createElement('p'); appendRichText(el, block.richText); break;
      case 'heading_1': case 'heading_2': case 'heading_3':
        el = document.createElement(block.type.replace('_','')); appendRichText(el, block.richText); break;
      case 'quote': el = document.createElement('blockquote'); appendRichText(el, block.richText); break;
      case 'divider': el = document.createElement('hr'); break;
      case 'to_do':
        el = document.createElement('div'); el.className='shp-mail-todo';
        const box=document.createElement('input'); box.type='checkbox'; box.checked=!!block.checked; box.disabled=true;
        el.appendChild(box); appendRichText(el, block.richText); break;
      case 'callout':
        el=document.createElement('aside'); el.className='shp-mail-callout';
        if(block.icon?.type==='emoji'){ const icon=document.createElement('span'); icon.textContent=block.icon.value+' '; el.appendChild(icon); }
        appendRichText(el, block.richText); break;
      case 'code':
        el=document.createElement('pre'); const code=document.createElement('code'); appendRichText(code, block.richText); el.appendChild(code); break;
      case 'equation': el=document.createElement('p'); el.textContent=block.expression||''; break;
      case 'image':
        if (!block.source?.url) return null;
        el=document.createElement('figure'); const img=document.createElement('img'); img.src=block.source.url; img.alt=plainRichText(block.caption)||'Letter image'; img.loading='lazy'; el.appendChild(img);
        if(block.caption?.length){ const cap=document.createElement('figcaption'); appendRichText(cap, block.caption); el.appendChild(cap); } break;
      case 'bookmark': case 'embed': case 'link_preview':
        if(!block.url) return null;
        el=document.createElement('p'); const a=document.createElement('a'); a.href=block.url; a.target='_blank'; a.rel='noopener noreferrer'; a.textContent=block.url; el.appendChild(a); break;
      case 'table': el=document.createElement('div'); el.className='shp-mail-table-wrap'; break;
      case 'table_row':
        el=document.createElement('div'); el.className='shp-mail-table-row';
        for(const cell of block.cells||[]){ const c=document.createElement('div'); c.className='shp-mail-table-cell'; appendRichText(c,cell); el.appendChild(c); } break;
      case 'toggle':
        el=document.createElement('details'); const s=document.createElement('summary'); appendRichText(s,block.richText); el.appendChild(s); break;
      case 'child_page': case 'child_database': el=document.createElement('p'); el.textContent=block.title||''; break;
      case 'audio': case 'video': case 'file': case 'pdf':
        if(!block.source?.url) return null;
        el=document.createElement('p'); const mediaLink=document.createElement('a'); mediaLink.href=block.source.url; mediaLink.target='_blank'; mediaLink.rel='noopener noreferrer'; mediaLink.textContent=block.name || `Open ${block.type}`; el.appendChild(mediaLink); break;
      default:
        if(block.richText?.length){ el=document.createElement('p'); appendRichText(el,block.richText); }
        else return null;
    }
    el.classList.add('shp-mail-block');
    return el;
  }

  function appendRichText(parent, items){
    for(const item of items||[]){
      let node;
      const text = item.type==='equation' ? (item.equation||item.plainText||'') : (item.plainText||'');
      if(item.href){ const a=document.createElement('a'); a.href=item.href; a.target='_blank'; a.rel='noopener noreferrer'; a.textContent=text; node=a; }
      else node=document.createTextNode(text);
      const ann=item.annotations||{};
      const wrappers=[];
      if(ann.code) wrappers.push('code');
      if(ann.bold) wrappers.push('strong');
      if(ann.italic) wrappers.push('em');
      if(ann.underline) wrappers.push('u');
      if(ann.strikethrough) wrappers.push('s');
      for(const tag of wrappers){ const w=document.createElement(tag); w.appendChild(node); node=w; }
      parent.appendChild(node);
    }
  }

  function plainRichText(items){ return (items||[]).map(x=>x.plainText||'').join('').trim(); }
  function monthDayLabel(value){
    const m=/^(?:\d{4})-(\d{2})-(\d{2})/.exec(value||'');
    return m ? `${Number(m[1])}/${Number(m[2])}` : '—';
  }
  function sameCharacter(a,b){ return String(a||'').trim().toLocaleLowerCase()===String(b||'').trim().toLocaleLowerCase(); }
  function friendlyError(error){
    const message=String(error?.message||error||'Unknown error');
    if (/failed to fetch/i.test(message)) return 'The mailbox service could not be reached. If you are testing with file://, open the handbook from GitHub Pages or allow your local origin in the Worker CORS settings.';
    return message;
  }
  function getRoomId(){
    const bits=location.pathname.split('/').filter(Boolean);
    const roomsIndex=bits.lastIndexOf('rooms');
    if(roomsIndex>=0 && bits[roomsIndex+1]) return decodeURIComponent(bits[roomsIndex+1]).toLowerCase();
    const folder=bits.length>1 ? bits[bits.length-2] : '';
    return decodeURIComponent(folder||'').toLowerCase();
  }

  function buildMailboxUI(name){
    const root=document.createElement('div'); root.className='shp-mailbox-overlay'; root.hidden=true;
    root.innerHTML=`<section class="shp-mailbox" role="dialog" aria-modal="true" aria-label="${name} mailbox">
      <header class="shp-mailbox-header">
        <button type="button" class="shp-mailbox-back" hidden>← Letters</button>
        <h2></h2>
        <button type="button" class="shp-mailbox-close" aria-label="Close mailbox">×</button>
      </header>
      <div class="shp-mailbox-list">
        <p class="shp-mailbox-status" aria-live="polite"></p>
        <div class="shp-mailbox-cards"></div>
      </div>
      <article class="shp-mailbox-reader" hidden>
        <div class="shp-mailbox-meta"></div>
        <div class="shp-mailbox-body"></div>
      </article>
    </section>`;
    const q=s=>root.querySelector(s);
    const ui={root,heading:q('h2'),close:q('.shp-mailbox-close'),back:q('.shp-mailbox-back'),list:q('.shp-mailbox-list'),status:q('.shp-mailbox-status'),cards:q('.shp-mailbox-cards'),reader:q('.shp-mailbox-reader'),letterMeta:q('.shp-mailbox-meta'),body:q('.shp-mailbox-body')};
    ui.heading.textContent=`${name}'s Mailbox`;
    return ui;
  }

  function injectStyles(){
    if(document.getElementById('shpDormMailboxStyles')) return;
    const style=document.createElement('style'); style.id='shpDormMailboxStyles';
    style.textContent=`
      .shp-mailbox-overlay[hidden]{display:none!important}.shp-mailbox-overlay{position:fixed;z-index:10000;inset:0;background:#01040bd9;display:grid;place-items:center;padding:18px;backdrop-filter:blur(5px)}
      .shp-mailbox{width:min(880px,96vw);height:min(760px,92vh);display:flex;flex-direction:column;overflow:hidden;background:linear-gradient(180deg,#111a2b,#070b15);border:2px solid #ffffffcc;border-left:8px solid var(--room-accent,var(--line,#e63b53));border-radius:12px;box-shadow:0 18px 70px #000,0 0 30px #e63b5340;color:#fff}
      .shp-mailbox-header{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;padding:13px 15px;border-bottom:1px solid #ffffff2e;background:#07111ff2}.shp-mailbox-header h2{margin:0;text-align:center;font-size:19px;letter-spacing:.05em}.shp-mailbox-header button{border:1px solid #ffffff44;background:#ffffff0e;color:#fff;border-radius:7px;padding:8px 11px;font-weight:800;cursor:pointer}.shp-mailbox-close{font-size:22px;line-height:1;padding:5px 10px!important}
      .shp-mailbox-list,.shp-mailbox-reader{min-height:0;overflow:auto;padding:18px}.shp-mailbox-status{margin:0 0 14px;color:#cbd8e7}.shp-mailbox-cards{display:grid;gap:10px}.shp-mail-card{display:grid;grid-template-columns:84px minmax(0,1fr);gap:4px 14px;text-align:left;width:100%;padding:13px 15px;border:1px solid #ffffff2d;border-radius:9px;background:#0b1524;color:#fff;cursor:pointer}.shp-mail-card:hover,.shp-mail-card:focus-visible{outline:none;border-color:var(--room-accent,var(--line,#e63b53));box-shadow:0 0 18px #e63b5355}.shp-mail-card-date{grid-row:1/4;align-self:center;font-size:18px;font-weight:900;color:var(--room-cyan,var(--cyan,#9be7ff))}.shp-mail-card-subject{font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.shp-mail-card-meta{font-size:13px;color:#b7c5d7}
      .shp-mailbox-meta{display:flex;flex-wrap:wrap;gap:8px 18px;padding:0 0 14px;margin-bottom:16px;border-bottom:1px solid #ffffff25;color:#cbd8e7;font-size:14px}.shp-mailbox-body{font-size:16px;line-height:1.62}.shp-mailbox-body p{margin:.8em 0}.shp-mailbox-body h1,.shp-mailbox-body h2,.shp-mailbox-body h3{margin:1.15em 0 .5em}.shp-mailbox-body blockquote{margin:1em 0;padding:.3em 1em;border-left:4px solid var(--room-accent,var(--line,#e63b53));background:#ffffff08}.shp-mailbox-body hr{border:0;border-top:1px solid #ffffff2e;margin:20px 0}.shp-mailbox-body a{color:var(--room-cyan,var(--cyan,#9be7ff))}.shp-mailbox-body img{display:block;max-width:100%;height:auto;margin:12px auto;border-radius:6px}.shp-mailbox-body pre{overflow:auto;padding:12px;background:#02050b;border:1px solid #ffffff25;border-radius:7px}.shp-mailbox-body code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;background:#ffffff12;padding:.08em .25em;border-radius:3px}.shp-mail-callout{padding:12px;border:1px solid #ffffff2e;border-radius:7px;background:#ffffff09}.shp-mail-todo{display:flex;gap:8px;align-items:flex-start;margin:.5em 0}.shp-mail-list{padding-left:24px}.shp-mail-children{margin-left:18px}.shp-mail-table-wrap{overflow:auto}.shp-mail-table-row{display:flex}.shp-mail-table-cell{min-width:120px;padding:7px;border:1px solid #ffffff25}.shp-mail-error,.shp-mail-truncated{color:#ffb8c2}.shp-mail-empty-body,.shp-mail-loading{color:#b7c5d7}
      @media(max-width:650px){.shp-mailbox-overlay{padding:6px}.shp-mailbox{width:100%;height:96vh}.shp-mail-card{grid-template-columns:60px minmax(0,1fr)}.shp-mail-card-date{font-size:15px}}
    `;
    document.head.appendChild(style);
  }
})();
