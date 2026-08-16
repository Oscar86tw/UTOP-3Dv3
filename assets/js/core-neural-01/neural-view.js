import {state} from '../state.js';
import {devices} from '../data.js';
import {ioFor,ioLabelFor} from '../core-module-01/module-manager.js';

let mounted=null;
export function unmountNeuralView(){if(mounted){mounted.destroy();mounted=null;}}

function liveConnection(c,now){return Number(state.activeSignals?.[c.id]||0)>now;}
function runtimeVehicleLabel(deviceId){
  const rt=state.deviceRuntime?.[deviceId]||{};
  const ids=rt.lastVehicleIds||rt.detectedVehicleIds||rt.authorizedVehicleIds||rt.rejectedVehicleIds||[];
  return Array.isArray(ids)&&ids.length?ids.join(', '):'';
}
function connectionTypeColor(c,active,traceOn){
  if(active)return '#ffd84d';
  if(traceOn)return '#60d7ff';
  const t=String(c.type||'').toUpperCase();
  if(t==='DI')return '#4b8dff'; if(t==='DO')return '#ff9d32'; if(t==='POWER')return '#e5c33b'; if(t==='NETWORK'||t==='COMM')return '#42d78a';
  return '#7f8ca8';
}
function deviceAccent(type){
  const t=String(type||'').toLowerCase();
  if(['loop','loopdetector','uhf','lpr','radar','infrared','cardreader'].includes(t))return '#66d8ff';
  if(['accesscontroller','relay','timer','ondelay','offdelay','delaytimer'].includes(t))return '#ffd75c';
  if(['barrier','traffic','ledpanel','beacon','bollard','shutter'].includes(t))return '#70e28f';
  return '#d8def2';
}

export function mountNeuralView(){
  unmountNeuralView();
  const canvas=document.getElementById('neuralCanvas');if(!canvas)return null;
  const ctx=canvas.getContext('2d');if(!ctx)return null;
  let yaw=.36,pitch=.24,scale=1,panX=0,panY=0,drag=false,moved=false,lx=0,ly=0,raf=0;
  let hitNodes=[];let hovered=null;let filter='all';
  const status=document.getElementById('neuralGraphStatus');
  const dpr=()=>Math.max(1,Math.min(2,window.devicePixelRatio||1));
  const resize=()=>{const r=canvas.getBoundingClientRect(),p=dpr();canvas.width=Math.max(1,Math.round(r.width*p));canvas.height=Math.max(1,Math.round(r.height*p));ctx.setTransform(p,0,0,p,0,0);};
  const ro=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;ro?.observe(canvas);resize();

  function project(p,w,h){
    let [x,y,z]=p;const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
    const x1=x*cy-z*sy,z1=x*sy+z*cy,y1=y*cp-z1*sp,z2=y*sp+z1*cp,depth=Math.max(2.5,8+z2*.12);
    return [w/2+panX+x1*scale*50/depth*7,h/2+panY-y1*scale*50/depth*7,depth];
  }
  function devicePositions(){
    const n=Math.max(1,devices.length);return devices.map((d,i)=>{
      const layer=Math.floor(i/10),idx=i%10,count=Math.min(10,n-layer*10),a=(idx/Math.max(1,count))*Math.PI*2-Math.PI/2;
      const ring=3.0+layer*1.55;return {d,p:[Math.cos(a)*ring,Math.sin(i*.83)*.9+((i%3)-1)*.25,Math.sin(a)*ring]};
    });
  }
  function traceSets(){
    const enabled=!!state.signalTrace?.enabled,focus=state.signalTrace?.focusDevice;
    if(!enabled||!focus)return {devices:new Set(),connections:new Set()};
    const ds=new Set([focus]),cs=new Set();let changed=true;
    while(changed){changed=false;for(const c of state.connections||[]){if(c.enabled===false)continue;const mode=state.signalTrace.mode||'full';const from=ds.has(c.fromDevice),to=ds.has(c.toDevice);if((mode==='full'||mode==='downstream')&&from&&!ds.has(c.toDevice)){ds.add(c.toDevice);cs.add(c.id);changed=true;}if((mode==='full'||mode==='upstream')&&to&&!ds.has(c.fromDevice)){ds.add(c.fromDevice);cs.add(c.id);changed=true;}if(from&&to)cs.add(c.id);}}
    return {devices:ds,connections:cs};
  }
  function curvePoint(a,b,t,bend=-24){const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2+bend;const u=1-t;return [u*u*a[0]+2*u*t*mx+t*t*b[0],u*u*a[1]+2*u*t*my+t*t*b[1]];}
  function drawGlowDot(x,y,r,color,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.shadowBlur=16;ctx.shadowColor=color;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();}
  function roundedLabel(x,y,text,bg='#172033',fg='#fff'){ctx.save();ctx.font='11px sans-serif';const m=ctx.measureText(text),w=m.width+12,h=20;ctx.fillStyle=bg;ctx.globalAlpha=.92;ctx.beginPath();ctx.roundRect(x-w/2,y-h/2,w,h,8);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,x,y);ctx.restore();}
  function draw(){
    const w=canvas.clientWidth,h=canvas.clientHeight,now=Date.now(),time=performance.now();
    ctx.clearRect(0,0,w,h);
    const bg=ctx.createRadialGradient(w*.5,h*.48,20,w*.5,h*.48,Math.max(w,h)*.7);bg.addColorStop(0,'#141b2a');bg.addColorStop(1,'#070a10');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    ctx.save();ctx.globalAlpha=.14;ctx.fillStyle='#c6d0e8';for(let i=0;i<80;i++){const x=(i*83)%Math.max(1,w),y=(i*47)%Math.max(1,h);ctx.fillRect(x,y,1,1);}ctx.restore();
    const pos=devicePositions(),map=new Map(pos.map(x=>[x.d.id,x])),trace=traceSets();hitNodes=[];
    const visibleConnections=(state.connections||[]).filter(c=>c.enabled!==false).filter(c=>filter==='all'||(filter==='trace'&&trace.connections.has(c.id))||(filter==='live'&&liveConnection(c,now)));
    for(const c of visibleConnections){
      const a=map.get(c.fromDevice),b=map.get(c.toDevice);if(!a||!b)continue;const pa=project(a.p,w,h),pb=project(b.p,w,h);const active=liveConnection(c,now),traceOn=trace.connections.has(c.id),color=connectionTypeColor(c,active,traceOn);
      ctx.save();ctx.strokeStyle=color;ctx.globalAlpha=active?1:traceOn?.78:.48;ctx.lineWidth=active?3.2:traceOn?2.5:1.35;ctx.shadowBlur=active?18:traceOn?10:0;ctx.shadowColor=color;ctx.beginPath();ctx.moveTo(pa[0],pa[1]);const bend=-26-(Math.abs(pa[0]-pb[0])*.02);ctx.quadraticCurveTo((pa[0]+pb[0])/2,(pa[1]+pb[1])/2+bend,pb[0],pb[1]);ctx.stroke();ctx.restore();
      if(active){for(let k=0;k<3;k++){const t=((time*.00045)+(k/3))%1,p=curvePoint(pa,pb,t,bend);drawGlowDot(p[0],p[1],3.2,color,.95);}const vids=runtimeVehicleLabel(c.toDevice)||runtimeVehicleLabel(c.fromDevice);if(vids){const p=curvePoint(pa,pb,.52,bend);roundedLabel(p[0],p[1]-12,vids,'#5b4b11','#fff6b8');}}
    }
    const sorted=[...pos].sort((a,b)=>project(b.p,w,h)[2]-project(a.p,w,h)[2]);
    for(const {d,p} of sorted){
      if(filter==='trace'&&!trace.devices.has(d.id)&&state.signalTrace?.enabled)continue;
      const [x,y,depth]=project(p,w,h),io=ioFor(d.type),accent=deviceAccent(d.type),selected=d.id===state.selectedDevice,traceOn=trace.devices.has(d.id),rt=state.deviceRuntime?.[d.id]||{},active=!!rt.active||Number(rt.lastActiveUntil||0)>now;
      const sats=[...io.inputs.map(s=>({dir:'DI',s})),...io.outputs.map(s=>({dir:'DO',s}))].slice(0,12);
      const radius=Math.max(24,40-depth*1.15);
      sats.forEach((item,i)=>{const a=(i/Math.max(1,sats.length))*Math.PI*2-Math.PI/2,rr=radius+22+(i%2)*8,ex=x+Math.cos(a)*rr,ey=y+Math.sin(a)*rr*.68;ctx.save();ctx.strokeStyle=item.dir==='DI'?'#4b8dff':'#ff9d32';ctx.globalAlpha=.58;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);ctx.stroke();ctx.restore();const ioOn=!!(rt.io||{})[item.s];drawGlowDot(ex,ey,ioOn?4.2:2.8,item.dir==='DI'?'#66a5ff':'#ffb15b',ioOn?1:.72);ctx.fillStyle='#dfe7fa';ctx.globalAlpha=.82;ctx.font='9px sans-serif';ctx.fillText(item.s,ex+5,ey+3);ctx.globalAlpha=1;});
      if(selected||traceOn||active){ctx.save();ctx.strokeStyle=active?'#ffd84d':selected?'#ffab2d':'#60d7ff';ctx.lineWidth=2;ctx.globalAlpha=.42;ctx.beginPath();ctx.arc(x,y,radius+9+Math.sin(time*.005)*2,0,Math.PI*2);ctx.stroke();ctx.restore();}
      drawGlowDot(x,y,radius,accent,selected?1:.94);
      ctx.save();ctx.fillStyle='#0a0f19';ctx.globalAlpha=.86;ctx.beginPath();ctx.arc(x,y,radius-5,0,Math.PI*2);ctx.fill();ctx.restore();
      ctx.fillStyle='#fff';ctx.font=selected?'bold 12px sans-serif':'11px sans-serif';ctx.textAlign='center';ctx.fillText(d.id.replace('DEV-',''),x,y+4);ctx.textAlign='start';
      ctx.fillStyle='#eef3ff';ctx.font='11px sans-serif';ctx.fillText(d.name,x-radius,y+radius+18);
      const vids=runtimeVehicleLabel(d.id);if(vids)roundedLabel(x,y-radius-16,vids,'#183d32','#bbffe8');
      const status=String(rt.status||rt.lastAction||'');if(status&&status!=='READY')roundedLabel(x,y+radius+34,status.slice(0,24),'#202941','#dfe8ff');
      hitNodes.push({id:d.id,x,y,r:radius+10,name:d.name});
    }
    if(status){const liveCount=visibleConnections.filter(c=>liveConnection(c,now)).length;status.textContent=`${devices.length} 模組 · ${state.connections.length} 線 · ${liveCount} 條訊號傳遞中${hovered?' · '+hovered.name:''}`;}
    raf=requestAnimationFrame(draw);
  }
  const pd=e=>{drag=true;moved=false;lx=e.clientX;ly=e.clientY;canvas.setPointerCapture?.(e.pointerId);};
  const pm=e=>{const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;hovered=hitNodes.find(n=>(x-n.x)**2+(y-n.y)**2<=n.r**2)||null;canvas.style.cursor=hovered?'pointer':drag?'grabbing':'grab';if(!drag)return;const dx=e.clientX-lx,dy=e.clientY-ly;if(Math.abs(dx)+Math.abs(dy)>2)moved=true;yaw+=dx*.008;pitch=Math.max(-1.1,Math.min(1.1,pitch+dy*.006));lx=e.clientX;ly=e.clientY;};
  const pu=e=>{if(!drag)return;drag=false;if(!moved){const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top,n=hitNodes.find(v=>(x-v.x)**2+(y-v.y)**2<=v.r**2);if(n){state.selectedDevice=n.id;window.dispatchEvent(new CustomEvent('utop:signalGraphSelect',{detail:{deviceId:n.id}}));}}};
  const wheel=e=>{e.preventDefault();scale=Math.max(.45,Math.min(2.8,scale-e.deltaY*.001));};
  const dbl=e=>{const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top,n=hitNodes.find(v=>(x-v.x)**2+(y-v.y)**2<=v.r**2);if(n)window.dispatchEvent(new CustomEvent('utop:signalGraphFocus3D',{detail:{deviceId:n.id}}));};
  canvas.addEventListener('pointerdown',pd);canvas.addEventListener('pointermove',pm);canvas.addEventListener('pointerup',pu);canvas.addEventListener('pointercancel',pu);canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('dblclick',dbl);
  const setFilter=v=>{filter=['all','trace','live'].includes(v)?v:'all';};
  draw();
  mounted={reset(){yaw=.36;pitch=.24;scale=1;panX=panY=0;},setFilter,focusDevice(id){state.selectedDevice=id;},destroy(){cancelAnimationFrame(raf);ro?.disconnect();canvas.removeEventListener('pointerdown',pd);canvas.removeEventListener('pointermove',pm);canvas.removeEventListener('pointerup',pu);canvas.removeEventListener('pointercancel',pu);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('dblclick',dbl);}};
  return mounted;
}
