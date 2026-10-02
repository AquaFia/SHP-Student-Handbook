(function(){
'use strict';
const MANIFEST_URL='companions/manifest.json';
let promise=null;
function norm(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
async function manifest(){
  if(!promise)promise=fetch(MANIFEST_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json();});
  return promise;
}
function find(data,roomId){
  const want=norm(String(roomId||'').replace(/-dorm$/,''));
  return (Array.isArray(data?.companions)?data.companions:[]).find(x=>{
    if(!x||x.enabled===false||!x.file)return false;
    const id=norm(x.id),name=norm(x.name);
    return id===want||id.startsWith(want+'-')||name===want||name.startsWith(want+'-');
  })||null;
}
function target(item){return new URL(String(item.file).replace(/^\.\//,''),new URL('./',location.href)).href;}
window.SHPDormCompanion=Object.freeze({
  async findForRoom(roomId){return find(await manifest(),roomId);},
  async openForRoom(roomId){const item=find(await manifest(),roomId);if(!item)return false;window.open(target(item),'_blank','noopener,noreferrer');return true;}
});
})();