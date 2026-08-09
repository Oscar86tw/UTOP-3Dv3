import {state} from '../state.js';
import {devices} from '../data.js';
import {getSceneProfile,floorVisible,groupVisible,groupOpacity,addViewpoint} from '../core-project-01/project-controls.js';
import {getDeviceTransform,updateDeviceTransform,floorElevation,selectDevice,setFloorFocus,setEditorMode as saveEditorMode} from '../core-editor-01/editor-commands.js';
import {getSettings,defaultSettings,updateRuntime,getRuntime} from '../core-module-01/module-manager.js';
import {traceNetwork} from '../core-signal-01/signal-trace.js';
import {createLocal3D} from '../core-local3d-01/local3d.js?v=1.3.0';
import {createRealisticDeviceModel} from './device-model-factory.js?v=1.3.0';

let active=null;
const THREE_SOURCES=[
  {name:'專案本地 Three.js',url:'../../../vendor/three/three.module.min.js'}
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
      throw new Error('本地 Three.js 模組內容不完整');
    }catch(err){
      console.error(`[UTOP-3D] ${source.name} 載入失敗`,err);
      errors.push(`${source.name}: ${err?.message||err}`);
    }
  }
  const error=new Error('專案本地 Three.js 載入失敗');
  error.details=errors;
  throw error;
}
export function unmountSimulator3D(){if(!active)return;active.destroy();active=null;}
export async function mountSimulator3D(callbacks={}){
  unmountSimulator3D();
  const host=document.getElementById('threeStage');
  if(!host)return null;
  setText('threeLoading','正在載入專案內建 3D 核心…');
  try{
    const loaded=await loadThree();
    if(!document.getElementById('threeStage'))return null;
    active=createSimulator(loaded.THREE,host,callbacks);
    setText('simStatus',`3D READY · ${loaded.source}`);
    return active;
  }catch(err){
    console.warn('[UTOP-3D] WebGL Three.js 啟動失敗，切換 Local 3D 備援核心',err);
    if(!document.getElementById('threeStage'))return null;
    try{
      active=createLocal3D(host,callbacks);
      setText('simStatus','LOCAL 3D READY');
      const toast=document.getElementById('simToast');
      if(toast){toast.textContent='WebGL 3D 無法啟動，已切換專案內建 Local 3D';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2400);}
      return active;
    }catch(fallbackErr){
      console.error('[UTOP-3D] Local 3D 備援核心也啟動失敗',fallbackErr);
      host.innerHTML=`<div class="three-error"><b>3D 核心啟動失敗</b><br><small>${String(err?.message||err)}</small><br><small>${String(fallbackErr?.message||fallbackErr)}</small></div>`;
      setText('simStatus','3D ERROR');
      return null;
    }
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

  const roadMarkingGroup=new THREE.Group();roadMarkingGroup.userData.layer='road';scene.add(roadMarkingGroup);
  function clearGroup(group){while(group.children.length){const o=group.children.pop();o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose?.());else o.material?.dispose?.();}}
  function markingMaterial(color=0xffffff){return new THREE.MeshStandardMaterial({color,roughness:.8,side:THREE.DoubleSide});}
  function addMarkBox(group,w,d,x,z,y=.13,rot=0,color=0xffffff){const m=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.02,w),.025,Math.max(.02,d)),markingMaterial(color));m.position.set(x,y,z);m.rotation.y=rot;group.add(m);return m;}
  function rebuildRoadMarkings(){
    clearGroup(roadMarkingGroup);
    (state.roadMarkings||[]).filter(x=>x.visible!==false).forEach(mark=>{
      const g=new THREE.Group();g.position.y=floorElevation(mark.floor||'1F');g.userData.markingId=mark.id;roadMarkingGroup.add(g);
      const x=Number(mark.x)||0,z=Number(mark.z)||0,rot=(Number(mark.rotation)||0)*Math.PI/180,w=Number(mark.width)||.12,len=Number(mark.length)||3;
      if(mark.kind==='dash'){
        for(let i=-Math.floor(len/1.5);i<=Math.floor(len/1.5);i+=2)addMarkBox(g,w,.7,x,z+i*.75,.13,rot,0xffffff);
      }else if(mark.kind==='double'){
        const off=.13;addMarkBox(g,w,len,x-off,z,.13,rot,0xf4c542);addMarkBox(g,w,len,x+off,z,.13,rot,0xf4c542);
      }else if(mark.kind==='zebra'){
        const count=7;for(let i=0;i<count;i++){const zz=z-len/2+(i+.5)*(len/count);addMarkBox(g,w,.22,x,zz,.13,rot,0xffffff);}
      }else if(mark.kind==='hatch'){
        const count=7;for(let i=0;i<count;i++){const off=-w/2+(i+.5)*(w/count);addMarkBox(g,.08,len,x+off,z,.13,rot+Math.PI/4,0xf4c542);}
      }else if(String(mark.kind).startsWith('arrow')){
        addMarkBox(g,.15,len*.7,x,z+.25,.13,rot,0xffffff);addMarkBox(g,.15,1,x-.32,z-len*.28,.13,rot-Math.PI/4,0xffffff);addMarkBox(g,.15,1,x+.32,z-len*.28,.13,rot+Math.PI/4,0xffffff);
      }else{
        const color=mark.kind==='stop'?0xffffff:0xffffff;addMarkBox(g,w,len,x,z,.13,rot,color);
      }
    });
    roadMarkingGroup.visible=groupVisible('road');
  }
  rebuildRoadMarkings();

  function markSelectable(root,id){root.userData.deviceId=id;root.traverse(n=>{n.userData.deviceId=id;});selectables.push(root);deviceRoots[id]=root;return root;}
  function basicPole(colorMat){const pole=new THREE.Mesh(new THREE.BoxGeometry(.18,3,.18),mats.dark);pole.position.y=1.5;const head=new THREE.Mesh(new THREE.BoxGeometry(.85,.5,.65),colorMat||mats.blue);head.position.set(0,3,.05);const g=new THREE.Group();g.add(pole,head);return g;}
  function createDeviceRoot(device){
    const root=createRealisticDeviceModel(THREE,mats,device);
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
  function applyProjectState(){rebuildRoadMarkings();const profile=getSceneProfile();scene.background.setHex(profile.sky);scene.fog.color.setHex(profile.fog);hemi.intensity=profile.ambient;sun.intensity=profile.sun;mats.road.color.setHex(profile.road);state.floors.forEach(f=>{const fg=floorGroups[f.id];if(!fg)return;fg.visible=floorVisible(f.id);applyMaterialOpacity(fg,f.opacity)});Object.values(deviceRoots).forEach(root=>{root.visible=groupVisible('devices');applyMaterialOpacity(root,groupOpacity('devices'));});car.visible=groupVisible('vehicle');signalGroup.visible=groupVisible('signals')&&state.simulator.signals;roadObjects.forEach(o=>o.visible=groupVisible('road'));guard.visible=groupVisible('building');Object.values(deviceRoots).forEach(root=>{if(root.userData.zone){const on=groupVisible('signals')&&state.simulator.zones;root.userData.zone.visible=on;}if(root.userData.zoneEdges)root.userData.zoneEdges.visible=groupVisible('signals')&&state.simulator.zones;});applyTraceFocus();showToast(`${state.scene.time} · ${state.scene.weather} · ${state.scene.event}`);}
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
    refreshRoadMarkings(){rebuildRoadMarkings();showToast('道路標線已更新');},
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
    const carWorld=new THREE.Vector3();car.getWorldPosition(carWorld);if(follow){const behind=new THREE.Vector3(0,4.2,7).applyAxisAngle(new THREE.Vector3(0,1,0),car.rotation.y);camera.position.lerp(carWorld.clone().add(behind),.12);camera.lookAt(carWorld.x,carWorld.y+1,carWorld.z);}else{camera.position.set(target.x+radius*Math.cos(pitch)*Math.sin(yaw),target.y+radius*Math.sin(pitch),target.z+radius*Math.cos(pitch)*Math.cos(yaw));camera.lookAt(target);}updateSelection();renderer.render(scene,camera);raf=requestAnimationFrame(frame);}raf=requestAnimationFrame(frame);setText('simStatus','3D EDIT READY');showToast('V1.3.0 Real Device Model & Direct Control 已啟動');return controllerApi;
}
