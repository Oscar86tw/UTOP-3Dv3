import {state} from '../state.js';
import {devices} from '../data.js';
import {getSceneProfile,floorVisible,groupVisible,groupOpacity,addViewpoint} from '../core-project-01/project-controls.js';
import {getDeviceTransform,updateDeviceTransform,floorElevation,selectDevice,setFloorFocus,setEditorMode as saveEditorMode} from '../core-editor-01/editor-commands.js';
import {getSettings,defaultSettings,updateRuntime,getRuntime} from '../core-module-01/module-manager.js';
import {traceNetwork} from '../core-signal-01/signal-trace.js';
import {createRealisticDeviceModel} from './device-model-factory.js?v=1.4.9';
import {connectionsTriggeredBy,actionForTargetTerminal,noteSignal} from '../core-logic-01/connection-runtime.js?v=1.4.9';

let active=null;
const THREE_SOURCES=[
  {name:'專案本地 Three.js',url:new URL('../../../vendor/three/three.module.min.js',import.meta.url).href}
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
    console.error('[UTOP-3D] True WebGL 3D 啟動失敗',err);
    if(!document.getElementById('threeStage'))return null;
    state.runtimeHealth??={};state.runtimeHealth.webglReady=false;state.runtimeHealth.simulatorReady=false;state.runtimeHealth.lastError=String(err?.message||err);
    const detail=[err?.message,...(err?.details||[])].filter(Boolean).join('｜');
    host.innerHTML=`<div class="three-error true3d-error"><b>真正 WebGL 3D 無法啟動</b><br><small>${detail||'未知錯誤'}</small><br><button id="retryTrue3D" class="primary-btn mt10">重新啟動真正 3D</button><br><small class="muted">本版不再切換成平面 Local 3D。</small></div>`;
    setText('simStatus','TRUE 3D ERROR');
    document.getElementById('retryTrue3D')?.addEventListener('click',()=>mountSimulator3D(callbacks));
    return null;
  }
}
function createSimulator(THREE,host,callbacks){
  host.innerHTML='';host.dataset.tool=state.editor.mode||'select';
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0xbdd7e5);scene.fog=new THREE.Fog(0xbdd7e5,45,100);
  const camera=new THREE.PerspectiveCamera(55,1,.1,240);
  const canvas=document.createElement('canvas');
  canvas.className='three-webgl-canvas';
  const preferred={alpha:false,antialias:true,depth:true,stencil:false,premultipliedAlpha:false,preserveDrawingBuffer:false,powerPreference:'high-performance',failIfMajorPerformanceCaveat:false};
  let gl=canvas.getContext('webgl2',preferred);
  let rendererMode='WebGL2 High';
  if(!gl){
    const compatible={alpha:false,antialias:false,depth:true,stencil:false,premultipliedAlpha:false,preserveDrawingBuffer:false,powerPreference:'default',failIfMajorPerformanceCaveat:false};
    gl=canvas.getContext('webgl2',compatible);
    rendererMode='WebGL2 Compatible';
  }
  if(!gl)throw new Error('瀏覽器沒有可用的 WebGL2 Context；已禁止切換到平面 Local 3D。');
  const renderer=new THREE.WebGLRenderer({canvas,context:gl,antialias:!!gl.getContextAttributes()?.antialias});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
  host.dataset.rendererMode=rendererMode;

  const hemi=new THREE.HemisphereLight(0xffffff,0x4d5962,1.8);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffffff,2.6);sun.position.set(18,22,14);sun.castShadow=true;scene.add(sun);
  const worldAxes=new THREE.AxesHelper(3);worldAxes.position.set(-6,.04,17);scene.add(worldAxes);
  const grid=new THREE.GridHelper(50,50,0x64748b,0x94a3b8);grid.position.y=.001;grid.material.transparent=true;grid.material.opacity=.16;scene.add(grid);

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
  ['1F','B1','B2'].forEach(id=>{const g=floorGroup(id);const road=new THREE.Mesh(new THREE.BoxGeometry(10,.14,38),mats.road);road.position.y=.02;road.receiveShadow=true;road.userData.layer='road';g.add(road);roadObjects.push(road);for(let z=-16;z<=16;z+=4){const d=new THREE.Mesh(new THREE.BoxGeometry(.13,.03,2),mats.white);d.position.set(0,.11,z);d.userData.layer='road';g.add(d);roadObjects.push(d);}});
  // 1F 車道展示場景：雙側人行道、路緣與方向箭頭，接近現場配置視覺
  {
    const g=floorGroup('1F');
    const walkMat=new THREE.MeshStandardMaterial({color:0xc9c2b5,roughness:1});
    const curbMat=new THREE.MeshStandardMaterial({color:0xe7e7e2,roughness:.9});
    for(const x of [-5.45,5.45]){
      const walk=new THREE.Mesh(new THREE.BoxGeometry(2.8,.10,42),walkMat);walk.position.set(x,.08,0);walk.receiveShadow=true;walk.userData.layer='road';g.add(walk);roadObjects.push(walk);
      const curb=new THREE.Mesh(new THREE.BoxGeometry(.18,.20,42),curbMat);curb.position.set(x+(x<0?1.48:-1.48),.15,0);curb.receiveShadow=true;curb.userData.layer='road';g.add(curb);roadObjects.push(curb);
    }
    const arrow=new THREE.Group();arrow.userData.layer='road';
    const stem=new THREE.Mesh(new THREE.BoxGeometry(.36,.025,2.0),mats.white);stem.position.set(-2.1,.14,11.8);arrow.add(stem);
    const a1=new THREE.Mesh(new THREE.BoxGeometry(.34,.025,1.25),mats.white);a1.position.set(-2.52,.14,10.75);a1.rotation.y=-Math.PI/4;arrow.add(a1);
    const a2=a1.clone();a2.position.x=-1.68;a2.rotation.y=Math.PI/4;arrow.add(a2);g.add(arrow);roadObjects.push(arrow);
  }
  function rampBetween(fromId,toId,z=20){const from=floorElevation(fromId),to=floorElevation(toId),rise=to-from,len=13;const angle=Math.asin(Math.min(.99,Math.abs(rise)/len));const mid=(from+to)/2;const ramp=new THREE.Mesh(new THREE.BoxGeometry(8,.22,len),mats.ramp);ramp.position.set(0,mid,z);ramp.rotation.x=(rise<0?angle:-angle);ramp.receiveShadow=true;ramp.userData.layer='road';ramp.userData.floorLink=[fromId,toId];scene.add(ramp);roadObjects.push(ramp);}
  rampBetween('1F','B1',20);rampBetween('B1','B2',6);
  const guard=new THREE.Group();const guardBody=new THREE.Mesh(new THREE.BoxGeometry(4,3.1,4),mats.building);guardBody.position.y=1.55;guardBody.castShadow=true;guardBody.receiveShadow=true;const roof=new THREE.Mesh(new THREE.BoxGeometry(4.4,.25,4.4),mats.dark);roof.position.y=3.22;guard.add(guardBody,roof);guard.position.set(-6,0,-1);guard.userData.layer='building';floorGroup('1F').add(guard);

  function createVehicle(colorMat,x,z,rot=0){
    const car=new THREE.Group();
    const body=new THREE.Mesh(new THREE.BoxGeometry(1.85,.58,3.75),colorMat);body.position.y=.62;body.castShadow=true;
    const hood=new THREE.Mesh(new THREE.BoxGeometry(1.72,.28,1.05),colorMat);hood.position.set(0,.92,-1.22);hood.castShadow=true;
    const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.48,.62,1.65),mats.dark);cabin.position.set(0,1.18,.18);cabin.castShadow=true;
    const windshield=new THREE.Mesh(new THREE.BoxGeometry(1.34,.38,.035),new THREE.MeshStandardMaterial({color:0x8fd3ff,roughness:.25,metalness:.05,transparent:true,opacity:.72}));windshield.position.set(0,1.23,-.66);windshield.rotation.x=-.12;
    const frontBumper=new THREE.Mesh(new THREE.BoxGeometry(1.68,.16,.12),mats.dark);frontBumper.position.set(0,.52,-1.92);
    const rearBumper=new THREE.Mesh(new THREE.BoxGeometry(1.68,.16,.12),mats.dark);rearBumper.position.set(0,.52,1.92);
    const lightMat=new THREE.MeshStandardMaterial({color:0xfef3c7,emissive:0xfff3b0,emissiveIntensity:1.2});
    const tailMat=new THREE.MeshStandardMaterial({color:0xdc2626,emissive:0x660000,emissiveIntensity:.8});
    for(const sx of [-.58,.58]){const h=new THREE.Mesh(new THREE.BoxGeometry(.28,.16,.04),lightMat);h.position.set(sx,.72,-1.91);car.add(h);const t=new THREE.Mesh(new THREE.BoxGeometry(.28,.16,.04),tailMat);t.position.set(sx,.72,1.91);car.add(t);}
    car.add(body,hood,cabin,windshield,frontBumper,rearBumper);car.position.set(x,0,z);car.rotation.y=rot;car.userData.layer='vehicle';car.userData.forwardAxis='-Z';floorGroup('1F').add(car);return car;
  }
  const car=createVehicle(mats.blue,-2.05,15,0);
  const exitCarMat=new THREE.MeshStandardMaterial({color:0xb45309,roughness:.55,metalness:.08});
  const exitCar=createVehicle(exitCarMat,2.05,-15,Math.PI);

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
  function physicalBoxOf(root,targetBox=new THREE.Box3()){
    const hidden=[];
    const hide=o=>{if(o&&o.visible!==false){hidden.push(o);o.visible=false;}};
    hide(root.userData.nameLabel);hide(root.userData.countdownSprite);hide(root.userData.zone);hide(root.userData.zoneEdges);
    root.traverse(o=>{if(o!==root&&(o.userData?.isDeviceLabel||o.userData?.isHelperVisual||o.type==='Sprite'))hide(o);});
    targetBox.setFromObject(root);
    hidden.forEach(o=>o.visible=true);
    return targetBox;
  }
  function createDeviceLabel(device,root){
    const s=getSettings(device.id);if(s.showLabel===false)return null;
    const canvas=document.createElement('canvas');canvas.width=640;canvas.height=170;const ctx=canvas.getContext('2d');
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false});
    const sprite=new THREE.Sprite(material);sprite.renderOrder=1000;sprite.userData.isDeviceLabel=true;sprite.userData.deviceId=device.id;
    root.add(sprite);root.userData.nameLabel=sprite;root.userData.nameLabelCanvas=canvas;root.userData.nameLabelCtx=ctx;root.userData.nameLabelTexture=texture;root.userData.nameLabelText='';
    const bbox=physicalBoxOf(root,new THREE.Box3());const height=Math.max(.35,bbox.max.y-bbox.min.y);sprite.position.set(Number(s.labelOffsetX)||0,height+0.72+(Number(s.labelOffsetY)||0),Number(s.labelOffsetZ)||0);sprite.scale.set(3.6,.96,1);
    return sprite;
  }
  function updateDeviceLabel(device,root,force=false){
    const s=getSettings(device.id),sprite=root.userData.nameLabel;
    if(s.showLabel===false||state.simulator.labels===false){if(sprite)sprite.visible=false;return;}
    const target=sprite||createDeviceLabel(device,root);if(!target)return;target.visible=true;const bbox=physicalBoxOf(root,new THREE.Box3());const height=Math.max(.35,bbox.max.y-bbox.min.y);target.position.set(Number(s.labelOffsetX)||0,height+0.72+(Number(s.labelOffsetY)||0),Number(s.labelOffsetZ)||0);
    const rt=getRuntime(device.id)||{};const text=`${device.name}|${rt.status||device.state||'READY'}`;if(!force&&root.userData.nameLabelText===text)return;root.userData.nameLabelText=text;
    const c=root.userData.nameLabelCanvas,ctx=root.userData.nameLabelCtx;ctx.clearRect(0,0,c.width,c.height);
    ctx.fillStyle='rgba(9,20,31,.88)';ctx.beginPath();ctx.roundRect(5,5,c.width-10,c.height-10,28);ctx.fill();ctx.strokeStyle='#67c8ed';ctx.lineWidth=6;ctx.stroke();
    ctx.fillStyle='#f8fafc';ctx.font='bold 54px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(device.name,c.width/2,65);
    ctx.fillStyle='#8bdcff';ctx.font='bold 28px sans-serif';ctx.fillText(rt.status||device.state||'READY',c.width/2,122);root.userData.nameLabelTexture.needsUpdate=true;
  }
  function createDeviceRoot(device){
    const root=createRealisticDeviceModel(THREE,mats,device,getSettings(device.id));
    markSelectable(root,device.id);createDeviceLabel(device,root);updateDeviceLabel(device,root,true);return root;
  }
  function ensureDevices(){devices.forEach(d=>{if(!deviceRoots[d.id])createDeviceRoot(d);syncTransform(d.id);applySettings(d.id);});Object.keys(deviceRoots).forEach(id=>{if(!devices.find(d=>d.id===id)){const root=deviceRoots[id];root.parent?.remove(root);delete deviceRoots[id];}});refreshSignals();}
  function syncTransform(id){const root=deviceRoots[id];if(!root)return;const t=getDeviceTransform(id);const fg=floorGroup(t.floor);if(root.parent!==fg)fg.add(root);root.position.set(t.x,t.y,t.z);root.rotation.set(t.rotationX||0,t.rotationY||0,t.rotationZ||0);}
  function applySettings(id){
    const root=deviceRoots[id],dev=devices.find(d=>d.id===id);if(!root||!dev)return;
    const s=getSettings(id),def=defaultSettings(dev.type),type=(dev.type||'').toLowerCase();
    root.scale.set(1,1,1);
    if(typeof root.userData.applySettings==='function') root.userData.applySettings(s,def,type);
    else {
      const baseW=def.width||1,baseH=def.height||1,baseD=def.depth||1;
      const scalable=['barrier','traffic','loop','laneindicator','shutter','heightbar'].includes(type);
      if(scalable&&(s.width!==undefined||s.height!==undefined||s.depth!==undefined))root.scale.set((s.width??baseW)/baseW,(s.height??baseH)/baseH,(s.depth??baseD)/baseD);else root.scale.set(1,1,1);
      if(root.userData.barrierArm&&s.boomLength){root.userData.barrierArm.scale.x=s.boomLength/(def.boomLength||2.5);}
      if(root.userData.zone&&s.range){const base=def.range||s.range;const ratio=Math.max(.25,s.range/base);root.userData.zone.scale.set(ratio,ratio,ratio);}
    }
    root.userData.positionLocked=!!s.positionLocked;root.visible=s.hidden!==true;updateDeviceLabel(dev,root,true);
  }

  // Runtime state must exist before ensureDevices() -> refreshSignals() -> applyTraceFocus().
  // Keep these declarations above the first initialization call to avoid TDZ startup errors.
  const keys=new Set();
  let speed=0,loopOn=false,barrierOpen=!!state.simulator.barrier;
  let yaw=.62,pitch=.42,radius=27,target=new THREE.Vector3(0,1,0),follow=!!state.simulator.follow,etagFlash=0;
  let laneDemo={running:false,mode:'entry',entry:{step:0,elapsed:0},exit:{step:0,elapsed:0}};
  let selectedId=state.selectedDevice||devices[0]?.id||null;
  let editorMode=state.editor.mode||'select',snap=!!state.editor.snap,draggingDevice=false,gizmoDragging=false,gizmoKind='',gizmoAxis='',gizmoStart={x:0,y:0},gizmoBase=null,orbiting=false,panning=false,lastX=0,lastY=0,rotateStart=0,rotateBase={x:0,y:0,z:0},rotateAxis='y',moveVertical=false;

  function refreshSignals(){signalGroup.clear();function curvedLine(a,b,color){const mid=new THREE.Vector3((a.x+b.x)/2,Math.max(a.y,b.y)+2.4,(a.z+b.z)/2);const c=new THREE.QuadraticBezierCurve3(a,mid,b);return new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(36)),new THREE.LineBasicMaterial({color,transparent:true,opacity:.9}));}const colors={DI:0x52b7ff,DO:0xff8c25,POWER:0xf5c542,NETWORK:0x4ade80,RS485:0xc084fc,SIGNAL:0xe5e7eb};state.connections.filter(c=>c.enabled!==false).forEach(c=>{const a=deviceRoots[c.fromDevice],b=deviceRoots[c.toDevice];if(!a||!b)return;const ap=new THREE.Vector3(),bp=new THREE.Vector3();a.getWorldPosition(ap);b.getWorldPosition(bp);const line=curvedLine(ap,bp,colors[c.type]||colors.SIGNAL);line.userData.connectionId=c.id;line.userData.fromDevice=c.fromDevice;line.userData.toDevice=c.toDevice;signalGroup.add(line);});applyTraceFocus();}
  function ensureCountdownLabel(id,root){
    if(root.userData.countdownSprite)return root.userData.countdownSprite;
    const type=String(devices.find(d=>d.id===id)?.type||'').toLowerCase();if(!(type==='timer'||type==='ledpanel'||type.includes('delay')))return null;
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const ctx=canvas.getContext('2d');const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const mat=new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false});const sprite=new THREE.Sprite(mat);const panel=root.userData.displayPanel;const pos=panel?.position||new THREE.Vector3(0,1.9,.08);sprite.position.set(pos.x,pos.y,pos.z+.08);sprite.scale.set(.65,.32,.32);root.add(sprite);root.userData.countdownSprite=sprite;root.userData.countdownCanvas=canvas;root.userData.countdownCtx=ctx;root.userData.countdownTexture=texture;root.userData.countdownLastText='';return sprite;
  }
  function updateCountdownLabel(id,root,textValue){const sprite=ensureCountdownLabel(id,root);if(!sprite)return;const val=String(textValue);if(root.userData.countdownLastText===val)return;root.userData.countdownLastText=val;const c=root.userData.countdownCanvas,ctx=root.userData.countdownCtx;ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='rgba(12,18,24,.92)';ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle='#64748b';ctx.lineWidth=5;ctx.strokeRect(3,3,c.width-6,c.height-6);ctx.fillStyle='#ff3b30';ctx.font='bold 76px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(val,c.width/2,c.height/2+4);root.userData.countdownTexture.needsUpdate=true;}

  const selectionBox=new THREE.Box3(),selectionHelper=new THREE.Box3Helper(selectionBox,0xffa500);selectionHelper.visible=false;scene.add(selectionHelper);
  const selectionAxes=new THREE.AxesHelper(.72);selectionAxes.visible=false;scene.add(selectionAxes);
  const transformGizmo=new THREE.Group();transformGizmo.visible=false;scene.add(transformGizmo);
  const gizmoMove=new THREE.Group(),gizmoRotate=new THREE.Group();transformGizmo.add(gizmoMove,gizmoRotate);
  const gizmoObjects=[];
  const axisInfo={x:{color:0xef4444,dir:new THREE.Vector3(1,0,0)},y:{color:0x22c55e,dir:new THREE.Vector3(0,1,0)},z:{color:0x3b82f6,dir:new THREE.Vector3(0,0,1)}};
  function makeMoveAxis(axis){const info=axisInfo[axis],g=new THREE.Group();const mat=new THREE.MeshBasicMaterial({color:info.color,depthTest:false,transparent:true,opacity:.92});const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.05,12),mat);shaft.position.y=.52;const head=new THREE.Mesh(new THREE.ConeGeometry(.085,.24,14),mat);head.position.y=1.16;g.add(shaft,head);if(axis==='x')g.rotation.z=-Math.PI/2;else if(axis==='z')g.rotation.x=Math.PI/2;g.traverse(o=>{o.userData.gizmoKind='move';o.userData.gizmoAxis=axis;gizmoObjects.push(o)});gizmoMove.add(g);}
  function makeRotateAxis(axis){const info=axisInfo[axis],mat=new THREE.MeshBasicMaterial({color:info.color,depthTest:false,transparent:true,opacity:.86,side:THREE.DoubleSide});const ring=new THREE.Mesh(new THREE.TorusGeometry(1.04,.018,8,72),mat);if(axis==='x')ring.rotation.y=Math.PI/2;else if(axis==='y')ring.rotation.x=Math.PI/2;ring.userData.gizmoKind='rotate';ring.userData.gizmoAxis=axis;gizmoObjects.push(ring);gizmoRotate.add(ring);}
  ['x','y','z'].forEach(makeMoveAxis);['x','y','z'].forEach(makeRotateAxis);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),dragPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),dragOffset=new THREE.Vector3(),hitPoint=new THREE.Vector3();
  function updateSelection(){
    if(!selectedId||!deviceRoots[selectedId]){selectionHelper.visible=false;selectionAxes.visible=false;transformGizmo.visible=false;setText('transformHud','XYZ -- / -- / -- · R -- / -- / --');return;}
    const root=deviceRoots[selectedId],tr=getDeviceTransform(selectedId);physicalBoxOf(root,selectionBox);selectionHelper.visible=true;const wp=new THREE.Vector3();root.getWorldPosition(wp);selectionAxes.position.copy(wp);selectionAxes.rotation.copy(root.rotation);selectionAxes.visible=true;
    transformGizmo.position.copy(wp);transformGizmo.visible=editorMode==='move'||editorMode==='rotate';gizmoMove.visible=editorMode==='move';gizmoRotate.visible=editorMode==='rotate';
    const dist=camera.position.distanceTo(wp);const gs=Math.max(.48,Math.min(1.25,dist*.032));transformGizmo.scale.setScalar(gs);
    const deg=v=>Math.round((v||0)*180/Math.PI);setText('transformHud',`XYZ ${Number(tr.x).toFixed(2)} / ${Number(tr.y).toFixed(2)} / ${Number(tr.z).toFixed(2)} · R ${deg(tr.rotationX)} / ${deg(tr.rotationY)} / ${deg(tr.rotationZ)}`);
  }
  function selectById(id,notify=true){if(!id||!deviceRoots[id])return;selectedId=id;selectDevice(id);updateSelection();if(notify)callbacks.onSelection?.(id);setText('selectedState',devices.find(d=>d.id===id)?.name||id);if(notify)showToast('選取 '+id);}
  if(selectedId&&deviceRoots[selectedId])selectById(selectedId,false);

  function snapVal(v){const size=state.editor.gridSize||.25;return snap?Math.round(v/size)*size:v;}
  function pointerToNdc(e){const r=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);}
  function hitDevice(e){pointerToNdc(e);const hits=raycaster.intersectObjects(Object.values(deviceRoots),true);if(!hits.length)return null;let o=hits[0].object;while(o&&!o.userData.deviceId)o=o.parent;return o?.userData.deviceId||null;}
  function hitGizmo(e){if(!transformGizmo.visible)return null;pointerToNdc(e);const hits=raycaster.intersectObjects(gizmoObjects,false);const h=hits.find(x=>x.object?.visible!==false);return h?{kind:h.object.userData.gizmoKind,axis:h.object.userData.gizmoAxis}:null;}
  function moveRootFromWorld(root,world,id){const parent=root.parent;const local=parent.worldToLocal(world.clone());root.position.x=snapVal(local.x);root.position.z=snapVal(local.z);const t=getDeviceTransform(id);updateDeviceTransform(id,{x:root.position.x,z:root.position.z,y:root.position.y,rotationX:root.rotation.x,rotationY:root.rotation.y,rotationZ:root.rotation.z,floor:t.floor});updateSelection();refreshSignals();callbacks.onTransform?.(id);}
  function pd(e){
    if(e.button===2){panning=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId);return;}
    const gh=hitGizmo(e);
    if(gh&&selectedId){const root=deviceRoots[selectedId];if(root.userData.positionLocked){showToast('此設備位置已固定');return;}gizmoDragging=true;gizmoKind=gh.kind;gizmoAxis=gh.axis;gizmoStart={x:e.clientX,y:e.clientY};gizmoBase={x:root.position.x,y:root.position.y,z:root.position.z,rx:root.rotation.x,ry:root.rotation.y,rz:root.rotation.z};renderer.domElement.setPointerCapture?.(e.pointerId);showToast(`${gh.kind==='move'?'移動':'旋轉'} ${gh.axis.toUpperCase()} 軸`);return;}
    const id=hitDevice(e);
    if(id){
      selectById(id);const root=deviceRoots[id];
      if(root.userData.positionLocked&&(editorMode==='move'||editorMode==='rotate')){showToast('此設備位置已固定');return;}
      if(editorMode==='move'){
        draggingDevice=true;moveVertical=!!e.shiftKey;
        if(moveVertical){lastX=e.clientX;lastY=e.clientY;}
        else {const worldY=floorElevation(getDeviceTransform(id).floor)+root.position.y;dragPlane.set(new THREE.Vector3(0,1,0),-worldY);pointerToNdc(e);if(raycaster.ray.intersectPlane(dragPlane,hitPoint)){const rootWorld=new THREE.Vector3();root.getWorldPosition(rootWorld);dragOffset.copy(rootWorld).sub(hitPoint);}}
        renderer.domElement.setPointerCapture?.(e.pointerId);return;
      }
      if(editorMode==='rotate'){
        draggingDevice=true;rotateStart=e.clientX;rotateBase={x:root.rotation.x,y:root.rotation.y,z:root.rotation.z};rotateAxis=e.shiftKey?'x':(e.altKey?'z':'y');renderer.domElement.setPointerCapture?.(e.pointerId);return;
      }
      return;
    }
    orbiting=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId);
  }
  function pm(e){
    if(gizmoDragging&&selectedId){const root=deviceRoots[selectedId],dx=e.clientX-gizmoStart.x,dy=e.clientY-gizmoStart.y;
      if(gizmoKind==='move'){
        const step=.018*Math.max(1,radius/18);let value=0;if(gizmoAxis==='x')value=dx*step;else if(gizmoAxis==='y')value=-dy*step;else value=dy*step;
        root.position.set(gizmoBase.x,gizmoBase.y,gizmoBase.z);root.position[gizmoAxis]=snapVal(gizmoBase[gizmoAxis]+value);
      }else{
        const delta=(dx-dy)*.01;root.rotation.set(gizmoBase.rx,gizmoBase.ry,gizmoBase.rz);root.rotation[gizmoAxis]=(gizmoAxis==='x'?gizmoBase.rx:gizmoAxis==='y'?gizmoBase.ry:gizmoBase.rz)+delta;
      }
      const tr=getDeviceTransform(selectedId);updateDeviceTransform(selectedId,{x:root.position.x,y:root.position.y,z:root.position.z,rotationX:root.rotation.x,rotationY:root.rotation.y,rotationZ:root.rotation.z,floor:tr.floor});updateSelection();refreshSignals();callbacks.onTransform?.(selectedId);return;
    }
    if(panning&&!state.simulator.follow){const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;const panScale=radius*.0025;const right=new THREE.Vector3();camera.getWorldDirection(right);right.cross(camera.up).normalize();const up=new THREE.Vector3(0,1,0);target.addScaledVector(right,-dx*panScale);target.addScaledVector(up,dy*panScale);return;}
    if(draggingDevice&&selectedId){const root=deviceRoots[selectedId];
      if(editorMode==='move'){
        if(moveVertical){const dy=e.clientY-lastY;lastY=e.clientY;root.position.y=snapVal(root.position.y-dy*.025);const tr=getDeviceTransform(selectedId);updateDeviceTransform(selectedId,{x:root.position.x,y:root.position.y,z:root.position.z,rotationX:root.rotation.x,rotationY:root.rotation.y,rotationZ:root.rotation.z,floor:tr.floor});updateSelection();refreshSignals();callbacks.onTransform?.(selectedId);}
        else {pointerToNdc(e);if(raycaster.ray.intersectPlane(dragPlane,hitPoint))moveRootFromWorld(root,hitPoint.add(dragOffset),selectedId);}
      }else if(editorMode==='rotate'){
        const delta=(e.clientX-rotateStart)*.012;root.rotation.set(rotateBase.x,rotateBase.y,rotateBase.z);root.rotation[rotateAxis]=rotateBase[rotateAxis]+delta;const tr=getDeviceTransform(selectedId);updateDeviceTransform(selectedId,{rotationX:root.rotation.x,rotationY:root.rotation.y,rotationZ:root.rotation.z,x:root.position.x,y:root.position.y,z:root.position.z,floor:tr.floor});updateSelection();refreshSignals();callbacks.onTransform?.(selectedId);
      }return;
    }
    if(orbiting&&!state.simulator.follow){const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;yaw-=dx*.008;pitch=Math.max(.12,Math.min(1.35,pitch+dy*.006));}
  }
  function pu(){draggingDevice=false;gizmoDragging=false;gizmoKind='';gizmoAxis='';orbiting=false;panning=false;moveVertical=false;}
  renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());renderer.domElement.addEventListener('pointerdown',pd);renderer.domElement.addEventListener('pointermove',pm);renderer.domElement.addEventListener('pointerup',pu);renderer.domElement.addEventListener('pointercancel',pu);
  renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();radius=Math.max(7,Math.min(60,radius+e.deltaY*.025));},{passive:false});
  let pinchDist=0;renderer.domElement.addEventListener('touchstart',e=>{if(e.touches.length===2)pinchDist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);},{passive:true});renderer.domElement.addEventListener('touchmove',e=>{if(e.touches.length===2){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);if(pinchDist)radius=Math.max(7,Math.min(60,radius-(d-pinchDist)*.03));pinchDist=d;}},{passive:true});

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
  function applyProjectState(){rebuildRoadMarkings();const profile=getSceneProfile();scene.background.setHex(profile.sky);scene.fog.color.setHex(profile.fog);hemi.intensity=profile.ambient;sun.intensity=profile.sun;mats.road.color.setHex(profile.road);state.floors.forEach(f=>{const fg=floorGroups[f.id];if(!fg)return;fg.visible=floorVisible(f.id);applyMaterialOpacity(fg,f.opacity)});Object.values(deviceRoots).forEach(root=>{root.visible=groupVisible('devices');applyMaterialOpacity(root,groupOpacity('devices'));});car.visible=groupVisible('vehicle');exitCar.visible=groupVisible('vehicle');signalGroup.visible=groupVisible('signals')&&state.simulator.signals;roadObjects.forEach(o=>{const link=o.userData?.floorLink;o.visible=groupVisible('road')&&(!link||link.some(fid=>floorVisible(fid)));});guard.visible=groupVisible('building');Object.values(deviceRoots).forEach(root=>{if(root.userData.zone){const on=groupVisible('signals')&&state.simulator.zones;root.userData.zone.visible=on;}if(root.userData.zoneEdges)root.userData.zoneEdges.visible=groupVisible('signals')&&state.simulator.zones;});applyTraceFocus();showToast(`${state.scene.time} · ${state.scene.weather} · ${state.scene.event}`);}
  function focusFloor(id){const f=state.floors.find(x=>x.id===id);if(!f)return;setFloorFocus(id);follow=false;target.set(0,f.elevation+1,0);yaw=.58;pitch=.42;radius=29;showToast('聚焦 '+f.name);}

  function executeDeviceAction(id,action,visited=new Set()){
    const visitKey=`${id}:${String(action).toLowerCase()}`;if(visited.has(visitKey))return false;visited.add(visitKey);
    const dev=devices.find(d=>d.id===id),root=deviceRoots[id];if(!dev||!root)return false;const type=(dev.type||'').toLowerCase();let status=String(action).toUpperCase();
    if(type==='barrier'){
      const s=getSettings(id);if(action==='open'){barrierOpen=true;state.simulator.barrier=true;root.userData.barrierTarget=-Math.PI/2;root.userData.barrierSeconds=Math.max(.2,Number(s.openTime)||3);status='OPENING';}
      else if(action==='close'||action==='reset'){barrierOpen=false;state.simulator.barrier=false;root.userData.barrierTarget=0;root.userData.barrierSeconds=Math.max(.2,Number(s.closeTime)||3);status='CLOSING';}
      else if(action==='stop'){root.userData.barrierTarget=null;status='STOPPED';}else if(action==='safety'){barrierOpen=true;root.userData.barrierTarget=-Math.PI/2;root.userData.barrierSeconds=Math.max(.2,Number(s.openTime)||3);status='SAFETY → OPENING';}
    }else if(type==='loop'){if(action==='vehicle'){loopOn=true;state.simulator.loop=true;status='ON';}else if(action==='clear'){loopOn=false;state.simulator.loop=false;status='OFF';}}
    else if(type==='uhf'){if(action==='read'){etagFlash=1;status='TAG DETECTED';}else status='READY';}
    else if(type==='traffic'||type==='ledpanel'){
      if(root.userData.trafficRed)root.userData.trafficRed.material.emissive?.setHex(action==='red'?0x660000:0x000000);
      if(root.userData.trafficGreen)root.userData.trafficGreen.material.emissive?.setHex(action==='green'?0x006600:0x000000);
      status=action==='off'?'OFF':action.toUpperCase();
    }else if(type==='infrared'){if(root.userData.beam)root.userData.beam.visible=action!=='blocked';status=action==='blocked'?'BLOCKED':'CLEAR';}
    else if(type==='beacon'){root.userData.flash=action==='flash';if(root.userData.beaconLamp){root.userData.beaconLamp.visible=action!=='off';root.userData.beaconLamp.material.emissive?.setHex(action==='off'?0x000000:0x553000);}status=action.toUpperCase();}
    else if(type==='bollard'){root.userData.bollardTarget=action==='up'?0.30:action==='down'?-0.20:(root.userData.bollard?.position.y??0.30);status=action.toUpperCase();}
    else if(type==='shutter'){const s=getSettings(id),h=Math.max(.5,Number(s.height)||2.6);if(action==='open'){root.userData.shutterTarget=h*.93;root.userData.shutterSeconds=Math.max(.2,Number(s.openTime)||6);status='OPENING';}else if(action==='close'){root.userData.shutterTarget=0;root.userData.shutterSeconds=Math.max(.2,Number(s.closeTime)||6);status='CLOSING';}else if(action==='stop'){root.userData.shutterTarget=null;status='STOPPED';}else if(action==='safety'){root.userData.shutterTarget=h*.93;root.userData.shutterSeconds=Math.max(.2,Number(s.openTime)||6);status='SAFETY → OPENING';}else status=action.toUpperCase();}
    else if(type==='relay'){if(root.userData.statusLamp)root.userData.statusLamp.material=action==='on'?mats.green:mats.gray;status=action==='on'?'NO CLOSED':'NC CLOSED';}
    else if(type==='estop'){if(root.userData.estop)root.userData.estop.position.y=action==='press'?.54:.62;status=action==='press'?'EMERGENCY STOP':'READY';}
    else if(type==='laneindicator'){if(root.userData.indicatorLight)root.userData.indicatorLight.material=action==='stop'?mats.red:mats.green;status=action.toUpperCase();}
    else if(type==='parkingdisplay'){status=action==='full'?'FULL':action==='available'?'AVAILABLE':action.toUpperCase();}
    else if(type==='timer'||type.includes('delay')){const s=getSettings(id);if(action==='start'||action==='on'){root.userData.timerRemaining=Math.max(.1,Number(s.seconds)||5);root.userData.timerRunning=true;status='RUNNING';}else if(action==='pause'){root.userData.timerRunning=!root.userData.timerRunning;status=root.userData.timerRunning?'RUNNING':'PAUSED';}else if(action==='reset'){root.userData.timerRunning=false;root.userData.timerRemaining=Math.max(.1,Number(s.seconds)||5);status='IDLE';}else status=action.toUpperCase();}
    else if(type==='cardreader'){status=action==='valid'?'VALID CARD':action==='invalid'?'INVALID CARD':'READY';}
    else if(type==='lpr'){status=action==='valid'?'PLATE OK':action==='invalid'?'PLATE FAIL':'READY';}
    else if(type==='ipcamera'){status=action==='record'?'RECORDING':action==='alarm'?'ALARM':'ONLINE';}
    else if(type==='accesscontroller'){status=action==='unlock'?'UNLOCKED':action==='lock'?'LOCKED':action==='alarm'?'ALARM':'ONLINE';}
    else if(type==='poeswitch'||type==='powersupply'){status=action==='on'?'ONLINE':action==='off'?'OFF':action==='fault'?'FAULT':'READY';}
    else if(type==='heightbar'){status=action==='overheight'?'OVERHEIGHT ALARM':action==='normal'?'NORMAL':'READY';}
    else status=action.toUpperCase();
    updateRuntime(id,{status,lastAction:action,active:!['off','clear','reset','close'].includes(action)});dev.state=status;
    const triggered=connectionsTriggeredBy(id,action);
    for(const conn of triggered){
      noteSignal(conn);
      const target=devices.find(d=>d.id===conn.toDevice);if(!target)continue;
      const nextAction=actionForTargetTerminal(target.type,conn.toTerminal);
      executeDeviceAction(target.id,nextAction,visited);
    }
    showToast(triggered.length?`${dev.name} · ${status} · 傳遞 ${triggered.length} 條訊號`:`${dev.name} · ${status}`);callbacks.onSelection?.(id);return true;
  }

  const controllerApi={
    setBarrier(open){barrierOpen=!!open;state.simulator.barrier=barrierOpen;showToast(open?'Barrier OPEN':'Barrier CLOSE');},
    toggleLoop(){loopOn=!loopOn;state.simulator.loop=loopOn;showToast('Loop '+(loopOn?'ON':'OFF'));},
    triggerEtag(){etagFlash=1;showToast('ETAG DETECTED');setText('etagState','DETECTED');setTimeout(()=>setText('etagState','READY'),1200);},
    toggleSignals(){state.simulator.signals=!state.simulator.signals;signalGroup.visible=state.simulator.signals;return state.simulator.signals;},
    toggleZones(){state.simulator.zones=!state.simulator.zones;Object.values(deviceRoots).forEach(root=>{if(root.userData.zone)root.userData.zone.visible=state.simulator.zones;if(root.userData.zoneEdges)root.userData.zoneEdges.visible=state.simulator.zones;});return state.simulator.zones;},
    resetCar(){car.position.set(-2.05,0,15);car.rotation.y=0;exitCar.position.set(2.05,0,-15);exitCar.rotation.y=Math.PI;speed=0;keys.clear();showToast('入口／出口車輛已重設');},
    setDrive(dir,on=true){const code={forward:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD'}[dir];if(!code)return;if(on)keys.add(code);else keys.delete(code);},
    stop(){keys.clear();speed=0;},
    setFollow(v){follow=!!v;state.simulator.follow=follow;},
    saveView(){const floor=state.editor.floorFocus||'1F',v={name:'視野 '+(state.simulator.viewpoints.length+1),yaw,pitch,radius,target:[target.x,target.y,target.z],floor};addViewpoint(v);showToast('已儲存目前視野');return v;},
    nextView(){state.simulator.cameraPreset=(state.simulator.cameraPreset+1)%state.simulator.viewpoints.length;this.gotoView(state.simulator.cameraPreset);},
    gotoView(i){const v=state.simulator.viewpoints[i];if(!v)return;follow=false;yaw=v.yaw;pitch=v.pitch;radius=v.radius;target.set(...v.target);state.simulator.cameraPreset=i;if(v.floor)setFloorFocus(v.floor);showToast(v.name);},
    applyProjectState(){ensureDevices();applyProjectState();},
    refreshRoadMarkings(){rebuildRoadMarkings();showToast('道路標線已更新');},
    focusFloor,
    setEditorMode(mode){editorMode=mode;saveEditorMode(mode);host.dataset.tool=mode;updateSelection();showToast('3D工具：'+mode);},
    setSnap(v){snap=!!v;state.editor.snap=snap;},
    applyDeviceTransform(id){ensureDevices();syncTransform(id);updateSelection();refreshSignals();},
    applyDeviceSettings(id){applySettings(id);updateSelection();refreshSignals();},
    applyTraceFocus(){const trace=applyTraceFocus();showToast(state.signalTrace?.enabled?'Focus Network ON':'Focus Network OFF');return trace;},
    selectDevice(id){selectById(id);},
    executeDeviceAction(id,action){return executeDeviceAction(id,action);},
    toggleLabels(){state.simulator.labels=state.simulator.labels===false;Object.entries(deviceRoots).forEach(([id,root])=>{const d=devices.find(x=>x.id===id);if(d)updateDeviceLabel(d,root,true)});return state.simulator.labels;},
    runLaneDemo(mode='entry'){
      this.resetCar();laneDemo={running:true,mode,entry:{step:0,elapsed:0},exit:{step:0,elapsed:0}};follow=false;yaw=.62;pitch=.50;radius=25;target.set(0,1,0);
      ['DEV-001','DEV-006'].forEach(id=>executeDeviceAction(id,'close'));['DEV-007','DEV-011'].forEach(id=>executeDeviceAction(id,'red'));['DEV-008','DEV-012'].forEach(id=>executeDeviceAction(id,'reset'));
      showToast(mode==='both'?'▶ 雙車道動作展示開始':mode==='exit'?'▶ 出口車道展示開始':'▶ 入口車道展示開始');return true;
    },
    destroy(){cancelAnimationFrame(raf);resizeObserver.disconnect();window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);renderer.domElement.removeEventListener('pointerdown',pd);renderer.domElement.removeEventListener('pointermove',pm);renderer.domElement.removeEventListener('pointerup',pu);renderer.dispose();host.innerHTML='';}
  };

  ensureDevices();applyProjectState();focusFloor(state.editor.floorFocus||'1F');if(selectedId&&deviceRoots[selectedId])selectById(selectedId,false);
  function resize(){const r=host.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);resize();

  let last=performance.now(),raf=0;function frame(now){const dt=Math.min(.04,(now-last)/1000);last=now;ensureDevices();const forward=keys.has('KeyW')||keys.has('ArrowUp'),back=keys.has('KeyS')||keys.has('ArrowDown'),left=keys.has('KeyA')||keys.has('ArrowLeft'),right=keys.has('KeyD')||keys.has('ArrowRight');const accel=(forward?1:0)-(back?1:0);speed+=accel*8*dt;speed*=Math.pow(.88,dt*60);speed=Math.max(-3.4,Math.min(6.2,speed));const steer=((left?1:0)-(right?1:0))*.95;if(Math.abs(speed)>.05){car.rotation.y+=steer*dt*(speed>=0?1:-1);const dir=new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0),car.rotation.y);car.position.addScaledVector(dir,speed*dt);car.position.x=Math.max(-3.1,Math.min(3.1,car.position.x));car.position.z=Math.max(-19,Math.min(19,car.position.z));}
    if(laneDemo.running){
      const runEntry=laneDemo.mode==='entry'||laneDemo.mode==='both',runExit=laneDemo.mode==='exit'||laneDemo.mode==='both';
      if(runEntry){const d=laneDemo.entry;d.elapsed+=dt;
        if(d.step===0){car.position.z-=dt*4.6;if(car.position.z<4.5){d.step=1;d.elapsed=0;executeDeviceAction('DEV-003','vehicle');showToast('入口地感 ON → 入口 Controller');}}
        else if(d.step===1&&d.elapsed>.65){executeDeviceAction('DEV-001','open');executeDeviceAction('DEV-007','green');executeDeviceAction('DEV-008','start');d.step=2;d.elapsed=0;}
        else if(d.step===2&&d.elapsed>2.8){d.step=3;d.elapsed=0;}
        else if(d.step===3){car.position.z-=dt*4.8;if(car.position.z<-8){executeDeviceAction('DEV-003','clear');executeDeviceAction('DEV-001','close');executeDeviceAction('DEV-007','red');d.step=4;d.elapsed=0;}}
      }
      if(runExit){const d=laneDemo.exit;d.elapsed+=dt;
        if(d.step===0){exitCar.position.z+=dt*4.4;if(exitCar.position.z>-4.5){d.step=1;d.elapsed=0;executeDeviceAction('DEV-009','vehicle');showToast('出口地感 ON → 出口 Controller');}}
        else if(d.step===1&&d.elapsed>.65){executeDeviceAction('DEV-006','open');executeDeviceAction('DEV-011','green');executeDeviceAction('DEV-012','start');d.step=2;d.elapsed=0;}
        else if(d.step===2&&d.elapsed>2.8){d.step=3;d.elapsed=0;}
        else if(d.step===3){exitCar.position.z+=dt*4.8;if(exitCar.position.z>8){executeDeviceAction('DEV-009','clear');executeDeviceAction('DEV-006','close');executeDeviceAction('DEV-011','red');d.step=4;d.elapsed=0;}}
      }
      const entryDone=!runEntry||laneDemo.entry.step>=4,exitDone=!runExit||laneDemo.exit.step>=4;
      if(entryDone&&exitDone){laneDemo.entry.elapsed+=dt;laneDemo.exit.elapsed+=dt;if(Math.max(laneDemo.entry.elapsed,laneDemo.exit.elapsed)>3.4){laneDemo.running=false;showToast('✅ 雙車道展示完成');}}
    }
    const loopDevice=devices.find(d=>(d.type||'').toLowerCase().includes('loop'));const barrierDevice=devices.find(d=>(d.type||'').toLowerCase().includes('barrier'));const etagDevice=devices.find(d=>(d.type||'').toLowerCase().includes('etag')||(d.type||'').toLowerCase().includes('uhf'));const loopRoot=loopDevice?deviceRoots[loopDevice.id]:null;const barrierRoot=barrierDevice?deviceRoots[barrierDevice.id]:null;const etagRoot=etagDevice?deviceRoots[etagDevice.id]:null;
    if(loopRoot){const carWorld=new THREE.Vector3();car.getWorldPosition(carWorld);const loopWorld=new THREE.Vector3();loopRoot.getWorldPosition(loopWorld);const detected=Math.abs(carWorld.x-loopWorld.x)<3.15&&Math.abs(carWorld.z-loopWorld.z)<2.1;if(detected!==loopOn){loopOn=detected;state.simulator.loop=loopOn;if(loopOn)executeDeviceAction(loopDevice.id,'vehicle');else executeDeviceAction(loopDevice.id,'clear');}if(loopRoot.userData.zoneMat)loopRoot.userData.zoneMat.opacity=loopOn?.55:.2;}
    Object.entries(deviceRoots).forEach(([id,root])=>{if(root.userData.barrierPivot&&root.userData.barrierTarget!==null&&root.userData.barrierTarget!==undefined){const cur=root.userData.barrierPivot.rotation.z,targetAngle=root.userData.barrierTarget,secs=Math.max(.2,root.userData.barrierSeconds||3),step=(Math.PI/2)/secs*dt,diff=targetAngle-cur;if(Math.abs(diff)<=step){root.userData.barrierPivot.rotation.z=targetAngle;root.userData.barrierTarget=null;const bd=getRuntime(id);updateRuntime(id,{...(bd||{}),status:targetAngle<0?'OPEN':'CLOSED',active:targetAngle<0});}else root.userData.barrierPivot.rotation.z+=Math.sign(diff)*step;}if(root.userData.beaconLamp&&root.userData.flash)root.userData.beaconLamp.visible=Math.floor(now/250)%2===0;if(root.userData.bollard&&root.userData.bollardTarget!==undefined&&root.userData.bollardTarget!==null)root.userData.bollard.position.y+=(root.userData.bollardTarget-root.userData.bollard.position.y)*Math.min(1,dt*5);if(root.userData.shutterDoor&&root.userData.shutterTarget!==undefined&&root.userData.shutterTarget!==null){const cur=root.userData.shutterDoor.position.y,tg=root.userData.shutterTarget,secs=Math.max(.2,root.userData.shutterSeconds||6),travel=Math.max(.5,Number(getSettings(id).height)||2.6),step=travel/secs*dt,diff=tg-cur;if(Math.abs(diff)<=step){root.userData.shutterDoor.position.y=tg;root.userData.shutterTarget=null;const rt=getRuntime(id);updateRuntime(id,{...(rt||{}),status:tg>0?'OPEN':'CLOSED',active:tg>0});}else root.userData.shutterDoor.position.y+=Math.sign(diff)*step;}if(root.userData.timerRunning){root.userData.timerRemaining=Math.max(0,(root.userData.timerRemaining||0)-dt);const remain=root.userData.timerRemaining,rt=getRuntime(id);updateRuntime(id,{...(rt||{}),status:`RUNNING ${Math.ceil(remain)}s`,active:true});updateCountdownLabel(id,root,Math.ceil(remain));if(root.userData.displayPanel){const pulse=.45+.35*(.5+.5*Math.sin(now*.012));root.userData.displayPanel.material.emissive?.setHex(0x550000);root.userData.displayPanel.material.emissiveIntensity=pulse;}if(remain<=0){root.userData.timerRunning=false;updateCountdownLabel(id,root,'0');updateRuntime(id,{...(rt||{}),status:'DONE',lastAction:'DONE',active:false});executeDeviceAction(id,'done',new Set());}}else if(root.userData.timerRemaining!==undefined){updateCountdownLabel(id,root,Math.ceil(root.userData.timerRemaining));}const dev=devices.find(d=>d.id===id);if(dev)updateDeviceLabel(dev,root);});
    if(state.signalTrace?.enabled)applyTraceFocus();else signalGroup.children.forEach(l=>l.material.opacity=loopOn?1:.35);
    if(etagRoot?.userData.reader){if(etagFlash>0){etagFlash=Math.max(0,etagFlash-dt*1.7);etagRoot.userData.reader.scale.setScalar(1+etagFlash*.18);}else etagRoot.userData.reader.scale.setScalar(1);}
    setText('simStatus',loopOn?'LOOP ON · Barrier OPEN':barrierOpen?'Barrier OPEN':'3D EDIT READY');setText('loopState',loopOn?'ON':'OFF');setText('barrierState3d',barrierOpen?'OPEN':'CLOSED');
    const carWorld=new THREE.Vector3();car.getWorldPosition(carWorld);if(follow){const behind=new THREE.Vector3(0,4.2,7).applyAxisAngle(new THREE.Vector3(0,1,0),car.rotation.y);camera.position.lerp(carWorld.clone().add(behind),.12);camera.lookAt(carWorld.x,carWorld.y+1,carWorld.z);}else{camera.position.set(target.x+radius*Math.cos(pitch)*Math.sin(yaw),target.y+radius*Math.sin(pitch),target.z+radius*Math.cos(pitch)*Math.cos(yaw));camera.lookAt(target);}updateSelection();renderer.render(scene,camera);raf=requestAnimationFrame(frame);}raf=requestAnimationFrame(frame);setText('simStatus',`TRUE 3D READY · ${host.dataset.rendererMode||'WebGL2'}`);state.runtimeHealth??={};state.runtimeHealth.webglReady=true;state.runtimeHealth.simulatorReady=true;state.runtimeHealth.lastError='';controllerApi.localFallback=false;showToast('V1.4.9 功能狀態驗證版已啟動');return controllerApi;
}
