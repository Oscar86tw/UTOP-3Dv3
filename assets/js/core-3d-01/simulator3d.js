import {state} from '../state.js';
import {devices} from '../data.js';
import {getSceneProfile,floorVisible,groupVisible,groupOpacity,addViewpoint} from '../core-project-01/project-controls.js';
import {getDeviceTransform,updateDeviceTransform,floorElevation,selectDevice,setFloorFocus,setEditorMode as saveEditorMode} from '../core-editor-01/editor-commands.js';
import {getSettings,defaultSettings,updateRuntime,getRuntime} from '../core-module-01/module-manager.js';
import {traceNetwork} from '../core-signal-01/signal-trace.js';

let active=null;
const THREE_SOURCES=[
  {name:'本地 Three.js',url:'../../vendor/three/three.module.min.js'},
  {name:'unpkg（V5參考來源）',url:'https://unpkg.com/three@0.180.0/build/three.module.js'},
  {name:'jsDelivr',url:'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js'},
  {name:'esm.sh',url:'https://esm.sh/three@0.180.0'}
];
function setText(id,text){const el=document.getElementById(id);if(el)el.textContent=text;}
function showToast(text){const el=document.getElementById('simToast');if(!el)return;el.textContent=text;el.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>el.classList.remove('show'),1500);}
async function loadThree(){
  const errors=[];
  for(const source of THREE_SOURCES){
    try{
      setText('threeLoading',`正在載入 3D 核心：${source.name}…`);
      const mod=await import(source.url);
      if(mod?.Scene&&mod?.WebGLRenderer)return {THREE:mod,source:source.name};
      throw new Error('模組內容不完整');
    }catch(err){
      console.warn(`[UTOP-3D] ${source.name} 載入失敗`,err);
      errors.push(`${source.name}: ${err?.message||err}`);
    }
  }
  const error=new Error('所有 Three.js 來源皆載入失敗');
  error.details=errors;
  throw error;
}
export function unmountSimulator3D(){if(!active)return;active.destroy();active=null;}
export async function mountSimulator3D(callbacks={}){
  unmountSimulator3D();const host=document.getElementById('threeStage');if(!host)return null;setText('threeLoading','正在載入 Three.js 3D Editor…');
  try{
    const loaded=await loadThree();
    if(!document.getElementById('threeStage'))return null;
    active=createSimulator(loaded.THREE,host,callbacks);
    setText('simStatus',`3D READY · ${loaded.source}`);
    return active;
  }catch(err){
    console.error(err);
    const details=(err.details||[]).map(x=>`<li>${String(x).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}</li>`).join('');
    host.innerHTML=`<div class="three-error"><b>3D 核心載入失敗</b><br>已依序嘗試本地、unpkg、jsDelivr、esm.sh。<ul class="three-error-list">${details}</ul><small>其他 UTOP 功能仍可使用。</small></div>`;
    setText('simStatus','3D OFFLINE');return null;
  }
}
function createSimulator(THREE,host,callbacks){
  host.innerHTML='';
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0xbdd7e5);scene.fog=new THREE.Fog(0xbdd7e5,45,100);
  const camera=new THREE.PerspectiveCamera(55,1,.1,240);
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);

  const hemi=new THREE.HemisphereLight(0xffffff,0x4d5962,1.8);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffffff,2.6);sun.position.set(18,22,14);sun.castShadow=true;scene.add(sun);

  const mats={
    ground:new THREE.MeshStandardMaterial({color:0x9caf84,roughness:1}),
    road:new THREE.MeshStandardMaterial({color:0x42464a,roughness:.92}),
    white:new THREE.MeshStandardMaterial({color:0xf1f1e8,roughness:.75}),
    orange:new THREE.MeshStandardMaterial({color:0xf59e0b,roughness:.55,metalness:.12}),
    blue:new THREE.MeshStandardMaterial({color:0x476f91,roughness:.5,metalness:.1}),
    dark:new THREE.MeshStandardMaterial({color:0x23292e,roughness:.85}),
    building:new THREE.MeshStandardMaterial({color:0xe8dfcf,roughness:.9}),
    floor:new THREE.MeshStandardMaterial({color:0xb7b7b0,roughness:1,transparent:true,opacity:.58}),
    ramp:new THREE.MeshStandardMaterial({color:0x565a5e,roughness:.95}),
    green:new THREE.MeshStandardMaterial({color:0x16a34a,roughness:.45}),
    red:new THREE.MeshStandardMaterial({color:0xdc2626,roughness:.45}),
    gray:new THREE.MeshStandardMaterial({color:0x7a7f86,roughness:.8})
  };

  const floorGroups={},roadObjects=[],deviceRoots={},selectables=[];
  function floorGroup(id){if(floorGroups[id])return floorGroups[id];const g=new THREE.Group();g.name='FLOOR_'+id;g.position.y=floorElevation(id);scene.add(g);floorGroups[id]=g;return g;}
  function addFloorSlab(id,w=26,d=44){const g=floorGroup(id);const slab=new THREE.Mesh(new THREE.BoxGeometry(w,.24,d),mats.floor.clone());slab.position.y=-.18;slab.receiveShadow=true;slab.userData.layer='road';g.add(slab);return slab;}
  addFloorSlab('1F',30,48);addFloorSlab('B1',28,46);addFloorSlab('B2',28,46);
  ['1F','B1','B2'].forEach(id=>{const g=floorGroup(id);const road=new THREE.Mesh(new THREE.BoxGeometry(8,.14,38),mats.road);road.position.y=.02;road.receiveShadow=true;road.userData.layer='road';g.add(road);roadObjects.push(road);for(let z=-16;z<=16;z+=4){const d=new THREE.Mesh(new THREE.BoxGeometry(.13,.03,2),mats.white);d.position.set(0,.11,z);d.userData.layer='road';g.add(d);roadObjects.push(d);}});
  function rampBetween(fromId,toId,z=20){const from=floorElevation(fromId),to=floorElevation(toId),rise=to-from,len=13;const angle=Math.asin(Math.min(.99,Math.abs(rise)/len));const mid=(from+to)/2;const ramp=new THREE.Mesh(new THREE.BoxGeometry(8,.22,len),mats.ramp);ramp.position.set(0,mid,z);ramp.rotation.x=(rise<0?angle:-angle);ramp.receiveShadow=true;ramp.userData.layer='road';scene.add(ramp);roadObjects.push(ramp);}
  rampBetween('1F','B1',20);rampBetween('B1','B2',6);
  const guard=new THREE.Group();const guardBody=new THREE.Mesh(new THREE.BoxGeometry(4,3.1,4),mats.building);guardBody.position.y=1.55;guardBody.castShadow=true;guardBody.receiveShadow=true;const roof=new THREE.Mesh(new THREE.BoxGeometry(4.4,.25,4.4),mats.dark);roof.position.y=3.22;guard.add(guardBody,roof);guard.position.set(-6,0,-1);guard.userData.layer='building';floorGroup('1F').add(guard);

  const car=new THREE.Group();const carBody=new THREE.Mesh(new THREE.BoxGeometry(2.05,.7,4.15),mats.blue);carBody.position.y=.72;carBody.castShadow=true;const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.6,.62,1.9),mats.dark);cabin.position.set(0,1.3,-.2);car.add(carBody,cabin);car.position.set(0,0,15);car.rotation.y=0;floorGroup('1F').add(car);car.userData.layer='vehicle';

  const signalGroup=new THREE.Group();signalGroup.userData.layer='signals';floorGroup('1F').add(signalGroup);

  function markSelectable(root,id){root.userData.deviceId=id;root.traverse(n=>{n.userData.deviceId=id;});selectables.push(root);deviceRoots[id]=root;return root;}
  function basicPole(colorMat){const pole=new THREE.Mesh(new THREE.BoxGeometry(.18,3,.18),mats.dark);pole.position.y=1.5;const head=new THREE.Mesh(new THREE.BoxGeometry(.85,.5,.65),colorMat||mats.blue);head.position.set(0,3,.05);const g=new THREE.Group();g.add(pole,head);return g;}
  function createDeviceRoot(device){
    const type=(device.type||'').toLowerCase();
    const root=new THREE.Group();
    const addBox=(w,h,d,material,x=0,y=h/2,z=0)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;};
    const addPole=(h=2.5,x=0,z=0)=>addBox(.12,h,.12,mats.dark,x,h/2,z);
    if(type==='barrier'){
      const cabinet=addBox(.34,1.03,.28,mats.orange,0,.515,0);root.userData.body=cabinet;
      const door=addBox(.25,.55,.015,mats.dark,0,.46,.148);root.userData.serviceDoor=door;
      const pivot=new THREE.Group();pivot.position.set(-.14,.88,0);const arm=new THREE.Mesh(new THREE.BoxGeometry(2.5,.10,.10),mats.white);arm.position.x=-1.23;arm.castShadow=true;pivot.add(arm);root.add(pivot);root.userData.barrierPivot=pivot;root.userData.barrierArm=arm;
    }else if(type==='uhf'){
      addPole(2.35);const reader=addBox(.23,.23,.06,mats.orange,0,2.30,.04);root.userData.reader=reader;
      const zone=new THREE.Mesh(new THREE.ConeGeometry(2.5,5.5,28,1,true),new THREE.MeshBasicMaterial({color:0xffa51d,transparent:true,opacity:.13,side:THREE.DoubleSide,depthWrite:false}));zone.rotation.x=Math.PI/2;zone.position.set(0,2.2,-2.7);root.add(zone);root.userData.zone=zone;
    }else if(type==='loop'){
      const zoneMat=new THREE.MeshBasicMaterial({color:0xf3c53f,transparent:true,opacity:.18,side:THREE.DoubleSide,depthWrite:false});const zone=new THREE.Mesh(new THREE.BoxGeometry(2,.035,1),zoneMat);zone.position.y=.08;root.add(zone);const edges=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2,.04,1)),new THREE.LineBasicMaterial({color:0xffcf39}));edges.position.y=.08;root.add(edges);root.userData.zone=zone;root.userData.zoneMat=zoneMat;root.userData.zoneEdges=edges;
    }else if(type==='loopdetector'){
      const body=addBox(.65,.85,.35,mats.dark);const lamp=addBox(.10,.10,.02,mats.green,0,.66,.19);root.userData.statusLamp=lamp;
    }else if(type==='infrared'){
      const tx=addBox(.12,.72,.12,mats.dark,-1.1,.36,0),rx=addBox(.12,.72,.12,mats.dark,1.1,.36,0);const beam=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,2.2,10),new THREE.MeshBasicMaterial({color:0xff3b30,transparent:true,opacity:.48}));beam.rotation.z=Math.PI/2;beam.position.y=.42;root.add(beam);root.userData.beam=beam;root.userData.tx=tx;root.userData.rx=rx;
    }else if(type==='radar'){
      addPole(1.8);const panel=addBox(.34,.24,.10,mats.blue,0,1.72,.04);root.userData.radarPanel=panel;
    }else if(type==='lpr'){
      addPole(2.2);const cameraBox=addBox(.55,.25,.32,mats.blue,0,2.12,0);const lens=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.12,18),mats.dark);lens.rotation.x=Math.PI/2;lens.position.set(0,2.12,.20);root.add(lens);root.userData.cameraBody=cameraBox;
    }else if(type==='cardreader'){
      addBox(.22,1.05,.22,mats.dark);const reader=addBox(.17,.26,.05,mats.gray,0,.82,.135);const lamp=addBox(.05,.04,.015,mats.green,0,.90,.17);root.userData.statusLamp=lamp;root.userData.reader=reader;
    }else if(type==='intercom'){
      addBox(.28,1.15,.28,mats.dark);const panel=addBox(.22,.38,.05,mats.gray,0,.84,.17);const call=addBox(.05,.05,.015,mats.red,0,.75,.205);root.userData.statusLamp=call;root.userData.panel=panel;
    }else if(type==='beacon'){
      addPole(1.2);const base=new THREE.Mesh(new THREE.CylinderGeometry(.14,.16,.10,20),mats.dark);base.position.y=1.20;root.add(base);const lamp=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.26,20),mats.orange.clone());lamp.position.y=1.38;root.add(lamp);root.userData.beaconLamp=lamp;
    }else if(type==='estop'){
      addBox(.22,.55,.22,mats.gray);const mushroom=new THREE.Mesh(new THREE.CylinderGeometry(.11,.15,.12,20),mats.red);mushroom.position.y=.62;root.add(mushroom);root.userData.estop=mushroom;
    }else if(type==='laneindicator'){
      addPole(2.0);const panel=addBox(1.1,.46,.12,mats.dark,0,1.92,0);const light=addBox(.72,.10,.02,mats.green,0,1.92,.071);root.userData.indicatorLight=light;root.userData.panel=panel;
    }else if(type==='parkingdisplay'){
      addPole(2.2);const panel=addBox(1.45,.72,.14,mats.dark,0,2.08,0);const display=addBox(.96,.32,.02,mats.green,0,2.08,.081);root.userData.displayPanel=display;root.userData.panel=panel;
    }else if(type==='bollard'){
      const cyl=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.6,22),mats.gray);cyl.position.y=.30;cyl.castShadow=true;root.add(cyl);root.userData.bollard=cyl;
    }else if(type==='heightbar'){
      addPole(2.4,-1.7,0);addPole(2.4,1.7,0);const bar=addBox(3.55,.16,.16,mats.orange,0,2.30,0);root.userData.heightBar=bar;
    }else if(type==='accesscontroller'){
      const body=addBox(1.10,.70,.15,mats.dark,0,.35,0);const door=addBox(.96,.58,.02,mats.gray,0,.35,.086);const lamp=addBox(.10,.04,.015,mats.green,.30,.56,.10);root.userData.statusLamp=lamp;root.userData.body=body;root.userData.panel=door;
    }else if(type==='ipcamera'){
      addPole(2.5);const base=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.10,24),mats.white);base.position.y=2.45;root.add(base);const dome=new THREE.Mesh(new THREE.SphereGeometry(.20,24,16,0,Math.PI*2,0,Math.PI/2),mats.dark);dome.rotation.x=Math.PI;dome.position.y=2.43;root.add(dome);root.userData.cameraBody=dome;
    }else if(type==='poeswitch'){
      const body=addBox(1.30,.32,.85,mats.dark);for(let i=0;i<8;i++){const port=addBox(.09,.07,.02,mats.green,-.42+i*.12,.18,.436);port.castShadow=false;}root.userData.body=body;
    }else if(type==='relay'){
      const body=addBox(.34,.45,.28,mats.gray);const light=addBox(.08,.06,.02,mats.green,0,.36,.151);root.userData.statusLamp=light;
    }else if(type==='powersupply'){
      const body=addBox(.85,.32,.52,mats.gray);for(let i=0;i<6;i++)addBox(.06,.05,.02,mats.dark,-.25+i*.10,.19,.271);root.userData.body=body;
    }else if(['delaytimer','poweroffdelay','powerondelay'].includes(type)){
      const body=addBox(.42,.62,.38,mats.dark);const dial=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.025,20),mats.orange);dial.rotation.x=Math.PI/2;dial.position.set(0,.38,.205);root.add(dial);const lamp=addBox(.06,.04,.02,mats.green,0,.51,.205);root.userData.statusLamp=lamp;
    }else if(type==='signal2way'||type==='signal3way'){
      const body=addBox(.90,.65,.28,mats.dark);const count=type==='signal3way'?3:2;for(let i=0;i<count;i++){const lamp=new THREE.Mesh(new THREE.SphereGeometry(.055,14,10),i===0?mats.green:mats.red);lamp.position.set((i-(count-1)/2)*.18,.44,.16);root.add(lamp);}root.userData.body=body;
    }else if(type==='timer'){
      const body=addBox(.75,.55,.22,mats.dark);const screen=addBox(.48,.24,.02,mats.red,0,.32,.121);root.userData.displayPanel=screen;
    }else if(type==='ledpanel'){
      addPole(2.0);const panel=addBox(1.25,.68,.13,mats.dark,0,1.90,0);const red=new THREE.Mesh(new THREE.SphereGeometry(.09,18,12),mats.red.clone());red.position.set(-.34,2.00,.08);const green=new THREE.Mesh(new THREE.SphereGeometry(.09,18,12),mats.green.clone());green.position.set(-.34,1.78,.08);root.add(red,green);const display=addBox(.55,.30,.02,mats.green,.24,1.90,.076);root.userData.trafficRed=red;root.userData.trafficGreen=green;root.userData.displayPanel=display;
    }else if(type==='traffic'){
      addPole(2.2);const box=addBox(.48,.82,.30,mats.dark,0,1.95,0);const red=new THREE.Mesh(new THREE.SphereGeometry(.11,18,12),mats.red.clone());red.position.set(0,2.16,.17);const green=new THREE.Mesh(new THREE.SphereGeometry(.11,18,12),mats.green.clone());green.position.set(0,1.78,.17);root.add(red,green);root.userData.trafficRed=red;root.userData.trafficGreen=green;root.userData.box=box;
    }else if(type==='shutter'){
      const left=addBox(.16,2.7,.18,mats.dark,-1.45,1.35,0),right=addBox(.16,2.7,.18,mats.dark,1.45,1.35,0),top=addBox(3.05,.18,.18,mats.dark,0,2.64,0);const door=addBox(2.75,2.45,.08,mats.gray,0,1.26,.02);root.userData.shutterDoor=door;root.userData.frame=[left,right,top];
    }else{
      const body=addBox(.7,.7,.7,mats.blue);root.userData.body=body;
    }
    root.userData.layer='devices';root.userData.type=type;
    return markSelectable(root,device.id);
  }
  function ensureDevices(){devices.forEach(d=>{if(!deviceRoots[d.id])createDeviceRoot(d);syncTransform(d.id);applySettings(d.id);});Object.keys(deviceRoots).forEach(id=>{if(!devices.find(d=>d.id===id)){const root=deviceRoots[id];root.parent?.remove(root);delete deviceRoots[id];}});refreshSignals();}
  function syncTransform(id){const root=deviceRoots[id];if(!root)return;const t=getDeviceTransform(id);const fg=floorGroup(t.floor);if(root.parent!==fg)fg.add(root);root.position.set(t.x,t.y,t.z);root.rotation.y=t.rotationY||0;}
  function applySettings(id){
    const root=deviceRoots[id],dev=devices.find(d=>d.id===id);if(!root||!dev)return;
    const s=getSettings(id),def=defaultSettings(dev.type),type=(dev.type||'').toLowerCase();
    const baseW=def.width||1,baseH=def.height||1,baseD=def.depth||1;
    const scalable=['barrier','traffic','loop','laneindicator','shutter','heightbar'].includes(type);
    if(scalable&&(s.width!==undefined||s.height!==undefined||s.depth!==undefined))root.scale.set((s.width??baseW)/baseW,(s.height??baseH)/baseH,(s.depth??baseD)/baseD);else root.scale.set(1,1,1);
    if(root.userData.barrierArm&&s.boomLength){root.userData.barrierArm.scale.x=s.boomLength/(def.boomLength||2.5);}
    if(root.userData.zone&&s.range){const base=def.range||s.range;const ratio=Math.max(.25,s.range/base);root.userData.zone.scale.set(ratio,ratio,ratio);}
    root.userData.positionLocked=!!s.positionLocked;root.visible=s.hidden!==true;
  }

  function refreshSignals(){signalGroup.clear();function curvedLine(a,b,color){const mid=new THREE.Vector3((a.x+b.x)/2,Math.max(a.y,b.y)+2.4,(a.z+b.z)/2);const c=new THREE.QuadraticBezierCurve3(a,mid,b);return new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(36)),new THREE.LineBasicMaterial({color,transparent:true,opacity:.9}));}const colors={DI:0x52b7ff,DO:0xff8c25,POWER:0xf5c542,NETWORK:0x4ade80,RS485:0xc084fc,SIGNAL:0xe5e7eb};state.connections.filter(c=>c.enabled!==false).forEach(c=>{const a=deviceRoots[c.fromDevice],b=deviceRoots[c.toDevice];if(!a||!b)return;const ap=new THREE.Vector3(),bp=new THREE.Vector3();a.getWorldPosition(ap);b.getWorldPosition(bp);const line=curvedLine(ap,bp,colors[c.type]||colors.SIGNAL);line.userData.connectionId=c.id;line.userData.fromDevice=c.fromDevice;line.userData.toDevice=c.toDevice;signalGroup.add(line);});applyTraceFocus();}
  ensureDevices();

  const selectionBox=new THREE.Box3(),selectionHelper=new THREE.Box3Helper(selectionBox,0xffa500);selectionHelper.visible=false;scene.add(selectionHelper);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),dragPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),dragOffset=new THREE.Vector3(),hitPoint=new THREE.Vector3();
  let selectedId=state.selectedDevice||devices[0]?.id||null,editorMode=state.editor.mode||'select',snap=!!state.editor.snap,draggingDevice=false,orbiting=false,lastX=0,lastY=0,rotateStart=0,rotateBase=0;
  function updateSelection(){if(!selectedId||!deviceRoots[selectedId]){selectionHelper.visible=false;return;}selectionBox.setFromObject(deviceRoots[selectedId]);selectionHelper.visible=true;}
  function selectById(id,notify=true){if(!id||!deviceRoots[id])return;selectedId=id;selectDevice(id);updateSelection();if(notify)callbacks.onSelection?.(id);setText('selectedState',devices.find(d=>d.id===id)?.name||id);if(notify)showToast('選取 '+id);}
  if(selectedId&&deviceRoots[selectedId])selectById(selectedId,false);

  function snapVal(v){const size=state.editor.gridSize||.25;return snap?Math.round(v/size)*size:v;}
  function pointerToNdc(e){const r=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);}
  function hitDevice(e){pointerToNdc(e);const hits=raycaster.intersectObjects(Object.values(deviceRoots),true);if(!hits.length)return null;let o=hits[0].object;while(o&&!o.userData.deviceId)o=o.parent;return o?.userData.deviceId||null;}
  function moveRootFromWorld(root,world,id){const parent=root.parent;const local=parent.worldToLocal(world.clone());root.position.x=snapVal(local.x);root.position.z=snapVal(local.z);const t=getDeviceTransform(id);updateDeviceTransform(id,{x:root.position.x,z:root.position.z,y:root.position.y,rotationY:root.rotation.y,floor:t.floor});updateSelection();refreshSignals();callbacks.onTransform?.(id);}
  function pd(e){const id=hitDevice(e);if(id){selectById(id);const root=deviceRoots[id];if(root.userData.positionLocked&&(editorMode==='move'||editorMode==='rotate')){showToast('此設備位置已固定');return;}if(editorMode==='move'){draggingDevice=true;const worldY=floorElevation(getDeviceTransform(id).floor)+root.position.y;dragPlane.set(new THREE.Vector3(0,1,0),-worldY);pointerToNdc(e);if(raycaster.ray.intersectPlane(dragPlane,hitPoint)){const rootWorld=new THREE.Vector3();root.getWorldPosition(rootWorld);dragOffset.copy(rootWorld).sub(hitPoint);}renderer.domElement.setPointerCapture?.(e.pointerId);return;}if(editorMode==='rotate'){draggingDevice=true;rotateStart=e.clientX;rotateBase=root.rotation.y;renderer.domElement.setPointerCapture?.(e.pointerId);return;}}orbiting=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId);}
  function pm(e){if(draggingDevice&&selectedId){const root=deviceRoots[selectedId];if(editorMode==='move'){pointerToNdc(e);if(raycaster.ray.intersectPlane(dragPlane,hitPoint))moveRootFromWorld(root,hitPoint.add(dragOffset),selectedId);}else if(editorMode==='rotate'){root.rotation.y=rotateBase+(e.clientX-rotateStart)*.012;const t=getDeviceTransform(selectedId);updateDeviceTransform(selectedId,{rotationY:root.rotation.y,x:root.position.x,y:root.position.y,z:root.position.z,floor:t.floor});updateSelection();refreshSignals();callbacks.onTransform?.(selectedId);}return;}if(orbiting&&!state.simulator.follow){const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;yaw-=dx*.008;pitch=Math.max(.12,Math.min(1.35,pitch+dy*.006));}}
  function pu(){draggingDevice=false;orbiting=false;}
  renderer.domElement.addEventListener('pointerdown',pd);renderer.domElement.addEventListener('pointermove',pm);renderer.domElement.addEventListener('pointerup',pu);renderer.domElement.addEventListener('pointercancel',pu);
  renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();radius=Math.max(7,Math.min(60,radius+e.deltaY*.025));},{passive:false});
  let pinchDist=0;renderer.domElement.addEventListener('touchstart',e=>{if(e.touches.length===2)pinchDist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);},{passive:true});renderer.domElement.addEventListener('touchmove',e=>{if(e.touches.length===2){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);if(pinchDist)radius=Math.max(7,Math.min(60,radius-(d-pinchDist)*.03));pinchDist=d;}},{passive:true});

  const keys=new Set();let speed=0,loopOn=false,barrierOpen=!!state.simulator.barrier;let yaw=.62,pitch=.42,radius=27,target=new THREE.Vector3(0,1,0),follow=!!state.simulator.follow,etagFlash=0;
  function onKeyDown(e){const el=document.activeElement;if(el&&['INPUT','TEXTAREA','SELECT'].includes(el.tagName))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)){e.preventDefault();keys.add(e.code);}}
  function onKeyUp(e){keys.delete(e.code);}window.addEventListener('keydown',onKeyDown,{passive:false});window.addEventListener('keyup',onKeyUp);

  function applyMaterialOpacity(obj,opacity){obj.traverse?.(n=>{if(!n.material)return;const apply=m=>{if(m.userData._utopBaseOpacity===undefined)m.userData._utopBaseOpacity=m.opacity??1;const base=m.userData._utopBaseOpacity;m.transparent=opacity<1||base<1;m.opacity=base*opacity;m.needsUpdate=true;};Array.isArray(n.material)?n.material.forEach(apply):apply(n.material);});}
  function applyTraceFocus(){
    const cfg=state.signalTrace||{};
    const enabled=!!cfg.enabled&&!!cfg.focusDevice;
    const trace=enabled?traceNetwork(cfg.focusDevice,cfg.mode||'full'):{devices:[],connections:[]};
    Object.entries(deviceRoots).forEach(([id,root])=>{
      const base=groupOpacity('devices');
      const opacity=enabled?(trace.devices.includes(id)?base:Math.min(.16,base)):base;
      applyMaterialOpacity(root,opacity);
    });
    signalGroup.children.forEach(line=>{
      const hit=trace.connections.includes(line.userData.connectionId);
      line.material.opacity=enabled?(hit?1:.06):(loopOn?1:.35);
      line.material.needsUpdate=true;
    });
    if(enabled){
      selectedId=cfg.focusDevice;
      if(deviceRoots[selectedId]){updateSelection();setText('selectedState',devices.find(d=>d.id===selectedId)?.name||selectedId);}
      setText('simStatus',`TRACE ${String(cfg.mode||'full').toUpperCase()} · ${trace.devices.length} DEV`);
    }
    return trace;
  }
  function applyProjectState(){const profile=getSceneProfile();scene.background.setHex(profile.sky);scene.fog.color.setHex(profile.fog);hemi.intensity=profile.ambient;sun.intensity=profile.sun;mats.road.color.setHex(profile.road);state.floors.forEach(f=>{const fg=floorGroups[f.id];if(!fg)return;fg.visible=floorVisible(f.id);applyMaterialOpacity(fg,f.opacity)});Object.values(deviceRoots).forEach(root=>{root.visible=groupVisible('devices');applyMaterialOpacity(root,groupOpacity('devices'));});car.visible=groupVisible('vehicle');signalGroup.visible=groupVisible('signals')&&state.simulator.signals;roadObjects.forEach(o=>o.visible=groupVisible('road'));guard.visible=groupVisible('building');Object.values(deviceRoots).forEach(root=>{if(root.userData.zone){const on=groupVisible('signals')&&state.simulator.zones;root.userData.zone.visible=on;}if(root.userData.zoneEdges)root.userData.zoneEdges.visible=groupVisible('signals')&&state.simulator.zones;});applyTraceFocus();showToast(`${state.scene.time} · ${state.scene.weather} · ${state.scene.event}`);}
  function focusFloor(id){const f=state.floors.find(x=>x.id===id);if(!f)return;setFloorFocus(id);follow=false;target.set(0,f.elevation+1,0);yaw=.58;pitch=.42;radius=29;showToast('聚焦 '+f.name);}

  function executeDeviceAction(id,action){
    const dev=devices.find(d=>d.id===id),root=deviceRoots[id];if(!dev||!root)return false;const type=(dev.type||'').toLowerCase();let status=String(action).toUpperCase();
    if(type==='barrier'){
      if(action==='open'){barrierOpen=true;state.simulator.barrier=true;status='OPEN';}
      else if(action==='close'||action==='reset'){barrierOpen=false;state.simulator.barrier=false;status='CLOSED';}
      else if(action==='stop')status='STOPPED';else if(action==='safety'){barrierOpen=true;status='SAFETY → OPEN';}
    }else if(type==='loop'){if(action==='vehicle'){loopOn=true;state.simulator.loop=true;status='ON';}else if(action==='clear'){loopOn=false;state.simulator.loop=false;status='OFF';}}
    else if(type==='uhf'){if(action==='read'){etagFlash=1;status='TAG DETECTED';}else status='READY';}
    else if(type==='traffic'||type==='ledpanel'){
      if(root.userData.trafficRed)root.userData.trafficRed.material.emissive?.setHex(action==='red'?0x660000:0x000000);
      if(root.userData.trafficGreen)root.userData.trafficGreen.material.emissive?.setHex(action==='green'?0x006600:0x000000);
      status=action==='off'?'OFF':action.toUpperCase();
    }else if(type==='infrared'){if(root.userData.beam)root.userData.beam.visible=action!=='blocked';status=action==='blocked'?'BLOCKED':'CLEAR';}
    else if(type==='beacon'){root.userData.flash=action==='flash';if(root.userData.beaconLamp){root.userData.beaconLamp.visible=action!=='off';root.userData.beaconLamp.material.emissive?.setHex(action==='off'?0x000000:0x553000);}status=action.toUpperCase();}
    else if(type==='bollard'){root.userData.bollardTarget=action==='up'?0.30:action==='down'?-0.20:(root.userData.bollard?.position.y??0.30);status=action.toUpperCase();}
    else if(type==='shutter'){root.userData.shutterTarget=action==='open'?2.45:action==='close'?0.0:(root.userData.shutterDoor?.position.y??1.26);status=action.toUpperCase();}
    else if(type==='relay'){if(root.userData.statusLamp)root.userData.statusLamp.material=action==='on'?mats.green:mats.gray;status=action==='on'?'NO CLOSED':'NC CLOSED';}
    else if(type==='estop'){if(root.userData.estop)root.userData.estop.position.y=action==='press'?.54:.62;status=action==='press'?'EMERGENCY STOP':'READY';}
    else if(type==='laneindicator'){if(root.userData.indicatorLight)root.userData.indicatorLight.material=action==='stop'?mats.red:mats.green;status=action.toUpperCase();}
    else if(type==='parkingdisplay'){status=action==='full'?'FULL':action==='available'?'AVAILABLE':action.toUpperCase();}
    else if(type==='timer'||type.includes('delay')){status=action==='start'||action==='on'?'RUNNING':action==='pause'?'PAUSED':action==='reset'?'IDLE':action.toUpperCase();}
    else if(type==='cardreader'){status=action==='valid'?'VALID CARD':action==='invalid'?'INVALID CARD':'READY';}
    else if(type==='lpr'){status=action==='valid'?'PLATE OK':action==='invalid'?'PLATE FAIL':'READY';}
    else if(type==='ipcamera'){status=action==='record'?'RECORDING':action==='alarm'?'ALARM':'ONLINE';}
    else if(type==='accesscontroller'){status=action==='unlock'?'UNLOCKED':action==='lock'?'LOCKED':action==='alarm'?'ALARM':'ONLINE';}
    else if(type==='poeswitch'||type==='powersupply'){status=action==='on'?'ONLINE':action==='off'?'OFF':action==='fault'?'FAULT':'READY';}
    else if(type==='heightbar'){status=action==='overheight'?'OVERHEIGHT ALARM':action==='normal'?'NORMAL':'READY';}
    else status=action.toUpperCase();
    updateRuntime(id,{status,lastAction:action,active:!['off','clear','reset','close'].includes(action)});dev.state=status;showToast(`${dev.name} · ${status}`);callbacks.onSelection?.(id);return true;
  }

  const controllerApi={
    setBarrier(open){barrierOpen=!!open;state.simulator.barrier=barrierOpen;showToast(open?'Barrier OPEN':'Barrier CLOSE');},
    toggleLoop(){loopOn=!loopOn;state.simulator.loop=loopOn;showToast('Loop '+(loopOn?'ON':'OFF'));},
    triggerEtag(){etagFlash=1;showToast('ETAG DETECTED');setText('etagState','DETECTED');setTimeout(()=>setText('etagState','READY'),1200);},
    toggleSignals(){state.simulator.signals=!state.simulator.signals;signalGroup.visible=state.simulator.signals;return state.simulator.signals;},
    toggleZones(){state.simulator.zones=!state.simulator.zones;Object.values(deviceRoots).forEach(root=>{if(root.userData.zone)root.userData.zone.visible=state.simulator.zones;if(root.userData.zoneEdges)root.userData.zoneEdges.visible=state.simulator.zones;});return state.simulator.zones;},
    resetCar(){car.position.set(0,0,15);car.rotation.y=0;speed=0;keys.clear();showToast('車輛已重設');},
    setDrive(dir,on=true){const code={forward:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD'}[dir];if(!code)return;if(on)keys.add(code);else keys.delete(code);},
    stop(){keys.clear();speed=0;},
    setFollow(v){follow=!!v;state.simulator.follow=follow;},
    saveView(){const floor=state.editor.floorFocus||'1F',v={name:'視野 '+(state.simulator.viewpoints.length+1),yaw,pitch,radius,target:[target.x,target.y,target.z],floor};addViewpoint(v);showToast('已儲存目前視野');return v;},
    nextView(){state.simulator.cameraPreset=(state.simulator.cameraPreset+1)%state.simulator.viewpoints.length;this.gotoView(state.simulator.cameraPreset);},
    gotoView(i){const v=state.simulator.viewpoints[i];if(!v)return;follow=false;yaw=v.yaw;pitch=v.pitch;radius=v.radius;target.set(...v.target);state.simulator.cameraPreset=i;if(v.floor)setFloorFocus(v.floor);showToast(v.name);},
    applyProjectState(){ensureDevices();applyProjectState();},
    focusFloor,
    setEditorMode(mode){editorMode=mode;saveEditorMode(mode);showToast('3D工具：'+mode);},
    setSnap(v){snap=!!v;state.editor.snap=snap;},
    applyDeviceTransform(id){ensureDevices();syncTransform(id);updateSelection();refreshSignals();},
    applyDeviceSettings(id){applySettings(id);updateSelection();refreshSignals();},
    applyTraceFocus(){const trace=applyTraceFocus();showToast(state.signalTrace?.enabled?'Focus Network ON':'Focus Network OFF');return trace;},
    selectDevice(id){selectById(id);},
    executeDeviceAction(id,action){return executeDeviceAction(id,action);},
    destroy(){cancelAnimationFrame(raf);resizeObserver.disconnect();window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);renderer.domElement.removeEventListener('pointerdown',pd);renderer.domElement.removeEventListener('pointermove',pm);renderer.domElement.removeEventListener('pointerup',pu);renderer.dispose();host.innerHTML='';}
  };

  applyProjectState();focusFloor(state.editor.floorFocus||'1F');if(selectedId&&deviceRoots[selectedId])selectById(selectedId,false);
  function resize(){const r=host.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);resize();

  let last=performance.now(),raf=0;function frame(now){const dt=Math.min(.04,(now-last)/1000);last=now;ensureDevices();const forward=keys.has('KeyW')||keys.has('ArrowUp'),back=keys.has('KeyS')||keys.has('ArrowDown'),left=keys.has('KeyA')||keys.has('ArrowLeft'),right=keys.has('KeyD')||keys.has('ArrowRight');const accel=(back?1:0)-(forward?1:0);speed+=accel*8*dt;speed*=Math.pow(.88,dt*60);speed=Math.max(-3.4,Math.min(6.2,speed));const steer=((right?1:0)-(left?1:0))*.95;if(Math.abs(speed)>.05){car.rotation.y+=steer*dt*(speed>=0?1:-1);const dir=new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0),car.rotation.y);car.position.addScaledVector(dir,speed*dt);car.position.x=Math.max(-3.1,Math.min(3.1,car.position.x));car.position.z=Math.max(-19,Math.min(19,car.position.z));}
    const loopDevice=devices.find(d=>(d.type||'').toLowerCase().includes('loop'));const barrierDevice=devices.find(d=>(d.type||'').toLowerCase().includes('barrier'));const etagDevice=devices.find(d=>(d.type||'').toLowerCase().includes('etag')||(d.type||'').toLowerCase().includes('uhf'));const loopRoot=loopDevice?deviceRoots[loopDevice.id]:null;const barrierRoot=barrierDevice?deviceRoots[barrierDevice.id]:null;const etagRoot=etagDevice?deviceRoots[etagDevice.id]:null;
    if(loopRoot){const carWorld=new THREE.Vector3();car.getWorldPosition(carWorld);const loopWorld=new THREE.Vector3();loopRoot.getWorldPosition(loopWorld);const detected=Math.abs(carWorld.x-loopWorld.x)<3.15&&Math.abs(carWorld.z-loopWorld.z)<2.1;if(detected!==loopOn){loopOn=detected;state.simulator.loop=loopOn;if(loopOn){barrierOpen=true;state.simulator.barrier=true;showToast('LOOP ON → DI1 → Relay → DO1');}else showToast('LOOP OFF');}if(loopRoot.userData.zoneMat)loopRoot.userData.zoneMat.opacity=loopOn?.55:.2;}
    if(barrierRoot?.userData.barrierPivot)barrierRoot.userData.barrierPivot.rotation.z+=((barrierOpen?-Math.PI/2:0)-barrierRoot.userData.barrierPivot.rotation.z)*.08;
    Object.values(deviceRoots).forEach(root=>{if(root.userData.beaconLamp&&root.userData.flash)root.userData.beaconLamp.visible=Math.floor(now/250)%2===0;if(root.userData.bollard&&root.userData.bollardTarget!==undefined)root.userData.bollard.position.y+=(root.userData.bollardTarget-root.userData.bollard.position.y)*.12;if(root.userData.shutterDoor&&root.userData.shutterTarget!==undefined)root.userData.shutterDoor.position.y+=(root.userData.shutterTarget-root.userData.shutterDoor.position.y)*.10;});
    if(state.signalTrace?.enabled)applyTraceFocus();else signalGroup.children.forEach(l=>l.material.opacity=loopOn?1:.35);
    if(etagRoot?.userData.reader){if(etagFlash>0){etagFlash=Math.max(0,etagFlash-dt*1.7);etagRoot.userData.reader.scale.setScalar(1+etagFlash*.18);}else etagRoot.userData.reader.scale.setScalar(1);}
    setText('simStatus',loopOn?'LOOP ON · Barrier OPEN':barrierOpen?'Barrier OPEN':'3D EDIT READY');setText('loopState',loopOn?'ON':'OFF');setText('barrierState3d',barrierOpen?'OPEN':'CLOSED');
    const carWorld=new THREE.Vector3();car.getWorldPosition(carWorld);if(follow){const behind=new THREE.Vector3(0,4.2,7).applyAxisAngle(new THREE.Vector3(0,1,0),car.rotation.y);camera.position.lerp(carWorld.clone().add(behind),.12);camera.lookAt(carWorld.x,carWorld.y+1,carWorld.z);}else{camera.position.set(target.x+radius*Math.cos(pitch)*Math.sin(yaw),target.y+radius*Math.sin(pitch),target.z+radius*Math.cos(pitch)*Math.cos(yaw));camera.lookAt(target);}updateSelection();renderer.render(scene,camera);raf=requestAnimationFrame(frame);}raf=requestAnimationFrame(frame);setText('simStatus','3D EDIT READY');showToast('V1.0.0 Legacy Workflow Merge 已啟動');return controllerApi;
}
