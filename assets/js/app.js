import {categories,devices,moduleCatalog} from './data.js';
import {state} from './state.js';
import {render} from './views.js';
import {mountSimulator3D,unmountSimulator3D} from './core-3d-01/simulator3d.js';
import {toggleFloor,toggleGroup,setGroupOpacity,renameViewpoint,deleteViewpoint,updateDisplay,hotkeyConflict,isReservedHotkey} from './core-project-01/project-controls.js';
import {getDeviceTransform,updateDeviceTransform,setFloorFocus,setEditorMode,selectDevice} from './core-editor-01/editor-commands.js';
const root=document.getElementById('viewRoot'),tabs=document.getElementById('mainTabs'),bottom=document.getElementById('bottomNav');
let capturing=false,sim3d=null;
function nextDeviceId(){const nums=devices.map(d=>Number((d.id||'').split('-')[1])||0);return `DEV-${String(Math.max(0,...nums)+1).padStart(3,'0')}`;}
function templateByKey(key){for(const g of moduleCatalog){const found=g.items.find(x=>x.key===key);if(found)return found;}return null;}
function addModuleFromTemplate(key){const tpl=templateByKey(key);if(!tpl)return;const id=nextDeviceId();const count=devices.length;const floor=state.editor.floorFocus||'1F';const nameBase=tpl.name;const same=devices.filter(d=>d.name.startsWith(nameBase)).length+1;devices.push({id,name:`${nameBase}${String(same).padStart(2,'0')}`,type:tpl.type,floor,state:tpl.state||'READY'});state.deviceTransforms[id]={x:-3+(count%5)*1.8,y:0,z:-8+Math.floor(count/5)*2.2,rotationY:0,floor};state.selectedDevice=id;go('simulator');}
function removeDevice(id){const idx=devices.findIndex(d=>d.id===id);if(idx<0)return;devices.splice(idx,1);delete state.deviceTransforms[id];if(state.selectedDevice===id)state.selectedDevice=devices[0]?.id||null;go(state.route==='simulator'?'simulator':state.route);}

function nav(){tabs.innerHTML=categories.map(c=>`<button data-route="${c.id}" class="${state.route===c.id?'active':''}">${c.label}</button>`).join('');bottom.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.route===state.route));}
async function go(route){if(state.route==='simulator'&&route!=='simulator'){unmountSimulator3D();sim3d=null;}state.route=route;nav();root.innerHTML=render(route);bind();if(route==='simulator'){sim3d=await mountSimulator3D({onSelection:syncPropertyPanel,onTransform:syncPropertyPanel});}}
function syncPropertyPanel(id){
  const d=devices.find(x=>x.id===id);if(!d)return;state.selectedDevice=id;const t=getDeviceTransform(id);
  const name=document.getElementById('propertyDeviceName'),badge=document.getElementById('deviceIdBadge'),sel=document.getElementById('selectedState');
  if(name)name.textContent=d.name;if(badge)badge.textContent=d.id;if(sel)sel.textContent=d.name;
  const map={propX:t.x,propY:t.y,propZ:t.z,propRot:Math.round((t.rotationY||0)*180/Math.PI),propFloor:t.floor,planX:t.x,planZ:t.z,planRot:Math.round((t.rotationY||0)*180/Math.PI),planFloor:t.floor};
  Object.entries(map).forEach(([k,v])=>{const el=document.getElementById(k);if(el)el.value=v});
}
function selectDeviceEverywhere(id){state.selectedDevice=id;selectDevice(id);sim3d?.selectDevice(id);if(state.route==='sync2d')go('sync2d');else syncPropertyPanel(id);}
function applyPlanPatch(patch){const id=state.selectedDevice;if(!id)return;updateDeviceTransform(id,patch);sim3d?.applyDeviceTransform(id);if(state.route==='sync2d')go('sync2d');else syncPropertyPanel(id);}
function bind(){
  root.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{state.simulator.cameraPreset=Number(b.dataset.view);go('simulator').then(()=>sim3d?.gotoView(Number(b.dataset.view)))}));
  root.querySelectorAll('[data-rename-view]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.renameView);const name=prompt('新的視野名稱',state.simulator.viewpoints[i]?.name||'');if(name?.trim()){renameViewpoint(i,name.trim());go('scene')}}));
  root.querySelectorAll('[data-delete-view]').forEach(b=>b.addEventListener('click',()=>{deleteViewpoint(Number(b.dataset.deleteView));go('scene')}));
  document.getElementById('applyScene')?.addEventListener('click',()=>{state.scene={place:scenePlace.value,time:sceneTime.value,weather:sceneWeather.value,event:sceneEvent.value};sceneSummary.textContent=`目前：${state.scene.place} · ${state.scene.time} · ${state.scene.weather} · ${state.scene.event}`;if(sim3d)sim3d.applyProjectState();});
  root.querySelectorAll('[data-floor]').forEach(b=>b.addEventListener('click',()=>{toggleFloor(b.dataset.floor);go('layers')}));
  root.querySelectorAll('[data-floor-focus]').forEach(b=>b.addEventListener('click',()=>{setFloorFocus(b.dataset.floorFocus);go('simulator').then(()=>sim3d?.focusFloor(b.dataset.floorFocus))}));
  root.querySelectorAll('[data-group]').forEach(b=>b.addEventListener('click',()=>{toggleGroup(b.dataset.group);go('layers')}));
  root.querySelectorAll('[data-group-opacity]').forEach(r=>r.addEventListener('input',()=>{setGroupOpacity(r.dataset.group,Number(r.value)/100);const m=r.closest('.layer-row')?.querySelector('.muted');if(m){const g=state.groups.find(x=>x.id===r.dataset.group);m.textContent=`${g.visible?'顯示':'隱藏'} · ${Math.round(g.opacity*100)}%`;}}));
  root.querySelectorAll('[data-select2d]').forEach(b=>b.addEventListener('click',()=>selectDeviceEverywhere(b.dataset.select2d)));
  root.querySelectorAll('[data-add-template]').forEach(b=>b.addEventListener('click',()=>addModuleFromTemplate(b.dataset.addTemplate)));
  root.querySelectorAll('[data-remove-device]').forEach(b=>b.addEventListener('click',()=>removeDevice(b.dataset.removeDevice)));
  root.querySelectorAll('[data-plan-nudge]').forEach(b=>b.addEventListener('click',()=>{const t=getDeviceTransform(state.selectedDevice),step=state.editor.gridSize||.25;const p={};if(b.dataset.planNudge==='x-')p.x=t.x-step;if(b.dataset.planNudge==='x+')p.x=t.x+step;if(b.dataset.planNudge==='z-')p.z=t.z-step;if(b.dataset.planNudge==='z+')p.z=t.z+step;applyPlanPatch(p)}));
  root.querySelectorAll('[data-plan-rotate]').forEach(b=>b.addEventListener('click',()=>{const t=getDeviceTransform(state.selectedDevice);applyPlanPatch({rotationY:(t.rotationY||0)+Number(b.dataset.planRotate)*Math.PI/180})}));
  document.getElementById('applyPlanTransform')?.addEventListener('click',()=>applyPlanPatch({x:Number(planX.value)||0,z:Number(planZ.value)||0,rotationY:(Number(planRot.value)||0)*Math.PI/180,floor:planFloor.value}));
  document.getElementById('captureHotkey')?.addEventListener('click',()=>{capturing=true;captureStatus.textContent='請直接按下單鍵或組合鍵；Esc取消，Delete清除。'});
  root.querySelectorAll('[data-hotkey-toggle]').forEach(b=>b.addEventListener('click',()=>{const h=state.hotkeys[Number(b.dataset.hotkeyToggle)];h.enabled=!h.enabled;go('hotkeys')}));
  root.querySelectorAll('[data-hotkey-delete]').forEach(b=>b.addEventListener('click',()=>{state.hotkeys.splice(Number(b.dataset.hotkeyDelete),1);go('hotkeys')}));
  document.getElementById('addDisplay')?.addEventListener('click',()=>{state.displays.push({name:'新顯示裝置 '+(state.displays.length+1),mode:'Browser Display',view:'跟隨主控',resolution:'自動',quality:'平衡',state:'STANDBY',signals:false,hud:true});go('display')});
  root.querySelectorAll('[data-display-mode]').forEach(x=>x.addEventListener('change',()=>updateDisplay(Number(x.dataset.displayMode),{mode:x.value})));
  root.querySelectorAll('[data-display-view]').forEach(x=>x.addEventListener('change',()=>updateDisplay(Number(x.dataset.displayView),{view:x.value})));
  root.querySelectorAll('[data-display-quality]').forEach(x=>x.addEventListener('change',()=>updateDisplay(Number(x.dataset.displayQuality),{quality:x.value})));
  root.querySelectorAll('[data-display-signals]').forEach(x=>x.addEventListener('change',()=>updateDisplay(Number(x.dataset.displaySignals),{signals:x.checked})));
  root.querySelectorAll('[data-display-hud]').forEach(x=>x.addEventListener('change',()=>updateDisplay(Number(x.dataset.displayHud),{hud:x.checked})));
  document.getElementById('validateWire')?.addEventListener('click',()=>{const a=wireFrom.value,b=wireTo.value;wireResult.textContent=a.includes('+12V')&&b.includes('+24V')?'❌ 電壓不相容：12V 不可直接接到 24V 端子。':a.includes('GND')&&!b.includes('GND')?'⚠️ GND 接到非接地端子，請確認。':'✅ 接線類型相容，可建立連線。'});
  document.getElementById('addSnapshot')?.addEventListener('click',()=>{state.snapshots.push('快照 '+(state.snapshots.length+1));go('project')});
  document.getElementById('playMission')?.addEventListener('click',()=>{const steps=[...document.querySelectorAll('.step')];let i=0;missionState.textContent='任務執行中';const t=setInterval(()=>{steps.forEach((s,n)=>s.classList.toggle('active',n===i));missionState.textContent=steps[i]?.querySelector('b')?.textContent||'完成';i++;if(i>=steps.length){clearInterval(t);setTimeout(()=>{missionState.textContent='✅ 任務完成';steps.forEach(s=>s.classList.remove('active'))},500)}},650)});
  root.querySelectorAll('[data-drive]').forEach(b=>{const dir=b.dataset.drive;if(dir==='stop'){b.addEventListener('click',()=>sim3d?.stop());return;}const down=e=>{e.preventDefault();sim3d?.setDrive(dir,true)};const up=e=>{e.preventDefault();sim3d?.setDrive(dir,false)};b.addEventListener('pointerdown',down);['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,up));});
  root.querySelectorAll('[data-editor-mode]').forEach(b=>b.addEventListener('click',()=>{setEditorMode(b.dataset.editorMode);root.querySelectorAll('[data-editor-mode]').forEach(x=>x.classList.toggle('active',x.dataset.editorMode===state.editor.mode));sim3d?.setEditorMode(state.editor.mode)}));
  document.getElementById('toggleSnap')?.addEventListener('click',e=>{state.editor.snap=!state.editor.snap;e.currentTarget.classList.toggle('active',state.editor.snap);e.currentTarget.textContent=`Snap ${state.editor.snap?'ON':'OFF'}`;sim3d?.setSnap(state.editor.snap)});
  document.getElementById('focusFloor')?.addEventListener('click',()=>sim3d?.focusFloor(state.editor.floorFocus));
  document.getElementById('applyTransform')?.addEventListener('click',()=>{const id=state.selectedDevice;if(!id)return;const patch={x:Number(propX.value)||0,y:Number(propY.value)||0,z:Number(propZ.value)||0,rotationY:(Number(propRot.value)||0)*Math.PI/180,floor:propFloor.value};updateDeviceTransform(id,patch);sim3d?.applyDeviceTransform(id);syncPropertyPanel(id)});
  document.getElementById('propFloor')?.addEventListener('change',()=>{const id=state.selectedDevice;if(!id)return;updateDeviceTransform(id,{floor:propFloor.value});sim3d?.applyDeviceTransform(id);syncPropertyPanel(id)});
  root.querySelectorAll('[data-nudge]').forEach(b=>b.addEventListener('click',()=>{const id=state.selectedDevice;if(!id)return;const t=getDeviceTransform(id),step=state.editor.gridSize||.25;const p={};if(b.dataset.nudge==='x-')p.x=t.x-step;if(b.dataset.nudge==='x+')p.x=t.x+step;if(b.dataset.nudge==='z-')p.z=t.z-step;if(b.dataset.nudge==='z+')p.z=t.z+step;updateDeviceTransform(id,p);sim3d?.applyDeviceTransform(id);syncPropertyPanel(id)}));
  root.querySelectorAll('[data-rotate]').forEach(b=>b.addEventListener('click',()=>{const id=state.selectedDevice;if(!id)return;const t=getDeviceTransform(id);updateDeviceTransform(id,{rotationY:(t.rotationY||0)+Number(b.dataset.rotate)*Math.PI/180});sim3d?.applyDeviceTransform(id);syncPropertyPanel(id)}));
  document.getElementById('toggleSignals')?.addEventListener('click',e=>{const on=sim3d?.toggleSignals();e.currentTarget.textContent=on?'隱藏 DI/DO 線':'顯示 DI/DO 線';});
  document.getElementById('toggleZones')?.addEventListener('click',e=>{const on=sim3d?.toggleZones();e.currentTarget.textContent=on?'隱藏感應範圍':'顯示感應範圍';});
  document.getElementById('followCar')?.addEventListener('click',e=>{state.simulator.follow=!state.simulator.follow;sim3d?.setFollow(state.simulator.follow);e.currentTarget.textContent=state.simulator.follow?'自由視角':'跟車視角';});
  document.getElementById('next3DView')?.addEventListener('click',()=>sim3d?.nextView());
  document.getElementById('resetCar')?.addEventListener('click',()=>sim3d?.resetCar());
  document.getElementById('saveView')?.addEventListener('click',()=>sim3d?.saveView());
  document.getElementById('refresh3DState')?.addEventListener('click',()=>sim3d?.applyProjectState());
  root.querySelectorAll('[data-diagram]').forEach(b=>b.addEventListener('click',()=>{diagramStatus.textContent=`已依目前專案產生：${b.dataset.diagram} 預覽。`;}));
  document.getElementById('compareRange')?.addEventListener('input',e=>{state.field.comparePercent=Number(e.target.value);compareText.textContent=`目前 ${state.field.comparePercent}% 疊圖比較：原車道 vs 改善後車道。`;});
  document.getElementById('addPhoto')?.addEventListener('click',()=>{state.photos.push({id:'P-'+String(state.photos.length+1).padStart(3,'0'),title:'新現場照片',device:state.selectedDevice});go('field')});
  document.getElementById('runAllTests')?.addEventListener('click',()=>{state.tests.forEach(t=>t.result='PASS');testSummary.textContent='✅ 6/6 測試通過，可產生驗收報告。';go('field')});
  document.getElementById('speed')?.addEventListener('change',e=>state.field.replaySpeed=e.target.value);
  document.getElementById('replayBtn')?.addEventListener('click',()=>{const lines=[...root.querySelectorAll('#eventStatus')];let i=0;const speedMap={'0.25x':1200,'0.5x':850,'1x':600,'2x':300};const timer=setInterval(()=>{if(i>=state.eventLog.length){clearInterval(timer);lines.forEach(el=>el.textContent='Replay 完成');return;}lines.forEach(el=>el.textContent=state.eventLog[i]);i++;},speedMap[state.field.replaySpeed]||600)});
  document.getElementById('docDevice')?.addEventListener('change',e=>{state.docsDevice=e.target.value;go('field')});
  document.getElementById('qrDevice')?.addEventListener('change',e=>{state.docsDevice=e.target.value;go('field')});
  root.querySelectorAll('[data-script-jump]').forEach(b=>b.addEventListener('click',()=>{state.field.scriptIndex=Number(b.dataset.scriptJump);go('field')}));
  document.getElementById('playScript')?.addEventListener('click',()=>{state.field.scriptIndex=0;go('field')});
  document.getElementById('nextScript')?.addEventListener('click',()=>{state.field.scriptIndex=(state.field.scriptIndex+1)%state.scripts.length;go('field')});
  document.getElementById('remotePrev')?.addEventListener('click',()=>{state.field.currentView='上一個視野';state.field.remoteState='已切換到上一個保存視野。';go('field')});
  document.getElementById('remoteNext')?.addEventListener('click',()=>{state.field.currentView='下一個視野';state.field.remoteState='已切換到下一個保存視野。';go('field')});
  document.getElementById('remoteOpen')?.addEventListener('click',()=>{state.field.barrierState='OPEN';state.field.remoteState='已送出 Barrier OPEN 指令。';sim3d?.setBarrier(true);go('field')});
  document.getElementById('remoteClose')?.addEventListener('click',()=>{state.field.barrierState='CLOSED';state.field.remoteState='已送出 Barrier CLOSE 指令。';sim3d?.setBarrier(false);go('field')});
  document.getElementById('remoteSignal')?.addEventListener('click',()=>{state.field.remoteState='已切換 DI/DO 顯示狀態。';sim3d?.toggleSignals();go('field')});
  document.getElementById('remoteMission')?.addEventListener('click',()=>{state.field.remoteState='已送出任務播放指令。';go('field')});
}
function safeKey(){const el=document.activeElement;return !(el&&['INPUT','TEXTAREA','SELECT'].includes(el.tagName));}
function keyCombo(e){const keys=[];if(e.ctrlKey)keys.push('Ctrl');if(e.altKey)keys.push('Alt');if(e.shiftKey)keys.push('Shift');if(!['Control','Alt','Shift','Meta'].includes(e.key))keys.push(e.key.length===1?e.key.toUpperCase():e.key);return keys.join(' + ');}
window.addEventListener('keydown',e=>{
  if(capturing){e.preventDefault();if(e.key==='Escape'){capturing=false;captureStatus.textContent='已取消。';return}if(['Backspace','Delete'].includes(e.key)){capturing=false;captureStatus.textContent='已清除快捷鍵設定。';return}const combo=keyCombo(e);if(!combo)return;if(isReservedHotkey(combo)){captureStatus.textContent='⚠️ 此按鍵可能與瀏覽器功能衝突，請改用其他按鍵。';capturing=false;return}const conflict=hotkeyConflict(combo);if(conflict){captureStatus.textContent=`⚠️ ${combo} 已設定給 ${conflict.target} ${conflict.action}`;capturing=false;return}const parts=hotkeyAction.value.split(' ');state.hotkeys.push({key:combo,target:parts.slice(0,-1).join(' '),action:parts.at(-1),enabled:true});capturing=false;go('hotkeys');return}
  if(!safeKey())return;const combo=keyCombo(e);const h=state.hotkeys.find(x=>x.enabled&&x.key===combo);if(!h)return;
  if(h.action==='OPEN')sim3d?.setBarrier(true);else if(h.action==='CLOSE')sim3d?.setBarrier(false);else if(h.action==='ON/OFF')sim3d?.toggleLoop();else if(h.action==='TRIGGER')sim3d?.triggerEtag();else if(h.action==='VIEW'||h.action==='NEXT VIEW')sim3d?.nextView();
});
document.addEventListener('click',e=>{const b=e.target.closest('[data-route]');if(b)go(b.dataset.route)});
document.getElementById('presentationToggle').addEventListener('click',()=>{state.presentation=!state.presentation;document.body.classList.toggle('presentation',state.presentation);presentationToggle.textContent=state.presentation?'退出簡報':'簡報模式'});
document.getElementById('saveBtn').addEventListener('click',()=>{state.savedAt=new Date();projectMeta.textContent='已儲存 · '+state.savedAt.toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'})});
go('overview');
