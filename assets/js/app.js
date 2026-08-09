import {categories,devices} from './data.js';
import {state} from './state.js';
import {render,renderDeviceInspector,renderQuick3DControls} from './views.js?v=1.4.9';
import {mountSimulator3D,unmountSimulator3D} from './core-3d-01/simulator3d.js?v=1.4.9';
import {toggleFloor,toggleGroup,setGroupOpacity,renameViewpoint,deleteViewpoint,updateDisplay,isReservedHotkey} from './core-project-01/project-controls.js';
import {getDeviceTransform,updateDeviceTransform,setFloorFocus,setEditorMode,selectDevice} from './core-editor-01/editor-commands.js';
import {addModule,removeModule,updateSettings,getSettings,controlsFor} from './core-module-01/module-manager.js';
import {deleteConnection,selectTerminalForBuilder,resetWiringBuilder} from './core-wiring-01/wiring-manager.js';
import {setTraceFocus,clearTraceFocus} from './core-signal-01/signal-trace.js';
import {applyScenePreset} from './core-scene-01/scene-library.js';
import {addRoadMarking,updateRoadMarking,deleteRoadMarking} from './core-road-01/road-markings.js';
import {mountNeuralView,unmountNeuralView} from './core-neural-01/neural-view.js';
import {runDebugAudit} from './core-debug-01/debug-center.js';
import {cloneDefaults,migrateProjectState} from './core-state-01/state-integrity.js?v=1.4.9';
import {runFunctionStateAudit} from './core-validation-01/function-state-validator.js?v=1.4.9';

const root=document.getElementById('viewRoot'),tabs=document.getElementById('mainTabs'),bottom=document.getElementById('bottomNav');
let capturing=false,sim3d=null,navEpoch=0,simulatorMountPromise=null,missionTimer=null;
const STORAGE_KEY='utop3dv3.project.v1';
const DEFAULTS=cloneDefaults(state,devices);

const byId=id=>document.getElementById(id);
const val=(id,fallback='')=>byId(id)?.value??fallback;
const num=(id,fallback=0)=>{const n=Number(val(id,''));return Number.isFinite(n)?n:fallback;};
const checked=id=>!!byId(id)?.checked;
function reportUiError(where,err){
  console.error(`[UTOP UI] ${where}`,err);
  const toast=byId('simToast');
  if(toast){toast.textContent=`${where} 失敗：${err?.message||err}`;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2600);}
  else {const meta=byId('projectMeta');if(meta)meta.textContent=`⚠ ${where} 失敗：${err?.message||err}`;}
}
function safeHandler(where,fn){return async e=>{try{return await fn(e);}catch(err){reportUiError(where,err);}}}

function saveProjectState(showStatus=true){
  try{
    const payload={schema:'4.10',savedAt:new Date().toISOString(),state,devices};
    localStorage.setItem(STORAGE_KEY,JSON.stringify(payload));
    state.savedAt=new Date(payload.savedAt);
    if(showStatus){const meta=byId('projectMeta');if(meta)meta.textContent='已儲存 · '+state.savedAt.toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'});}
    return true;
  }catch(err){reportUiError('儲存專案',err);return false;}
}
function restoreProjectState(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(raw){
      const payload=JSON.parse(raw);
      if(payload?.state&&typeof payload.state==='object'){
        for(const [k,v] of Object.entries(payload.state)) state[k]=v;
        if(payload.savedAt)state.savedAt=new Date(payload.savedAt);
      }
      if(Array.isArray(payload?.devices)&&payload.devices.length)devices.splice(0,devices.length,...payload.devices);
    }
    migrateProjectState(state,devices,DEFAULTS.state,DEFAULTS.devices);
    return !!raw;
  }catch(err){
    console.warn('[UTOP] 本機專案狀態還原失敗，執行完整性修復',err);
    migrateProjectState(state,devices,DEFAULTS.state,DEFAULTS.devices);
    return false;
  }
}
async function withSimulator(where,fn){
  try{
    if(state.route!=='simulator'){state.workspace.mode='3d';await go('simulator');}
    if(simulatorMountPromise)await simulatorMountPromise;
    if(!sim3d)throw new Error('3D 尚未完成初始化');
    return await fn(sim3d);
  }catch(err){reportUiError(where,err);return null;}
}


function nav(){
  tabs.innerHTML=categories.map(c=>`<button data-route="${c.id}" class="${state.route===c.id?'active':''}">${c.label}</button>`).join('');
  bottom.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.route===state.route));
  document.body.dataset.route=state.route;
}
async function go(route){
  const epoch=++navEpoch;
  if(state.route==='simulator'&&route!=='simulator'){unmountSimulator3D();sim3d=null;simulatorMountPromise=null;}
  if(state.route==='diagrams'&&route!=='diagrams')unmountNeuralView();
  state.route=route;nav();root.innerHTML=render(route);bind();
  if(route==='simulator'&&state.workspace.mode!=='2d'){
    simulatorMountPromise=mountSimulator3D({onSelection:id=>syncInspector(id,true),onTransform:id=>syncInspector(id,false)});
    const mounted=await simulatorMountPromise;
    if(epoch!==navEpoch||state.route!=='simulator'){mounted?.destroy?.();return;}
    sim3d=mounted;simulatorMountPromise=null;
    state.runtimeHealth??={};
    state.runtimeHealth.simulatorReady=!!sim3d;
    state.runtimeHealth.webglReady=!!sim3d && sim3d.localFallback!==true;
    state.runtimeHealth.lastError=sim3d?'':'3D 初始化沒有回傳 Simulator API';
  }
  if(route==='diagrams'&&epoch===navEpoch)mountNeuralView();
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
  byId('deleteSelectedModule')?.addEventListener('click',safeHandler('刪除模組',async()=>{
    const id=state.selectedDevice;if(!id)return;
    if(!confirm('確定刪除目前模組及相關接線？'))return;
    if(!removeModule(id))return;
    state.selectedDevice=devices[0]?.id||null;
    if(state.route==='simulator')await go('simulator');
  }));
  document.getElementById('applyInspectorProperties')?.addEventListener('click',()=>{
    const id=state.selectedDevice,d=devices.find(x=>x.id===id);if(!d)return;
    d.name=String(val('inspectorName',d.name)).trim()||d.name;
    updateDeviceTransform(id,{x:num('propX'),y:num('propY'),z:num('propZ'),rotationX:num('propRX')*Math.PI/180,rotationY:num('propRY')*Math.PI/180,rotationZ:num('propRZ')*Math.PI/180,floor:val('propFloor',getDeviceTransform(id).floor)});
    updateSettings(id,{showLabel:checked('showLabelSetting'),labelOffsetX:num('labelOffsetX'),labelOffsetY:num('labelOffsetY'),labelOffsetZ:num('labelOffsetZ'),positionLocked:checked('lockPositionSetting')});
    withSimulator('設備屬性套用',s=>{s.applyDeviceTransform(id);s.applyDeviceSettings(id);});syncInspector(id,false);
  });
  document.getElementById('applyModuleSettings')?.addEventListener('click',()=>{
    const id=state.selectedDevice,patch={};root.querySelectorAll('[data-setting-param]').forEach(el=>patch[el.dataset.settingParam]=Number(el.value));updateSettings(id,patch);withSimulator('設備參數套用',s=>s.applyDeviceSettings(id));syncInspector(id,false);
  });
  root.querySelectorAll('[data-open-selected-inspector]').forEach(b=>b.addEventListener('click',()=>{state.workspace.inspectorTab='controls';syncInspector(b.dataset.openSelectedInspector,true);}));
  root.querySelectorAll('[data-device-action]').forEach(b=>b.addEventListener('click',safeHandler('設備控制',async()=>{const [id,action]=b.dataset.deviceAction.split('|');await withSimulator('設備控制',s=>s.executeDeviceAction(id,action));setTimeout(()=>syncInspector(id,false),80);})));
}
function bind(){
  root.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{state.simulator.cameraPreset=Number(b.dataset.view);go('simulator').then(()=>sim3d?.gotoView(Number(b.dataset.view)))}));
  root.querySelectorAll('[data-rename-view]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.renameView);const name=prompt('新的視野名稱',state.simulator.viewpoints[i]?.name||'');if(name?.trim()){renameViewpoint(i,name.trim());go('scene')}}));
  root.querySelectorAll('[data-delete-view]').forEach(b=>b.addEventListener('click',()=>{deleteViewpoint(Number(b.dataset.deleteView));go('scene')}));
  byId('applyScene')?.addEventListener('click',safeHandler('套用情境',async()=>{state.scene={place:val('scenePlace'),time:val('sceneTime'),weather:val('sceneWeather'),event:val('sceneEvent')};const summary=byId('sceneSummary');if(summary)summary.textContent=`目前：${state.scene.place} · ${state.scene.time} · ${state.scene.weather} · ${state.scene.event}`;state.workspace.mode='3d';await go('simulator');sim3d?.applyProjectState();}));
  root.querySelectorAll('[data-scene-preset]').forEach(b=>b.addEventListener('click',()=>{const p=applyScenePreset(b.dataset.scenePreset);if(!p)return;state.workspace.mode='3d';go('simulator').then(()=>{sim3d?.applyProjectState();if(Number.isInteger(p.view))sim3d?.gotoView(p.view);});}));
  root.querySelectorAll('[data-add-road-marking]').forEach(b=>b.addEventListener('click',()=>{addRoadMarking(b.dataset.addRoadMarking,state.editor.floorFocus||'1F');go('scene');}));
  root.querySelectorAll('[data-select-road-marking]').forEach(b=>b.addEventListener('click',()=>{state.selectedRoadMarking=b.dataset.selectRoadMarking;go('scene');}));
  root.querySelectorAll('[data-delete-road-marking]').forEach(b=>b.addEventListener('click',()=>{deleteRoadMarking(b.dataset.deleteRoadMarking);go('scene');}));
  byId('applyRoadMarking')?.addEventListener('click',safeHandler('套用道路標線',async()=>{const id=state.selectedRoadMarking;if(!id)return;updateRoadMarking(id,{floor:val('roadFloor','1F'),x:num('roadX'),z:num('roadZ'),rotation:num('roadRot'),width:Math.max(.02,num('roadWidth',.1)),length:Math.max(.1,num('roadLength',1))});state.workspace.mode='3d';await go('simulator');sim3d?.refreshRoadMarkings?.();}));
  root.querySelectorAll('[data-floor]').forEach(b=>b.addEventListener('click',()=>{toggleFloor(b.dataset.floor);go('layers')}));
  root.querySelectorAll('[data-floor-focus]').forEach(b=>b.addEventListener('click',()=>{setFloorFocus(b.dataset.floorFocus);go('simulator').then(()=>sim3d?.focusFloor(b.dataset.floorFocus))}));
  root.querySelectorAll('[data-group]').forEach(b=>b.addEventListener('click',()=>{toggleGroup(b.dataset.group);go('layers')}));
  root.querySelectorAll('[data-group-opacity]').forEach(r=>r.addEventListener('input',()=>setGroupOpacity(r.dataset.group,Number(r.value)/100)));
  root.querySelectorAll('[data-select2d]').forEach(b=>b.addEventListener('click',()=>selectDeviceEverywhere(b.dataset.select2d)));

  document.getElementById('toggleModuleSidebar')?.addEventListener('click',()=>{state.workspace.leftOpen=!state.workspace.leftOpen;go('simulator')});
  document.getElementById('toggleInspectorSidebar')?.addEventListener('click',()=>{state.workspace.rightOpen=!state.workspace.rightOpen;go('simulator')});
  document.getElementById('closeModuleSidebar')?.addEventListener('click',()=>{state.workspace.leftOpen=false;go('simulator')});
  root.querySelectorAll('[data-workspace-mode]').forEach(b=>b.addEventListener('click',()=>{state.workspace.mode=b.dataset.workspaceMode;go('simulator')}));
  document.getElementById('toggle3DFullscreen')?.addEventListener('click',()=>{state.workspace.fullscreen3d=!state.workspace.fullscreen3d;go('simulator')});
  root.querySelectorAll('[data-editor-mode]').forEach(b=>b.addEventListener('click',safeHandler('切換3D編輯模式',async()=>{setEditorMode(b.dataset.editorMode);root.querySelectorAll('[data-editor-mode]').forEach(x=>x.classList.toggle('active',x.dataset.editorMode===state.editor.mode));await withSimulator('切換3D編輯模式',s=>s.setEditorMode(state.editor.mode));})));
  document.getElementById('toggleSnap')?.addEventListener('click',safeHandler('Snap切換',async e=>{state.editor.snap=!state.editor.snap;e.currentTarget.classList.toggle('active',state.editor.snap);e.currentTarget.textContent=`Snap ${state.editor.snap?'ON':'OFF'}`;await withSimulator('Snap切換',s=>s.setSnap(state.editor.snap));}));
  root.querySelectorAll('[data-add-template]').forEach(b=>b.addEventListener('click',safeHandler('新增模組',async()=>{const id=addModule(b.dataset.addTemplate,state.editor.floorFocus||'1F');if(id){state.selectedDevice=id;selectDevice(id);state.workspace.rightOpen=true;state.workspace.mode='3d';await go('simulator');sim3d?.selectDevice(id);syncInspector(id,true);}})));
  document.getElementById('moduleSearch')?.addEventListener('input',e=>updateModuleSearch(e.target.value));
  document.getElementById('moduleGroup')?.addEventListener('change',e=>{state.moduleLibrary.group=e.target.value;go('simulator')});
  bindDynamicInspector();

  root.querySelectorAll('[data-drive]').forEach(b=>{const dir=b.dataset.drive;if(dir==='stop'){b.addEventListener('click',()=>sim3d?.stop());return;}const down=e=>{e.preventDefault();sim3d?.setDrive(dir,true)},up=e=>{e.preventDefault();sim3d?.setDrive(dir,false)};b.addEventListener('pointerdown',down);['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,up));});
  document.getElementById('toggleSignals')?.addEventListener('click',safeHandler('DI/DO線切換',async e=>{const on=await withSimulator('DI/DO線切換',s=>s.toggleSignals());if(on!==null)e.currentTarget.textContent=on?'隱藏 DI/DO 線':'顯示 DI/DO 線';}));
  document.getElementById('toggleZones')?.addEventListener('click',safeHandler('感應範圍切換',async e=>{const on=await withSimulator('感應範圍切換',s=>s.toggleZones());if(on!==null)e.currentTarget.textContent=on?'隱藏感應範圍':'顯示感應範圍';}));
  document.getElementById('followCar')?.addEventListener('click',safeHandler('跟車視角切換',async e=>{state.simulator.follow=!state.simulator.follow;await withSimulator('跟車視角切換',s=>s.setFollow(state.simulator.follow));e.currentTarget.textContent=state.simulator.follow?'自由視角':'跟車視角';}));
  document.getElementById('next3DView')?.addEventListener('click',()=>withSimulator('切換3D視野',s=>s.nextView()));document.getElementById('resetCar')?.addEventListener('click',()=>withSimulator('重設車輛',s=>s.resetCar()));document.getElementById('toggleDeviceLabels')?.addEventListener('click',e=>{const on=sim3d?.toggleLabels?.();e.currentTarget.textContent=on?'隱藏名稱牌':'顯示名稱牌'});document.getElementById('runEntryLaneDemo')?.addEventListener('click',()=>withSimulator('入口展示',s=>s.runLaneDemo?.('entry')));document.getElementById('runExitLaneDemo')?.addEventListener('click',()=>withSimulator('出口展示',s=>s.runLaneDemo?.('exit')));document.getElementById('runBothLaneDemo')?.addEventListener('click',()=>withSimulator('雙車道展示',s=>s.runLaneDemo?.('both')));document.getElementById('saveView')?.addEventListener('click',()=>withSimulator('儲存視野',s=>s.saveView()));

  byId('applyPlanTransform')?.addEventListener('click',safeHandler('套用平面位置',()=>applyPlanPatch({x:num('planX'),z:num('planZ'),rotationY:num('planRot')*Math.PI/180,floor:val('planFloor','1F')})));

  document.getElementById('hotkeyDevice')?.addEventListener('change',e=>{state.hotkeyEditor.deviceId=e.target.value;state.hotkeyEditor.actionId='';state.hotkeyEditor.message='請選擇這台模組要設定的功能。';go('hotkeys')});
  document.getElementById('hotkeyAction')?.addEventListener('change',e=>{state.hotkeyEditor.actionId=e.target.value;state.hotkeyEditor.message=e.target.value?'按「設定按鍵」後，直接按你要使用的按鍵。':'請選擇功能。';go('hotkeys')});
  document.getElementById('captureHotkey')?.addEventListener('click',()=>{if(!state.hotkeyEditor.actionId)return;capturing=true;state.hotkeyEditor.capture=true;const el=document.getElementById('captureStatus');if(el)el.textContent='請直接按下單鍵或組合鍵；Esc 取消，Delete 清除此功能按鍵。'});
  root.querySelectorAll('[data-clear-device-hotkey]').forEach(b=>b.addEventListener('click',()=>{const [id,action]=b.dataset.clearDeviceHotkey.split('|');if(state.deviceHotkeys[id])delete state.deviceHotkeys[id][action];state.hotkeyEditor.message='已清除快捷鍵。';go('hotkeys')}));

  byId('addDisplay')?.addEventListener('click',()=>{
    const i=state.displays.length+1;
    state.displays.push({name:`顯示裝置 ${i}`,mode:'簡報同步',view:'跟隨主控',resolution:'1080p',quality:'平衡',state:'STANDBY',signals:true,hud:true});
    go('display');
  });
  root.querySelectorAll('[data-display-mode]').forEach(x=>x.addEventListener('change',()=>updateDisplay(Number(x.dataset.displayMode),{mode:x.value})));root.querySelectorAll('[data-display-view]').forEach(x=>x.addEventListener('change',()=>updateDisplay(Number(x.dataset.displayView),{view:x.value})));root.querySelectorAll('[data-display-quality]').forEach(x=>x.addEventListener('change',()=>updateDisplay(Number(x.dataset.displayQuality),{quality:x.value})));
  root.querySelectorAll('[data-terminal-pick]').forEach(b=>b.addEventListener('click',()=>{const [deviceId,terminal]=b.dataset.terminalPick.split('|');selectTerminalForBuilder(deviceId,terminal);go('engineering')}));
  root.querySelectorAll('[data-delete-connection]').forEach(b=>b.addEventListener('click',()=>{deleteConnection(b.dataset.deleteConnection);go('engineering')}));
  document.getElementById('resetWiringBuilder')?.addEventListener('click',()=>{resetWiringBuilder();go('engineering')});
  document.getElementById('showAllWiring3D')?.addEventListener('click',()=>{clearTraceFocus();state.workspace.mode='3d';go('simulator').then(()=>sim3d?.applyProjectState())});
  root.querySelectorAll('[data-focus-wiring-3d]').forEach(b=>b.addEventListener('click',()=>{setTraceFocus(b.dataset.focusWiring3d,'full');state.selectedDevice=b.dataset.focusWiring3d;state.workspace.mode='3d';go('simulator').then(()=>sim3d?.applyTraceFocus())}));
  root.querySelectorAll('[data-trace-device]').forEach(b=>b.addEventListener('click',()=>{setTraceFocus(b.dataset.traceDevice,'full');state.selectedDevice=b.dataset.traceDevice;go('diagrams')}));
  byId('applyTrace')?.addEventListener('click',safeHandler('開始 Signal Trace',()=>{setTraceFocus(val('traceDevice'),val('traceMode','full'));return go('diagrams')}));byId('showTrace3D')?.addEventListener('click',safeHandler('3D 顯示 Signal Trace',async()=>{const deviceId=val('traceDevice'),mode=val('traceMode','full');setTraceFocus(deviceId,mode);state.selectedDevice=deviceId;state.workspace.mode='3d';await go('simulator');sim3d?.applyTraceFocus();}));byId('clearTraceFromDiagram')?.addEventListener('click',()=>{clearTraceFocus();go('diagrams')});
  root.querySelectorAll('[data-diagram]').forEach(b=>b.addEventListener('click',()=>{const el=document.getElementById('diagramStatus');if(el)el.textContent=`已依目前 Connection / Trace 產生：${b.dataset.diagram} 預覽。`}));
  document.getElementById('playMission')?.addEventListener('click',()=>{if(missionTimer){clearInterval(missionTimer);missionTimer=null;}const steps=[...document.querySelectorAll('.step')];let i=0;const label=document.getElementById('missionState');if(label)label.textContent='任務執行中';missionTimer=setInterval(()=>{if(state.route!=='mission'){clearInterval(missionTimer);missionTimer=null;return;}steps.forEach((s,n)=>s.classList.toggle('active',n===i));if(label)label.textContent=steps[i]?.querySelector('b')?.textContent||'完成';i++;if(i>=steps.length){clearInterval(missionTimer);missionTimer=null;setTimeout(()=>{if(label)label.textContent='✅ 任務完成';steps.forEach(s=>s.classList.remove('active'))},400)}},600)});
  document.getElementById('compareRange')?.addEventListener('input',e=>{state.field.comparePercent=Number(e.target.value);const el=document.getElementById('compareText');if(el)el.textContent=`目前 ${state.field.comparePercent}% 疊圖比較。`});
  document.getElementById('addPhoto')?.addEventListener('click',()=>{state.photos.push({id:'P-'+String(state.photos.length+1).padStart(3,'0'),title:'新現場照片',device:state.selectedDevice});go('field')});
  document.getElementById('runAllTests')?.addEventListener('click',()=>{state.tests.forEach(t=>t.result='PASS');go('field')});
  document.getElementById('runDebugAudit')?.addEventListener('click',()=>{runDebugAudit();go('project');});
  document.getElementById('repairProjectState')?.addEventListener('click',()=>{migrateProjectState(state,devices,DEFAULTS.state,DEFAULTS.devices);saveProjectState(false);runFunctionStateAudit();go('project');});
  document.getElementById('runFunctionStateAudit')?.addEventListener('click',()=>{runFunctionStateAudit();go('project');});
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
  if(!safeKey())return;const combo=keyCombo(e),assign=assignmentForKey(combo);if(!assign)return;e.preventDefault();withSimulator('快捷鍵設備控制',s=>s.executeDeviceAction(assign.deviceId,assign.action));
});

document.addEventListener('click',e=>{const b=e.target.closest('[data-route]');if(b)go(b.dataset.route)});
byId('presentationToggle')?.addEventListener('click',()=>{state.presentation=!state.presentation;document.body.classList.toggle('presentation',state.presentation);const b=byId('presentationToggle');if(b)b.textContent=state.presentation?'退出簡報':'簡報模式'});
byId('saveBtn')?.addEventListener('click',()=>saveProjectState(true));
window.addEventListener('beforeunload',()=>saveProjectState(false));
restoreProjectState();
go(state.route||'overview');
