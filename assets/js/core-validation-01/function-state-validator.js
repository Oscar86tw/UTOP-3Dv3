import {state} from '../state.js';
import {MODULE_DEFINITIONS} from '../core-module-01/module-definitions.js';
import {devices} from '../data.js';
import {controlsFor} from '../core-module-01/module-manager.js';
import {deviceAllConnectables} from '../core-wiring-01/wiring-manager.js';
import {verifyConnectionActionChains} from '../core-logic-01/connection-runtime.js?v=1.7.9';
import {APP_VERSION,APP_VERSION_LABEL} from '../core-version-01/version-info.js?v=1.7.9';

function finite(n){return Number.isFinite(Number(n));}
function add(arr,name,ok,detail){arr.push({name,ok:!!ok,detail});}
export function runFunctionStateAudit(){
  state.runtimeHealth??={webglReady:false,simulatorReady:false,lastError:'',lastValidatedAt:''};
  const checks=[];const ids=new Set(devices.map(d=>d.id));
  const meta=document.getElementById('projectMeta')?.textContent||'';const domVersion=document.documentElement.dataset.utopVersion||'';add(checks,'版本同步',domVersion===APP_VERSION&&meta.includes(APP_VERSION_LABEL),`首頁 ${meta||'-'} / Runtime ${domVersion||'-'} / Expected ${APP_VERSION_LABEL}`);
  add(checks,'設備清單',true,devices.length?`${devices.length} 台設備`:'空白專案，尚未加入設備');
  const badTransform=devices.filter(d=>{const t=state.deviceTransforms?.[d.id];return !t||![t.x,t.y,t.z,t.rotationX,t.rotationY,t.rotationZ].every(finite)||!t.floor;});
  add(checks,'XYZ / RX RY RZ',badTransform.length===0,badTransform.length?`${badTransform.length} 台座標不完整`:'全部設備六軸資料完整');
  const missingSettings=devices.filter(d=>!state.deviceSettings?.[d.id]);add(checks,'設備 Settings',missingSettings.length===0,missingSettings.length?`缺少 ${missingSettings.length} 台`:'完整');
  const missingRuntime=devices.filter(d=>!state.deviceRuntime?.[d.id]);add(checks,'設備 Runtime',missingRuntime.length===0,missingRuntime.length?`缺少 ${missingRuntime.length} 台`:'完整');
  const missingHotkey=devices.filter(d=>!state.deviceHotkeys?.[d.id]);add(checks,'設備 Hotkey Map',missingHotkey.length===0,missingHotkey.length?`缺少 ${missingHotkey.length} 台`:'完整');
  const noControls=devices.filter(d=>controlsFor(d.type).length===0);add(checks,'3D 設備控制定義',noControls.length===0,noControls.length?`${noControls.length} 台沒有控制動作`:'全部設備都有控制定義');
  const invalidConnections=(state.connections||[]).filter(c=>{const a=devices.find(d=>d.id===c.fromDevice),b=devices.find(d=>d.id===c.toDevice);return !a||!b||!deviceAllConnectables(a.id).includes(c.fromTerminal)||!deviceAllConnectables(b.id).includes(c.toTerminal);});
  add(checks,'接線狀態',invalidConnections.length===0,invalidConnections.length?`${invalidConnections.length} 條無效 Connection`:`${state.connections?.length||0} 條 Connection 可用`);
  const legacyDemoIds=['DEV-001','DEV-003','DEV-006','DEV-007','DEV-008','DEV-009','DEV-011','DEV-012'];if(legacyDemoIds.every(id=>ids.has(id)))for(const c of verifyConnectionActionChains())add(checks,`3D動作鏈：${c.name}`,c.ok,c.detail);
  const invalidMarkings=(state.roadMarkings||[]).filter(m=>!m.id||!m.floor||![m.x,m.z,m.rotation,m.width,m.length].every(finite));add(checks,'道路標線狀態',invalidMarkings.length===0,invalidMarkings.length?`${invalidMarkings.length} 個標線資料異常`:`${state.roadMarkings?.length||0} 個標線正常`);
  add(checks,'場景狀態',!!(state.scene?.place&&state.scene?.time&&state.scene?.weather),`${state.scene?.place||'-'} / ${state.scene?.time||'-'} / ${state.scene?.weather||'-'}`);
  add(checks,'樓層狀態',Array.isArray(state.floors)&&state.floors.length>0,`${state.floors?.length||0} 層`);
  add(checks,'群組/圖層狀態',Array.isArray(state.groups)&&state.groups.length>0,`${state.groups?.length||0} 組`);
  add(checks,'視野狀態',Array.isArray(state.simulator?.viewpoints)&&state.simulator.viewpoints.length>0,`${state.simulator?.viewpoints?.length||0} 個視野`);
  add(checks,'選取設備',!state.selectedDevice||ids.has(state.selectedDevice),state.selectedDevice||'未選取');
  const health=state.runtimeHealth||{};add(checks,'真正 WebGL 3D',health.webglReady===true,health.webglReady?'WebGL READY':health.lastError||'尚未進入 3D 頁面驗證');
  add(checks,'Simulator API',health.simulatorReady===true,health.simulatorReady?'Simulator READY':'尚未完成 3D API 驗證');
  try{const k='__utop_validate__';localStorage.setItem(k,'1');localStorage.removeItem(k);add(checks,'瀏覽器設定儲存',true,'localStorage 可保存 Google Web App 網址與介面偏好');}catch(err){add(checks,'瀏覽器設定儲存',false,err?.message||String(err));}
  state.functionStateAudit={lastRun:new Date().toISOString(),checks};state.runtimeHealth.lastValidatedAt=state.functionStateAudit.lastRun;return checks;
}
export function functionStateSummary(){const checks=runFunctionStateAudit();return {total:checks.length,pass:checks.filter(c=>c.ok).length,fail:checks.filter(c=>!c.ok).length,checks};}
