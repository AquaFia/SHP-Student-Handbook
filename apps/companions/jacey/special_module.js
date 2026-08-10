/* =========================================================
   JACEY COMPANION — SPECIAL MODULE
   Cipher Lab
   ========================================================= */

(function(){
"use strict";

const MODULE_STYLE_ID="companion-special-module-cipher-lab-style";
const UNKNOWN_CIPHER_RESET_MS=1100;

const MODULE_CSS='.cipher-mode{\n  display:none;\n  min-height:0;\n  overflow:auto;\n  padding:clamp(16px,1.5vw,28px);\n  background:linear-gradient(180deg,color-mix(in srgb,var(--panel) 96%,transparent),color-mix(in srgb,var(--bg) 98%,transparent))\n}\n.cipher-mode.active{display:block}\n.cipher-shell{\n  width:100%;\n  max-width:none;\n  margin:0;\n  display:grid;\n  gap:clamp(14px,1.1vw,20px);\n}\n.cipher-intro,.cipher-card,.cipher-result{\n  border:1px solid var(--line);border-radius:16px;\n  background:color-mix(in srgb,var(--panel2) 88%,black);\n  box-shadow:inset 0 0 30px color-mix(in srgb,var(--violet) 8%,transparent)\n}\n.cipher-intro{padding:16px}\n.cipher-intro h3{margin:0 0 7px;color:var(--ink);font-size:15px}\n.cipher-intro p{margin:0;color:var(--muted);font-size:12px;line-height:1.55}\n.cipher-card{padding:16px;display:grid;gap:12px}\n.cipher-grid{\n  display:grid;\n  grid-template-columns:repeat(2,minmax(260px,1fr));\n  gap:clamp(11px,1vw,18px);\n}\n.cipher-field{display:grid;gap:6px}\n.cipher-field.full{grid-column:1/-1}\n.cipher-field label{\n  color:color-mix(in srgb,var(--violet) 70%,var(--ink));\n  font:700 10px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.12em\n}\n.cipher-field select,.cipher-field input,.cipher-field textarea{\n  width:100%;box-sizing:border-box;border:1px solid var(--line);border-radius:11px;\n  background:color-mix(in srgb,var(--bg) 90%,black);color:var(--ink);\n  padding:10px 11px;font:12px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace;\n  outline:none;transition:.25s ease\n}\n.cipher-field textarea{min-height:120px;resize:vertical}\n.cipher-field select:focus,.cipher-field input:focus,.cipher-field textarea:focus{\n  border-color:var(--violet);box-shadow:0 0 0 3px color-mix(in srgb,var(--violet) 14%,transparent)\n}\n.cipher-actions{display:flex;gap:9px;flex-wrap:wrap}\n.cipher-run,.cipher-clear{\n  border:1px solid var(--line);border-radius:11px;padding:10px 14px;cursor:pointer;\n  font:800 10px/1 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.12em\n}\n.cipher-run{color:white;background:linear-gradient(135deg,var(--violet),var(--blue));border-color:transparent}\n.cipher-clear{color:var(--muted);background:color-mix(in srgb,var(--panel) 90%,black)}\n.cipher-result{padding:16px;display:none}\n.cipher-result.show{display:block}\n.cipher-result.error{border-color:var(--red)}\n.cipher-result.success{border-color:color-mix(in srgb,var(--cyan) 60%,var(--line))}\n.cipher-result-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}\n.cipher-result-title{font:800 11px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.13em;color:var(--ink)}\n.cipher-result-expression{font-size:10px;color:var(--muted)}\n.cipher-result pre{\n  margin:0;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--ink);\n  font:12px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace\n}\n.cipher-note{font-size:11px;color:var(--muted);line-height:1.45}\n.cipher-duty-wrap.hidden,.cipher-version-wrap.hidden{display:none}\n@media(max-width:700px){\n  .cipher-grid{grid-template-columns:1fr}\n  .cipher-field.full{grid-column:auto}\n  .mode-tab{padding:7px 9px;font-size:9px}\n}\n\n\n@media(max-width:1100px){\n  .cipher-mode{padding:14px}\n  .cipher-grid{grid-template-columns:1fr}\n  .cipher-field.full{grid-column:auto}\n}\n@media(max-width:700px){\n  .cipher-mode{padding:10px}\n  .cipher-card,.cipher-intro,.cipher-result{border-radius:12px}\n  .cipher-card,.cipher-intro{padding:12px}\n  .cipher-field textarea{min-height:96px}\n}\n';
const MODULE_HTML='<section class="cipher-mode" id="cipherMode" aria-label="Cipher Lab">\n  <div class="cipher-shell">\n    <div class="cipher-intro">\n      <h3 id="cipherLabTitle">JACE // CIPHER LAB</h3>\n      <p id="cipherLabIntro">Build, test, encrypt, and decrypt your messages. I’ll verify the format before running anything, and I’ll let you know if I spot a mistake.</p>\n    </div>\n\n    <div class="cipher-card">\n      <div class="cipher-grid">\n        <div class="cipher-field">\n          <label for="cipherFamily">CIPHER FAMILY</label>\n          <select id="cipherFamily">\n            <option value="CLC">Committee Lanes Cipher (CLC)</option>\n            <option value="FFC">Fushimi Fenrir Cipher (FFC)</option>\n            <option value="CFC">Cosmo Family Cipher (CFC)</option>\n          </select>\n        </div>\n<div class="cipher-field">\n          <label for="cipherOperation">MODE</label>\n          <select id="cipherOperation">\n            <option value="encrypt">Encrypt</option>\n            <option value="decrypt">Decrypt</option>\n          </select>\n        </div>\n\n        <div class="cipher-field cipher-version-wrap hidden" id="cipherVersionWrap">\n          <label for="cipherVersion">CLC VERSION</label>\n          <select id="cipherVersion">\n            <option value="CLC-1">CLC-1 — Original</option>\n            <option value="CLC-2">CLC-2 — After Saya Left</option>\n          </select>\n        </div>\n\n        <div class="cipher-field cipher-duty-wrap hidden" id="cipherDutyWrap">\n          <label for="cipherDuty">DUTY LIST — 2 TO 5 NAMES</label>\n          <input id="cipherDuty" placeholder="Tokiko / Ludo / Daika">\n        </div>\n\n        <div class="cipher-field full">\n          <label id="cipherTextLabel" for="cipherText">MESSAGE</label>\n          <textarea id="cipherText" placeholder="Enter the text to encrypt…"></textarea>\n        </div>\n      </div>\n\n      <label class="cipher-note">\n        <input id="cipherPreserve" type="checkbox">\n        Preserve spaces and punctuation for CLC. FFC always preserves them; CFC normalizes to letters only.\n      </label>\n\n      <div class="cipher-actions">\n        <button class="cipher-run" id="cipherRun" type="button">RUN CIPHER</button>\n        <button class="cipher-clear" id="cipherClear" type="button">CLEAR</button>\n      </div>\n    </div>\n\n    <div class="cipher-result" id="cipherResult">\n      <div class="cipher-result-head">\n        <span class="cipher-result-title" id="cipherResultTitle">JACE // VALIDATION</span>\n        <span class="cipher-result-expression" id="cipherResultExpression">READY</span>\n      </div>\n      <pre id="cipherResultText"></pre>\n    </div>\n  </div>\n</section>';

let runtime=null;
let activeIdentity="jace";
let CHARACTER={};

let cipherModeBtn=null;
let cipherModePanel=null;
let cipherFamily=null;
let cipherOperation=null;
let cipherVersion=null;
let cipherVersionWrap=null;
let cipherDuty=null;
let cipherDutyWrap=null;
let cipherText=null;
let cipherTextLabel=null;
let cipherPreserve=null;
let cipherRun=null;
let cipherClear=null;
let cipherResult=null;
let cipherResultTitle=null;
let cipherResultExpression=null;
let cipherResultText=null;

function syncIdentityState(){
  activeIdentity=runtime.getActiveIdentity();
  const definition=runtime.getCharacter();
  CHARACTER=definition.identities?.[activeIdentity]
    || definition.identities?.[definition.defaultIdentity]
    || {};
}

function setExpression(name){
  return runtime.setExpression(name);
}

function showToast(text){
  return runtime.showToast(text);
}

const CLC_LANES={
  'CLC-1':['Aria','Tokiko','Damian','Ludo','Daika','Fate','Luxi','Tyler','Kouji','Ruby','Juno','Hikari','Alice','Saya','Adair','Milo','Meggie','Jace'],
  'CLC-2':['Adair','Alice','Aria','Daika','Damian','Fate','Hikari','Jace','Juno','Kouji','Ludo','Luxi','Meggie','Milo','Ruby','Tokiko','Tyler']
};
const NAME_ALIASES={
  'jacey':'Jace','jacey cosmo':'Jace','jace cosmo':'Jace',
  'ty':'Tyler','ari':'Aria','damon':'Damian'
};
function canonicalDutyName(name){
  const raw=name.trim().replace(/[^a-zA-Z ]/g,'').replace(/\s+/g,' ');
  const key=raw.toLowerCase();
  const alias=NAME_ALIASES[key];
  const wanted=(alias||raw).toLowerCase();
  const all=[...new Set([...CLC_LANES['CLC-1'],...CLC_LANES['CLC-2']])];
  return all.find(n=>n.toLowerCase()===wanted)||null;
}
function clcTransform(text,version,duties,decrypt=false,preserve=false){
  const lanes=CLC_LANES[version];
  if(!lanes)throw new Error('Use CLC-1 or CLC-2.');
  if(duties.length<2||duties.length>5)throw new Error('CLC requires 2–5 duty names.');
  const nums=duties.map(name=>{
    const canon=canonicalDutyName(name);
    if(!canon)throw new Error(`Unknown duty name: ${name.trim()}`);
    const n=lanes.findIndex(x=>x.toLowerCase()===canon.toLowerCase())+1;
    if(!n)throw new Error(`${canon} is not in ${version}.`);
    return n;
  });
  let keyIndex=0,out='';
  for(const ch of text.toUpperCase()){
    if(/[A-Z]/.test(ch)){
      const p=ch.charCodeAt(0)-65;
      const k=(nums[keyIndex++%nums.length]-1)%26;
      out+=String.fromCharCode(65+((decrypt?p-k:p+k)+26)%26);
    }else if(preserve){
      out+=ch;
    }
  }
  const keyword=nums.map(n=>String.fromCharCode(64+((n-1)%26+1))).join('');
  return {result:out,keyword,laneNumbers:nums.join('/')};
}

const FFC_PLAIN='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const FFC_CIPHER='WOLFABCDGHJKMPQTUVXYZENRIS';
const FFC_KEY='FUSHIMI';
function ffcEncrypt(text){
  let keyI=0,out='';
  for(const ch of text.toUpperCase()){
    if(/[A-Z]/.test(ch)){
      const sub=FFC_CIPHER[FFC_PLAIN.indexOf(ch)];
      const p=sub.charCodeAt(0)-65;
      const k=FFC_KEY.charCodeAt(keyI++%FFC_KEY.length)-65;
      out+=String.fromCharCode(65+(p+k)%26);
    }else out+=ch;
  }
  return out;
}
function ffcDecrypt(text){
  let keyI=0,out='';
  for(const ch of text.toUpperCase()){
    if(/[A-Z]/.test(ch)){
      const c=ch.charCodeAt(0)-65;
      const k=FFC_KEY.charCodeAt(keyI++%FFC_KEY.length)-65;
      const sub=String.fromCharCode(65+((c-k)+26)%26);
      const idx=FFC_CIPHER.indexOf(sub);
      if(idx<0)throw new Error(`Invalid FFC symbol: ${sub}`);
      out+=FFC_PLAIN[idx];
    }else out+=ch;
  }
  return out;
}

const CFC_ROWS=['INTEG','RYOVU','HABCD','FKLMP','QSWXZ'];
const CFC_ENC={},CFC_DEC={};
CFC_ROWS.forEach((row,r)=>[...row].forEach((ch,c)=>{
  const token=`${r+1}${c+1}`;
  CFC_ENC[ch]=token;CFC_DEC[token]=ch;
}));
const CFC_ORDER=[0,3,1,4,2];
const CFC_IOT=[11,23,13];
const CFC_TAGS=['C','M','O','O','S'];
function cfcEncrypt(text){
  const normalized=text.toUpperCase().replace(/J/g,'I').replace(/[^A-Z]/g,'');
  if(!normalized)throw new Error('CFC needs at least one letter.');
  const tokens=[...normalized].map(ch=>CFC_ENC[ch]);
  while(tokens.length%5)tokens.push('54');
  const rows=tokens.length/5;
  const grid=Array.from({length:rows},(_,r)=>tokens.slice(r*5,r*5+5));
  const transposed=[];
  CFC_ORDER.forEach(col=>{for(let r=0;r<rows;r++)transposed.push(grid[r][col]);});
  const cipher=transposed.map((tok,i)=>String((Number(tok)+CFC_IOT[i%3])%100).padStart(2,'0'));
  return cipher.map((tok,i)=>CFC_TAGS[i%5]+tok).join(' ');
}
function cfcDecrypt(text){
  const matches=[...text.toUpperCase().matchAll(/[CMOS]?\s*(\d{2})/g)].map(m=>m[1]);
  if(!matches.length)throw new Error('No CFC tokens found.');
  if(matches.length%5!==0)throw new Error('CFC token count must be divisible by 5.');
  const transposed=matches.map((tok,i)=>String((Number(tok)-CFC_IOT[i%3]+100)%100).padStart(2,'0'));
  const rows=transposed.length/5;
  const grid=Array.from({length:rows},()=>Array(5));
  let p=0;
  CFC_ORDER.forEach(col=>{for(let r=0;r<rows;r++)grid[r][col]=transposed[p++];});
  const original=grid.flat();
  let plain='';
  for(const tok of original){
    if(!CFC_DEC[tok])throw new Error(`Invalid CFC coordinate: ${tok}`);
    plain+=CFC_DEC[tok];
  }
  return plain.replace(/X+$/,'');
}

function executeCipherRequest(req){
  if(!req.message)throw new Error(`Add ${req.mode==='encrypt'?'Message':'Ciphertext'}: after a | separator.`);
  if(req.type==='FFC'){
    const result=req.mode==='encrypt'?ffcEncrypt(req.message):ffcDecrypt(req.message);
    return `${req.mode==='encrypt'?'FFC ENCRYPTED':'FFC DECRYPTED'}\n${result}`;
  }
  if(req.type==='CFC'){
    const result=req.mode==='encrypt'?cfcEncrypt(req.message):cfcDecrypt(req.message);
    return `${req.mode==='encrypt'?'CFC ENCRYPTED':'CFC DECRYPTED'}\n${result}`;
  }
  if(req.type==='CLC-1'||req.type==='CLC-2'){
    if(!req.duty)throw new Error('CLC requires Duty: NAME / NAME.');
    const duties=req.duty.split(/\s*\/\s*|\s*,\s*/).filter(Boolean);
    const data=clcTransform(req.message,req.type,duties,req.mode==='decrypt',req.preserve);
    const label=req.mode==='encrypt'?'CIPHERTEXT':'PLAINTEXT';
    return `${req.type} ${req.mode.toUpperCase()}\nDUTY: ${duties.map(canonicalDutyName).join(' / ')}\nLANES: ${data.laneNumbers}\nKEYWORD: ${data.keyword}\n${label}: ${data.result}`;
  }
  throw new Error('Unsupported cipher.');
}

const CIPHER_KNOWLEDGE={
  jace:['CLC'],
  naoya:['FFC','CFC'],
  mao:['FFC','CFC']
};
const DEFAULT_CIPHER={
  jace:'CLC',
  naoya:'FFC',
  mao:'FFC'
};

function getKnownCipherFamilies(){
  return CIPHER_KNOWLEDGE[activeIdentity]||[];
}

function unknownCipherMessage(family){
  if(activeIdentity==='jace'){
    return family==='CLC'
      ?''
      :"Hmm...\n\nI've never seen this cipher before.\n\nIt feels strangely familiar, but I don't actually remember how it works.";
  }
  if(activeIdentity==='naoya'){
    return family==='CLC'
      ?'Unknown encryption method.\n\nRecent construction. It is not part of this memory set.'
      :'';
  }
  if(activeIdentity==='mao'){
    return family==='CLC'
      ?'Not ours.'
      :'';
  }
  return 'Cipher unavailable.';
}

function updateCipherKnowledge(){
  const fallback=DEFAULT_CIPHER[activeIdentity]||'CLC';
  cipherFamily.value=fallback;
  updateCipherForm();
  cipherResult.className='cipher-result';
  cipherResultText.textContent='';
}

function reactToUnknownCipher(family){
  const message=unknownCipherMessage(family);
  if(!message)return false;

  if(activeIdentity==='jace' && CHARACTER.portrait!==false){
    setExpression('curious'); // OPEN_CURIOUS
  }

  const expressionLabel=
    activeIdentity==='jace' ? 'OPEN_CURIOUS' :
    activeIdentity==='naoya' ? 'UNKNOWN METHOD' :
    'UNRECOGNIZED';

  showCipherFeedback(
    `${CHARACTER.shortName.toUpperCase()} // UNKNOWN CIPHER`,
    message,
    'error',
    expressionLabel
  );
  showToast('CIPHER MEMORY // UNAVAILABLE');

  const fallback=DEFAULT_CIPHER[activeIdentity]||'CLC';
  window.setTimeout(()=>{
    cipherFamily.value=fallback;
    updateCipherForm();
  },UNKNOWN_CIPHER_RESET_MS);

  return true;
}

const CIPHER_IDENTITY_COPY={
  jace:{
    title:'JACE // CIPHER LAB',
    intro:'Build, test, encrypt, and decrypt your messages. I’ll verify the format before running anything, and I’ll let you know if I spot a mistake.',
    run:'RUN CIPHER',
    clear:'CLEAR',
    encryptPlaceholder:'Enter the text to encrypt…',
    decryptPlaceholder:'Enter the ciphertext to decrypt…',
    validationTitle:'JACE // FORMAT ERROR',
    validationExpression:'CONTRADICTION FOUND',
    successTitle:'JACE // OPERATION COMPLETE',
    successEncrypt:'ENCRYPTED',
    successDecrypt:'DECRYPTED',
    failureTitle:'JACE // OPERATION FAILED',
    failureExpression:'RECHECK REQUIRED',
    invalidTail:'Fix those fields and I’ll try again.',
    failureLead:'The format passed, but the cipher still rejected something:'
  },
  naoya:{
    title:'NAOYA // ANALYSIS TERMINAL',
    intro:'Every cipher follows a pattern. Provide the required information and I’ll verify the structure before processing the data.',
    run:'PROCESS DATA',
    clear:'RESET',
    encryptPlaceholder:'Input plaintext…',
    decryptPlaceholder:'Input ciphertext…',
    validationTitle:'NAOYA // STRUCTURE ERROR',
    validationExpression:'FORMAT INVALID',
    successTitle:'NAOYA // ANALYSIS COMPLETE',
    successEncrypt:'ENCODED',
    successDecrypt:'DECODED',
    failureTitle:'NAOYA // PROCESSING FAILED',
    failureExpression:'RECHECK STRUCTURE',
    invalidTail:'Correct the fields and resubmit.',
    failureLead:'The format was accepted, but processing failed:'
  },
  mao:{
    title:'MAO // FENRIR OPERATIONS',
    intro:'Accuracy matters. Incomplete or incorrect information compromises the operation. Verify the fields before continuing.',
    run:'EXECUTE',
    clear:'CLEAR',
    encryptPlaceholder:'Awaiting plaintext.',
    decryptPlaceholder:'Awaiting ciphertext.',
    validationTitle:'MAO // FORMAT REJECTED',
    validationExpression:'INPUT INVALID',
    successTitle:'MAO // OPERATION COMPLETE',
    successEncrypt:'ENCRYPTED',
    successDecrypt:'DECRYPTED',
    failureTitle:'MAO // OPERATION FAILED',
    failureExpression:'VERIFY INPUT',
    invalidTail:'Correct it.',
    failureLead:'The operation failed after validation:'
  }
};

function getCipherIdentityCopy(){
  return CIPHER_IDENTITY_COPY[activeIdentity]||CIPHER_IDENTITY_COPY.jace;
}

function updateCipherIdentityText(){
  const copy=getCipherIdentityCopy();
  const title=document.querySelector('#cipherLabTitle');
  const intro=document.querySelector('#cipherLabIntro');
  if(title)title.textContent=copy.title;
  if(intro)intro.textContent=copy.intro;
  if(cipherRun)cipherRun.textContent=copy.run;
  if(cipherClear)cipherClear.textContent=copy.clear;
  updateCipherForm();
}

function updateCipherForm(){
  const copy=getCipherIdentityCopy();
  const isCLC=cipherFamily.value==='CLC';
  cipherVersionWrap.classList.toggle('hidden',!isCLC);
  cipherDutyWrap.classList.toggle('hidden',!isCLC);
  cipherTextLabel.textContent=cipherOperation.value==='encrypt'?'MESSAGE':'CIPHERTEXT';
  cipherText.placeholder=cipherOperation.value==='encrypt'
    ?copy.encryptPlaceholder
    :copy.decryptPlaceholder;
}

function showCipherFeedback(title,text,type='error',expression='FORMAT CHECK'){
  cipherResult.classList.add('show');
  cipherResult.classList.toggle('error',type==='error');
  cipherResult.classList.toggle('success',type==='success');
  cipherResultTitle.textContent=title;
  cipherResultExpression.textContent=expression;
  cipherResultText.textContent=text;
  cipherResult.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function validateCipherForm(){
  const family=cipherFamily.value;
  const known=getKnownCipherFamilies();
  if(!known.includes(family)){
    return [unknownCipherMessage(family)];
  }
  const operation=cipherOperation.value;
  const text=cipherText.value.trim();
  const problems=[];

  if(!text){
    problems.push(operation==='encrypt'
      ?'The message field is empty.'
      :'The ciphertext field is empty.');
  }

  if(family==='CLC'){
    const duties=cipherDuty.value.split(/\s*\/\s*|\s*,\s*/).filter(Boolean);
    if(!cipherDuty.value.trim()){
      problems.push('CLC needs a duty list.');
    }else if(duties.length<2||duties.length>5){
      problems.push(`CLC needs 2–5 duty names. I counted ${duties.length}.`);
    }else{
      const version=cipherVersion.value;
      const invalid=[];
      const unavailable=[];
      duties.forEach(name=>{
        const canon=canonicalDutyName(name);
        if(!canon)invalid.push(name.trim());
        else if(!CLC_LANES[version].some(x=>x.toLowerCase()===canon.toLowerCase()))unavailable.push(canon);
      });
      if(invalid.length)problems.push(`I don't recognize these duty names: ${invalid.join(', ')}.`);
      if(unavailable.length)problems.push(`${unavailable.join(', ')} ${unavailable.length===1?'is':'are'} not in ${version}.`);
    }
    if(operation==='decrypt'&&!/^[A-Z\s.,!?'"’\-:;]+$/i.test(text)){
      problems.push('CLC ciphertext should contain letters A–Z. Punctuation is okay only when it was preserved during encryption.');
    }
  }

  if(family==='CFC'&&operation==='decrypt'){
    const tokens=[...text.toUpperCase().matchAll(/[CMOS]?\s*(\d{2})/g)].map(m=>m[1]);
    if(!tokens.length)problems.push('I could not find any CFC two-digit tokens.');
    else if(tokens.length%5!==0)problems.push(`CFC needs a token count divisible by 5. I counted ${tokens.length}.`);
    if(/[A-Z]/i.test(text.replace(/[CMOS]/gi,''))){
      problems.push('CFC ciphertext should use C/M/O/O/S tags and two-digit numbers.');
    }
  }

  if(family==='FFC'&&operation==='decrypt'&&!/[A-Z]/i.test(text)){
    problems.push('FFC ciphertext needs at least one letter.');
  }

  return problems;
}

function injectStyle(){
  if(document.getElementById(MODULE_STYLE_ID))return;
  const style=document.createElement("style");
  style.id=MODULE_STYLE_ID;
  style.textContent=MODULE_CSS;
  document.head.append(style);
}

function buildInterface(){
  const nav=runtime.mounts.navigation;
  const content=runtime.mounts.content;

  nav.replaceChildren();
  content.replaceChildren();

  cipherModeBtn=document.createElement("button");
  cipherModeBtn.className="mode-tab";
  cipherModeBtn.type="button";
  cipherModeBtn.textContent="CIPHER LAB";
  cipherModeBtn.dataset.specialModule="cipher-lab";
  nav.append(cipherModeBtn);

  content.innerHTML=MODULE_HTML;
  cipherModePanel=content.querySelector("#cipherMode");

  cipherFamily=content.querySelector("#cipherFamily");
  cipherOperation=content.querySelector("#cipherOperation");
  cipherVersion=content.querySelector("#cipherVersion");
  cipherVersionWrap=content.querySelector("#cipherVersionWrap");
  cipherDuty=content.querySelector("#cipherDuty");
  cipherDutyWrap=content.querySelector("#cipherDutyWrap");
  cipherText=content.querySelector("#cipherText");
  cipherTextLabel=content.querySelector("#cipherTextLabel");
  cipherPreserve=content.querySelector("#cipherPreserve");
  cipherRun=content.querySelector("#cipherRun");
  cipherClear=content.querySelector("#cipherClear");
  cipherResult=content.querySelector("#cipherResult");
  cipherResultTitle=content.querySelector("#cipherResultTitle");
  cipherResultExpression=content.querySelector("#cipherResultExpression");
  cipherResultText=content.querySelector("#cipherResultText");
}

const CipherLab={
  id:"cipher-lab",
  name:"Cipher Lab",
  state:{open:false,initialized:false},

  init(moduleRuntime){
    if(this.state.initialized)return this;
    if(
      !moduleRuntime
      || typeof moduleRuntime.getActiveIdentity!=="function"
      || typeof moduleRuntime.getCharacter!=="function"
      || typeof moduleRuntime.setExpression!=="function"
      || typeof moduleRuntime.showToast!=="function"
      || typeof moduleRuntime.enterSpecialMode!=="function"
      || typeof moduleRuntime.leaveSpecialMode!=="function"
      || !moduleRuntime.mounts?.navigation
      || !moduleRuntime.mounts?.content
    ){
      throw new Error("Cipher Lab received an incomplete special-module runtime.");
    }

    runtime=moduleRuntime;
    syncIdentityState();
    injectStyle();
    buildInterface();

    cipherModeBtn.addEventListener("click",()=>this.open());
    cipherFamily.addEventListener("change",()=>this.handleFamilyChange());
    cipherOperation.addEventListener("change",()=>this.renderForm());
    cipherRun.addEventListener("click",()=>this.run());
    cipherClear.addEventListener("click",()=>this.clear());

    this.state.initialized=true;
    updateCipherKnowledge();
    updateCipherIdentityText();
    this.renderForm();
    return this;
  },

  isOpen(){
    return this.state.open;
  },

  open(){
    if(!this.state.initialized||this.state.open)return false;
    this.state.open=true;
    runtime.enterSpecialMode();
    cipherModePanel.classList.add("active");
    cipherModeBtn.classList.add("active");
    showToast("CIPHER LAB // ACTIVE");
    this.renderForm();
    return true;
  },

  close(){
    if(!this.state.initialized)return false;

    cipherModePanel.classList.remove("active");
    cipherModeBtn.classList.remove("active");

    if(!this.state.open){
      return false;
    }

    this.state.open=false;
    showToast("COMPANION CHAT // ACTIVE");
    runtime.leaveSpecialMode();
    return true;
  },

  renderForm(){
    updateCipherForm();
  },

  handleFamilyChange(){
    const selected=cipherFamily.value;
    if(!getKnownCipherFamilies().includes(selected)){
      reactToUnknownCipher(selected);
      return false;
    }
    this.renderForm();
    return true;
  },

  run(){
    const problems=validateCipherForm();
    const copy=getCipherIdentityCopy();

    if(problems.length){
      if(activeIdentity==="jace"&&CHARACTER.portrait!==false)setExpression("deadpan");
      showCipherFeedback(
        copy.validationTitle,
        `I found ${problems.length===1?"a problem":"some problems"}:\n\n• ${problems.join("\n• ")}\n\n${copy.invalidTail}`,
        "error",
        copy.validationExpression
      );
      showToast("CIPHER FORMAT // INVALID");
      return false;
    }

    try{
      const family=cipherFamily.value;
      const operation=cipherOperation.value;
      const req={
        mode:operation,
        type:family,
        message:cipherText.value.trim(),
        preserve:cipherPreserve.checked
      };

      if(family==="CLC"){
        req.type=cipherVersion.value;
        req.duty=cipherDuty.value.trim();
      }

      const output=executeCipherRequest(req);

      if(activeIdentity==="jace"&&CHARACTER.portrait!==false)setExpression("clue");

      showCipherFeedback(
        copy.successTitle,
        output,
        "success",
        operation==="encrypt"?copy.successEncrypt:copy.successDecrypt
      );
      showToast("CIPHER OPERATION // COMPLETE");
      return true;
    }catch(error){
      if(activeIdentity==="jace"&&CHARACTER.portrait!==false)setExpression("panic");
      showCipherFeedback(
        copy.failureTitle,
        `${copy.failureLead}\n\n${error.message}`,
        "error",
        copy.failureExpression
      );
      showToast("CIPHER OPERATION // ERROR");
      return false;
    }
  },

  clear(){
    cipherDuty.value="";
    cipherText.value="";
    cipherPreserve.checked=false;
    cipherResult.className="cipher-result";
    cipherResultText.textContent="";
    this.renderForm();
    return true;
  },

  onIdentityChange(){
    if(!this.state.initialized)return false;
    syncIdentityState();
    updateCipherKnowledge();
    updateCipherIdentityText();
    return true;
  },

  destroy(){
    if(!this.state.initialized)return false;
    if(this.state.open)this.close();

    runtime.mounts.navigation.replaceChildren();
    runtime.mounts.content.replaceChildren();
    document.getElementById(MODULE_STYLE_ID)?.remove();

    runtime=null;
    cipherModeBtn=null;
    cipherModePanel=null;
    cipherFamily=null;
    cipherOperation=null;
    cipherVersion=null;
    cipherVersionWrap=null;
    cipherDuty=null;
    cipherDutyWrap=null;
    cipherText=null;
    cipherTextLabel=null;
    cipherPreserve=null;
    cipherRun=null;
    cipherClear=null;
    cipherResult=null;
    cipherResultTitle=null;
    cipherResultExpression=null;
    cipherResultText=null;

    this.state.open=false;
    this.state.initialized=false;
    return true;
  }
};

window.CompanionSpecialModule=CipherLab;
})();
