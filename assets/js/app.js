import {categories} from './data.js';
import {state} from './state.js';
import {render} from './views.js';
const root=document.getElementById('viewRoot');const tabs=document.getElementById('mainTabs');const bottom=document.getElementById('bottomNav');
let capturing=false;
function nav(){tabs.innerHTML=categories.map(c=>`<button data-route="${c.id}" class="${state.route===c.id?'active':''}">${c.label}</button>`).join('');bottom.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.route===state.route));}
function go(route){state.route=route;nav();root.innerHTML=render(route);bind();}
function bind(){
  root.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>alert('已切換視野：'+state.viewpoints[Number(b.dataset.view)])));
  document.getElementById('applyScene')?.addEventListener('click',()=>{state.scene={place:scenePlace.value,time:sceneTime.value,weather:sceneWeather.value,event:sceneEvent.value};sceneSummary.textContent=`目前：${state.scene.place} · ${state.scene.time} · ${state.scene.weather} · ${state.scene.event}`});
  document.getElementById('addView')?.addEventListener('click',()=>{state.viewpoints.push('新視野 '+(state.viewpoints.length+1));go('scene')});
  document.getElementById('captureHotkey')?.addEventListener('click',()=>{capturing=true;captureStatus.textContent='請直接按下單鍵或組合鍵；Esc取消，Delete清除。'});
  document.getElementById('addDisplay')?.addEventListener('click',()=>{state.displays.push({name:'新顯示裝置 '+(state.displays.length+1),mode:'Browser Display',resolution:'自動',state:'STANDBY'});go('display')});
  document.getElementById('validateWire')?.addEventListener('click',()=>{const a=wireFrom.value,b=wireTo.value;wireResult.textContent=a.includes('+12V')&&b.includes('+24V')?'❌ 電壓不相容：12V 不可直接接到24V端子。':a.includes('GND')&&!b.includes('GND')?'⚠️ GND 接到非接地端子，請確認。':'✅ 接線類型相容，可建立連線。'});
  document.getElementById('addSnapshot')?.addEventListener('click',()=>{state.snapshots.push('快照 '+(state.snapshots.length+1));go('project')});
  document.getElementById('playMission')?.addEventListener('click',()=>{const steps=[...document.querySelectorAll('.step')];let i=0;missionState.textContent='任務執行中';const t=setInterval(()=>{steps.forEach((s,n)=>s.classList.toggle('active',n===i));missionState.textContent=steps[i]?.querySelector('b')?.textContent||'完成';i++;if(i>=steps.length){clearInterval(t);setTimeout(()=>{missionState.textContent='✅ 任務完成';steps.forEach(s=>s.classList.remove('active'))},500)}},650)});
  const car=document.getElementById('car'); if(car){updateCar();root.querySelectorAll('[data-drive]').forEach(b=>b.addEventListener('click',()=>drive(b.dataset.drive)));document.getElementById('toggleSignals')?.addEventListener('click',()=>{state.simulator.signals=!state.simulator.signals;document.getElementById('signalLine').classList.toggle('on',state.simulator.signals)});document.getElementById('resetCar')?.addEventListener('click',()=>{state.simulator.carY=0;state.simulator.carX=0;state.simulator.barrier=false;state.simulator.loop=false;updateCar()});document.getElementById('saveView')?.addEventListener('click',()=>alert('目前視野已記錄（原型示意）'));}
}
function drive(dir){if(dir==='forward')state.simulator.carY+=24;if(dir==='back')state.simulator.carY-=24;if(dir==='left')state.simulator.carX-=12;if(dir==='right')state.simulator.carX+=12;if(dir==='stop'){}state.simulator.carY=Math.max(0,Math.min(185,state.simulator.carY));state.simulator.carX=Math.max(-80,Math.min(80,state.simulator.carX));state.simulator.loop=state.simulator.carY>75&&state.simulator.carY<145;state.simulator.barrier=state.simulator.loop;updateCar()}
function updateCar(){const car=document.getElementById('car');if(!car)return;car.style.transform=`translate(${state.simulator.carX}px,${-state.simulator.carY}px)`;document.getElementById('loopZone')?.classList.toggle('on',state.simulator.loop);document.getElementById('barrierArm')?.classList.toggle('open',state.simulator.barrier);const s=document.getElementById('simStatus');if(s)s.textContent=state.simulator.loop?'LOOP ON · Barrier OPEN':'待命'}
function safeKey(e){const el=document.activeElement;if(el&&['INPUT','TEXTAREA','SELECT'].includes(el.tagName))return false;return true}
window.addEventListener('keydown',e=>{
  if(capturing){e.preventDefault();if(e.key==='Escape'){capturing=false;captureStatus.textContent='已取消。';return}const keys=[];if(e.ctrlKey)keys.push('Ctrl');if(e.altKey)keys.push('Alt');if(e.shiftKey)keys.push('Shift');if(!['Control','Alt','Shift','Meta'].includes(e.key))keys.push(e.key.length===1?e.key.toUpperCase():e.key);const combo=keys.join(' + ');if(!combo)return;const reserved=['F5','F11','F12','Ctrl + R','Ctrl + W','Ctrl + P','Ctrl + F'];if(reserved.includes(combo)){captureStatus.textContent='⚠️ 此按鍵可能與瀏覽器功能衝突，請改用其他按鍵。';capturing=false;return}const conflict=state.hotkeys.find(h=>h.key===combo);if(conflict){captureStatus.textContent=`⚠️ ${combo} 已設定給 ${conflict.target} ${conflict.action}`;capturing=false;return}const a=hotkeyAction.value.split(' ');state.hotkeys.push({key:combo,target:a.slice(0,-1).join(' '),action:a.at(-1)});capturing=false;go('hotkeys');return}
  if(!safeKey(e))return;if(state.route==='simulator'){const map={w:'forward',s:'back',a:'left',d:'right'};const d=map[e.key.toLowerCase()];if(d){e.preventDefault();drive(d)}}
  const combo=(e.shiftKey?'Shift + ':'')+(e.key.length===1?e.key.toUpperCase():e.key);if(combo==='G'){state.simulator.barrier=true}else if(combo==='Shift + G'){state.simulator.barrier=false}else if(combo==='L'){state.simulator.loop=!state.simulator.loop}else if(combo==='V'){alert('切換到下一個記錄視野')}
});

document.addEventListener('click',e=>{const b=e.target.closest('[data-route]');if(b)go(b.dataset.route)});
document.getElementById('presentationToggle').addEventListener('click',()=>{state.presentation=!state.presentation;document.body.classList.toggle('presentation',state.presentation);presentationToggle.textContent=state.presentation?'退出簡報':'簡報模式'});
document.getElementById('saveBtn').addEventListener('click',()=>{state.savedAt=new Date();projectMeta.textContent='已儲存 · '+state.savedAt.toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'})});
go('overview');
