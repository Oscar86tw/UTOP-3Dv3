import {categories} from './data.js';
import {state} from './state.js';
import {render} from './views.js';
import {mountSimulator3D,unmountSimulator3D} from './core-3d-01/simulator3d.js';
const root=document.getElementById('viewRoot');const tabs=document.getElementById('mainTabs');const bottom=document.getElementById('bottomNav');
let capturing=false,sim3d=null;
function nav(){tabs.innerHTML=categories.map(c=>`<button data-route="${c.id}" class="${state.route===c.id?'active':''}">${c.label}</button>`).join('');bottom.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.route===state.route));}
async function go(route){if(state.route==='simulator'&&route!=='simulator'){unmountSimulator3D();sim3d=null;}state.route=route;nav();root.innerHTML=render(route);bind();if(route==='simulator')sim3d=await mountSimulator3D();}
function bind(){
  root.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>alert('已切換視野：'+state.viewpoints[Number(b.dataset.view)])));
  document.getElementById('applyScene')?.addEventListener('click',()=>{state.scene={place:scenePlace.value,time:sceneTime.value,weather:sceneWeather.value,event:sceneEvent.value};sceneSummary.textContent=`目前：${state.scene.place} · ${state.scene.time} · ${state.scene.weather} · ${state.scene.event}`});
  document.getElementById('addView')?.addEventListener('click',()=>{state.viewpoints.push('新視野 '+(state.viewpoints.length+1));go('scene')});
  document.getElementById('captureHotkey')?.addEventListener('click',()=>{capturing=true;captureStatus.textContent='請直接按下單鍵或組合鍵；Esc取消，Delete清除。'});
  document.getElementById('addDisplay')?.addEventListener('click',()=>{state.displays.push({name:'新顯示裝置 '+(state.displays.length+1),mode:'Browser Display',resolution:'自動',state:'STANDBY'});go('display')});
  document.getElementById('validateWire')?.addEventListener('click',()=>{const a=wireFrom.value,b=wireTo.value;wireResult.textContent=a.includes('+12V')&&b.includes('+24V')?'❌ 電壓不相容：12V 不可直接接到24V端子。':a.includes('GND')&&!b.includes('GND')?'⚠️ GND 接到非接地端子，請確認。':'✅ 接線類型相容，可建立連線。'});
  document.getElementById('addSnapshot')?.addEventListener('click',()=>{state.snapshots.push('快照 '+(state.snapshots.length+1));go('project')});
  document.getElementById('playMission')?.addEventListener('click',()=>{const steps=[...document.querySelectorAll('.step')];let i=0;missionState.textContent='任務執行中';const t=setInterval(()=>{steps.forEach((s,n)=>s.classList.toggle('active',n===i));missionState.textContent=steps[i]?.querySelector('b')?.textContent||'完成';i++;if(i>=steps.length){clearInterval(t);setTimeout(()=>{missionState.textContent='✅ 任務完成';steps.forEach(s=>s.classList.remove('active'))},500)}},650)});
  root.querySelectorAll('[data-drive]').forEach(b=>{const dir=b.dataset.drive;if(dir==='stop'){b.addEventListener('click',()=>sim3d?.stop());return;}const down=e=>{e.preventDefault();sim3d?.setDrive(dir,true)};const up=e=>{e.preventDefault();sim3d?.setDrive(dir,false)};b.addEventListener('pointerdown',down);['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,up));});
  document.getElementById('toggleSignals')?.addEventListener('click',e=>{const on=sim3d?.toggleSignals();e.currentTarget.textContent=on?'隱藏 DI/DO 線':'顯示 DI/DO 線';});
  document.getElementById('toggleZones')?.addEventListener('click',e=>{const on=sim3d?.toggleZones();e.currentTarget.textContent=on?'隱藏感應範圍':'顯示感應範圍';});
  document.getElementById('followCar')?.addEventListener('click',e=>{state.simulator.follow=!state.simulator.follow;sim3d?.setFollow(state.simulator.follow);e.currentTarget.textContent=state.simulator.follow?'自由視角':'跟車視角';});
  document.getElementById('next3DView')?.addEventListener('click',()=>sim3d?.nextView());
  document.getElementById('resetCar')?.addEventListener('click',()=>sim3d?.resetCar());
  document.getElementById('saveView')?.addEventListener('click',()=>sim3d?.saveView());
}
function safeKey(){const el=document.activeElement;return !(el&&['INPUT','TEXTAREA','SELECT'].includes(el.tagName));}
window.addEventListener('keydown',e=>{
  if(capturing){e.preventDefault();if(e.key==='Escape'){capturing=false;captureStatus.textContent='已取消。';return}if(['Backspace','Delete'].includes(e.key)){capturing=false;captureStatus.textContent='已清除快捷鍵設定。';return}const keys=[];if(e.ctrlKey)keys.push('Ctrl');if(e.altKey)keys.push('Alt');if(e.shiftKey)keys.push('Shift');if(!['Control','Alt','Shift','Meta'].includes(e.key))keys.push(e.key.length===1?e.key.toUpperCase():e.key);const combo=keys.join(' + ');if(!combo)return;const reserved=['F5','F11','F12','Ctrl + R','Ctrl + W','Ctrl + P','Ctrl + F'];if(reserved.includes(combo)){captureStatus.textContent='⚠️ 此按鍵可能與瀏覽器功能衝突，請改用其他按鍵。';capturing=false;return}const conflict=state.hotkeys.find(h=>h.key===combo);if(conflict){captureStatus.textContent=`⚠️ ${combo} 已設定給 ${conflict.target} ${conflict.action}`;capturing=false;return}const a=hotkeyAction.value.split(' ');state.hotkeys.push({key:combo,target:a.slice(0,-1).join(' '),action:a.at(-1)});capturing=false;go('hotkeys');return}
  if(!safeKey())return;
  const combo=(e.shiftKey?'Shift + ':'')+(e.key.length===1?e.key.toUpperCase():e.key);
  if(combo==='G'){sim3d?.setBarrier(true);state.simulator.barrier=true}
  else if(combo==='Shift + G'){sim3d?.setBarrier(false);state.simulator.barrier=false}
  else if(combo==='L'){sim3d?.toggleLoop()}
  else if(combo==='E'){sim3d?.triggerEtag()}
  else if(combo==='V'){sim3d?.nextView()}
});

document.addEventListener('click',e=>{const b=e.target.closest('[data-route]');if(b)go(b.dataset.route)});
document.getElementById('presentationToggle').addEventListener('click',()=>{state.presentation=!state.presentation;document.body.classList.toggle('presentation',state.presentation);presentationToggle.textContent=state.presentation?'退出簡報':'簡報模式'});
document.getElementById('saveBtn').addEventListener('click',()=>{state.savedAt=new Date();projectMeta.textContent='已儲存 · '+state.savedAt.toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'})});
go('overview');
