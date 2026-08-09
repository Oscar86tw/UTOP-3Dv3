import {categories,devices} from './data.js';
import {state} from './state.js';
import {render,renderDeviceInspector,renderQuick3DControls} from './views.js?v=1.5.4';
import {mountSimulator3D,unmountSimulator3D} from './core-3d-01/simulator3d.js?v=1.5.4';
import {toggleFloor,toggleGroup,setGroupOpacity,renameViewpoint,deleteViewpoint,updateDisplay,isReservedHotkey} from './core-project-01/project-controls.js';
import {getDeviceTransform,updateDeviceTransform,setFloorFocus,setEditorMode,selectDevice} from './core-editor-01/editor-commands.js';
import {addModule,removeModule,updateSettings,getSettings,controlsFor} from './core-module-01/module-manager.js';
import {deleteConnection,selectTerminalForBuilder,resetWiringBuilder} from './core-wiring-01/wiring-manager.js';
import {setTraceFocus,clearTraceFocus} from './core-signal-01/signal-trace.js';
import {applyScenePreset} from './core-scene-01/scene-library.js';
import {addRoadMarking,updateRoadMarking,deleteRoadMarking} from './core-road-01/road-markings.js';
import {mountNeuralView,unmountNeuralView} from './core-neural-01/neural-view.js';
import {runDebugAudit} from './core-debug-01/debug-center.js';
import {cloneDefaults,migrateProjectState} from './core-state-01/state-integrity.js?v=1.5.4';
import {runFunctionStateAudit} from './core-validation-01/function-state-validator.js?v=1.5.4';
import {pingCloud,selfTestCloud,verifyCloudWrite,repairCloudIndex,listCloudProjects,saveCloudProject,loadCloudProject,deleteCloudProject} from './core-cloud-01/google-cloud-projects.js?v=1.5.4';

const root=document.getElementById('viewRoot'),tabs=document.getElementById('mainTabs'),bottom=document.getElementById('bottomNav');
let capturing=false,sim3d=null,navEpoch=0,simulatorMountPromise=null,missionTimer=null,lastCloudFingerprint='';
const CLOUD_URL_KEY='utop3dv3.cloud.webAppUrl';
const LEGACY_STORAGE_KEY='utop3dv3.project.v1';
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

function rememberCloudUrl(){try{localStorage.setItem(CLOUD_URL_KEY,state.cloud?.webAppUrl||'');}catch(_){}}
function restoreCloudUrl(){try{const u=localStorage.getItem(CLOUD_URL_KEY);if(u){state.cloud??={};state.cloud.webAppUrl=u;}}catch(_){}}
function cloudSerializableState(){
  const copy=structuredClone(state);delete copy.cloud;delete copy.runtimeHealth;copy.savedAt=copy.savedAt instanceof Date?copy.savedAt.toISOString():copy.savedAt;return copy;
}
function projectPayload(){return {state:cloudSerializableState(),devices:structuredClone(devices)};}
function fingerprintValue(){
  const text=JSON.stringify(projectPayload());let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16);
}
function syncDirtyFlag(){state.cloud??={};state.cloud.dirty=!!lastCloudFingerprint&&fingerprintValue()!==lastCloudFingerprint;return state.cloud.dirty;}
function markCloudBaseline(){lastCloudFingerprint=fingerprintValue();state.cloud??={};state.cloud.dirty=false;}
function confirmDiscard(message='目前內容尚未儲存到 Google，確定繼續？'){syncDirtyFlag();return !state.cloud?.dirty||confirm(message);}
function replaceProjectData(project){
  const keepUrl=state.cloud?.webAppUrl||'';
  const incomingState=project?.state&&typeof project.state==='object'?project.state:{};
  for(const k of Object.keys(state))delete state[k];Object.assign(state,structuredClone(incomingState));
  devices.splice(0,devices.length,...structuredClone(Array.isArray(project?.devices)?project.devices:[]));
  migrateProjectState(state,devices,DEFAULTS.state,DEFAULTS.devices);
  state.cloud??={};state.cloud.webAppUrl=keepUrl;state.cloud.projectId=project?.projectId||state.cloud.projectId||'';state.cloud.projectName=project?.projectName||state.cloud.projectName||'未命名專案';state.cloud.lastCloudSavedAt=project?.updatedAt||'';state.cloud.selectedProjectId=project?.projectId||'';state.cloud.status='已從 Google 雲端開啟';markCloudBaseline();
}
function importLegacyLocalProject(){
  const raw=localStorage.getItem(LEGACY_STORAGE_KEY);if(!raw)throw new Error('找不到舊版本機專案資料');const payload=JSON.parse(raw);if(!payload?.state)throw new Error('舊版本機資料格式不正確');replaceProjectData({state:payload.state,devices:Array.isArray(payload.devices)?payload.devices:[],projectId:'',projectName:'舊版本機專案',updatedAt:payload.savedAt||''});state.cloud.projectId='';state.cloud.projectName='舊版本機專案';state.cloud.status='已匯入舊版本機資料，請按「儲存到 Google」完成雲端移轉';return true;
}
function resetToBlankProject(){
  const keepUrl=state.cloud?.webAppUrl||'';const fresh=structuredClone(DEFAULTS.state);for(const k of Object.keys(state))delete state[k];Object.assign(state,fresh);devices.splice(0,devices.length);migrateProjectState(state,devices,DEFAULTS.state,DEFAULTS.devices);state.cloud??={};Object.assign(state.cloud,{webAppUrl:keepUrl,projectId:'',projectName:'未命名專案',lastCloudSavedAt:'',selectedProjectId:'',status:'新空白專案',dirty:false});markCloudBaseline();
}
async function cloudSave(asNew=false,force=false){
  state.cloud??={};state.cloud.webAppUrl=String(byId('cloudWebAppUrl')?.value??state.cloud.webAppUrl??'').trim();state.cloud.projectName=String(byId('cloudProjectName')?.value??state.cloud.projectName??'未命名專案').trim()||'未命名專案';rememberCloudUrl();
  const args={projectId:asNew?'':(state.cloud.projectId||''),projectName:state.cloud.projectName,...projectPayload(),baseUpdatedAt:asNew?'':(state.cloud.lastCloudSavedAt||''),force};
  let r;try{r=await saveCloudProject(state.cloud.webAppUrl,args);}catch(err){if(err.code==='REVISION_CONFLICT'&&!force&&confirm('Google 雲端已有較新的版本。仍要用目前畫面覆蓋雲端嗎？'))return cloudSave(asNew,true);throw err;}
  state.cloud.projectId=r.projectId;state.cloud.selectedProjectId=r.projectId;state.cloud.projectName=r.projectName;state.cloud.lastCloudSavedAt=r.updatedAt;state.cloud.status=`✅ 已儲存到 Google：${r.projectName}`;state.savedAt=new Date(r.updatedAt);markCloudBaseline();return r;
}
async function refreshCloudProjectList(){
  state.cloud??={};state.cloud.webAppUrl=String(byId('cloudWebAppUrl')?.value??state.cloud.webAppUrl??'').trim();rememberCloudUrl();const items=await listCloudProjects(state.cloud.webAppUrl);state.cloud.projects=items;const sel=byId('cloudProjectList');if(sel){sel.innerHTML='<option value="">請選擇專案</option>';for(const item of items){const o=document.createElement('option');o.value=item.projectId;o.textContent=`${item.projectName} · ${item.updatedAt?new Date(item.updatedAt).toLocaleString('zh-TW'):''}`;sel.appendChild(o);}const wanted=state.cloud.selectedProjectId||state.cloud.projectId||'';if(wanted&&items.some(x=>x.projectId===wanted))sel.value=wanted;}state.cloud.status=`已讀取 ${items.length} 個 Google 雲端專案`;const st=byId('cloudStatus');if(st)st.textContent=state.cloud.status;return items;
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
  state.route=route;syncDirtyFlag();nav();root.innerHTML=render(route);bind();
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

const inspectorApplyTimers=new Map();
function refreshInspectorPreserveScroll(id,delay=0){
  const run=()=>{
    const aside=document.getElementById('deviceInspectorSidebar');
    const scrollTop=aside?.scrollTop||0;
    const active=document.activeElement;
    const focusKey=active?.dataset?.settingParam||active?.id||'';
    syncInspector(id,false);
    const nextAside=document.getElementById('deviceInspectorSidebar');if(nextAside)nextAside.scrollTop=scrollTop;
    if(focusKey){const next=document.querySelector(`[data-setting-param="${CSS.escape(focusKey)}"]`)||document.getElementById(focusKey);next?.focus?.({preventScroll:true});}
  };
  if(delay>0)setTimeout(run,delay);else run();
}
function scheduleLiveDeviceSettings(id){
  clearTimeout(inspectorApplyTimers.get(id));
  const t=setTimeout(async()=>{inspectorApplyTimers.delete(id);if(state.selectedDevice!==id)return;await withSimulator('設備參數即時套用',s=>s.applyDeviceSettings(id));},120);
  inspectorApplyTimers.set(id,t);
}

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
  root.querySelectorAll('[data-setting-param]').forEach(el=>el.addEventListener('input',()=>{
    const id=state.selectedDevice;if(!id)return;const n=Number(el.value);if(!Number.isFinite(n))return;
    updateSettings(id,{[el.dataset.settingParam]:n});scheduleLiveDeviceSettings(id);
  }));
  document.getElementById('applyModuleSettings')?.addEventListener('click',safeHandler('設備參數套用',async()=>{
    const id=state.selectedDevice,patch={};root.querySelectorAll('[data-setting-param]').forEach(el=>{const n=Number(el.value);if(Number.isFinite(n))patch[el.dataset.settingParam]=n;});
    updateSettings(id,patch);await withSimulator('設備參數套用',s=>s.applyDeviceSettings(id));
    refreshInspectorPreserveScroll(id);
  }));
  root.querySelectorAll('[data-open-selected-inspector]').forEach(b=>b.addEventListener('click',()=>{state.workspace.inspectorTab='controls';syncInspector(b.dataset.openSelectedInspector,true);}));
  root.querySelectorAll('[data-device-action]').forEach(b=>b.addEventListener('click',safeHandler('設備控制',async()=>{const [id,action]=b.dataset.deviceAction.split('|');await withSimulator('設備控制',s=>s.executeDeviceAction(id,action));setTimeout(()=>refreshInspectorPreserveScroll(id),80);})));
  root.querySelectorAll('[data-io-trigger]').forEach(b=>b.addEventListener('click',safeHandler('DI/DO 模擬',async()=>{const [id,dir,signal]=b.dataset.ioTrigger.split('|');await withSimulator('DI/DO 模擬',s=>s.simulateIo(id,dir,signal));refreshInspectorPreserveScroll(id);})));
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
  byId('quickScenePreset')?.addEventListener('change',safeHandler('切換場景',async e=>{const p=applyScenePreset(e.target.value);if(!p)return;await withSimulator('切換場景',sim=>sim.applyProjectState());}));
  byId('quickViewSelect')?.addEventListener('change',safeHandler('切換視野',async e=>{const i=Number(e.target.value);state.simulator.cameraPreset=i;await withSimulator('切換視野',sim=>sim.gotoView(i));}));
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

  document.getElementById('hotkeyDevice')?.addEventListener('change',e=>{state.hotkeyEditor.deviceId=e.target.value;state.hotkeyEditor.actionId='';state.hotkeyEditor.message='請選擇這台模組要設定的功能。';const actionSel=byId('hotkeyAction');if(actionSel){actionSel.innerHTML='<option value="">請選擇功能</option>';for(const a of controlsFor(e.target.value?devices.find(d=>d.id===e.target.value)?.type:'')||[]){const o=document.createElement('option');o.value=a.id;o.textContent=a.label;actionSel.appendChild(o);}}const cap=byId('captureHotkey');if(cap)cap.disabled=true;const st=byId('captureStatus');if(st)st.textContent=state.hotkeyEditor.message;});
  document.getElementById('hotkeyAction')?.addEventListener('change',e=>{state.hotkeyEditor.actionId=e.target.value;state.hotkeyEditor.message=e.target.value?'按「設定按鍵」後，直接按你要使用的按鍵。':'請選擇功能。';const cap=byId('captureHotkey');if(cap)cap.disabled=!e.target.value;const st=byId('captureStatus');if(st)st.textContent=state.hotkeyEditor.message;});
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
  byId('cloudWebAppUrl')?.addEventListener('change',e=>{state.cloud??={};state.cloud.webAppUrl=e.target.value.trim();rememberCloudUrl();});
  byId('cloudProjectName')?.addEventListener('input',e=>{state.cloud??={};state.cloud.projectName=e.target.value;});
  byId('cloudConnect')?.addEventListener('click',safeHandler('Google 雲端連線',async()=>{state.cloud.webAppUrl=val('cloudWebAppUrl',state.cloud.webAppUrl).trim();rememberCloudUrl();const r=await pingCloud(state.cloud.webAppUrl);state.cloud.status=`✅ Google 雲端已連線 · ${r.service||'UTOP'} · V${r.version||''}`;byId('cloudStatus').textContent=state.cloud.status;}));
  byId('cloudSelfTest')?.addEventListener('click',safeHandler('Google 雲端自我檢查',async()=>{state.cloud.webAppUrl=val('cloudWebAppUrl',state.cloud.webAppUrl).trim();rememberCloudUrl();const r=await selfTestCloud(state.cloud.webAppUrl);state.cloud.status=`✅ Drive：${r.folderName} · Sheet：${r.sheetName} · ${r.projects} 個專案`;byId('cloudStatus').textContent=state.cloud.status;}));
  byId('cloudWriteTest')?.addEventListener('click',safeHandler('Google 雲端儲存驗證',async()=>{state.cloud.webAppUrl=val('cloudWebAppUrl',state.cloud.webAppUrl).trim();rememberCloudUrl();const r=await verifyCloudWrite(state.cloud.webAppUrl);state.cloud.status=`✅ Google Drive 寫入／讀取／刪除權限正常 · ${r.folderName}`;byId('cloudStatus').textContent=state.cloud.status;}));
  byId('cloudRepairIndex')?.addEventListener('click',safeHandler('重建 Google 專案索引',async()=>{const r=await repairCloudIndex(state.cloud.webAppUrl);state.cloud.status=`✅ 已重建 Google 專案索引：${r.count} 筆`;byId('cloudStatus').textContent=state.cloud.status;await refreshCloudProjectList();}));
  byId('cloudRefresh')?.addEventListener('click',safeHandler('讀取雲端專案',refreshCloudProjectList));
  byId('cloudSave')?.addEventListener('click',safeHandler('Google 雲端儲存',async()=>{await cloudSave(false);byId('cloudStatus').textContent=state.cloud.status;await refreshCloudProjectList();}));
  byId('cloudSaveAs')?.addEventListener('click',safeHandler('Google 雲端另存',async()=>{await cloudSave(true);byId('cloudStatus').textContent=state.cloud.status;await refreshCloudProjectList();}));
  byId('cloudImportLegacy')?.addEventListener('click',safeHandler('匯入舊版本機專案',async()=>{importLegacyLocalProject();await go('project');}));
  byId('cloudNew')?.addEventListener('click',safeHandler('建立空白專案',async()=>{if(!confirmDiscard('建立空白專案？目前尚未儲存到 Google 的內容會被清除。'))return;resetToBlankProject();await go('simulator');}));
  byId('cloudProjectList')?.addEventListener('change',e=>{state.cloud.selectedProjectId=e.target.value;});
  byId('cloudOpen')?.addEventListener('click',safeHandler('開啟 Google 專案',async()=>{const id=val('cloudProjectList');if(!id)throw new Error('請先選擇雲端專案');if(!confirmDiscard('開啟其他 Google 專案？目前未儲存內容會被替換。'))return;const r=await loadCloudProject(state.cloud.webAppUrl,id);replaceProjectData(r.project);await go('simulator');}));
  byId('cloudDelete')?.addEventListener('click',safeHandler('刪除 Google 專案',async()=>{const id=val('cloudProjectList');if(!id)throw new Error('請先選擇雲端專案');if(!confirm('確定刪除選取的 Google 雲端專案？檔案會移到 Google Drive 垃圾桶。'))return;await deleteCloudProject(state.cloud.webAppUrl,id);if(state.cloud.projectId===id){resetToBlankProject();state.cloud.status='已刪除目前 Google 專案，已切換成空白專案';}else state.cloud.status='已刪除 Google 雲端專案';state.cloud.selectedProjectId='';await refreshCloudProjectList();}));
  document.getElementById('runDebugAudit')?.addEventListener('click',()=>{runDebugAudit();go('project');});
  document.getElementById('repairProjectState')?.addEventListener('click',()=>{migrateProjectState(state,devices,DEFAULTS.state,DEFAULTS.devices);runFunctionStateAudit();syncDirtyFlag();go('project');});
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
byId('saveBtn')?.addEventListener('click',safeHandler('Google 雲端儲存',async()=>{if(!state.cloud?.webAppUrl){state.cloud??={};state.cloud.status='請先到「專案 / Debug」設定 Google Apps Script Web App 網址';await go('project');return;}await cloudSave(false);const meta=byId('projectMeta');if(meta)meta.textContent=`Google 已儲存 · ${state.cloud.projectName}`;}));
restoreCloudUrl();
migrateProjectState(state,devices,DEFAULTS.state,DEFAULTS.devices);
markCloudBaseline();
go(state.route||'overview');
