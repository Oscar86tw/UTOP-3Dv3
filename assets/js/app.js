import {categories,devices} from './data.js';
import {state} from './state.js';
import {render,renderDeviceInspector,renderQuick3DControls} from './views.js?v=1.3.1';
import {mountSimulator3D,unmountSimulator3D} from './core-3d-01/simulator3d.js?v=1.3.1';
import {toggleFloor,toggleGroup,setGroupOpacity,renameViewpoint,deleteViewpoint,updateDisplay,isReservedHotkey} from './core-project-01/project-controls.js';
import {getDeviceTransform,updateDeviceTransform,setFloorFocus,setEditorMode,selectDevice} from './core-editor-01/editor-commands.js';
import {addModule,removeModule,updateSettings,getSettings,controlsFor} from './core-module-01/module-manager.js';
import {deleteConnection,selectTerminalForBuilder,resetWiringBuilder} from './core-wiring-01/wiring-manager.js';
import {setTraceFocus,clearTraceFocus} from './core-signal-01/signal-trace.js';
import {applyScenePreset} from './core-scene-01/scene-library.js';
import {addRoadMarking,updateRoadMarking,deleteRoadMarking} from './core-road-01/road-markings.js';
import {mountNeuralView,unmountNeuralView} from './core-neural-01/neural-view.js';
import {runDebugAudit} from './core-debug-01/debug-center.js';

const root=document.getElementById('viewRoot'),tabs=document.getElementById('mainTabs'),bottom=document.getElementById('bottomNav');
let capturing=false,sim3d=null;

function nav(){
  tabs.innerHTML=categories.map(c=>`<button data-route="${c.id}" class="${state.route===c.id?'active':''}">${c.label}</button>`).join('');
  bottom.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.route===state.route));
  document.body.dataset.route=state.route;
}
async function go(route){
  if(state.route==='simulator'&&route!=='simulator'){unmountSimulator3D();sim3d=null;}
  if(state.route==='diagrams'&&route!=='diagrams')unmountNeuralView();
  state.route=route;nav();root.innerHTML=render(route);bind();
  if(route==='simulator'&&state.workspace.mode!=='2d'){
    sim3d=await mountSimulator3D({onSelection:id=>syncInspector(id,true),onTransform:id=>syncInspector(id,false)});
  }
  if(route==='diagrams')mountNeuralView();
}
function ensureInspectorShell(){
  const workspace=root.querySelector('.legacy-workspace');if(!workspace)return null;
  let aside=document.getElementById('deviceInspectorSidebar');
  if(!aside){
    aside=document.createElement('aside');aside.id='deviceInspectorSidebar';aside.className='legacy-sidebar right-sidebar';aside.innerHTML='<div id="deviceInspectorPanelContent"></div>';workspace.appendChild(aside);workspace.classList.add('has-right');
  }
  state.workspace.rightOpen=true;return aside;
}
function syncInspector(id,open=true){
  const d=devices.find(x=>x.id===id);if(!d)return;state.selectedDevice=id;selectDevice(id);
  if(open)ensureInspectorShell();
  const slot=document.getElementById('deviceInspectorPanelContent');if(slot)slot.innerHTML=renderDeviceInspector(id);
  const quick=document.getElementById('quick3DControlSlot');if(quick)quick.innerHTML=renderQuick3DControls(id);
  bindDynamicInspector();
  const badge=root.querySelector('.selected-badge');if(badge)badge.textContent=d.name;
  const sel=document.getElementById('selectedState');if(sel)sel.textContent=d.name;
}
function selectDeviceEverywhere(id){state.selectedDevice=id;selectDevice(id);sim3d?.selectDevice(id);if(state.route==='sync2d')go('sync2d');else if(state.route==='simulator')syncInspector(id,true);}
function applyPlanPatch(patch){const id=state.selectedDevice;if(!id)return;updateDeviceTransform(id,patch);sim3d?.applyDeviceTransform(id);if(state.route==='sync2d')go('sync2d');else syncInspector(id,false);}
function updateModuleSearch(q){state.moduleLibrary.search=q;const term=q.trim().toLowerCase();root.querySelectorAll('.legacy-module-card').forEach(card=>{card.hidden=!!term&&!card.textContent.toLowerCase().includes(term);});}
function currentHotkeyConflict(combo,exceptDevice='',exceptAction=''){
  for(const [deviceId,map] of Object.entries(state.deviceHotkeys||{}))for(const [action,key] of Object.entries(map||{}))if(key===combo&&!(deviceId===exceptDevice&&action===exceptAction))return {deviceId,action,key};
  return null;
}
function assignmentForKey(combo){for(const [deviceId,map] of Object.entries(state.deviceHotkeys||{}))for(const [action,key] of Object.entries(map||{}))if(key===combo)return {deviceId,action};return null;}
function keyCombo(e){const keys=[];if(e.ctrlKey)keys.push('Ctrl');if(e.altKey)keys.push('Alt');if(e.shiftKey)keys.push('Shift');if(!['Control','Alt','Shift','Meta'].includes(e.key))keys.push(e.key.length===1?e.key.toUpperCase():e.key);return keys.join(' + ');}
function safeKey(){const el=document.activeElement;return !(el&&['INPUT','TEXTAREA','SELECT'].includes(el.tagName));}
function bindDynamicInspector(){
  root.querySelectorAll('[data-inspector-tab]').forEach(b=>b.addEventListener('click',()=>{state.workspace.inspectorTab=b.dataset.inspectorTab;const slot=document.getElementById('deviceInspectorPanelContent');if(slot){slot.innerHTML=renderDeviceInspector(state.selectedDevice);bindDynamicInspector();}}));
  document.getElementById('closeInspectorSidebar')?.addEventListener('click',()=>{state.workspace.rightOpen=false;const aside=document.getElementById('deviceInspectorSidebar');aside?.remove();root.querySelector('.legacy-workspace')?.classList.remove('has-right');});
  document.getElementById('applyInspectorProperties')?.addEventListener('click',()=>{
    const id=state.selectedDevice,d=devices.find(x=>x.id===id);if(!d)return;
    d.name=document.getElementById('inspectorName')?.value.trim()||d.name;
    updateDeviceTransform(id,{x:Number(propX.value)||0,y:Number(propY.value)||0,z:Number(propZ.value)||0,rotationY:(Number(propRot.value)||0)*Math.PI/180,floor:propFloor.value});
    updateSettings(id,{showLabel:!!document.getElementById('showLabelSetting')?.checked,positionLocked:!!document.getElementById('lockPositionSetting')?.checked});
    sim3d?.applyDeviceTransform(id);sim3d?.applyDeviceSettings(id);syncInspector(id,false);
  });
  document.getElementById('applyModuleSettings')?.addEventListener('click',()=>{
    const id=state.selectedDevice,patch={};root.querySelectorAll('[data-setting-param]').forEach(el=>patch[el.dataset.settingParam]=Number(el.value));updateSettings(id,patch);sim3d?.applyDeviceSettings(id);syncInspector(id,false);
  });
  root.querySelectorAll('[data-open-selected-inspector]').forEach(b=>b.addEventListener('click',()=>{state.workspace.inspectorTab='controls';syncInspector(b.dataset.openSelectedInspector,true);}));
  root.querySelectorAll('[data-device-action]').forEach(b=>b.addEventListener('click',()=>{const [id,action]=b.dataset.deviceAction.split('|');sim3d?.executeDeviceAction(id,action);setTimeout(()=>syncInspector(id,false),80);}));
}
function bind(){
  root.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{state.simulator.cameraPreset=Number(b.dataset.view);go('simulator').then(()=>sim3d?.gotoView(Number(b.dataset.view)))}));
  root.querySelectorAll('[data-rename-view]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.renameView);const name=prompt('新的視野名稱',state.simulator.viewpoints[i]?.name||'');if(name?.trim()){renameViewpoint(i,name.trim());go('scene')}}));
  root.querySelectorAll('[data-delete-view]').forEach(b=>b.addEventListener('click',()=>{deleteViewpoint(Number(b.dataset.deleteView));go('scene')}));
  document.getElementById('applyScene')?.addEventListener('click',()=>{state.scene={place:scenePlace.value,time:sceneTime.value,weather:sceneWeather.value,event:sceneEvent.value};sceneSummary.textContent=`目前：${state.scene.place} · ${state.scene.time} · ${state.scene.weather} · ${state.scene.event}`;sim3d?.applyProjectState();});
  root.querySelectorAll('[data-scene-preset]').forEach(b=>b.addEventListener('click',()=>{const p=applyScenePreset(b.dataset.scenePreset);if(!p)return;state.workspace.mode='3d';go('simulator').then(()=>{sim3d?.applyProjectState();if(Number.isInteger(p.view))sim3d?.gotoView(p.view);});}));
  root.querySelectorAll('[data-add-road-marking]').forEach(b=>b.addEventListener('click',()=>{addRoadMarking(b.dataset.addRoadMarking,state.editor.floorFocus||'1F');go('scene');}));
  root.querySelectorAll('[data-select-road-marking]').forEach(b=>b.addEventListener('click',()=>{state.selectedRoadMarking=b.dataset.selectRoadMarking;go('scene');}));
  root.querySelectorAll('[data-delete-road-marking]').forEach(b=>b.addEventListener('click',()=>{deleteRoadMarking(b.dataset.deleteRoadMarking);go('scene');}));
  document.getElementById('applyRoadMarking')?.addEventListener('click',()=>{const id=state.selectedRoadMarking;if(!id)return;updateRoadMarking(id,{floor:roadFloor.value,x:Number(roadX.value)||0,z:Number(roadZ.value)||0,rotation:Number(roadRot.value)||0,width:Math.max(.02,Number(roadWidth.value)||.1),length:Math.max(.1,Number(roadLength.value)||1)});state.workspace.mode='3d';go('simulator').then(()=>sim3d?.refreshRoadMarkings?.());});
  root.querySelectorAll('[data-floor]').forEach(b=>b.addEventListener('click',()=>{toggleFloor(b.dataset.floor);go('layers')}));
  root.querySelectorAll('[data-floor-focus]').forEach(b=>b.addEventListener('click',()=>{setFloorFocus(b.dataset.floorFocus);go('simulator').then(()=>sim3d?.focusFloor(b.dataset.floorFocus))}));
  root.querySelectorAll('[data-group]').forEach(b=>b.addEventListener('click',()=>{toggleGroup(b.dataset.group);go('layers')}));
  root.querySelectorAll('[data-group-opacity]').forEach(r=>r.addEventListener('input',()=>setGroupOpacity(r.dataset.group,Number(r.value)/100)));
  root.querySelectorAll('[data-select2d]').forEach(b=>b.addEventListener('click',()=>selectDeviceEverywhere(b.dataset.select2d)));

  document.getElementById('toggleModuleSidebar')?.addEventListener('click',()=>{state.workspace.leftOpen=!state.workspace.leftOpen;go('simulator')});
  document.getElementById('toggleInspectorSidebar')?.addEventListener('click',()=>{state.workspace.rightOpen=!state.workspace.rightOpen;go('simulator')});
  document.getElementById('closeModuleSidebar')?.addEventListener('click',()=>{state.workspace.leftOpen=false;go('simulator')});
  document.getElementById('closeInspectorSidebar')?.addEventListener('click',()=>{state.workspace.rightOpen=false;go('simulator')});
  root.querySelectorAll('[data-workspace-mode]').forEach(b=>b.addEventListener('click',()=>{state.workspace.mode=b.dataset.workspaceMode;go('simulator')}));
  document.getElementById('toggle3DFullscreen')?.addEventListener('click',()=>{state.workspace.fullscreen3d=!state.workspace.fullscreen3d;go('simulator')});
  root.querySelectorAll('[data-editor-mode]').forEach(b=>b.addEventListener('click',()=>{setEditorMode(b.dataset.editorMode);root.querySelectorAll('[data-editor-mode]').forEach(x=>x.classList.toggle('active',x.dataset.editorMode===state.editor.mode));sim3d?.setEditorMode(state.editor.mode)}));
  document.getElementById('toggleSnap')?.addEventListener('click',e=>{state.editor.snap=!state.editor.snap;e.currentTarget.classList.toggle('active',state.editor.snap);e.currentTarget.textContent=`Snap ${state.editor.snap?'ON':'OFF'}`;sim3d?.setSnap(state.editor.snap)});
  root.querySelectorAll('[data-add-template]').forEach(b=>b.addEventListener('click',()=>{const id=addModule(b.dataset.addTemplate,state.editor.floorFocus||'1F');if(id){state.workspace.rightOpen=true;go('simulator')}}));
  document.getElementById('moduleSearch')?.addEventListener('input',e=>updateModuleSearch(e.target.value));
  document.getElementById('moduleGroup')?.addEventListener('change',e=>{state.moduleLibrary.group=e.target.value;go('simulator')});
  bindDynamicInspector();

  root.querySelectorAll('[data-drive]').forEach(b=>{const dir=b.dataset.drive;if(dir==='stop'){b.addEventListener('click',()=>sim3d?.stop());return;}const down=e=>{e.preventDefault();sim3d?.setDrive(dir,true)},up=e=>{e.preventDefault();sim3d?.setDrive(dir,false)};b.addEventListener('pointerdown',down);['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,up));});
  document.getElementById('toggleSignals')?.addEventListener('click',e=>{const on=sim3d?.toggleSignals();e.currentTarget.textContent=on?'隱藏 DI/DO 線':'顯示 DI/DO 線'});
  document.getElementById('toggleZones')?.addEventListener('click',e=>{const on=sim3d?.toggleZones();e.currentTarget.textContent=on?'隱藏感應範圍':'顯示感應範圍'});
  document.getElementById('followCar')?.addEventListener('click',e=>{state.simulator.follow=!state.simulator.follow;sim3d?.setFollow(state.simulator.follow);e.currentTarget.textContent=state.simulator.follow?'自由視角':'跟車視角'});
  document.getElementById('next3DView')?.addEventListener('click',()=>sim3d?.nextView());document.getElementById('resetCar')?.addEventListener('click',()=>sim3d?.resetCar());document.getElementById('saveView')?.addEventListener('click',()=>sim3d?.saveView());

  document.getElementById('applyPlanTransform')?.addEventListener('click',()=>applyPlanPatch({x:Number(planX.value)||0,z:Number(planZ.value)||0,rotationY:(Number(planRot.value)||0)*Math.PI/180,floor:planFloor.value}));

  document.getElementById('hotkeyDevice')?.addEventListener('change',e=>{state.hotkeyEditor.deviceId=e.target.value;state.hotkeyEditor.actionId='';state.hotkeyEditor.message='請選擇這台模組要設定的功能。';go('hotkeys')});
  document.getElementById('hotkeyAction')?.addEventListener('change',e=>{state.hotkeyEditor.actionId=e.target.value;state.hotkeyEditor.message=e.target.value?'按「設定按鍵」後，直接按你要使用的按鍵。':'請選擇功能。';go('hotkeys')});
  document.getElementById('captureHotkey')?.addEventListener('click',()=>{if(!state.hotkeyEditor.actionId)return;capturing=true;state.hotkeyEditor.capture=true;const el=document.getElementById('captureStatus');if(el)el.textContent='請直接按下單鍵或組合鍵；Esc 取消，Delete 清除此功能按鍵。'});
  root.querySelectorAll('[data-clear-device-hotkey]').forEach(b=>b.addEventListener('click',()=>{const [id,action]=b.dataset.clearDeviceHotkey.split('|');if(state.deviceHotkeys[id])delete state.deviceHotkeys[id][action];state.hotkeyEditor.message='已清除快捷鍵。';go('hotkeys')}));

  root.querySelectorAll('[data-display-mode]').forEach(x=>x.addEventListener('change',()=>updateDisplay(Number(x.dataset.displayMode),{mode:x.value})));root.querySelectorAll('[data-display-view]').forEach(x=>x.addEventListener('change',()=>updateDisplay(Number(x.dataset.displayView),{view:x.value})));root.querySelectorAll('[data-display-quality]').forEach(x=>x.addEventListener('change',()=>updateDisplay(Number(x.dataset.displayQuality),{quality:x.value})));
  root.querySelectorAll('[data-terminal-pick]').forEach(b=>b.addEventListener('click',()=>{const [deviceId,terminal]=b.dataset.terminalPick.split('|');selectTerminalForBuilder(deviceId,terminal);go('engineering')}));
  root.querySelectorAll('[data-delete-connection]').forEach(b=>b.addEventListener('click',()=>{deleteConnection(b.dataset.deleteConnection);go('engineering')}));
  document.getElementById('resetWiringBuilder')?.addEventListener('click',()=>{resetWiringBuilder();go('engineering')});
  document.getElementById('showAllWiring3D')?.addEventListener('click',()=>{clearTraceFocus();state.workspace.mode='3d';go('simulator').then(()=>sim3d?.applyProjectState())});
  root.querySelectorAll('[data-focus-wiring-3d]').forEach(b=>b.addEventListener('click',()=>{setTraceFocus(b.dataset.focusWiring3d,'full');state.selectedDevice=b.dataset.focusWiring3d;state.workspace.mode='3d';go('simulator').then(()=>sim3d?.applyTraceFocus())}));
  root.querySelectorAll('[data-trace-device]').forEach(b=>b.addEventListener('click',()=>{setTraceFocus(b.dataset.traceDevice,'full');state.selectedDevice=b.dataset.traceDevice;go('diagrams')}));
  document.getElementById('applyTrace')?.addEventListener('click',()=>{setTraceFocus(traceDevice.value,traceMode.value);go('diagrams')});document.getElementById('showTrace3D')?.addEventListener('click',()=>{setTraceFocus(traceDevice.value,traceMode.value);state.selectedDevice=traceDevice.value;state.workspace.mode='3d';go('simulator').then(()=>sim3d?.applyTraceFocus())});document.getElementById('clearTraceFromDiagram')?.addEventListener('click',()=>{clearTraceFocus();go('diagrams')});
  root.querySelectorAll('[data-diagram]').forEach(b=>b.addEventListener('click',()=>{const el=document.getElementById('diagramStatus');if(el)el.textContent=`已依目前 Connection / Trace 產生：${b.dataset.diagram} 預覽。`}));
  document.getElementById('playMission')?.addEventListener('click',()=>{const steps=[...document.querySelectorAll('.step')];let i=0;const label=document.getElementById('missionState');if(label)label.textContent='任務執行中';const timer=setInterval(()=>{steps.forEach((s,n)=>s.classList.toggle('active',n===i));if(label)label.textContent=steps[i]?.querySelector('b')?.textContent||'完成';i++;if(i>=steps.length){clearInterval(timer);setTimeout(()=>{if(label)label.textContent='✅ 任務完成';steps.forEach(s=>s.classList.remove('active'))},400)}},600)});
  document.getElementById('compareRange')?.addEventListener('input',e=>{state.field.comparePercent=Number(e.target.value);const el=document.getElementById('compareText');if(el)el.textContent=`目前 ${state.field.comparePercent}% 疊圖比較。`});
  document.getElementById('addPhoto')?.addEventListener('click',()=>{state.photos.push({id:'P-'+String(state.photos.length+1).padStart(3,'0'),title:'新現場照片',device:state.selectedDevice});go('field')});
  document.getElementById('runAllTests')?.addEventListener('click',()=>{state.tests.forEach(t=>t.result='PASS');go('field')});
  document.getElementById('runDebugAudit')?.addEventListener('click',()=>{runDebugAudit();go('project');});
  document.getElementById('neuralReset')?.addEventListener('click',()=>{unmountNeuralView();mountNeuralView();});
  document.getElementById('docDevice')?.addEventListener('change',e=>{state.docsDevice=e.target.value;go('field')});root.querySelectorAll('[data-script-jump]').forEach(b=>b.addEventListener('click',()=>{state.field.scriptIndex=Number(b.dataset.scriptJump);go('field')}));
}

window.addEventListener('keydown',e=>{
  if(capturing){
    e.preventDefault();const status=document.getElementById('captureStatus');
    if(e.key==='Escape'){capturing=false;state.hotkeyEditor.capture=false;state.hotkeyEditor.message='已取消設定。';if(status)status.textContent=state.hotkeyEditor.message;return;}
    const deviceId=state.hotkeyEditor.deviceId,actionId=state.hotkeyEditor.actionId;if(!deviceId||!actionId)return;
    if(['Backspace','Delete'].includes(e.key)){state.deviceHotkeys[deviceId]??={};delete state.deviceHotkeys[deviceId][actionId];capturing=false;state.hotkeyEditor.capture=false;state.hotkeyEditor.message='已清除此功能按鍵。';go('hotkeys');return;}
    const combo=keyCombo(e);if(!combo)return;if(isReservedHotkey(combo)){capturing=false;state.hotkeyEditor.message='⚠️ 此按鍵與瀏覽器功能衝突，請使用其他按鍵。';go('hotkeys');return;}
    const conflict=currentHotkeyConflict(combo,deviceId,actionId);if(conflict){const d=devices.find(x=>x.id===conflict.deviceId);capturing=false;state.hotkeyEditor.message=`⚠️ ${combo} 已設定給 ${d?.name||conflict.deviceId} 的 ${conflict.action}`;go('hotkeys');return;}
    state.deviceHotkeys[deviceId]??={};state.deviceHotkeys[deviceId][actionId]=combo;capturing=false;state.hotkeyEditor.capture=false;state.hotkeyEditor.message=`✅ 已設定 ${combo}`;go('hotkeys');return;
  }
  if(!safeKey())return;const combo=keyCombo(e),assign=assignmentForKey(combo);if(!assign)return;e.preventDefault();sim3d?.executeDeviceAction(assign.deviceId,assign.action);
});

document.addEventListener('click',e=>{const b=e.target.closest('[data-route]');if(b)go(b.dataset.route)});
document.getElementById('presentationToggle').addEventListener('click',()=>{state.presentation=!state.presentation;document.body.classList.toggle('presentation',state.presentation);presentationToggle.textContent=state.presentation?'退出簡報':'簡報模式'});
document.getElementById('saveBtn').addEventListener('click',()=>{state.savedAt=new Date();projectMeta.textContent='已儲存 · '+state.savedAt.toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'})});
go('overview');
