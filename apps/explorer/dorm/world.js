import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const data = await fetch('./data/dorm-floor.json').then(r => {
  if (!r.ok) throw new Error(`Could not load floor data (${r.status})`);
  return r.json();
});

const S = data.worldScale;
const mapToWorld = (x, y) => ({ x: (x - data.mapWidth / 2) * S, z: (y - data.mapHeight / 2) * S });
const worldToMap = (x, z) => ({ x: x / S + data.mapWidth / 2, y: z / S + data.mapHeight / 2 });

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a1422);
scene.fog = new THREE.Fog(0x0a1422, 20, 72);
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 150);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.prepend(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
controls.pointerSpeed = 0.8;
const menu = document.getElementById('menu');
const prompt = document.getElementById('prompt');
const sceneOverlay = document.getElementById('scene');
const sceneBody = document.getElementById('sceneBody');
const minimap = document.getElementById('minimap');
const miniCtx = minimap.getContext('2d');
const keys = new Set();
let activeDoor = null;
let roomOpen = false;
const STATE_KEY='shpDormExplorerStateV4';

function resetPosition() {
  setSpawnFromData();
  localStorage.removeItem(STATE_KEY);
}
function savePosition() {
  localStorage.setItem(STATE_KEY, JSON.stringify({x:camera.position.x,y:camera.position.y,z:camera.position.z,ry:camera.rotation.y}));
}
function restorePosition() {
  try {
    const s=JSON.parse(localStorage.getItem(STATE_KEY));
    if(s && Number.isFinite(s.x)){camera.position.set(s.x,s.y,s.z);camera.rotation.set(0,s.ry||0,0);return;}
  } catch {}
  resetPosition();
}
restorePosition();

scene.add(new THREE.HemisphereLight(0xa9dfff, 0x1b2635, 1.65));

// Dorm hallway artwork supplied for the prototype.  Each wall segment receives
// its own texture clone so the full wall height is preserved while the artwork
// repeats horizontally.  Corridor floors use the same idea, with the artwork
// rotated on vertical branches so its purple border remains along the hallway
// edges instead of running across the walking path.
const textureLoader = new THREE.TextureLoader();
function loadColorTexture(path){
  const t=textureLoader.load(path);
  t.colorSpace=THREE.SRGBColorSpace;
  t.wrapS=THREE.RepeatWrapping;
  t.wrapT=THREE.RepeatWrapping;
  t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  return t;
}
const dormFloorTexture=loadColorTexture('./assets/textures/dorm-floor.png');
const dormWallTexture=loadColorTexture('./assets/textures/dorm-wall.png');

function floorMaterialFor(hall){
  const horizontal=hall.w>=hall.h;
  const longSide=horizontal?hall.w:hall.h;
  const shortSide=horizontal?hall.h:hall.w;
  const t=dormFloorTexture.clone();
  t.needsUpdate=true;
  t.center.set(.5,.5);
  if(horizontal){
    t.repeat.set(Math.max(1,longSide/(Math.max(shortSide,.01)*2)),1);
  }else{
    t.rotation=Math.PI/2;
    t.repeat.set(Math.max(1,longSide/(Math.max(shortSide,.01)*2)),1);
  }
  return new THREE.MeshStandardMaterial({map:t,color:0xffffff,roughness:.72,metalness:.03});
}
function wallMaterialFor(length){
  const t=dormWallTexture.clone();
  t.needsUpdate=true;
  // The source wall artwork is 2:1.  One undistorted tile therefore spans
  // roughly twice the wall height before repeating along longer wall runs.
  t.repeat.set(Math.max(1,length/(data.height*2)),1);
  return new THREE.MeshStandardMaterial({map:t,color:0xffffff,roughness:.78,metalness:.02});
}

const ceilingMat = new THREE.MeshStandardMaterial({color:0xaebdca,roughness:.9});
const trimMat = new THREE.MeshStandardMaterial({color:0x27475d,roughness:.7});
const doorMat = new THREE.MeshStandardMaterial({color:0x50352b,roughness:.65});
const jaceyDoorTexture = new THREE.TextureLoader().load('./assets/textures/jacey-door.webp');
jaceyDoorTexture.colorSpace=THREE.SRGBColorSpace;
const jaceyDoorMat = new THREE.MeshLambertMaterial({map:jaceyDoorTexture,color:0xffffff});
const stairMat = new THREE.MeshStandardMaterial({color:0x263746,roughness:.8});
const lightMat = new THREE.MeshStandardMaterial({color:0xeaf8ff,emissive:0xcceeff,emissiveIntensity:2});

function box(w,h,d,mat,x,y,z){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);m.receiveShadow=true;m.castShadow=true;scene.add(m);return m;
}

// Floor and ceiling follow the same hallway footprint as the Dorms map.
// At corridor junctions, do not stack two coplanar floor meshes on top of
// each other: that caused z-fighting/clipping where the connector met the
// horizontal halls.  The connector is trimmed to the open span between the
// upper and main halls, while the horizontal halls own the junction squares.
function visibleFloorSegment(hall){
  if(hall.id !== 'connector') return {...hall};

  const upper = data.corridors.find(c => c.id === 'upper-hall');
  const main = data.corridors.find(c => c.id === 'main-hall');
  if(!upper || !main) return {...hall};

  const startY = upper.y + upper.h;
  const endY = main.y;
  return {
    ...hall,
    y: startY,
    h: Math.max(0, endY - startY)
  };
}

for (const hall of data.corridors) {
  const floorHall = visibleFloorSegment(hall);
  if(floorHall.w > 0 && floorHall.h > 0){
    const fc = mapToWorld(floorHall.x + floorHall.w/2, floorHall.y + floorHall.h/2);
    box(floorHall.w*S,.18,floorHall.h*S,floorMaterialFor(floorHall),fc.x,0,fc.z);
  }

  // Ceilings are high enough that coplanar floor z-fighting is irrelevant,
  // so retain the original coverage there.
  const cc = mapToWorld(hall.x + hall.w/2, hall.y + hall.h/2);
  box(hall.w*S,.16,hall.h*S,ceilingMat,cc.x,data.height,cc.z);
}

// Exterior walls follow the exact union outline of those rectangles.
// The south wall of the main dorm hall is split around the stairwell opening
// directly opposite Tyler's door, so the stairs are actually visible from the hall.
function addWallSegment(mx1,my1,mx2,my2){
  const a=mapToWorld(mx1,my1), b=mapToWorld(mx2,my2);
  const dx=b.x-a.x, dz=b.z-a.z;
  const length=Math.hypot(dx,dz);
  if(length<.02)return;
  const cx=(a.x+b.x)/2, cz=(a.z+b.z)/2;
  const wall=box(length,.001,.001,wallMaterialFor(length),cx,data.height/2,cz);
  wall.geometry.dispose();
  wall.geometry=new THREE.BoxGeometry(length,data.height,.18);
  wall.rotation.y=-Math.atan2(dz,dx);
  const trim=box(length,.22,.10,trimMat,cx,.12,cz);
  trim.rotation.y=wall.rotation.y;
}
for(let i=0;i<data.outline.length;i++){
  const [ax,ay]=data.outline[i], [bx,by]=data.outline[(i+1)%data.outline.length];
  const isStairWall=Math.abs(ay-data.stairs.y)<.001 && Math.abs(by-data.stairs.y)<.001;
  if(isStairWall){
    const lo=Math.min(ax,bx), hi=Math.max(ax,bx);
    const sx=data.stairs.x, ex=data.stairs.x+data.stairs.w;
    if(lo<sx)addWallSegment(lo,ay,Math.min(sx,hi),ay);
    if(hi>ex)addWallSegment(Math.max(ex,lo),ay,hi,ay);
  }else{
    addWallSegment(ax,ay,bx,by);
  }
}

// Ceiling lights distributed along each branch.
for (const hall of data.corridors) {
  const horizontal = hall.w >= hall.h;
  const span = horizontal ? hall.w : hall.h;
  const count = Math.max(1, Math.floor(span / 12));
  for(let i=0;i<=count;i++){
    const t=(i+.5)/(count+1);
    const mx=horizontal?hall.x+hall.w*t:hall.x+hall.w/2;
    const my=horizontal?hall.y+hall.h/2:hall.y+hall.h*t;
    const p=mapToWorld(mx,my);
    const light=new THREE.PointLight(0xf4fbff,2.8,14,2);light.position.set(p.x,data.height-.35,p.z);scene.add(light);
    box(horizontal?1.4:.5,.06,horizontal?.5:1.4,lightMat,p.x,data.height-.12,p.z);
  }
}

function labelTexture(text){
  const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');
  ctx.fillStyle='#07111f';ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle='#9be7ff';ctx.lineWidth=6;ctx.strokeRect(3,3,c.width-6,c.height-6);
  ctx.fillStyle='#fff';ctx.font='bold 48px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,65);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

function nearestDoor(room){
  const cx=room.x+room.w/2, cy=room.y+room.h/2;
  const candidates=[];
  for(const hall of data.corridors){
    const hx1=hall.x, hx2=hall.x+hall.w, hy1=hall.y, hy2=hall.y+hall.h;
    if(cx>=hx1&&cx<=hx2){
      candidates.push({side:'bottom',d:Math.abs(room.y+room.h-hy1),x:cx,y:hy1,normal:[0,-1],axis:'x'});
      candidates.push({side:'top',d:Math.abs(room.y-hy2),x:cx,y:hy2,normal:[0,1],axis:'x'});
    }
    if(cy>=hy1&&cy<=hy2){
      candidates.push({side:'right',d:Math.abs(room.x+room.w-hx1),x:hx1,y:cy,normal:[-1,0],axis:'y'});
      candidates.push({side:'left',d:Math.abs(room.x-hx2),x:hx2,y:cy,normal:[1,0],axis:'y'});
    }
  }
  // Some corner rooms touch two corridors. Their source-map doorway is on the
  // room's short end, so an explicit side prevents the nearest corridor edge
  // from rotating the door onto the long wall.
  if(room.doorSide){
    const forced=candidates.filter(c=>c.side===room.doorSide).sort((a,b)=>a.d-b.d)[0];
    if(forced)return forced;
  }
  return candidates.sort((a,b)=>a.d-b.d)[0];
}

const doors=[];
for(const room of data.rooms){
  const d=nearestDoor(room);
  const horizontalWall=d.axis==='x';

  // Place the visible panel just inside the corridor. The perimeter wall remains
  // continuous for collision, but no longer covers the door and its name sign.
  const panelInsetMap=.34;
  const panelPoint=mapToWorld(
    d.x-d.normal[0]*panelInsetMap,
    d.y-d.normal[1]*panelInsetMap
  );
  const activeDoorMat = room.name==='Jacey' ? jaceyDoorMat : doorMat;
  const door=box(
    horizontalWall?1.35:.12,
    2.35,
    horizontalWall?.12:1.35,
    activeDoorMat,
    panelPoint.x,
    1.175,
    panelPoint.z
  );

  // A slightly larger frame makes each doorway easy to identify at a distance.
  const frame=box(
    horizontalWall?1.55:.06,
    2.55,
    horizontalWall?.06:1.55,
    trimMat,
    panelPoint.x,
    1.275,
    panelPoint.z
  );
  frame.renderOrder=1;
  door.renderOrder=2;

  const sign=new THREE.Mesh(
    new THREE.PlaneGeometry(1.25,.32),
    new THREE.MeshBasicMaterial({map:labelTexture(room.name),depthTest:true})
  );
  const signOffset=.075;
  if(horizontalWall){
    sign.position.set(panelPoint.x,2.78,panelPoint.z-d.normal[1]*signOffset);
    sign.rotation.y=d.normal[1]<0?0:Math.PI;
  } else {
    sign.position.set(panelPoint.x-d.normal[0]*signOffset,2.78,panelPoint.z);
    sign.rotation.y=d.normal[0]<0?Math.PI/2:-Math.PI/2;
  }
  scene.add(sign);

  const inside=mapToWorld(d.x-d.normal[0]*1.7,d.y-d.normal[1]*1.7);
  doors.push({room,position:new THREE.Vector3(inside.x,1.5,inside.z)});
}

// Dorm-wing stairwell: centered directly across from Tyler's dorm door.
// The wall is open here and the treads descend below hallway floor level.
const stairCount=8;
const stairDepth=(data.stairs.h*S)/stairCount;
const stairCenterX=data.stairs.x+data.stairs.w/2;
const stairStart=mapToWorld(stairCenterX,data.stairs.y);
for(let i=0;i<stairCount;i++){
  const mapY=data.stairs.y+(i+.5)*(data.stairs.h/stairCount);
  const p=mapToWorld(stairCenterX,mapY);
  const topY=-i*.12;
  const treadHeight=.16;
  box(data.stairs.w*S,treadHeight,stairDepth+.025,stairMat,p.x,topY-treadHeight/2,p.z);
}
// Cheap stairwell enclosure: two side walls and a dark lower landing/back wall.
const stairMid=mapToWorld(stairCenterX,data.stairs.y+data.stairs.h/2);
const stairLeft=mapToWorld(data.stairs.x,data.stairs.y+data.stairs.h/2);
const stairRight=mapToWorld(data.stairs.x+data.stairs.w,data.stairs.y+data.stairs.h/2);
const stairRun=data.stairs.h*S;
const stairWallH=data.height+1.4;
for(const side of [stairLeft,stairRight]){
  box(.16,stairWallH,stairRun,wallMaterialFor(stairRun),side.x,.7,stairMid.z);
}
const stairBack=mapToWorld(stairCenterX,data.stairs.y+data.stairs.h);
box(data.stairs.w*S,stairWallH,.16,wallMaterialFor(data.stairs.w*S),stairBack.x,.7,stairBack.z);
const lowerLanding=box(data.stairs.w*S,.12,1.3*S,stairMat,stairBack.x,-.92,stairBack.z-.65*S);
const stairSign=new THREE.Mesh(new THREE.PlaneGeometry(2.2,.55),new THREE.MeshBasicMaterial({map:labelTexture('STAIRS DOWN')}));
stairSign.position.set(stairStart.x,2.25,stairStart.z-.10);
stairSign.rotation.y=Math.PI;
scene.add(stairSign);

const move={speed:5.4,radius:.42};
function mapPointInCorridor(x,y){
  return data.corridors.some(h=>x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h);
}
function insideCorridor(pos){
  const m=worldToMap(pos.x,pos.z), r=move.radius/S;
  // Test the player's collision circle against the UNION of all corridor
  // rectangles. Shrinking each rectangle independently created invisible
  // barriers exactly where the middle connector joins the other hallways.
  const samples=[
    [0,0],[r,0],[-r,0],[0,r],[0,-r],
    [r*.707,r*.707],[r*.707,-r*.707],[-r*.707,r*.707],[-r*.707,-r*.707]
  ];
  return samples.every(([dx,dy])=>mapPointInCorridor(m.x+dx,m.y+dy));
}
window.addEventListener('keydown',e=>{keys.add(e.code);if(e.code==='KeyE'&&activeDoor&&!roomOpen)openRoom(activeDoor.room)});
window.addEventListener('keyup',e=>keys.delete(e.code));
controls.addEventListener('lock',()=>menu.classList.add('hidden'));
controls.addEventListener('unlock',()=>{if(!roomOpen)menu.classList.remove('hidden');savePosition()});
document.getElementById('start').onclick=()=>{
  // Embedded handbook mode can briefly reject/delay Pointer Lock even though
  // the click itself is valid. Enter the world immediately so the control
  // never appears dead; mouse capture can succeed on this click or the next
  // click on the 3D canvas.
  menu.classList.add('hidden');
  try{
    const result=controls.lock();
    if(result&&typeof result.catch==='function'){
      result.catch(()=>{});
    }
  }catch(_){
    // Keep the hallway visible. A later canvas click can request capture.
  }
};
renderer.domElement.addEventListener('click',()=>{
  if(!roomOpen&&!controls.isLocked){
    try{
      const result=controls.lock();
      if(result&&typeof result.catch==='function')result.catch(()=>{});
    }catch(_){}
  }
});
document.getElementById('reset').onclick=()=>{resetPosition();if(!controls.isLocked&&!roomOpen)controls.lock()};
function leaveRoom(){roomOpen=false;sceneOverlay.classList.remove('open');sceneBody.innerHTML='';controls.lock();}
document.getElementById('leave').onclick=leaveRoom;
window.addEventListener('message',event=>{if(event.data?.type==='shp:explorer-leave-room')leaveRoom()});
function openRoom(room){
  roomOpen=true;controls.unlock();menu.classList.add('hidden');sceneOverlay.classList.add('open');
  const destination=room.entry||room.sceneHtml||null;
  if(destination){
    const frame=document.createElement('iframe');
    frame.className='room-frame';
    const separator=destination.includes('?')?'&':'?';
    frame.src=`${destination}${separator}mode=explorer`;
    frame.title=`${room.name}'s dorm room`;
    frame.dataset.roomId=room.roomId||room.id||'';
    frame.setAttribute('allow','fullscreen');
    sceneBody.replaceChildren(frame);
  }else{
    sceneBody.innerHTML=`<div class="placeholder-room"><div><h2>${room.name}'s Dorm</h2><p>No interactive room layout exists for this student in the room registry yet.</p></div></div>`;
  }
}

function drawMinimap(){
  const w=minimap.width,h=minimap.height,sx=w/data.mapWidth,sy=h/data.mapHeight;
  miniCtx.clearRect(0,0,w,h);miniCtx.fillStyle='#07111fe8';miniCtx.fillRect(0,0,w,h);
  miniCtx.fillStyle='#8fc6df';for(const c of data.corridors)miniCtx.fillRect(c.x*sx,c.y*sy,c.w*sx,c.h*sy);
  miniCtx.fillStyle='#dce9f0';for(const r of data.rooms)miniCtx.fillRect(r.x*sx,r.y*sy,r.w*sx,r.h*sy);
  miniCtx.fillStyle='#263746';miniCtx.fillRect(data.stairs.x*sx,data.stairs.y*sy,data.stairs.w*sx,data.stairs.h*sy);
  const p=worldToMap(camera.position.x,camera.position.z);miniCtx.fillStyle='#e63b53';miniCtx.beginPath();miniCtx.arc(p.x*sx,p.y*sy,4,0,Math.PI*2);miniCtx.fill();
  const dx=-Math.sin(camera.rotation.y)*9,dy=-Math.cos(camera.rotation.y)*9;miniCtx.strokeStyle='#fff';miniCtx.lineWidth=2;miniCtx.beginPath();miniCtx.moveTo(p.x*sx,p.y*sy);miniCtx.lineTo((p.x+dx)*sx,(p.y+dy)*sy);miniCtx.stroke();
  miniCtx.strokeStyle='#ffffff55';miniCtx.strokeRect(.5,.5,w-1,h-1);
}


// --- Lightweight layout editor -------------------------------------------------
const editor = document.getElementById('editor');
const editorCanvas = document.getElementById('editorCanvas');
const ectx = editorCanvas.getContext('2d');
const editorStatus = document.getElementById('editorStatus');
let editorOpen = false;
let selectedPoint = null;
let draggingPoint = null;
const originalEditorData = JSON.parse(JSON.stringify({spawns:data.spawns,navNodes:data.navNodes}));

function activeSpawn(){
  const key=data.defaultSpawn || Object.keys(data.spawns||{})[0];
  return {key, value:data.spawns[key]};
}
function validMapPoint(x,y,pad=1){
  return data.corridors.some(h=>x>=h.x+pad&&x<=h.x+h.w-pad&&y>=h.y+pad&&y<=h.y+h.h-pad);
}
function nearestValidMapPoint(x,y){
  let best=null;
  for(const h of data.corridors){
    const px=Math.max(h.x+1,Math.min(h.x+h.w-1,x));
    const py=Math.max(h.y+1,Math.min(h.y+h.h-1,y));
    const d=(px-x)**2+(py-y)**2;
    if(!best||d<best.d)best={x:px,y:py,d};
  }
  return best;
}
function setSpawnFromData(){
  const sp=activeSpawn().value;
  const p=mapToWorld(sp.mapX,sp.mapY);
  camera.position.set(p.x,1.7,p.z);
  camera.rotation.set(0,sp.yaw||0,0);
}
function editorCoords(evt){
  const r=editorCanvas.getBoundingClientRect();
  return {x:(evt.clientX-r.left)/r.width*data.mapWidth,y:(evt.clientY-r.top)/r.height*data.mapHeight};
}
function pointScreen(x,y){return {x:x/data.mapWidth*editorCanvas.width,y:y/data.mapHeight*editorCanvas.height};}
function hitPoint(m){
  const candidates=[];
  const sp=activeSpawn(); candidates.push({type:'spawn',key:sp.key,obj:sp.value});
  for(const n of data.navNodes||[])candidates.push({type:'node',key:n.id,obj:n});
  let best=null;
  for(const c of candidates){
    const dx=c.obj.mapX-m.x,dy=c.obj.mapY-m.y,d=Math.hypot(dx,dy);
    if(d<2.4&&(!best||d<best.d))best={...c,d};
  }
  return best;
}
function drawEditor(){
  const sx=editorCanvas.width/data.mapWidth, sy=editorCanvas.height/data.mapHeight;
  ectx.clearRect(0,0,editorCanvas.width,editorCanvas.height);
  ectx.fillStyle='#07111f';ectx.fillRect(0,0,editorCanvas.width,editorCanvas.height);
  ectx.fillStyle='#8fc6df';for(const c of data.corridors)ectx.fillRect(c.x*sx,c.y*sy,c.w*sx,c.h*sy);
  ectx.fillStyle='#dce9f0';for(const r of data.rooms){ectx.fillRect(r.x*sx,r.y*sy,r.w*sx,r.h*sy);ectx.fillStyle='#22384a';ectx.font='18px Arial';ectx.textAlign='center';ectx.fillText(r.name,(r.x+r.w/2)*sx,(r.y+r.h/2)*sy);ectx.fillStyle='#dce9f0';}
  ectx.fillStyle='#263746';ectx.fillRect(data.stairs.x*sx,data.stairs.y*sy,data.stairs.w*sx,data.stairs.h*sy);
  ectx.strokeStyle='#20465d';ectx.lineWidth=8;ectx.lineCap='round';
  const nodes=data.navNodes||[];
  for(let i=1;i<nodes.length;i++){
    const a=nodes[i-1],b=nodes[i];
    if(Math.hypot(a.mapX-b.mapX,a.mapY-b.mapY)<30){ectx.beginPath();ectx.moveTo(a.mapX*sx,a.mapY*sy);ectx.lineTo(b.mapX*sx,b.mapY*sy);ectx.stroke();}
  }
  for(const n of nodes){const p=pointScreen(n.mapX,n.mapY);ectx.fillStyle=selectedPoint?.obj===n?'#fff':'#59bfff';ectx.beginPath();ectx.arc(p.x,p.y,10,0,Math.PI*2);ectx.fill();ectx.strokeStyle='#07111f';ectx.lineWidth=3;ectx.stroke();}
  const sp=activeSpawn();const p=pointScreen(sp.value.mapX,sp.value.mapY);ectx.fillStyle=selectedPoint?.type==='spawn'?'#fff':'#59e391';ectx.beginPath();ectx.arc(p.x,p.y,13,0,Math.PI*2);ectx.fill();ectx.strokeStyle='#07111f';ectx.lineWidth=4;ectx.stroke();
  ectx.strokeStyle='#ffffff55';ectx.lineWidth=2;ectx.strokeRect(1,1,editorCanvas.width-2,editorCanvas.height-2);
  requestAnimationFrame(()=>{if(editorOpen)drawEditor();});
}
function updateEditorStatus(){
  if(!selectedPoint){editorStatus.textContent='No point selected.';return;}
  const o=selectedPoint.obj;
  editorStatus.textContent=`${selectedPoint.type.toUpperCase()}: ${selectedPoint.key}\nmapX: ${o.mapX.toFixed(2)}\nmapY: ${o.mapY.toFixed(2)}`;
}
function toggleEditor(force){
  editorOpen=force??!editorOpen;
  editor.classList.toggle('open',editorOpen);editor.setAttribute('aria-hidden',String(!editorOpen));
  if(editorOpen){controls.unlock();menu.classList.add('hidden');selectedPoint=null;updateEditorStatus();drawEditor();}
  else if(!roomOpen)controls.lock();
}
editorCanvas.addEventListener('pointerdown',e=>{
  const m=editorCoords(e),hit=hitPoint(m);
  if(hit){selectedPoint=hit;draggingPoint=hit;editorCanvas.setPointerCapture(e.pointerId);}
  else if(validMapPoint(m.x,m.y)){
    const id=`node-${Date.now().toString(36)}`;const n={id,mapX:m.x,mapY:m.y};(data.navNodes||(data.navNodes=[])).push(n);selectedPoint={type:'node',key:id,obj:n};draggingPoint=selectedPoint;
  }
  updateEditorStatus();
});
editorCanvas.addEventListener('pointermove',e=>{
  if(!draggingPoint)return;const m=editorCoords(e);const v=validMapPoint(m.x,m.y)?m:nearestValidMapPoint(m.x,m.y);draggingPoint.obj.mapX=v.x;draggingPoint.obj.mapY=v.y;updateEditorStatus();
});
editorCanvas.addEventListener('pointerup',()=>draggingPoint=null);
document.getElementById('editorClose').onclick=()=>toggleEditor(false);
document.getElementById('editorDelete').onclick=()=>{if(selectedPoint?.type==='node'){data.navNodes=data.navNodes.filter(n=>n!==selectedPoint.obj);selectedPoint=null;updateEditorStatus();}};
document.getElementById('editorReset').onclick=()=>{data.spawns=JSON.parse(JSON.stringify(originalEditorData.spawns));data.navNodes=JSON.parse(JSON.stringify(originalEditorData.navNodes));selectedPoint=null;updateEditorStatus();};
document.getElementById('editorExport').onclick=()=>{
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='dorm-floor.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};
window.addEventListener('keydown',e=>{if(e.code==='F2'){e.preventDefault();toggleEditor();}});

// Revalidate any saved position against the generated hallway.
if(!insideCorridor(camera.position)) resetPosition();

const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);
  if(controls.isLocked&&!roomOpen){
    const old=camera.position.clone(),amount=move.speed*dt;
    if(keys.has('KeyW'))controls.moveForward(amount);if(keys.has('KeyS'))controls.moveForward(-amount);if(keys.has('KeyA'))controls.moveRight(-amount);if(keys.has('KeyD'))controls.moveRight(amount);
    camera.position.y=1.7;if(!insideCorridor(camera.position))camera.position.copy(old);
    activeDoor=null;let best=2.15;for(const d of doors){const dist=camera.position.distanceTo(d.position);if(dist<best){best=dist;activeDoor=d;}}
    if(activeDoor){prompt.textContent=`[ E ] Enter ${activeDoor.room.name}'s Dorm`;prompt.classList.add('show');}else prompt.classList.remove('show');
  }else prompt.classList.remove('show');
  drawMinimap();renderer.render(scene,camera);
}
animate();
setInterval(()=>{if(controls.isLocked)savePosition()},2500);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
