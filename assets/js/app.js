import {categories,devices} from './data.js';
import {state} from './state.js';
import {render,renderDeviceInspector,renderQuick3DControls,renderModuleLibrary} from './views.js?v=1.7.16';
import {mountSimulator3D,unmountSimulator3D} from './core-3d-01/simulator3d.js?v=1.7.16';
import {toggleFloor,toggleGroup,setGroupOpacity,renameViewpoint,deleteViewpoint,updateDisplay,isReservedHotkey} from './core-project-01/project-controls.js';
import {getDeviceTransform,updateDeviceTransform,setFloorFocus,setEditorMode,selectDevice} from './core-editor-01/editor-commands.js';
import {addModule,removeModule,updateSettings,getSettings,controlsFor} from './core-module-01/module-manager.js';
import {deleteConnection,selectTerminalForBuilder,resetWiringBuilder} from './core-wiring-01/wiring-manager.js';
import {setTraceFocus,clearTraceFocus} from './core-signal-01/signal-trace.js';
import {applyScenePreset} from './core-scene-01/scene-library.js';
import {addRoadMarking,updateRoadMarking,deleteRoadMarking} from './core-road-01/road-markings.js';
import {mountNeuralView,unmountNeuralView} from './core-neural-01/neural-view.js';
import {runDebugAudit} from './core-debug-01/debug-center.js';
import {cloneDefaults,migrateProjectState} from './core-state-01/state-integrity.js?v=1.7.16';
import {runFunctionStateAudit} from './core-validation-01/function-state-validator.js?v=1.7.16';
import {pingCloud,selfTestCloud,verifyCloudWrite,repairCloudIndex,listCloudProjects,saveCloudProject,loadCloudProject,deleteCloudProject} from './core-cloud-01/google-cloud-projects.js?v=1.7.16';
import {APP_VERSION,APP_VERSION_LABEL,APP_TITLE,APP_META} from './core-version-01/version-info.js?v=1.7.16';

const workspaceRoot=document.getElementById('workspaceRoot'),toolPanelLayer=document.getElementById('toolPanelLayer'),tabs=document.getElementById('mainTabs'),bottom=document.getElementById('bottomNav');
let root=workspaceRoot;
let capturing=false,sim3d=null,navEpoch=0,simulatorMountPromise=null,missionTimer=null,lastCloudFingerprint='',workspaceReady=false,activeToolRoute='',panelZ=120;
const CLOUD_URL_KEY='utop3dv3.cloud.webAppUrl';
const LEGACY_STORAGE_KEY='utop3dv3.project.v1';
const WORKSPACE_LAYOUT_KEY='utop3dv3.workspace.layout.v1';
const WORKSPACE_OPEN_KEY='utop3dv3.workspace.openPanels.v1';
const SIDEBAR_LAYOUT_KEY='utop3dv3.workspace.sidebars.v1';
const WORKSPACE_PRESET_KEY='utop3dv3.workspace.presets.v1';
const DEFAULTS=cloneDefaults(state,devices);

const byId=id=>document.getElementById(id);
const val=(id,fallback='')=>byId(id)?.value??fallback;
const num=(id,fallback=0)=>{const n=Number(val(id,''));return Number.isFinite(n)?n:fallback;};
const checked=id=>!!byId(id)?.checked;
function reportUiError(where,err){
  console.error(`[UTOP UI] ${where}`,err);
  window.__utopBoot?.error?.(`UI:${where}`,err);
  const toast=byId('simToast');
  if(toast){toast.textContent=`${where} 失敗：${err?.message||err}`;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2600);}
  else setHeaderStatus(`⚠ ${where} 失敗：${err?.message||err}`);
}
function safeHandler(where,fn){return async e=>{try{return await fn(e);}catch(err){reportUiError(where,err);}}}


// V1.7.7 - Global Error & Boot Diagnostics.
window.__utopBoot?.mark('appStarted',true);window.__utopBoot?.phase('app.js MODULE EXECUTION START');
document.documentElement.dataset.utopVersion=APP_VERSION;
const INDEX_VERSION=document.documentElement.dataset.utopIndexVersion||window.__utopBoot?.state?.version||'';
window.__utopBuild={indexVersion:INDEX_VERSION,runtimeVersion:APP_VERSION,manifestVersion:'',manifestState:'loading',consistent:INDEX_VERSION===APP_VERSION};
(async()=>{try{const r=await fetch(`assets/build-info.json?ts=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error(`build-info.json HTTP ${r.status}`);const m=await r.json();window.__utopBuild.manifestVersion=String(m.version||'');window.__utopBuild.manifestState='loaded';window.__utopBuild.consistent=INDEX_VERSION===APP_VERSION&&window.__utopBuild.manifestVersion===APP_VERSION;if(!window.__utopBuild.consistent)window.__utopBoot?.show?.('DEPLOYMENT VERSION MISMATCH',`部署版本不一致：Index ${INDEX_VERSION||'-'} / Runtime ${APP_VERSION} / Manifest ${window.__utopBuild.manifestVersion||'-'}`,'請確認 GitHub Pages 已部署完整同一版本檔案。');}catch(err){window.__utopBuild.manifestState='error';window.__utopBuild.manifestError=err?.message||String(err);window.__utopBuild.consistent=INDEX_VERSION===APP_VERSION;console.warn('[UTOP] build manifest check unavailable',err);}})();
document.title=`UTOP-3Dv3 ${APP_VERSION_LABEL} ${APP_TITLE}`;
const versionMeta=document.getElementById('projectMeta');if(versionMeta){versionMeta.textContent=APP_META;versionMeta.dataset.version=APP_VERSION;}

// Keep the native <select> for existing value/change logic, but render the choices
// in our own DOM popover so floating/dock pointer events cannot collapse it.
let stableSelectActive=null,stableSelectPopover=null;
function stableSelectText(select){return select?.selectedOptions?.[0]?.textContent||select?.options?.[select.selectedIndex]?.textContent||'請選擇';}
function ensureStableSelectPopover(){
  if(stableSelectPopover?.isConnected)return stableSelectPopover;
  const pop=document.createElement('div');pop.className='utop-select-popover';pop.hidden=true;document.body.appendChild(pop);stableSelectPopover=pop;return pop;
}
function closeStableSelect(){
  if(stableSelectPopover)stableSelectPopover.hidden=true;
  stableSelectActive?.trigger?.setAttribute('aria-expanded','false');
  stableSelectActive=null;
}
function positionStableSelectPopover(trigger,pop){
  const r=trigger.getBoundingClientRect(),gap=6,minH=140,maxH=Math.min(360,Math.max(180,window.innerHeight-30));
  const below=window.innerHeight-r.bottom-gap,above=r.top-gap;
  const openUp=below<minH&&above>below;
  const h=Math.min(maxH,Math.max(120,openUp?above:below));
  pop.style.width=Math.max(180,Math.round(r.width))+'px';
  pop.style.maxHeight=Math.floor(h)+'px';
  pop.style.left=Math.max(6,Math.min(window.innerWidth-Math.max(180,r.width)-6,r.left))+'px';
  if(openUp){pop.style.top='auto';pop.style.bottom=Math.max(6,window.innerHeight-r.top+gap)+'px';}
  else{pop.style.bottom='auto';pop.style.top=Math.min(window.innerHeight-80,r.bottom+gap)+'px';}
}
function rebuildStableSelect(select){
  if(!select?.isConnected)return;
  const trigger=select._utopSelectTrigger;if(trigger)trigger.querySelector('.utop-select-value').textContent=stableSelectText(select);
  if(stableSelectActive?.select===select)openStableSelect(select,trigger,true);
}
function openStableSelect(select,trigger,rebuildOnly=false){
  if(!select||!trigger)return;
  const pop=ensureStableSelectPopover();
  if(!rebuildOnly&&stableSelectActive?.select===select&&!pop.hidden){closeStableSelect();return;}
  pop.innerHTML='';
  [...select.options].forEach((option,index)=>{
    const btn=document.createElement('button');btn.type='button';btn.className='utop-select-option';
    btn.dataset.value=option.value;btn.disabled=!!option.disabled;btn.setAttribute('role','option');btn.setAttribute('aria-selected',String(option.selected));
    btn.innerHTML=`<span>${option.textContent||''}</span>${option.selected?'<b>✓</b>':''}`;
    btn.addEventListener('pointerdown',e=>{e.stopPropagation();});
    btn.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      if(option.disabled)return;
      select.selectedIndex=index;
      select.value=option.value;
      trigger.querySelector('.utop-select-value').textContent=option.textContent||'';
      select.dispatchEvent(new Event('input',{bubbles:true}));
      select.dispatchEvent(new Event('change',{bubbles:true}));
      closeStableSelect();
    });
    pop.appendChild(btn);
  });
  positionStableSelectPopover(trigger,pop);pop.hidden=false;stableSelectActive={select,trigger};trigger.setAttribute('aria-expanded','true');
}
function enhanceStableSelect(select){
  if(!(select instanceof HTMLSelectElement)||select.multiple||Number(select.size)>1||select.dataset.nativeSelect==='true')return;
  if(select.dataset.utopStableSelect==='1'){rebuildStableSelect(select);return;}
  select.dataset.utopStableSelect='1';select.classList.add('utop-native-select');select.tabIndex=-1;
  const trigger=document.createElement('button');trigger.type='button';trigger.className='utop-select-trigger';trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
  trigger.innerHTML='<span class="utop-select-value"></span><span class="utop-select-arrow">⌄</span>';
  trigger.querySelector('.utop-select-value').textContent=stableSelectText(select);
  select.insertAdjacentElement('afterend',trigger);select._utopSelectTrigger=trigger;
  trigger.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();});
  trigger.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openStableSelect(select,trigger);});
  select.addEventListener('change',()=>rebuildStableSelect(select));
}
function enhanceStableSelects(scope=document){
  if(scope instanceof HTMLSelectElement)enhanceStableSelect(scope);
  scope.querySelectorAll?.('select').forEach(enhanceStableSelect);
}
const stableSelectObserver=new MutationObserver(mutations=>{
  for(const m of mutations){
    if(m.target instanceof HTMLSelectElement)rebuildStableSelect(m.target);
    for(const n of m.addedNodes){if(n.nodeType===1)enhanceStableSelects(n);}
  }
});
stableSelectObserver.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('pointerdown',e=>{if(stableSelectActive&&!e.target.closest('.utop-select-popover,.utop-select-trigger'))closeStableSelect();},{capture:true});
window.addEventListener('resize',()=>{if(stableSelectActive&&!stableSelectPopover?.hidden)positionStableSelectPopover(stableSelectActive.trigger,stableSelectPopover);});
window.addEventListener('scroll',()=>{if(stableSelectActive&&!stableSelectPopover?.hidden)positionStableSelectPopover(stableSelectActive.trigger,stableSelectPopover);},true);

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
  state.cloud??={};state.cloud.webAppUrl=String(byId('cloudWebAppUrl')?.value??state.cloud.webAppUrl??'').trim();rememberCloudUrl();const items=await listCloudProjects(state.cloud.webAppUrl);state.cloud.projects=items;const sel=byId('cloudProjectList');if(sel){sel.innerHTML='<option value="">請選擇專案</option>';for(const item of items){const o=document.createElement('option');o.value=item.projectId;o.textContent=`${item.projectName} · ${item.updatedAt?new Date(item.updatedAt).toLocaleString('zh-TW'):''}`;sel.appendChild(o);}const wanted=state.cloud.selectedProjectId||state.cloud.projectId||'';if(wanted&&items.some(x=>x.projectId===wanted))sel.value=wanted;rebuildStableSelect(sel);}state.cloud.status=`已讀取 ${items.length} 個 Google 雲端專案`;const st=byId('cloudStatus');if(st)st.textContent=state.cloud.status;return items;
}


function readSidebarLayouts(){
  try{return JSON.parse(localStorage.getItem(SIDEBAR_LAYOUT_KEY)||'{}')||{};}catch(_){return {};}
}
function writeSidebarLayouts(layouts){try{localStorage.setItem(SIDEBAR_LAYOUT_KEY,JSON.stringify(layouts||{}));}catch(_){} }
function sidebarDefaults(name){
  if(name==='module')return {floating:false,left:10,top:150,width:310,height:Math.max(360,window.innerHeight-240)};
  return {floating:false,left:Math.max(12,window.innerWidth-360),top:150,width:340,height:Math.max(360,window.innerHeight-240)};
}
function sidebarElement(name){return name==='module'?document.getElementById('moduleLibrarySidebar'):document.getElementById('deviceInspectorSidebar');}
function saveSidebarLayout(name,aside=sidebarElement(name)){
  if(!aside)return;const layouts=readSidebarLayouts(),cur=layouts[name]||sidebarDefaults(name),floating=aside.classList.contains('sidebar-floating');
  if(floating){const r=aside.getBoundingClientRect();layouts[name]={...cur,floating:true,left:Math.round(r.left),top:Math.round(r.top),width:Math.round(r.width),height:Math.round(r.height)};}
  else layouts[name]={...cur,floating:false};
  writeSidebarLayouts(layouts);
}
function applySidebarLayout(name){
  const aside=sidebarElement(name);if(!aside)return;const cfg={...sidebarDefaults(name),...(readSidebarLayouts()[name]||{})};
  aside.classList.toggle('sidebar-floating',!!cfg.floating);aside.classList.toggle('sidebar-docked',!cfg.floating);
  if(cfg.floating){
    const maxW=Math.max(300,window.innerWidth-20),maxH=Math.max(260,window.innerHeight-90);
    const width=Math.min(Math.max(280,cfg.width||320),maxW),height=Math.min(Math.max(260,cfg.height||520),maxH);
    const left=Math.min(Math.max(4,cfg.left||10),Math.max(4,window.innerWidth-width-4));
    const top=Math.min(Math.max(72,cfg.top||120),Math.max(72,window.innerHeight-height-4));
    Object.assign(aside.style,{left:`${left}px`,top:`${top}px`,width:`${width}px`,height:`${height}px`,right:'auto',bottom:'auto'});
  }else aside.removeAttribute('style');
}
function enableDockableSidebar(name){
  const aside=sidebarElement(name);if(!aside||aside.dataset.dockReady==='1')return;aside.dataset.dockReady='1';
  let drag=null;
  aside.addEventListener('pointerdown',e=>{
    if(!aside.classList.contains('sidebar-floating'))return;
    const head=e.target.closest('.sidebar-pane-title');if(!head||e.target.closest('button,input,select,a'))return;
    const r=aside.getBoundingClientRect();drag={dx:e.clientX-r.left,dy:e.clientY-r.top,id:e.pointerId};head.setPointerCapture?.(e.pointerId);e.preventDefault();
  });
  aside.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const r=aside.getBoundingClientRect(),left=Math.min(Math.max(4,e.clientX-drag.dx),window.innerWidth-r.width-4),top=Math.min(Math.max(72,e.clientY-drag.dy),window.innerHeight-r.height-4);aside.style.left=`${left}px`;aside.style.top=`${top}px`;});
  const end=e=>{if(!drag)return;drag=null;saveSidebarLayout(name,aside);};aside.addEventListener('pointerup',end);aside.addEventListener('pointercancel',end);
  if(typeof ResizeObserver!=='undefined'){let t;const ro=new ResizeObserver(()=>{if(!aside.classList.contains('sidebar-floating'))return;clearTimeout(t);t=setTimeout(()=>saveSidebarLayout(name,aside),120);});ro.observe(aside);}
}
function toggleSidebarDock(name){
  const aside=sidebarElement(name);if(!aside)return;const layouts=readSidebarLayouts(),cfg={...sidebarDefaults(name),...(layouts[name]||{})};cfg.floating=!cfg.floating;layouts[name]=cfg;writeSidebarLayouts(layouts);applySidebarLayout(name);enableDockableSidebar(name);
}
function showSidebar(name,show=true){
  const aside=sidebarElement(name);if(!aside)return;aside.hidden=!show;if(name==='module')state.workspace.leftOpen=show;else state.workspace.rightOpen=show;
  document.getElementById(name==='module'?'toggleModuleSidebar':'toggleInspectorSidebar')?.classList.toggle('active',show);
  if(show){applySidebarLayout(name);enableDockableSidebar(name);}
}
function bindModuleLibraryControls(){
  const aside=document.getElementById('moduleLibrarySidebar');if(!aside)return;
  const close=aside.querySelector('#closeModuleSidebar');if(close)close.onclick=()=>showSidebar('module',false);
  const floatBtn=aside.querySelector('#floatModuleSidebar');if(floatBtn)floatBtn.onclick=()=>toggleSidebarDock('module');
  const search=aside.querySelector('#moduleSearch');if(search)search.oninput=e=>updateModuleSearch(e.target.value);
  const group=aside.querySelector('#moduleGroup');if(group)group.onchange=e=>{state.moduleLibrary.group=e.target.value;aside.innerHTML=renderModuleLibrary();bindModuleLibraryControls();enhanceStableSelects(aside);applySidebarLayout('module');};
  aside.querySelectorAll('[data-add-template]').forEach(b=>{b.onclick=safeHandler('新增模組',async()=>{const id=addModule(b.dataset.addTemplate,state.editor.floorFocus||'1F');if(id){state.selectedDevice=id;selectDevice(id);showSidebar('inspector',true);state.workspace.mode='3d';await ensurePersistentWorkspace();sim3d?.applyProjectState?.();sim3d?.selectDevice(id);syncInspector(id,true);}});});
  enableDockableSidebar('module');applySidebarLayout('module');
}
function initDockableSidebars(){
  applySidebarLayout('module');applySidebarLayout('inspector');enableDockableSidebar('module');enableDockableSidebar('inspector');bindModuleLibraryControls();
}

async function ensurePersistentWorkspace(){
  window.__utopBoot?.phase('ensurePersistentWorkspace ENTER');
  if(workspaceReady&&sim3d)return sim3d;
  if(!workspaceReady){
    state.workspace.mode='3d';state.workspace.leftOpen=true;
    window.__utopBoot?.phase('RENDER SIMULATOR WORKSPACE');
    workspaceRoot.innerHTML=render('simulator');
    const prev=root;root=workspaceRoot;bind();root=prev;
    enhanceStableSelects(workspaceRoot);
    initDockableSidebars();
    workspaceReady=true;window.__utopBoot?.mark('workspaceReady',true);window.__utopBoot?.phase('WORKSPACE DOM READY');
  }
  if(!sim3d&&!simulatorMountPromise){
    const epoch=++navEpoch;
    window.__utopBoot?.phase('THREE.JS MOUNT START');
    simulatorMountPromise=mountSimulator3D({onSelection:id=>syncInspector(id,true),onTransform:id=>syncInspector(id,false)});
    const mounted=await simulatorMountPromise;
    simulatorMountPromise=null;
    if(epoch!==navEpoch&&activeToolRoute==='__workspace_rebuild__'){mounted?.destroy?.();return null;}
    sim3d=mounted;
    state.runtimeHealth??={};
    state.runtimeHealth.simulatorReady=!!sim3d;
    state.runtimeHealth.webglReady=!!sim3d&&sim3d.localFallback!==true;
    state.runtimeHealth.lastError=sim3d?'':'3D 初始化沒有回傳 Simulator API';
    window.__utopBoot?.mark('simulatorReady',!!sim3d);window.__utopBoot?.phase(sim3d?'THREE.JS SIMULATOR READY':'THREE.JS SIMULATOR NULL');
  }else if(simulatorMountPromise)await simulatorMountPromise;
  return sim3d;
}
async function withSimulator(where,fn){
  try{
    const simulator=await ensurePersistentWorkspace();
    if(!simulator)throw new Error('3D 尚未完成初始化');
    return await fn(simulator);
  }catch(err){reportUiError(where,err);return null;}
}
function toolTitle(route){return categories.find(c=>c.id===route)?.label||'工具';}
function readWorkspaceLayouts(){try{return JSON.parse(localStorage.getItem(WORKSPACE_LAYOUT_KEY)||'{}')||{};}catch(_){return {};}}
function readOpenPanelRoutes(){try{const v=JSON.parse(localStorage.getItem(WORKSPACE_OPEN_KEY)||'[]');return Array.isArray(v)?v.filter(r=>categories.some(c=>c.id===r)&&r!=='simulator'):[];}catch(_){return [];}}
function writeOpenPanelRoutes(routes){try{localStorage.setItem(WORKSPACE_OPEN_KEY,JSON.stringify([...new Set(routes||[])]));}catch(_){} }
function rememberPanelOpen(route){const routes=readOpenPanelRoutes().filter(r=>r!==route);routes.push(route);writeOpenPanelRoutes(routes);}
function rememberPanelClosed(route){writeOpenPanelRoutes(readOpenPanelRoutes().filter(r=>r!==route));}
function writeWorkspaceLayouts(layouts){try{localStorage.setItem(WORKSPACE_LAYOUT_KEY,JSON.stringify(layouts||{}));}catch(_){} }
function savePanelLayout(panel,route){
  if(!panel||!route)return;
  const layouts=readWorkspaceLayouts(),r=panel.getBoundingClientRect();
  const dockEdge=panel.dataset.dockEdge||'';layouts[route]={left:Math.round(r.left),top:Math.round(r.top),width:Math.round(r.width),height:Math.round(r.height),dockEdge,minimized:panel.classList.contains('minimized'),z:Number(panel.style.zIndex)||panelZ};
  writeWorkspaceLayouts(layouts);
}
function restorePanelLayout(panel,route,index=0){
  const layout=readWorkspaceLayouts()[route];
  if(layout){
    const edge=layout.dockEdge||(layout.docked?'right':'');panel.dataset.dockEdge=edge;panel.classList.toggle('docked',!!edge);panel.classList.toggle('minimized',!!layout.minimized);
    if(!edge&&window.innerWidth>900){
      const w=Math.max(320,Math.min(Number(layout.width)||660,window.innerWidth-16));
      const h=Math.max(180,Math.min(Number(layout.height)||620,window.innerHeight-88));
      const left=Math.max(0,Math.min(Number(layout.left)||18,window.innerWidth-w));
      const top=Math.max(72,Math.min(Number(layout.top)||116,window.innerHeight-h));
      Object.assign(panel.style,{right:'auto',left:left+'px',top:top+'px',width:w+'px',height:h+'px'});
    }
    panel.style.zIndex=String(Number(layout.z)||++panelZ);panelZ=Math.max(panelZ,Number(layout.z)||0);
  }else if(window.innerWidth>900){
    const cascade=(index%6)*24;panel.style.right='auto';panel.style.left=Math.max(12,window.innerWidth-680-cascade)+'px';panel.style.top=(104+cascade)+'px';panel.style.zIndex=String(++panelZ);
  }
}
const DOCK_ORDER=['','right','left','bottom','top'];
function dockLabel(edge){return edge?({'right':'右側','left':'左側','bottom':'下方','top':'上方'}[edge]||edge):'浮動';}
function updateDockedPanelLayout(){
  const panels=[...toolPanelLayer.querySelectorAll('.floating-tool-window')];
  for(const edge of ['left','right','top','bottom']){
    const list=panels.filter(p=>(p.dataset.dockEdge||'')===edge&&!p.classList.contains('minimized'));
    const n=Math.max(1,list.length);
    list.forEach((panel,i)=>{
      panel.classList.add('docked');panel.classList.add('dock-'+edge);panel.style.resize='none';panel.style.zIndex=String(Math.max(100,Number(panel.style.zIndex)||100));
      if(edge==='left'||edge==='right'){
        const h=Math.max(180,Math.floor((window.innerHeight-186)/n));
        Object.assign(panel.style,{top:(104+i*h)+'px',bottom:'auto',height:h+'px',width:'min(520px,42vw)',left:edge==='left'?'8px':'auto',right:edge==='right'?'8px':'auto'});
      }else{
        const w=Math.max(320,Math.floor((window.innerWidth-24)/n));
        Object.assign(panel.style,{left:(8+i*w)+'px',right:'auto',width:w+'px',height:'min(360px,38vh)',top:edge==='top'?'104px':'auto',bottom:edge==='bottom'?'76px':'auto'});
      }
    });
  }
  panels.filter(p=>!(p.dataset.dockEdge||'')).forEach(panel=>{panel.classList.remove('docked','dock-left','dock-right','dock-top','dock-bottom');if(!panel.classList.contains('minimized'))panel.style.resize='both';});
}
function cyclePanelDock(panel){
  const current=panel.dataset.dockEdge||'';const next=DOCK_ORDER[(DOCK_ORDER.indexOf(current)+1)%DOCK_ORDER.length];panel.dataset.dockEdge=next;panel.classList.remove('dock-left','dock-right','dock-top','dock-bottom');
  if(next){panel.classList.add('docked','dock-'+next);panel.classList.remove('minimized');}
  else{panel.classList.remove('docked');const r=panel.getBoundingClientRect();Object.assign(panel.style,{right:'auto',bottom:'auto',left:Math.max(8,Math.min(window.innerWidth-r.width-8,r.left||18))+'px',top:Math.max(84,Math.min(window.innerHeight-r.height-8,r.top||104))+'px',width:Math.max(320,r.width)+'px',height:Math.max(180,r.height)+'px',resize:'both'});}
  const btn=panel.querySelector('[data-tool-dock]');if(btn){btn.title='吸附：'+dockLabel(next);btn.dataset.edge=next;}
  updateDockedPanelLayout();savePanelLayout(panel,panel.dataset.toolRoute||'');
}
function readWorkspacePresets(){try{return JSON.parse(localStorage.getItem(WORKSPACE_PRESET_KEY)||'{}')||{};}catch(_){return {};}}
function writeWorkspacePresets(v){try{localStorage.setItem(WORKSPACE_PRESET_KEY,JSON.stringify(v||{}));}catch(_){} }
function captureWorkspacePreset(name){
  const title=String(name||'').trim();if(!title)throw new Error('請輸入工作區版型名稱');
  [...toolPanelLayer.querySelectorAll('.floating-tool-window')].forEach(p=>savePanelLayout(p,p.dataset.toolRoute||''));saveSidebarLayout('module');saveSidebarLayout('inspector');
  const presets=readWorkspacePresets();presets[title]={name:title,createdAt:new Date().toISOString(),openRoutes:readOpenPanelRoutes(),layouts:readWorkspaceLayouts(),sidebars:readSidebarLayouts(),sidebarOpen:{module:state.workspace.leftOpen!==false,inspector:state.workspace.rightOpen!==false}};writeWorkspacePresets(presets);refreshWorkspacePresetSelect(title);return title;
}
async function applyWorkspacePreset(name){
  const p=readWorkspacePresets()[name];if(!p)throw new Error('找不到工作區版型');
  try{localStorage.setItem(WORKSPACE_LAYOUT_KEY,JSON.stringify(p.layouts||{}));localStorage.setItem(SIDEBAR_LAYOUT_KEY,JSON.stringify(p.sidebars||{}));writeOpenPanelRoutes(p.openRoutes||[]);}catch(_){}
  for(const panel of [...toolPanelLayer.querySelectorAll('.floating-tool-window')]){panel._layoutObserver?.disconnect?.();panel.remove();}
  applySidebarLayout('module');applySidebarLayout('inspector');showSidebar('module',p.sidebarOpen?.module!==false);showSidebar('inspector',p.sidebarOpen?.inspector!==false);
  for(const route of p.openRoutes||[])await openToolPanel(route);
  updateDockedPanelLayout();syncPanelLayerState();
}
function refreshWorkspacePresetSelect(selected=''){
  const sel=document.getElementById('workspacePresetSelect');if(!sel)return;const names=Object.keys(readWorkspacePresets()).sort((a,b)=>a.localeCompare(b,'zh-Hant'));sel.innerHTML='';const first=document.createElement('option');first.value='';first.textContent='工作區版型';sel.appendChild(first);for(const name of names){const o=document.createElement('option');o.value=name;o.textContent=name;o.selected=name===selected;sel.appendChild(o);}
}
function topOpenPanel(){return [...toolPanelLayer.querySelectorAll('.floating-tool-window')].sort((a,b)=>(Number(b.style.zIndex)||0)-(Number(a.style.zIndex)||0))[0]||null;}
function syncPanelLayerState(){const any=!!toolPanelLayer.querySelector('.floating-tool-window');toolPanelLayer.classList.toggle('open',any);const top=topOpenPanel();activeToolRoute=top?.dataset.toolRoute||'';state.route=activeToolRoute||'simulator';nav();}
function bringPanelToFront(panel){if(!panel)return;panel.style.zIndex=String(++panelZ);activeToolRoute=panel.dataset.toolRoute||'';state.route=activeToolRoute||'simulator';nav();}
function closeToolPanel(route=activeToolRoute){
  const panel=toolPanelLayer.querySelector(`.floating-tool-window[data-tool-route="${CSS.escape(route||'')}"]`);if(!panel){syncPanelLayerState();return;}
  if(route==='diagrams')unmountNeuralView();savePanelLayout(panel,route);rememberPanelClosed(route);panel._layoutObserver?.disconnect?.();panel.remove();updateDockedPanelLayout();syncPanelLayerState();
}
function resetFloatingPanelLayouts(){
  try{localStorage.removeItem(WORKSPACE_LAYOUT_KEY);}catch(_){}
  const panels=[...toolPanelLayer.querySelectorAll('.floating-tool-window')];panels.forEach((panel,i)=>{panel.classList.remove('docked','dock-left','dock-right','dock-top','dock-bottom','minimized');panel.dataset.dockEdge='';panel.removeAttribute('style');restorePanelLayout(panel,panel.dataset.toolRoute,i);});updateDockedPanelLayout();syncPanelLayerState();
}
function enableFloatingPanelDrag(panel){
  const route=panel.dataset.toolRoute||'',handle=panel.querySelector('.floating-tool-header');let drag=null;
  const startFront=e=>{if(e.target.closest('select,option,input,textarea,button,label,a,[contenteditable="true"]'))return;bringPanelToFront(panel);};panel.addEventListener('pointerdown',startFront,{capture:true});
  handle?.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;if((panel.dataset.dockEdge||'')||window.innerWidth<=900)return;const r=panel.getBoundingClientRect();drag={dx:e.clientX-r.left,dy:e.clientY-r.top};panel.style.right='auto';bringPanelToFront(panel);handle.setPointerCapture?.(e.pointerId);});
  handle?.addEventListener('pointermove',e=>{if(!drag)return;const maxX=Math.max(0,window.innerWidth-panel.offsetWidth),maxY=Math.max(72,window.innerHeight-panel.offsetHeight);panel.style.left=Math.max(0,Math.min(maxX,e.clientX-drag.dx))+'px';panel.style.top=Math.max(72,Math.min(maxY,e.clientY-drag.dy))+'px';});
  const stop=()=>{if(drag)savePanelLayout(panel,route);drag=null;};handle?.addEventListener('pointerup',stop);handle?.addEventListener('pointercancel',stop);
  panel.querySelector('[data-tool-close]')?.addEventListener('click',()=>closeToolPanel(route));
  panel.querySelector('[data-tool-minimize]')?.addEventListener('click',()=>{panel.classList.toggle('minimized');bringPanelToFront(panel);savePanelLayout(panel,route);});
  panel.querySelector('[data-tool-dock]')?.addEventListener('click',()=>{cyclePanelDock(panel);bringPanelToFront(panel);});
  if(typeof ResizeObserver!=='undefined'){let last='';const ro=new ResizeObserver(()=>{const r=panel.getBoundingClientRect(),sig=`${Math.round(r.width)}x${Math.round(r.height)}`;if(sig!==last){last=sig;clearTimeout(panel._layoutTimer);panel._layoutTimer=setTimeout(()=>savePanelLayout(panel,route),140);}});ro.observe(panel);panel._layoutObserver=ro;}
}
function refreshToolPanelBody(panel,route){
  if(!panel)return;
  if(route==='diagrams')unmountNeuralView();
  const body=panel.querySelector('.floating-tool-body');if(!body)return;
  body.innerHTML=render(route);const prev=root;root=body;bind();root=prev;enhanceStableSelects(body);
  if(route==='diagrams')mountNeuralView();
}
function refreshAllToolPanels(){
  for(const panel of toolPanelLayer.querySelectorAll('.floating-tool-window')){
    const route=panel.dataset.toolRoute;if(route)refreshToolPanelBody(panel,route);
  }
}
function wiringPortIsLive(deviceId,direction,signal,now=Date.now()){
  const rt=state.deviceRuntime?.[deviceId]||{},io=rt.io||{};if(io[signal])return true;
  for(const c of state.connections||[]){
    const until=Number(state.activeSignals?.[c.id]||0);if(until<=now)continue;
    if(direction==='DO'&&c.fromDevice===deviceId&&String(c.fromTerminal).toUpperCase()===String(signal).toUpperCase())return true;
    if(direction==='DI'&&c.toDevice===deviceId&&String(c.toTerminal).toUpperCase()===String(signal).toUpperCase())return true;
  }
  return false;
}
function refreshEngineeringLiveStatus(){
  const panel=toolPanelLayer?.querySelector('.floating-tool-window[data-tool-route="engineering"]');if(!panel)return;
  const now=Date.now();
  for(const [id,until] of Object.entries(state.activeSignals||{}))if(Number(until)<=now)delete state.activeSignals[id];
  panel.querySelectorAll('[data-wiring-live-port]').forEach(el=>{
    const [deviceId,direction,...rest]=String(el.dataset.wiringLivePort||'').split('|'),signal=rest.join('|');
    const on=wiringPortIsLive(deviceId,direction,signal,now);el.classList.toggle('signal-on',on);const stateEl=el.querySelector('.wiring-port-state');if(stateEl)stateEl.textContent=on?'ON':'OFF';
  });
  panel.querySelectorAll('[data-wiring-live-connection]').forEach(row=>{
    const id=row.dataset.wiringLiveConnection||'',on=Number(state.activeSignals?.[id]||0)>now;row.classList.toggle('signal-live',on);const label=row.querySelector('.connection-live-state');if(label)label.textContent=on?'● 訊號傳遞中':'待命';
  });
  panel.querySelectorAll('[data-wiring-device-card]').forEach(card=>{card.classList.toggle('signal-active',!!card.querySelector('.wiring-signal-chip.signal-on'));});
}
setInterval(refreshEngineeringLiveStatus,110);

async function openToolPanel(route){
  if(route==='simulator'){const top=topOpenPanel();if(top)closeToolPanel(top.dataset.toolRoute);return;}
  let panel=toolPanelLayer.querySelector(`.floating-tool-window[data-tool-route="${CSS.escape(route)}"]`);
  if(panel){panel.classList.remove('minimized');bringPanelToFront(panel);refreshToolPanelBody(panel,route);savePanelLayout(panel,route);rememberPanelOpen(route);return panel;}
  const count=toolPanelLayer.querySelectorAll('.floating-tool-window').length;
  const safeRoute=String(route).replace(/[^a-z0-9_-]/gi,'');const bodyId=`floatingToolBody_${safeRoute}`;
  toolPanelLayer.insertAdjacentHTML('beforeend',`<section class="floating-tool-window" data-tool-route="${route}"><header class="floating-tool-header"><div><b>${toolTitle(route)}</b><small>工作區保持運作，不重新載入 3D</small></div><div class="floating-tool-actions"><button data-tool-minimize title="最小化">—</button><button data-tool-dock title="吸附位置">▣</button><button data-tool-close title="關閉">×</button></div></header><div id="${bodyId}" class="floating-tool-body">${render(route)}</div></section>`);
  toolPanelLayer.classList.add('open');panel=toolPanelLayer.querySelector(`.floating-tool-window[data-tool-route="${CSS.escape(route)}"]`);restorePanelLayout(panel,route,count);enableFloatingPanelDrag(panel);updateDockedPanelLayout();const dockBtn=panel.querySelector('[data-tool-dock]');if(dockBtn)dockBtn.title='吸附：'+dockLabel(panel.dataset.dockEdge||'');bringPanelToFront(panel);
  const body=panel.querySelector(`#${bodyId}`),prev=root;root=body;bind();root=prev;enhanceStableSelects(body);
  if(route==='diagrams')mountNeuralView();rememberPanelOpen(route);return panel;
}
function nav(){
  tabs.innerHTML=categories.map(c=>`<button data-route="${c.id}" class="${state.route===c.id?'active':''}">${c.label}</button>`).join('');
  bottom.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.route===state.route||(b.dataset.route==='simulator'&&!activeToolRoute)));
  document.body.dataset.route=activeToolRoute||'simulator';
}
async function go(route){
  await ensurePersistentWorkspace();
  if(route==='sync2d'){
    // 2D/3D 同步工具改為浮動面板，真正 3D Canvas 保留在底層。
    return openToolPanel(route);
  }
  if(route==='simulator'){
    const top=topOpenPanel();if(top)closeToolPanel(top.dataset.toolRoute);sim3d?.applyProjectState?.();return sim3d;
  }
  return openToolPanel(route);
}
function ensureInspectorShell(){
  const workspace=workspaceRoot.querySelector('.legacy-workspace');if(!workspace)return null;
  let aside=document.getElementById('deviceInspectorSidebar');
  if(!aside){
    aside=document.createElement('aside');aside.id='deviceInspectorSidebar';aside.className='legacy-sidebar right-sidebar dockable-sidebar sidebar-docked';aside.dataset.sidebar='inspector';aside.innerHTML='<div id="deviceInspectorPanelContent"></div>';workspace.appendChild(aside);
  }
  aside.hidden=false;workspace.classList.add('has-right');state.workspace.rightOpen=true;applySidebarLayout('inspector');enableDockableSidebar('inspector');return aside;
}
function syncInspector(id,open=true){
  const d=devices.find(x=>x.id===id);if(!d)return;state.selectedDevice=id;selectDevice(id);
  if(open)ensureInspectorShell();
  const slot=document.getElementById('deviceInspectorPanelContent');if(slot)slot.innerHTML=renderDeviceInspector(id);
  const quick=document.getElementById('quick3DControlSlot');if(quick)quick.innerHTML=renderQuick3DControls(id);
  bindDynamicInspector();enhanceStableSelects(slot||workspaceRoot);
  const badge=workspaceRoot.querySelector('.selected-badge');if(badge)badge.textContent=d.name;
  const sel=document.getElementById('selectedState');if(sel)sel.textContent=d.name;
}
function selectDeviceEverywhere(id){state.selectedDevice=id;selectDevice(id);sim3d?.selectDevice(id);syncInspector(id,true);}
function applyPlanPatch(patch){const id=state.selectedDevice;if(!id)return;updateDeviceTransform(id,patch);sim3d?.applyDeviceTransform(id);syncInspector(id,false);}
function updateModuleSearch(q){state.moduleLibrary.search=q;const term=q.trim().toLowerCase();workspaceRoot.querySelectorAll('.legacy-module-card').forEach(card=>{card.hidden=!!term&&!card.textContent.toLowerCase().includes(term);});}
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
  workspaceRoot.querySelectorAll('[data-inspector-tab]').forEach(b=>b.addEventListener('click',()=>{state.workspace.inspectorTab=b.dataset.inspectorTab;const slot=document.getElementById('deviceInspectorPanelContent');if(slot){slot.innerHTML=renderDeviceInspector(state.selectedDevice);bindDynamicInspector();}}));
  document.getElementById('closeInspectorSidebar')?.addEventListener('click',()=>showSidebar('inspector',false));
  document.getElementById('floatInspectorSidebar')?.addEventListener('click',()=>toggleSidebarDock('inspector'));
  applySidebarLayout('inspector');enableDockableSidebar('inspector');
  byId('deleteSelectedModule')?.addEventListener('click',safeHandler('刪除模組',async()=>{
    const id=state.selectedDevice;if(!id)return;
    if(!confirm('確定刪除目前模組及相關接線？'))return;
    if(!removeModule(id))return;
    state.selectedDevice=devices[0]?.id||null;
    sim3d?.applyProjectState?.();
    const slot=document.getElementById('deviceInspectorPanelContent');if(slot)slot.innerHTML=renderDeviceInspector(state.selectedDevice);
  }));
  const applyTransformFromInspector=async()=>{const id=state.selectedDevice;if(!id)return;const clampPos=v=>Math.max(-100,Math.min(300,Number(v)||0));updateDeviceTransform(id,{x:clampPos(num('propX')),y:clampPos(num('propY')),z:clampPos(num('propZ')),rotationX:num('propRX')*Math.PI/180,rotationY:num('propRY')*Math.PI/180,rotationZ:num('propRZ')*Math.PI/180,floor:val('propFloor',getDeviceTransform(id).floor)});await withSimulator('設備座標即時套用',sim=>sim.applyDeviceTransform(id));};
  workspaceRoot.querySelectorAll('[data-transform-range]').forEach(range=>range.addEventListener('input',safeHandler('XYZ拉桿',async()=>{const axis=range.dataset.transformRange;const input=document.getElementById(`prop${axis}`);if(input)input.value=Number(range.value).toFixed(2);await applyTransformFromInspector();})));
  ['X','Y','Z'].forEach(axis=>document.getElementById(`prop${axis}`)?.addEventListener('input',()=>{const r=workspaceRoot.querySelector(`[data-transform-range="${axis}"]`);if(r){const v=Math.max(-100,Math.min(300,Number(document.getElementById(`prop${axis}`)?.value)||0));r.value=String(v);}}));
  workspaceRoot.querySelectorAll('[data-rotation-preset]').forEach(btn=>btn.addEventListener('click',safeHandler('旋轉快速角度',async()=>{const [axis,degree]=btn.dataset.rotationPreset.split('|');const input=document.getElementById(`propR${axis}`);if(input)input.value=degree;await applyTransformFromInspector();})));
  document.getElementById('showTransformGizmoSetting')?.addEventListener('change',safeHandler('3D操作線顯示',async e=>{state.editor.showTransformGizmo=!!e.currentTarget.checked;await withSimulator('3D操作線顯示',sim=>sim.setTransformGizmoVisible?.(state.editor.showTransformGizmo));}));
  document.getElementById('applyInspectorProperties')?.addEventListener('click',()=>{
    const id=state.selectedDevice,d=devices.find(x=>x.id===id);if(!d)return;
    d.name=String(val('inspectorName',d.name)).trim()||d.name;
    const clampPos=v=>Math.max(-100,Math.min(300,Number(v)||0));updateDeviceTransform(id,{x:clampPos(num('propX')),y:clampPos(num('propY')),z:clampPos(num('propZ')),rotationX:num('propRX')*Math.PI/180,rotationY:num('propRY')*Math.PI/180,rotationZ:num('propRZ')*Math.PI/180,floor:val('propFloor',getDeviceTransform(id).floor)});
    updateSettings(id,{showLabel:checked('showLabelSetting'),labelOffsetX:num('labelOffsetX'),labelOffsetY:num('labelOffsetY'),labelOffsetZ:num('labelOffsetZ'),positionLocked:checked('lockPositionSetting'),allowOverlap:checked('allowOverlapSetting')});
    withSimulator('設備屬性套用',s=>{s.applyDeviceTransform(id);s.applyDeviceSettings(id);});syncInspector(id,false);
  });
  workspaceRoot.querySelectorAll('[data-setting-param]').forEach(el=>el.addEventListener('input',()=>{
    const id=state.selectedDevice;if(!id)return;const n=Number(el.value);if(!Number.isFinite(n))return;
    updateSettings(id,{[el.dataset.settingParam]:n});scheduleLiveDeviceSettings(id);
  }));
  document.getElementById('barrierArmSide')?.addEventListener('change',()=>{const id=state.selectedDevice;if(!id)return;updateSettings(id,{armSide:val('barrierArmSide','left')});scheduleLiveDeviceSettings(id);});
  document.getElementById('barrierAutoCloseEnabled')?.addEventListener('change',e=>{const id=state.selectedDevice;if(!id)return;updateSettings(id,{autoCloseEnabled:!!e.currentTarget.checked});scheduleLiveDeviceSettings(id);});
  document.getElementById('barrierAutoCloseSeconds')?.addEventListener('input',e=>{const id=state.selectedDevice;if(!id)return;updateSettings(id,{autoCloseSeconds:Math.max(1,Math.min(120,Number(e.currentTarget.value)||5))});scheduleLiveDeviceSettings(id);});
  document.getElementById('signalIdleState')?.addEventListener('change',()=>{const id=state.selectedDevice;if(!id)return;updateSettings(id,{idleSignal:val('signalIdleState','green')});scheduleLiveDeviceSettings(id);});
  document.getElementById('signalRestoreAfterPulse')?.addEventListener('change',e=>{const id=state.selectedDevice;if(!id)return;updateSettings(id,{restoreAfterPulse:!!e.currentTarget.checked});scheduleLiveDeviceSettings(id);});
  document.getElementById('ledRedMode')?.addEventListener('change',()=>{const id=state.selectedDevice;if(!id)return;updateSettings(id,{redMode:val('ledRedMode','steady')});scheduleLiveDeviceSettings(id);});
  document.getElementById('lastFiveFlash')?.addEventListener('change',e=>{const id=state.selectedDevice;if(!id)return;updateSettings(id,{lastFiveFlash:!!e.currentTarget.checked});scheduleLiveDeviceSettings(id);});
  document.getElementById('signalManagementMode')?.addEventListener('change',()=>{const id=state.selectedDevice;if(!id)return;updateSettings(id,{managementMode:val('signalManagementMode','timer')});scheduleLiveDeviceSettings(id);});
  document.getElementById('applyModuleSettings')?.addEventListener('click',safeHandler('設備參數套用',async()=>{
    const id=state.selectedDevice,patch={};workspaceRoot.querySelectorAll('[data-setting-param]').forEach(el=>{const n=Number(el.value);if(Number.isFinite(n))patch[el.dataset.settingParam]=n;});
    const sideSelect=document.getElementById('barrierArmSide');if(sideSelect)patch.armSide=sideSelect.value||'left';
    const autoClose=document.getElementById('barrierAutoCloseEnabled');if(autoClose)patch.autoCloseEnabled=!!autoClose.checked;
    const autoSeconds=document.getElementById('barrierAutoCloseSeconds');if(autoSeconds)patch.autoCloseSeconds=Math.max(1,Math.min(120,Number(autoSeconds.value)||5));
    const idleSelect=document.getElementById('signalIdleState');if(idleSelect)patch.idleSignal=idleSelect.value||'green';
    const restore=document.getElementById('signalRestoreAfterPulse');if(restore)patch.restoreAfterPulse=!!restore.checked;
    const redMode=document.getElementById('ledRedMode');if(redMode)patch.redMode=redMode.value||'steady';
    const five=document.getElementById('lastFiveFlash');if(five)patch.lastFiveFlash=!!five.checked;
    const manage=document.getElementById('signalManagementMode');if(manage)patch.managementMode=manage.value||'timer';
    updateSettings(id,patch);await withSimulator('設備參數套用',s=>s.applyDeviceSettings(id));
    refreshInspectorPreserveScroll(id);
  }));
  workspaceRoot.querySelectorAll('[data-open-selected-inspector]').forEach(b=>b.addEventListener('click',()=>{state.workspace.inspectorTab='controls';syncInspector(b.dataset.openSelectedInspector,true);}));
  workspaceRoot.querySelectorAll('[data-device-action]').forEach(b=>b.addEventListener('click',safeHandler('設備控制',async()=>{const [id,action]=b.dataset.deviceAction.split('|');await withSimulator('設備控制',s=>s.executeDeviceAction(id,action));setTimeout(()=>refreshInspectorPreserveScroll(id),80);})));
  workspaceRoot.querySelectorAll('[data-io-trigger]').forEach(b=>b.addEventListener('click',safeHandler('DI/DO 脈衝',async()=>{const [id,dir,signal]=b.dataset.ioTrigger.split('|');await withSimulator('DI/DO 脈衝',s=>s.simulateIo(id,dir,signal));refreshInspectorPreserveScroll(id);setTimeout(()=>{if(state.selectedDevice===id)refreshInspectorPreserveScroll(id);},520);})));
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

  document.getElementById('toggleModuleSidebar')?.addEventListener('click',()=>{const aside=document.getElementById('moduleLibrarySidebar');showSidebar('module',!!aside?.hidden);});
  document.getElementById('resetToolWindows')?.addEventListener('click',()=>{resetFloatingPanelLayouts();try{localStorage.removeItem(SIDEBAR_LAYOUT_KEY);}catch(_){}applySidebarLayout('module');applySidebarLayout('inspector');});
  document.getElementById('saveWorkspacePreset')?.addEventListener('click',safeHandler('保存工作區版型',()=>{const name=prompt('工作區版型名稱，例如：接線工作');if(name)captureWorkspacePreset(name);}));
  document.getElementById('workspacePresetSelect')?.addEventListener('change',safeHandler('套用工作區版型',async e=>{if(e.target.value)await applyWorkspacePreset(e.target.value);}));
  document.getElementById('deleteWorkspacePreset')?.addEventListener('click',()=>{const sel=document.getElementById('workspacePresetSelect'),name=sel?.value;if(!name)return;if(confirm(`刪除工作區版型「${name}」？`)){const presets=readWorkspacePresets();delete presets[name];writeWorkspacePresets(presets);refreshWorkspacePresetSelect();}});
  refreshWorkspacePresetSelect(document.getElementById('workspacePresetSelect')?.value||'');
  document.getElementById('toggleInspectorSidebar')?.addEventListener('click',()=>{let aside=document.getElementById('deviceInspectorSidebar');if(!aside&&state.selectedDevice)aside=ensureInspectorShell();if(aside)showSidebar('inspector',!!aside.hidden);});
  root.querySelectorAll('[data-workspace-mode]').forEach(b=>b.addEventListener('click',()=>{const mode=b.dataset.workspaceMode;if(mode==='3d'){state.workspace.mode='3d';closeToolPanel();}else{state.workspace.mode=mode;openToolPanel('sync2d');}}));
  byId('quickScenePreset')?.addEventListener('change',safeHandler('切換場景',async e=>{const p=applyScenePreset(e.target.value);if(!p)return;await withSimulator('切換場景',sim=>sim.applyProjectState());}));
  byId('quickViewSelect')?.addEventListener('change',safeHandler('切換視野',async e=>{const i=Number(e.target.value);state.simulator.cameraPreset=i;await withSimulator('切換視野',sim=>sim.gotoView(i));}));
  document.getElementById('toggle3DFullscreen')?.addEventListener('click',()=>{state.workspace.fullscreen3d=!state.workspace.fullscreen3d;go('simulator')});
  root.querySelectorAll('[data-editor-mode]').forEach(b=>b.addEventListener('click',safeHandler('切換3D編輯模式',async()=>{setEditorMode(b.dataset.editorMode);root.querySelectorAll('[data-editor-mode]').forEach(x=>x.classList.toggle('active',x.dataset.editorMode===state.editor.mode));await withSimulator('切換3D編輯模式',s=>s.setEditorMode(state.editor.mode));})));
  document.getElementById('toggleSnap')?.addEventListener('click',safeHandler('Snap切換',async e=>{state.editor.snap=!state.editor.snap;e.currentTarget.classList.toggle('active',state.editor.snap);e.currentTarget.textContent=`Snap ${state.editor.snap?'ON':'OFF'}`;await withSimulator('Snap切換',s=>s.setSnap(state.editor.snap));}));
  if(root===workspaceRoot)bindModuleLibraryControls();
  bindDynamicInspector();

  root.querySelectorAll('[data-drive]').forEach(b=>{const dir=b.dataset.drive;if(dir==='stop'){b.addEventListener('click',()=>sim3d?.stop());return;}const down=e=>{e.preventDefault();sim3d?.setDrive(dir,true)},up=e=>{e.preventDefault();sim3d?.setDrive(dir,false)};b.addEventListener('pointerdown',down);['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,up));});
  document.getElementById('toggleSignals')?.addEventListener('click',safeHandler('DI/DO線切換',async e=>{const on=await withSimulator('DI/DO線切換',s=>s.toggleSignals());if(on!==null)e.currentTarget.textContent=on?'隱藏 DI/DO 線':'顯示 DI/DO 線';}));
  document.getElementById('toggleZones')?.addEventListener('click',safeHandler('感應範圍切換',async e=>{const on=await withSimulator('感應範圍切換',s=>s.toggleZones());if(on!==null)e.currentTarget.textContent=on?'隱藏感應範圍':'顯示感應範圍';}));
  byId('vehicleTypeSelect')?.addEventListener('change',safeHandler('切換車種',async e=>{state.simulator.vehicleType=e.target.value==='motorcycle'?'motorcycle':'car';await withSimulator('切換車種',sim=>sim.setVehicleType?.(state.simulator.vehicleType));}));
  byId('activeVehicleSelect')?.addEventListener('change',safeHandler('切換控制車輛',async e=>{state.simulator.activeVehicleId=e.target.value;await withSimulator('切換控制車輛',sim=>sim.selectVehicle?.(e.target.value));refreshAllToolPanels();}));
  byId('addCarVehicle')?.addEventListener('click',safeHandler('新增汽車',async()=>{await withSimulator('新增汽車',sim=>sim.addVehicle?.('car'));refreshAllToolPanels();}));
  byId('addMotorcycleVehicle')?.addEventListener('click',safeHandler('新增機車',async()=>{await withSimulator('新增機車',sim=>sim.addVehicle?.('motorcycle'));refreshAllToolPanels();}));
  byId('deleteActiveVehicle')?.addEventListener('click',safeHandler('刪除車輛',async()=>{await withSimulator('刪除車輛',sim=>sim.removeVehicle?.(state.simulator.activeVehicleId));refreshAllToolPanels();}));
  byId('laneTypeSelect')?.addEventListener('change',safeHandler('切換車道類型',async e=>{const v=e.target.value;state.simulator.laneType=v==='car'||v==='motorcycle'?v:'mixed';await withSimulator('切換車道類型',sim=>sim.setLaneType?.(state.simulator.laneType));}));
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
  byId('cloudRunExample')?.addEventListener('click',safeHandler('Google 儲存範例',async()=>{const status=byId('cloudExampleStatus');state.cloud.webAppUrl=val('cloudWebAppUrl',state.cloud.webAppUrl).trim();if(!state.cloud.webAppUrl)throw new Error('請先貼上 Apps Script /exec 網址');rememberCloudUrl();if(status)status.textContent='1/4 測試連線…';await pingCloud(state.cloud.webAppUrl);if(status)status.textContent='2/4 測試 Drive 寫入權限…';await verifyCloudWrite(state.cloud.webAppUrl);const d=new Date(),pad=n=>String(n).padStart(2,'0');state.cloud.projectName=`UTOP_儲存範例_${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;const nameInput=byId('cloudProjectName');if(nameInput)nameInput.value=state.cloud.projectName;if(status)status.textContent='3/4 建立範例專案並儲存…';const saved=await cloudSave(true);if(status)status.textContent='4/4 更新 Google 專案清單…';await refreshCloudProjectList();const sel=byId('cloudProjectList');if(sel&&saved?.projectId)sel.value=saved.projectId;state.cloud.selectedProjectId=saved?.projectId||'';if(status)status.textContent=`✅ 範例完成：${saved?.projectName||state.cloud.projectName}。現在可按「開啟選取專案」測試讀取。`;}));
  byId('cloudRepairIndex')?.addEventListener('click',safeHandler('重建 Google 專案索引',async()=>{const r=await repairCloudIndex(state.cloud.webAppUrl);state.cloud.status=`✅ 已重建 Google 專案索引：${r.count} 筆`;byId('cloudStatus').textContent=state.cloud.status;await refreshCloudProjectList();}));
  byId('cloudRefresh')?.addEventListener('click',safeHandler('讀取雲端專案',refreshCloudProjectList));
  byId('cloudSave')?.addEventListener('click',safeHandler('Google 雲端儲存',async()=>{await cloudSave(false);byId('cloudStatus').textContent=state.cloud.status;await refreshCloudProjectList();}));
  byId('cloudSaveAs')?.addEventListener('click',safeHandler('Google 雲端另存',async()=>{await cloudSave(true);byId('cloudStatus').textContent=state.cloud.status;await refreshCloudProjectList();}));
  byId('cloudImportLegacy')?.addEventListener('click',safeHandler('匯入舊版本機專案',async()=>{importLegacyLocalProject();await go('project');sim3d?.applyProjectState?.();refreshAllToolPanels();}));
  byId('cloudNew')?.addEventListener('click',safeHandler('建立空白專案',async()=>{if(!confirmDiscard('建立空白專案？目前尚未儲存到 Google 的內容會被清除。'))return;resetToBlankProject();await go('simulator');sim3d?.applyProjectState?.();refreshAllToolPanels();}));
  byId('cloudProjectList')?.addEventListener('change',e=>{state.cloud.selectedProjectId=e.target.value;});
  byId('cloudOpen')?.addEventListener('click',safeHandler('開啟 Google 專案',async()=>{const id=val('cloudProjectList');if(!id)throw new Error('請先選擇雲端專案');if(!confirmDiscard('開啟其他 Google 專案？目前未儲存內容會被替換。'))return;const r=await loadCloudProject(state.cloud.webAppUrl,id);replaceProjectData(r.project);await go('simulator');sim3d?.applyProjectState?.();refreshAllToolPanels();}));
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
byId('saveBtn')?.addEventListener('click',safeHandler('Google 雲端儲存',async()=>{if(!state.cloud?.webAppUrl){state.cloud??={};state.cloud.status='請先到「專案 / Debug」設定 Google Apps Script Web App 網址';await go('project');return;}await cloudSave(false);setHeaderStatus(`Google 已儲存 · ${state.cloud.projectName}`);}));
window.addEventListener('resize',()=>{updateDockedPanelLayout();});

(async function bootApplication(){
  try{
    window.__utopBoot?.phase('ENHANCE SELECTS');enhanceStableSelects(document);
    window.__utopBoot?.phase('RESTORE CLOUD URL');restoreCloudUrl();
    window.__utopBoot?.phase('MIGRATE PROJECT STATE');migrateProjectState(state,devices,DEFAULTS.state,DEFAULTS.devices);
    markCloudBaseline();
    const bootRoute=state.route||'overview';state.route='simulator';
    window.__utopBoot?.phase('PERSISTENT WORKSPACE BOOT');await ensurePersistentWorkspace();
    const persisted=readOpenPanelRoutes();
    if(window.innerWidth<=900&&persisted.length)await openToolPanel(persisted[persisted.length-1]);
    else if(persisted.length){for(const route of persisted)await openToolPanel(route);}
    else await go(bootRoute==='simulator'?'simulator':bootRoute);
    window.__utopBoot?.phase('APPLICATION BOOT COMPLETE');window.__utopBoot?.hide?.();
  }catch(err){
    window.__utopBoot?.error?.('APPLICATION BOOT FAILED',err);
    reportUiError('應用程式啟動',err);
  }
})();
