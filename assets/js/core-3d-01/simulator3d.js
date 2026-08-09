import {state} from '../state.js';

let active=null;
const THREE_URL='https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js';

function setText(id,text){const el=document.getElementById(id);if(el)el.textContent=text;}
function showToast(text){const el=document.getElementById('simToast');if(!el)return;el.textContent=text;el.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>el.classList.remove('show'),1500);}

export function unmountSimulator3D(){
  if(!active)return;
  active.destroy();
  active=null;
}

export async function mountSimulator3D(){
  unmountSimulator3D();
  const host=document.getElementById('threeStage');
  if(!host)return null;
  setText('threeLoading','正在載入 Three.js 3D 核心…');
  try{
    const THREE=await import(THREE_URL);
    if(!document.getElementById('threeStage'))return null;
    active=createSimulator(THREE,host);
    return active;
  }catch(err){
    console.error(err);
    host.innerHTML='<div class="three-error"><b>3D 核心載入失敗</b><br>請確認目前網路可連到 jsDelivr CDN。其他 UTOP 功能仍可使用。</div>';
    setText('simStatus','3D OFFLINE');
    return null;
  }
}

function createSimulator(THREE,host){
  host.innerHTML='';
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0xbdd7e5);
  scene.fog=new THREE.Fog(0xbdd7e5,35,80);

  const camera=new THREE.PerspectiveCamera(55,1,0.1,150);
  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff,0x506060,1.8));
  const sun=new THREE.DirectionalLight(0xffffff,2.6);sun.position.set(10,18,12);sun.castShadow=true;scene.add(sun);

  const mat={
    ground:new THREE.MeshStandardMaterial({color:0x9db27f,roughness:1}),
    road:new THREE.MeshStandardMaterial({color:0x42464a,roughness:.92}),
    white:new THREE.MeshStandardMaterial({color:0xf1f1e8,roughness:.75}),
    orange:new THREE.MeshStandardMaterial({color:0xf59e0b,roughness:.55,metalness:.12}),
    red:new THREE.MeshStandardMaterial({color:0xc84e45,roughness:.6}),
    blue:new THREE.MeshStandardMaterial({color:0x476f91,roughness:.5,metalness:.1}),
    dark:new THREE.MeshStandardMaterial({color:0x23292e,roughness:.85}),
    building:new THREE.MeshStandardMaterial({color:0xe8dfcf,roughness:.9})
  };

  const ground=new THREE.Mesh(new THREE.BoxGeometry(30,.35,48),mat.ground);ground.position.y=-.28;ground.receiveShadow=true;scene.add(ground);
  const road=new THREE.Mesh(new THREE.BoxGeometry(8,.18,42),mat.road);road.position.y=0;road.receiveShadow=true;scene.add(road);
  for(let z=-18;z<=18;z+=4){const d=new THREE.Mesh(new THREE.BoxGeometry(.13,.03,2),mat.white);d.position.set(0,.12,z);scene.add(d);}

  const guard=new THREE.Mesh(new THREE.BoxGeometry(4,3.1,4),mat.building);guard.position.set(-6,1.55,-1);guard.castShadow=true;guard.receiveShadow=true;scene.add(guard);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(4.4,.25,4.4),mat.dark);roof.position.set(-6,3.22,-1);scene.add(roof);

  const loopMat=new THREE.MeshBasicMaterial({color:0xf3c53f,transparent:true,opacity:.2,side:THREE.DoubleSide,depthWrite:false});
  const loopZone=new THREE.Mesh(new THREE.BoxGeometry(5.6,.05,3.4),loopMat);loopZone.position.set(0,.14,2.2);scene.add(loopZone);
  const loopEdges=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(5.6,.08,3.4)),new THREE.LineBasicMaterial({color:0xffcf39}));loopEdges.position.copy(loopZone.position);scene.add(loopEdges);

  const etag=new THREE.Group();
  const etagPole=new THREE.Mesh(new THREE.BoxGeometry(.24,3,.24),mat.dark);etagPole.position.y=1.5;
  const etagReader=new THREE.Mesh(new THREE.BoxGeometry(1.05,.72,.25),mat.orange);etagReader.position.set(0,2.65,.05);
  etag.add(etagPole,etagReader);etag.position.set(-4.6,0,7.2);scene.add(etag);
  const etagZone=new THREE.Mesh(new THREE.ConeGeometry(3.8,7,32,1,true),new THREE.MeshBasicMaterial({color:0xffa51d,transparent:true,opacity:.13,side:THREE.DoubleSide,depthWrite:false}));etagZone.rotation.x=Math.PI/2;etagZone.position.set(-4.6,2.25,3.7);scene.add(etagZone);

  const barrier=new THREE.Group();
  const cabinet=new THREE.Mesh(new THREE.BoxGeometry(1.05,2.05,1.05),mat.orange);cabinet.position.set(3.8,1.04,-4.6);cabinet.castShadow=true;barrier.add(cabinet);
  const pivot=new THREE.Group();pivot.position.set(3.32,1.82,-4.6);
  const arm=new THREE.Mesh(new THREE.BoxGeometry(5.8,.18,.18),mat.white);arm.position.x=-2.88;arm.castShadow=true;pivot.add(arm);barrier.add(pivot);scene.add(barrier);

  const controller=new THREE.Mesh(new THREE.BoxGeometry(1.3,1.5,.8),mat.dark);controller.position.set(-4.9,.75,-4.2);controller.castShadow=true;scene.add(controller);

  const car=new THREE.Group();
  const carBody=new THREE.Mesh(new THREE.BoxGeometry(2.05,.7,4.15),mat.blue);carBody.position.y=.72;carBody.castShadow=true;
  const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.6,.62,1.9),mat.dark);cabin.position.set(0,1.3,-.2);cabin.castShadow=true;car.add(carBody,cabin);
  const wheelMat=new THREE.MeshStandardMaterial({color:0x171717,roughness:1});
  [[-.98,.4,-1.32],[.98,.4,-1.32],[-.98,.4,1.32],[.98,.4,1.32]].forEach(p=>{const w=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.3,18),wheelMat);w.rotation.z=Math.PI/2;w.position.set(...p);car.add(w);});
  car.position.set(0,0,15);car.rotation.y=Math.PI;scene.add(car);

  const signalGroup=new THREE.Group();
  function curvedLine(a,b,color){const mid=new THREE.Vector3((a.x+b.x)/2,3.2,(a.z+b.z)/2);const c=new THREE.QuadraticBezierCurve3(a,mid,b);return new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(36)),new THREE.LineBasicMaterial({color,transparent:true,opacity:.9}));}
  signalGroup.add(curvedLine(new THREE.Vector3(0,.5,2.2),new THREE.Vector3(-4.9,1.6,-4.2),0x52b7ff));
  signalGroup.add(curvedLine(new THREE.Vector3(-4.9,1.6,-4.2),new THREE.Vector3(3.8,2.2,-4.6),0xff8c25));scene.add(signalGroup);

  const keys=new Set();
  let speed=0,steer=0,loopOn=false,barrierOpen=!!state.simulator.barrier;
  let yaw=.62,pitch=.42,radius=27,target=new THREE.Vector3(0,1,0),drag=false,lastX=0,lastY=0,follow=!!state.simulator.follow;
  let etagFlash=0;

  const controllerApi={
    setBarrier(open){barrierOpen=!!open;state.simulator.barrier=barrierOpen;showToast(open?'Barrier OPEN':'Barrier CLOSE');},
    toggleLoop(){loopOn=!loopOn;state.simulator.loop=loopOn;showToast('Loop '+(loopOn?'ON':'OFF'));},
    triggerEtag(){etagFlash=1;showToast('ETAG DETECTED');setText('etagState','DETECTED');setTimeout(()=>setText('etagState','READY'),1200);},
    toggleSignals(){state.simulator.signals=!state.simulator.signals;signalGroup.visible=state.simulator.signals;return state.simulator.signals;},
    toggleZones(){state.simulator.zones=!state.simulator.zones;etagZone.visible=state.simulator.zones;loopZone.visible=state.simulator.zones;loopEdges.visible=state.simulator.zones;return state.simulator.zones;},
    resetCar(){car.position.set(0,0,15);car.rotation.y=Math.PI;speed=0;keys.clear();showToast('車輛已重設');},
    setDrive(dir,on=true){const code={forward:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD'}[dir];if(!code)return;if(on)keys.add(code);else keys.delete(code);},
    stop(){keys.clear();speed=0;},
    setFollow(v){follow=!!v;state.simulator.follow=follow;},
    saveView(){const v={name:'視野 '+(state.simulator.viewpoints.length+1),yaw,pitch,radius,target:[target.x,target.y,target.z]};state.simulator.viewpoints.push(v);state.viewpoints.push(v.name);showToast('已儲存目前視野');return v;},
    nextView(){state.simulator.cameraPreset=(state.simulator.cameraPreset+1)%state.simulator.viewpoints.length;this.gotoView(state.simulator.cameraPreset);},
    gotoView(i){const v=state.simulator.viewpoints[i];if(!v)return;follow=false;yaw=v.yaw;pitch=v.pitch;radius=v.radius;target.set(...v.target);state.simulator.cameraPreset=i;showToast(v.name);},
    destroy(){cancelAnimationFrame(raf);resizeObserver.disconnect();window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);renderer.domElement.removeEventListener('pointerdown',pd);renderer.domElement.removeEventListener('pointermove',pm);renderer.domElement.removeEventListener('pointerup',pu);renderer.dispose();host.innerHTML='';}
  };

  signalGroup.visible=state.simulator.signals;etagZone.visible=state.simulator.zones;loopZone.visible=state.simulator.zones;loopEdges.visible=state.simulator.zones;

  function onKeyDown(e){
    const el=document.activeElement;if(el&&['INPUT','TEXTAREA','SELECT'].includes(el.tagName))return;
    if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)){e.preventDefault();keys.add(e.code);}
  }
  function onKeyUp(e){keys.delete(e.code);}
  window.addEventListener('keydown',onKeyDown,{passive:false});window.addEventListener('keyup',onKeyUp);

  function pd(e){drag=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId);}
  function pm(e){if(!drag||follow)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;yaw-=dx*.008;pitch=Math.max(.12,Math.min(1.35,pitch+dy*.006));}
  function pu(){drag=false;}
  renderer.domElement.addEventListener('pointerdown',pd);renderer.domElement.addEventListener('pointermove',pm);renderer.domElement.addEventListener('pointerup',pu);renderer.domElement.addEventListener('pointercancel',pu);
  renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();radius=Math.max(7,Math.min(48,radius+e.deltaY*.025));},{passive:false});

  let pinchDist=0;
  renderer.domElement.addEventListener('touchstart',e=>{if(e.touches.length===2)pinchDist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);},{passive:true});
  renderer.domElement.addEventListener('touchmove',e=>{if(e.touches.length===2){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);if(pinchDist)radius=Math.max(7,Math.min(48,radius-(d-pinchDist)*.03));pinchDist=d;}},{passive:true});

  function resize(){const r=host.getBoundingClientRect();const w=Math.max(1,r.width),h=Math.max(1,r.height);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);resize();

  let last=performance.now(),raf=0;
  function frame(now){
    const dt=Math.min(.04,(now-last)/1000);last=now;
    const forward=keys.has('KeyW')||keys.has('ArrowUp'),back=keys.has('KeyS')||keys.has('ArrowDown');
    const left=keys.has('KeyA')||keys.has('ArrowLeft'),right=keys.has('KeyD')||keys.has('ArrowRight');
    const accel=(forward?1:0)-(back?1:0);speed+=accel*8*dt;speed*=Math.pow(.88,dt*60);speed=Math.max(-3.4,Math.min(6.2,speed));
    steer=((left?1:0)-(right?1:0))*.95;
    if(Math.abs(speed)>.05){car.rotation.y+=steer*dt*(speed>=0?1:-1);const dir=new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0),car.rotation.y);car.position.addScaledVector(dir,speed*dt);car.position.x=Math.max(-3.1,Math.min(3.1,car.position.x));car.position.z=Math.max(-19,Math.min(19,car.position.z));}
    const detected=Math.abs(car.position.x)<3.15&&car.position.z>0.2&&car.position.z<4.2;
    if(detected!==loopOn){loopOn=detected;state.simulator.loop=loopOn;if(loopOn){barrierOpen=true;state.simulator.barrier=true;showToast('LOOP ON → DI1 → Relay → DO1');}else{showToast('LOOP OFF');}}
    const barrierTarget=barrierOpen?-Math.PI/2:0;pivot.rotation.z+=(barrierTarget-pivot.rotation.z)*.08;
    loopMat.opacity=loopOn?.55:.2;
    signalGroup.children.forEach(l=>l.material.opacity=loopOn?1:.35);
    if(etagFlash>0){etagFlash=Math.max(0,etagFlash-dt*1.7);etagReader.scale.setScalar(1+etagFlash*.18);}else etagReader.scale.setScalar(1);
    setText('simStatus',loopOn?'LOOP ON · Barrier OPEN':barrierOpen?'Barrier OPEN':'待命');
    setText('loopState',loopOn?'ON':'OFF');setText('barrierState3d',barrierOpen?'OPEN':'CLOSED');
    if(follow){const behind=new THREE.Vector3(0,4.2,7).applyAxisAngle(new THREE.Vector3(0,1,0),car.rotation.y);camera.position.lerp(car.position.clone().add(behind),.12);camera.lookAt(car.position.x,1,car.position.z);}else{camera.position.set(target.x+radius*Math.cos(pitch)*Math.sin(yaw),target.y+radius*Math.sin(pitch),target.z+radius*Math.cos(pitch)*Math.cos(yaw));camera.lookAt(target);}
    renderer.render(scene,camera);raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
  setText('simStatus','3D READY');showToast('Three.js 3D 核心已啟動');
  return controllerApi;
}
