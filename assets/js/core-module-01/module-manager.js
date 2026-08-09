import {state} from '../state.js';
import {devices,moduleCatalog} from '../data.js';
import {definitionForType,definitionForKey} from './module-definitions.js';

export function templateByKey(key){
  const def=definitionForKey(key);if(!def)return null;
  return {key:def.key,name:def.name,type:def.type,state:'READY',image:def.image,summary:def.summary,modelCode:def.modelCode};
}
export function definitionForDevice(id){const d=devices.find(x=>x.id===id);return d?definitionForType(d.type):null;}
export function nextDeviceId(){const max=Math.max(0,...devices.map(d=>Number((d.id||'').split('-')[1])||0));return `DEV-${String(max+1).padStart(3,'0')}`;}
export function defaultSettings(type='Generic'){
  const def=definitionForType(type);const out={showLabel:true,positionLocked:false,installationHeight:0};
  for(const param of def?.parameters||[])out[param.id]=param.value;
  if(out.width===undefined)out.width=1;if(out.height===undefined)out.height=1;if(out.depth===undefined)out.depth=1;
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
  state.deviceTransforms[id]={x:-3+(count%5)*1.8,y:0,z:-8+Math.floor(count/5)*2.2,rotationY:0,floor};
  state.deviceSettings[id]=defaultSettings(def.type);state.deviceRuntime[id]={status:'READY',lastAction:'',active:false};
  state.deviceHotkeys[id]={};state.selectedDevice=id;return id;
}
export function removeModule(id){
  const idx=devices.findIndex(d=>d.id===id);if(idx<0)return false;
  devices.splice(idx,1);delete state.deviceTransforms[id];delete state.deviceSettings[id];delete state.deviceRuntime[id];delete state.deviceHotkeys[id];
  state.connections=state.connections.filter(c=>c.fromDevice!==id&&c.toDevice!==id);
  if(state.selectedDevice===id)state.selectedDevice=devices[0]?.id||null;return true;
}
export function getSettings(id){const dev=devices.find(d=>d.id===id);if(!dev)return {};return state.deviceSettings[id]||(state.deviceSettings[id]=defaultSettings(dev.type));}
export function updateSettings(id,patch){Object.assign(getSettings(id),patch);return getSettings(id);}
export function getRuntime(id){return state.deviceRuntime[id]||(state.deviceRuntime[id]={status:'READY',lastAction:'',active:false});}
export function updateRuntime(id,patch){Object.assign(getRuntime(id),patch);return getRuntime(id);}
export function filterCatalog(search='',group='全部'){
  const q=String(search).trim().toLowerCase();
  return moduleCatalog.map(g=>({...g,items:g.items.filter(i=>(group==='全部'||group===g.group)&&(!q||`${i.name} ${i.type} ${i.modelCode||''} ${i.summary||''}`.toLowerCase().includes(q)))})).filter(g=>g.items.length);
}
