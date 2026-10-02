(function(){
'use strict';
const MANIFEST_URL='../../../../../companions/manifest.json';
const roomId=getRoomId();
const resident=roomId.replace(/-dorm$/,'');
let record=null;

window.SHPDormCompanion=Object.freeze({
  manifestUrl:MANIFEST_URL,
  async findForRoom(id){const manifest=await readManifest();return findRecord(manifest,String(id||'').replace(/-dorm$/,''));},
  async openForRoom(id){const item=await this.findForRoom(id);if(!item)return false;openRecord(item);return true;}
});

const group=document.querySelector('.room-topbar .group:last-child');
if(group&&resident){
  initRoomButton();
}

async function initRoomButton(){
  try{
    record=findRecord(await readManifest(),resident);
    if(!record||record.enabled===false||!record.file)return;
    const b=document.createElement('button');
    b.type='button'; b.id='dormCompanionButton'; b.textContent='✦ Companion';
    b.title='Open companion in a separate window';
    group.insertBefore(b,group.firstChild);
    b.addEventListener('click',()=>openRecord(record));
  }catch(err){console.info('[SHP Companion] Manifest unavailable.',err);}
}
async function readManifest(){
  const r=await fetch(MANIFEST_URL,{cache:'no-store'});
  if(!r.ok)throw new Error('HTTP '+r.status);
  return r.json();
}
function findRecord(manifest,resident){
  const list=Array.isArray(manifest?.companions)?manifest.companions:[];
  const want=norm(resident);
  return list.find(x=>{
    if(!x||x.enabled===false)return false;
    const id=norm(x.id), name=norm(x.name);
    return id===want||id.startsWith(want+'-')||name===want||name.startsWith(want+'-');
  })||null;
}
function openRecord(item){
  // Current manifest file values are apps-relative (e.g. ./companions/shared/...).
  const target=new URL(String(item.file).replace(/^\.\//,''),new URL('../../../../../',location.href)).href;
  window.open(target,'_blank','noopener,noreferrer');
}
function norm(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function getRoomId(){const a=location.pathname.split('/').filter(Boolean),i=a.lastIndexOf('rooms');return i>=0&&a[i+1]?decodeURIComponent(a[i+1]).toLowerCase():'';}
})();