/*
M.S.6 — SHP 3D ROOM RUNTIME PLACEHOLDER

Replace the placeholder visuals below with the room's existing Three.js/WebGL
runtime. Keep this public surface so index.html can manage navigation/lifecycle
without knowing how the room is implemented.

Required:
  init(context)

Recommended:
  pause(reason)
  resume(reason)
  resetPosition(spawnId)
  dispose()

Context passed to init:
  context.host        DOM element that owns the 3D canvas
  context.roomId      canonical room ID
  context.config      ROOM_3D_CONFIG
  context.entry       { source, spawnId }
  context.navigation  { sendToParent(type, detail) }
  context.setStatus   status overlay helper
*/
(function(){
  let host = null;
  let placeholder = null;
  let paused = false;

  function init(context){
    host = context.host;
    placeholder = document.createElement("div");
    placeholder.style.cssText = [
      "position:absolute","inset:0","display:grid","place-items:center",
      "background:linear-gradient(135deg,#0d1624,#17283a 55%,#07111f)",
      "color:#dcecff","font-family:Arial,Helvetica,sans-serif","text-align:center"
    ].join(";");
    placeholder.innerHTML = '<div><div style="font-size:26px;font-weight:900;margin-bottom:10px">'+
      escapeHtml(context.config.title || "3D Room")+
      '</div><div style="max-width:560px;line-height:1.5;color:#aebed0">M.S.6 runtime contract is active. Replace <code>world.js</code> with this room’s lightweight Three.js/WebGL implementation.</div></div>';
    host.appendChild(placeholder);
  }

  function pause(){ paused = true; }
  function resume(){ paused = false; }
  function resetPosition(spawnId){
    console.info("SHP 3D template resetPosition", spawnId || "default");
  }
  function dispose(){
    if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
    placeholder = null;
    host = null;
  }
  function escapeHtml(value){
    return String(value).replace(/[&<>\"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
  }

  window.SHP3DRoomRuntime = { init, pause, resume, resetPosition, dispose, get paused(){ return paused; } };
})();
