import {state} from '../state.js';
import {devices} from '../data.js';
import {terminalsFor} from '../core-module-01/module-manager.js';

let mounted=null;
export function unmountNeuralView(){if(mounted){mounted.destroy();mounted=null;}}
export function mountNeuralView(){
  unmountNeuralView();const canvas=document.getElementById('neuralCanvas');if(!canvas)return null;const ctx=canvas.getContext('2d');if(!ctx)return null;
  let yaw=.3,pitch=.25,scale=1,drag=false,lx=0,ly=0,raf=0;
  const resize=()=>{const r=canvas.getBoundingClientRect();canvas.width=Math.max(1,Math.round(r.width*devicePixelRatio));canvas.height=Math.max(1,Math.round(r.height*devicePixelRatio));ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);};
  const ro=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;ro?.observe(canvas);resize();
  function project(p,w,h){let [x,y,z]=p;const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);const x1=x*cy-z*sy,z1=x*sy+z*cy,y1=y*cp-z1*sp,z2=y*sp+z1*cp;const depth=7+z2*.08;return [w/2+x1*scale*40/depth*7,h/2-y1*scale*40/depth*7,depth];}
  function positions(){const n=Math.max(1,devices.length);return devices.map((d,i)=>{const a=(i/n)*Math.PI*2-Math.PI/2;const ring=3.2+(i%2)*.7;return {d,p:[Math.cos(a)*ring,Math.sin(i*.75)*.6,Math.sin(a)*ring]};});}
  function draw(){const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);const pos=positions(),map=new Map(pos.map(x=>[x.d.id,x]));
    (state.connections||[]).filter(c=>c.enabled!==false).forEach(c=>{const a=map.get(c.fromDevice),b=map.get(c.toDevice);if(!a||!b)return;const pa=project(a.p,w,h),pb=project(b.p,w,h);ctx.beginPath();ctx.moveTo(pa[0],pa[1]);const mx=(pa[0]+pb[0])/2,my=(pa[1]+pb[1])/2-30;ctx.quadraticCurveTo(mx,my,pb[0],pb[1]);ctx.strokeStyle=c.type==='DI'?'#3b82f6':c.type==='DO'?'#f59e0b':c.type==='POWER'?'#eab308':c.type==='NETWORK'?'#22c55e':'#9ca3af';ctx.lineWidth=2.2;ctx.stroke();ctx.fillStyle='#555';ctx.font='11px sans-serif';ctx.fillText(`${c.fromTerminal} → ${c.toTerminal}`,mx-28,my-4);});
    pos.sort((a,b)=>project(a.p,w,h)[2]-project(b.p,w,h)[2]).forEach(({d,p})=>{const [x,y]=project(p,w,h);const terms=terminalsFor(d.type).slice(0,8);terms.forEach((t,i)=>{const a=(i/Math.max(1,terms.length))*Math.PI*2;const ex=x+Math.cos(a)*30,ey=y+Math.sin(a)*30;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);ctx.strokeStyle='#777';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#666';ctx.font='9px sans-serif';ctx.fillText(t,ex+2,ey);});ctx.beginPath();ctx.arc(x,y,18,0,Math.PI*2);ctx.fillStyle=d.id===state.selectedDevice?'#f59e0b':'#fff';ctx.fill();ctx.strokeStyle='#555';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#111';ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillText(d.id.replace('DEV-',''),x,y+4);ctx.textAlign='start';ctx.font='12px sans-serif';ctx.fillText(d.name,x-30,y+48);});
    raf=requestAnimationFrame(draw);
  }
  const pd=e=>{drag=true;lx=e.clientX;ly=e.clientY;canvas.setPointerCapture?.(e.pointerId)},pm=e=>{if(!drag)return;yaw+=(e.clientX-lx)*.008;pitch=Math.max(-1,Math.min(1,pitch+(e.clientY-ly)*.006));lx=e.clientX;ly=e.clientY;},pu=()=>drag=false,wheel=e=>{e.preventDefault();scale=Math.max(.55,Math.min(2.2,scale-e.deltaY*.001));};
  canvas.addEventListener('pointerdown',pd);canvas.addEventListener('pointermove',pm);canvas.addEventListener('pointerup',pu);canvas.addEventListener('pointercancel',pu);canvas.addEventListener('wheel',wheel,{passive:false});draw();
  mounted={destroy(){cancelAnimationFrame(raf);ro?.disconnect();canvas.removeEventListener('pointerdown',pd);canvas.removeEventListener('pointermove',pm);canvas.removeEventListener('pointerup',pu);canvas.removeEventListener('wheel',wheel);}};return mounted;
}
