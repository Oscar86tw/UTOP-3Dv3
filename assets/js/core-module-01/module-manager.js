import {state} from '../state.js';
import {devices,moduleCatalog} from '../data.js';
import {definitionForType,definitionForKey} from './module-definitions.js';
import {ioSemanticLabel,terminalSemanticLabel,ioSourceNote} from './io-semantic-labels.js?v=1.7.20';

export function templateByKey(key){
  const def=definitionForKey(key);if(!def)return null;
  return {key:def.key,name:def.name,type:def.type,state:'READY',image:def.image,summary:def.summary,modelCode:def.modelCode};
}
export function definitionForDevice(id){const d=devices.find(x=>x.id===id);return d?definitionForType(d.type):null;}
export function nextDeviceId(){const max=Math.max(0,...devices.map(d=>Number((d.id||'').split('-')[1])||0));return `DEV-${String(max+1).padStart(3,'0')}`;}
export function defaultSettings(type='Generic'){
  const def=definitionForType(type);const out={showLabel:true,labelOffsetX:0,labelOffsetY:0,labelOffsetZ:0,positionLocked:false,allowOverlap:false,installationHeight:0};
  for(const param of def?.parameters||[])out[param.id]=param.value;
  if(out.width===undefined)out.width=1;if(out.height===undefined)out.height=1;if(out.depth===undefined)out.depth=1;
  const kind=String(type).toLowerCase();
  if(kind==='barrier'){if(out.armSide===undefined)out.armSide='left';if(out.autoCloseEnabled===undefined)out.autoCloseEnabled=false;if(out.autoCloseSeconds===undefined)out.autoCloseSeconds=5;}
  if(kind==='traffic'){if(out.idleSignal===undefined)out.idleSignal='green';if(out.restoreAfterPulse===undefined)out.restoreAfterPulse=true;if(out.restoreDelay===undefined)out.restoreDelay=.45;}
  if(kind==='ledpanel'){if(out.idleSignal===undefined)out.idleSignal='green';if(out.restoreAfterPulse===undefined)out.restoreAfterPulse=true;if(out.redMode===undefined)out.redMode='steady';if(out.lastFiveFlash===undefined)out.lastFiveFlash=true;}
  if(kind==='signal2way'||kind==='signal3way'){if(out.managementMode===undefined)out.managementMode='timer';if(out.idleLane===undefined)out.idleLane='A';}
  return out;
}
export function terminalsFor(type='Generic'){return [...(definitionForType(type)?.terminals||['IN','OUT','COM','V+','GND'])];}
export function controlsFor(type='Generic'){return [...(definitionForType(type)?.controls||[])];}
export function parametersFor(type='Generic'){return [...(definitionForType(type)?.parameters||[])];}
export function ioFor(type='Generic'){const d=definitionForType(type);return {inputs:[...(d?.inputs||[])],outputs:[...(d?.outputs||[])]};}
export function imageFor(type='Generic'){return definitionForType(type)?.image||'';}
export function modelCodeFor(type='Generic'){return definitionForType(type)?.modelCode||'';}
export function addModule(key,floor='1F'){
  const def=definitionForKey(key);if(!def)return null;
  const id=nextDeviceId();const same=devices.filter(d=>d.type===def.type).length+1;
  devices.push({id,modelCode:def.modelCode,name:`${def.name}${String(same).padStart(2,'0')}`,type:def.type,floor,state:'READY'});
  const count=devices.length-1;
  state.deviceTransforms[id]={x:-3+(count%5)*1.8,y:0,z:-8+Math.floor(count/5)*2.2,rotationX:0,rotationY:0,rotationZ:0,floor};
  state.deviceSettings[id]=defaultSettings(def.type);state.deviceRuntime[id]={status:'READY',lastAction:'',active:false};
  state.deviceHotkeys[id]={};state.selectedDevice=id;return id;
}
export function removeModule(id){
  const idx=devices.findIndex(d=>d.id===id);if(idx<0)return false;
  devices.splice(idx,1);delete state.deviceTransforms[id];delete state.deviceSettings[id];delete state.deviceRuntime[id];delete state.deviceHotkeys[id];
  state.connections=state.connections.filter(c=>c.fromDevice!==id&&c.toDevice!==id);
  if(state.selectedDevice===id)state.selectedDevice=devices[0]?.id||null;return true;
}
export function getSettings(id){const dev=devices.find(d=>d.id===id);if(!dev)return {};const defaults=defaultSettings(dev.type);const current=state.deviceSettings[id]||(state.deviceSettings[id]={});for(const [k,v] of Object.entries(defaults))if(current[k]===undefined)current[k]=v;return current;}
export function updateSettings(id,patch){Object.assign(getSettings(id),patch);return getSettings(id);}
export function getRuntime(id){return state.deviceRuntime[id]||(state.deviceRuntime[id]={status:'READY',lastAction:'',active:false});}
export function updateRuntime(id,patch){Object.assign(getRuntime(id),patch);return getRuntime(id);}
export function filterCatalog(search='',group='全部'){
  const q=String(search).trim().toLowerCase();
  return moduleCatalog.map(g=>({...g,items:g.items.filter(i=>(group==='全部'||group===g.group)&&(!q||`${i.name} ${i.type} ${i.modelCode||''} ${i.summary||''}`.toLowerCase().includes(q)))})).filter(g=>g.items.length);
}

export function ioLabelFor(type,direction,signal){return ioSemanticLabel(type,direction,signal);}
export function terminalLabelFor(type,terminal){return terminalSemanticLabel(type,terminal);}
export function ioReferenceFor(type){return ioSourceNote(type);}
