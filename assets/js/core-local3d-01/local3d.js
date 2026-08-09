import {state} from '../state.js';
import {devices} from '../data.js';
import {getDeviceTransform,updateDeviceTransform,selectDevice,setFloorFocus,setEditorMode as saveEditorMode} from '../core-editor-01/editor-commands.js';
import {getRuntime,updateRuntime,controlsFor} from '../core-module-01/module-manager.js';
import {traceNetwork} from '../core-signal-01/signal-trace.js';

function labelFor(d){return d?.name||d?.id||'';}
function colorFor(type=''){
  const t=type.toLowerCase();
  if(t.includes('barrier'))return '#f59e0b';
  if(t.includes('etag')||t.includes('uhf'))return '#f97316';
  if(t.includes('loop'))return '#eab308';
  if(t.includes('controller')||t.includes('relay'))return '#334155';
  if(t.includes('camera')||t.includes('lpr'))return '#2563eb';
  if(t.includes('traffic')||t.includes('indicator'))return '#16a34a';
  if(t.includes('shutter'))return '#64748b';
  return '#7c3aed';
}
export function createLocal3D(host,callbacks={}){
  host.innerHTML='';
  const wrap=document.createElement('div');wrap.className='local3d-wrap';
  const canvas=document.createElement('canvas');canvas.className='local3d-canvas';wrap.appendChild(canvas);
  const badge=document.createElement('div');badge.className='local3d-badge';badge.textContent='LOCAL 3D 備援核心';wrap.appendChild(badge);host.appendChild(wrap);
  const ctx=canvas.getContext('2d');
  let raf=0,selected=state.selectedDevice||devices[0]?.id||null,mode=state.editor.mode||'select',zoom=1,panX=0,panY=0,drag=null,car={x:0,z:15,a:0,s:0},keys=new Set(),follow=false;
  function resize(){const r=host.getBoundingClientRect();canvas.width=Math.max(640,Math.floor(r.width*(devicePixelRatio||1)));canvas.height=Math.max(420,Math.floor(r.height*(devicePixelRatio||1)));canvas.style.width=r.width+'px';canvas.style.height=r.height+'px';}
  const ro=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;if(ro)ro.observe(host);else window.addEventListener('resize',resize);resize();
  function project(x,y,z){
    const w=canvas.width,h=canvas.height,dpr=devicePixelRatio||1;const s=18*dpr*zoom;const cx=w*.5+panX*dpr,cy=h*.64+panY*dpr;
    return {x:cx+(x-z*.35)*s,y:cy+(z*.55-y*1.9)*s};
  }
  function drawRoad(){
    const w=canvas.width,h=canvas.height;ctx.fillStyle='#cbd5c0';ctx.fillRect(0,0,w,h);ctx.fillStyle='#475569';
    const a=project(-4,0,-20),b=project(4,0,-20),c=project(4,0,22),d=project(-4,0,22);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#f8fafc';ctx.lineWidth=2*(devicePixelRatio||1);ctx.setLineDash([12,12]);const p1=project(0,.02,-18),p2=project(0,.02,20);ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();ctx.setLineDash([]);
    (state.roadMarkings||[]).filter(m=>m.visible!==false).forEach(m=>{const p=project(Number(m.x)||0,.04,Number(m.z)||0);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-(Number(m.rotation)||0)*Math.PI/180);ctx.strokeStyle=String(m.kind).includes('double')||String(m.kind).includes('hatch')?'#f4c542':'#ffffff';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=Math.max(2,(Number(m.width)||.1)*14)*(devicePixelRatio||1);const len=Math.max(8,(Number(m.length)||1)*18)*(devicePixelRatio||1);if(m.kind==='zebra'){for(let i=-3;i<=3;i++)ctx.fillRect(-30*(devicePixelRatio||1),i*7*(devicePixelRatio||1),60*(devicePixelRatio||1),3*(devicePixelRatio||1));}else if(m.kind==='dash'){ctx.setLineDash([10,10]);ctx.beginPath();ctx.moveTo(0,-len/2);ctx.lineTo(0,len/2);ctx.stroke();ctx.setLineDash([]);}else{ctx.beginPath();ctx.moveTo(0,-len/2);ctx.lineTo(0,len/2);ctx.stroke();}ctx.restore();});
  }
  function drawConnection(c,trace){const a=getDeviceTransform(c.fromDevice),b=getDeviceTransform(c.toDevice);if(!a||!b)return;const p=project(a.x,a.y+1,a.z),q=project(b.x,b.y+1,b.z);const active=!state.signalTrace?.enabled||trace.connections.includes(c.id);ctx.strokeStyle=active?(c.type==='DI'?'#38bdf8':c.type==='DO'?'#fb923c':'#a78bfa'):'rgba(100,116,139,.14)';ctx.lineWidth=(active?3:1)*(devicePixelRatio||1);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.quadraticCurveTo((p.x+q.x)/2,(p.y+q.y)/2-45*(devicePixelRatio||1),q.x,q.y);ctx.stroke();}
  function drawDevice(d,trace){const t=getDeviceTransform(d.id);if(!t)return;const p=project(t.x,t.y,t.z);const onTrace=!state.signalTrace?.enabled||trace.devices.includes(d.id);ctx.globalAlpha=onTrace?1:.18;ctx.fillStyle=colorFor(d.type);ctx.strokeStyle=d.id===selected?'#111827':'#ffffff';ctx.lineWidth=(d.id===selected?4:2)*(devicePixelRatio||1);const size=(d.type.toLowerCase().includes('loop')?20:12)*(devicePixelRatio||1);ctx.beginPath();if(typeof ctx.roundRect==='function'){ctx.roundRect(p.x-size,p.y-size*1.2,size*2,size*2.4,5*(devicePixelRatio||1));ctx.fill();ctx.stroke();}else{ctx.fillRect(p.x-size,p.y-size*1.2,size*2,size*2.4);ctx.strokeRect(p.x-size,p.y-size*1.2,size*2,size*2.4);}ctx.globalAlpha=1;ctx.fillStyle='#111827';ctx.font=`${12*(devicePixelRatio||1)}px sans-serif`;ctx.textAlign='center';ctx.fillText(labelFor(d),p.x,p.y-size*1.6);const rt=getRuntime(d.id);ctx.font=`${10*(devicePixelRatio||1)}px sans-serif`;ctx.fillText(rt?.status||d.state||'',p.x,p.y+size*1.8);}
  function drawCar(){const p=project(car.x,.2,car.z);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-car.a);ctx.fillStyle='#0f766e';ctx.fillRect(-10*(devicePixelRatio||1),-18*(devicePixelRatio||1),20*(devicePixelRatio||1),36*(devicePixelRatio||1));ctx.fillStyle='#bae6fd';ctx.fillRect(-7*(devicePixelRatio||1),-10*(devicePixelRatio||1),14*(devicePixelRatio||1),11*(devicePixelRatio||1));ctx.restore();}
  function frame(){
    const f=keys.has('KeyW')||keys.has('ArrowUp'),b=keys.has('KeyS')||keys.has('ArrowDown'),l=keys.has('KeyA')||keys.has('ArrowLeft'),r=keys.has('KeyD')||keys.has('ArrowRight');const acc=(f?1:0)-(b?1:0);car.s=(car.s+acc*.08)*.94;car.s=Math.max(-1.2,Math.min(2,car.s));if(Math.abs(car.s)>.02)car.a+=((l?1:0)-(r?1:0))*.035*(car.s>=0?1:-1);car.x+=Math.sin(car.a)*car.s*.08;car.z-=Math.cos(car.a)*car.s*.08;
    ctx.clearRect(0,0,canvas.width,canvas.height);drawRoad();const trace=state.signalTrace?.enabled?traceNetwork(state.signalTrace.focusDevice,state.signalTrace.mode||'full'):{devices:devices.map(d=>d.id),connections:state.connections.map(c=>c.id)};if(state.simulator.signals!==false)state.connections.filter(c=>c.enabled!==false).forEach(c=>drawConnection(c,trace));devices.forEach(d=>drawDevice(d,trace));drawCar();raf=requestAnimationFrame(frame);
  }
  function hit(e){const r=canvas.getBoundingClientRect(),mx=(e.clientX-r.left)*(canvas.width/r.width),my=(e.clientY-r.top)*(canvas.height/r.height);let best=null,dist=Infinity;for(const d of devices){const t=getDeviceTransform(d.id),p=project(t.x,t.y,t.z),dd=Math.hypot(mx-p.x,my-p.y);if(dd<30*(devicePixelRatio||1)&&dd<dist){best=d.id;dist=dd;}}return best;}
  canvas.addEventListener('pointerdown',e=>{const id=hit(e);if(id){selected=id;selectDevice(id);callbacks.onSelection?.(id);if(mode==='move'){drag={id,lastX:e.clientX,lastY:e.clientY};canvas.setPointerCapture?.(e.pointerId);}return;}drag={orbit:true,lastX:e.clientX,lastY:e.clientY};});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;if(drag.id&&mode==='move'){const t=getDeviceTransform(drag.id),dx=(e.clientX-drag.lastX)/(18*zoom),dy=(e.clientY-drag.lastY)/(18*zoom);drag.lastX=e.clientX;drag.lastY=e.clientY;updateDeviceTransform(drag.id,{x:t.x+dx,z:t.z+dy/.55});callbacks.onTransform?.(drag.id);}else if(drag.orbit){panX+=e.clientX-drag.lastX;panY+=e.clientY-drag.lastY;drag.lastX=e.clientX;drag.lastY=e.clientY;}});
  ['pointerup','pointercancel'].forEach(ev=>canvas.addEventListener(ev,()=>drag=null));
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.55,Math.min(2.3,zoom+(e.deltaY<0?.08:-.08)));},{passive:false});
  const kd=e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;keys.add(e.code)},ku=e=>keys.delete(e.code);window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);
  const api={
    localFallback:true,setEditorMode(v){mode=v;saveEditorMode(v)},setSnap(){},focusFloor(id){setFloorFocus(id)},applyProjectState(){},refreshRoadMarkings(){},applyDeviceTransform(){},applyDeviceSettings(){},applyTraceFocus(){},selectDevice(id){selected=id;selectDevice(id)},toggleSignals(){state.simulator.signals=!state.simulator.signals;return state.simulator.signals},toggleZones(){state.simulator.zones=!state.simulator.zones;return state.simulator.zones},setFollow(v){follow=!!v},nextView(){},gotoView(){},saveView(){},resetCar(){car={x:0,z:15,a:0,s:0}},setDrive(dir,on=true){const code={forward:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD'}[dir];if(code){if(on)keys.add(code);else keys.delete(code)}},stop(){keys.clear();car.s=0},setBarrier(open){const d=devices.find(x=>(x.type||'').toLowerCase().includes('barrier'));if(d)updateRuntime(d.id,{status:open?'OPEN':'CLOSED',lastAction:open?'OPEN':'CLOSE',active:open});state.simulator.barrier=!!open},toggleLoop(){state.simulator.loop=!state.simulator.loop;return state.simulator.loop},triggerEtag(){const d=devices.find(x=>(x.type||'').toLowerCase().includes('etag'));if(d)updateRuntime(d.id,{status:'DETECTED',lastAction:'TRIGGER',active:true})},executeDeviceAction(id,action){const a=String(action).toUpperCase(),rt=getRuntime(id)||{};let status=a;if(a==='OPEN')status='OPEN';if(a==='CLOSE')status='CLOSED';if(a==='ON')status='ON';if(a==='OFF')status='OFF';updateRuntime(id,{status,lastAction:a,active:!['OFF','CLOSE','STOP','RESET'].includes(a)});return true},destroy(){cancelAnimationFrame(raf);if(ro)ro.disconnect();else window.removeEventListener('resize',resize);window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);host.innerHTML='';}
  };
  frame();return api;
}
