/* Safe Havens Peak — M.S.14 Floor Module Runtime
 * Classic-script module registry + renderer. Deliberately avoids ES-module
 * imports so the handbook map remains testable from file:// as well as HTTP.
 */
(function(global){
  'use strict';
  const VERSION='1.0.0';
  const definitions=Object.create(null);

  function validate(def){
    const errors=[];
    if(!def||typeof def!=='object') return ['floor-definition-missing'];
    if(!def.id||typeof def.id!=='string') errors.push('floor-id-missing');
    if(!def.image||typeof def.image!=='string') errors.push('floor-image-missing');
    if(!Array.isArray(def.rooms)) errors.push('floor-rooms-missing');
    else def.rooms.forEach((r,i)=>{
      if(!r||typeof r!=='object') errors.push('room-'+i+'-invalid');
      else {
        if(!r.roomId) errors.push('room-'+i+'-roomId-missing');
        if(!r.name) errors.push('room-'+i+'-name-missing');
        ['x','y','w','h'].forEach(k=>{if(!Number.isFinite(Number(r[k]))) errors.push('room-'+i+'-'+k+'-invalid');});
      }
    });
    return errors;
  }

  function register(def){
    const errors=validate(def);
    if(errors.length) throw new Error('Invalid SHP floor module '+(def&&def.id?def.id:'unknown')+': '+errors.join(', '));
    const normalized=Object.freeze(Object.assign({},def,{rooms:Object.freeze(def.rooms.map(r=>Object.freeze(Object.assign({},r))))}));
    definitions[normalized.id]=normalized;
    return normalized;
  }
  function get(id){return definitions[id]||null;}
  function has(id){return !!definitions[id];}
  function list(){return Object.keys(definitions);}

  function render(host,def,options={}){
    if(!host||!def) return null;
    host.innerHTML='';
    if(def.renderer==='dorms') return renderDorms(host,def,options);
    const stage=document.createElement('div');
    stage.className='map-stage floor-module-stage';
    stage.dataset.floor=def.id;
    if(def.minWidth) stage.style.minWidth=Number(def.minWidth)+'px';
    const img=document.createElement('img');
    img.alt=def.imageAlt||((def.title||def.id)+' map');
    img.src=def.image;
    stage.appendChild(img);
    const spots=document.createElement('div');
    spots.className='floor-module-spots';
    spots.dataset.floor=def.id;
    stage.appendChild(spots);
    def.rooms.forEach(r=>{
      const d=document.createElement('div');
      d.className='hotspot';
      d.dataset.name=r.name;
      d.dataset.roomId=r.roomId;
      Object.assign(d.style,{left:r.x+'%',top:r.y+'%',width:r.w+'%',height:r.h+'%'});
      d.onclick=()=>{
        select(host,r.roomId,r.name);
        if(typeof options.onSelect==='function') options.onSelect(r);
      };
      spots.appendChild(d);
    });
    host.appendChild(stage);
    return stage;
  }
  function renderDorms(host,def,options={}){
    const stage=document.createElement('div');
    stage.className='dorm-module-stage';
    stage.dataset.floor=def.id;
    if(def.minWidth) stage.style.minWidth=Number(def.minWidth)+'px';

    const title=document.createElement('div');
    title.className='dorm-module-title';
    title.textContent=def.title||'Dorm Wing Directory';
    stage.appendChild(title);

    const grid=document.createElement('div');
    grid.className='dorm-module-grid';
    stage.appendChild(grid);

    [
      {left:0,top:19,width:54,height:11,label:'Hallway'},
      {left:45.5,top:19,width:8.5,height:50,label:'Hallway'},
      {left:0,top:69,width:100,height:21,label:'Main Dorm Hallway'}
    ].forEach(h=>{
      const el=document.createElement('div');
      el.className='dorm-module-hall';
      el.textContent=h.label;
      Object.assign(el.style,{left:h.left+'%',top:h.top+'%',width:h.width+'%',height:h.height+'%'});
      grid.appendChild(el);
    });
    const stairs=document.createElement('div');
    stairs.className='dorm-module-stairs';
    stairs.title='Stairs';
    grid.appendChild(stairs);

    def.rooms.forEach(r=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='dorm-module-room';
      b.dataset.name=r.name;
      b.dataset.roomId=r.roomId;
      b.setAttribute('aria-label',r.name+' dorm');
      Object.assign(b.style,{left:r.x+'%',top:r.y+'%',width:r.w+'%',height:r.h+'%'});
      const name=document.createElement('strong');
      name.textContent=r.name;
      b.appendChild(name);
      const sub=document.createElement('span');
      sub.textContent='Dorm';
      b.appendChild(sub);
      b.onclick=()=>{
        select(host,r.roomId,r.name);
        if(typeof options.onSelect==='function') options.onSelect(r);
      };
      grid.appendChild(b);
    });
    host.appendChild(stage);
    return stage;
  }

  function select(host,roomId,roomName){
    if(!host)return;
    host.querySelectorAll('.hotspot,.dorm-module-room').forEach(el=>{
      el.classList.toggle('selected',!!((roomId&&el.dataset.roomId===roomId)||(!roomId&&roomName&&el.dataset.name===roomName)));
    });
  }
  function clear(host){if(host)host.querySelectorAll('.hotspot.selected,.dorm-module-room.selected').forEach(el=>el.classList.remove('selected'));}

  global.SHPFloorModuleRegistry=Object.freeze({VERSION,register,get,has,list,validate});
  global.SHPFloorModuleRenderer=Object.freeze({VERSION,render,select,clear});
})(window);
