/*
 * Safe Havens Peak Map — M.F.2 Shared Floor Contract
 * Classic script on purpose: compatible with direct file:// testing.
 * Floor artwork/layout remains owned by each floor HTML file.
 */
(function(global){
  'use strict';
  const VERSION='1.0.0';
  const TO_SHELL=Object.freeze({
    READY:'MAP_FLOOR_READY',
    SELECTED:'MAP_FLOOR_SELECTED',
    RESET_PANEL:'MAP_FLOOR_RESET_PANEL',
    ACTION:'MAP_FLOOR_REQUEST_ACTION'
  });
  const TO_FLOOR=Object.freeze({
    SELECT:'MAP_FLOOR_SELECT',
    CLEAR_SELECTION:'MAP_FLOOR_CLEAR_SELECTION',
    ACTIVATE:'MAP_FLOOR_ACTIVATE'
  });
  const VALID_STATUS=new Set(['open','restricted','locked','occupied','pending','directory']);
  function cloneRoom(room){
    if(!room||typeof room!=='object')return null;
    const copy=Object.assign({},room);
    if(!copy.name)return null;
    if(copy.roomId==null&&copy.id!=null)copy.roomId=copy.id;
    return copy;
  }
  function normalizeRooms(rooms){return Array.isArray(rooms)?rooms.map(cloneRoom).filter(Boolean):[];}
  function normalizeMeta(meta,floor){
    meta=meta&&typeof meta==='object'?meta:{};
    return {
      id:String(meta.id||floor||''),
      label:String(meta.label||meta.name||floor||''),
      description:String(meta.description||''),
      status:String(meta.status||'Open'),
      contractVersion:VERSION
    };
  }
  function emit(type,floor,extra){
    if(!floor)throw new Error('[SHP Map Floor Contract] floor id is required');
    const payload=Object.assign({type,floor,contractVersion:VERSION},extra||{});
    if(global.parent&&global.parent!==global)global.parent.postMessage(payload,'*');
    return payload;
  }
  function ready(floor,{rooms=[],description='',status='Open',meta={}}={}){
    const m=normalizeMeta(Object.assign({},meta,{description:meta.description||description,status:meta.status||status}),floor);
    return emit(TO_SHELL.READY,floor,{rooms:normalizeRooms(rooms),description:m.description,status:m.status,meta:m});
  }
  function selected(floor,room){const r=cloneRoom(room); if(!r)return null; return emit(TO_SHELL.SELECTED,floor,{room:r});}
  function resetPanel(floor,{description='',status=null}={}){return emit(TO_SHELL.RESET_PANEL,floor,{description,status});}
  function requestAction(floor,action,payload={}){return emit(TO_SHELL.ACTION,floor,{action,payload});}
  function isCommand(message,type,floor){return !!message&&typeof message==='object'&&message.type===type&&(!floor||message.floor===floor);}
  global.SHPMapFloorContract=Object.freeze({
    VERSION,TO_SHELL,TO_FLOOR,normalizeRooms,normalizeMeta,emit,ready,selected,resetPanel,requestAction,isCommand
  });
})(window);
