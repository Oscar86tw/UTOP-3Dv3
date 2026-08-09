import {state} from '../state.js';
import {devices,moduleCatalog} from '../data.js';

export function templateByKey(key){
  for(const group of moduleCatalog){
    const item=group.items.find(x=>x.key===key);
    if(item)return item;
  }
  return null;
}
export function nextDeviceId(){
  const max=Math.max(0,...devices.map(d=>Number((d.id||'').split('-')[1])||0));
  return `DEV-${String(max+1).padStart(3,'0')}`;
}
export function defaultSettings(type='Generic'){
  const t=String(type).toLowerCase();
  if(t.includes('barrier'))return {width:1.05,height:2.05,depth:1.05,boomLength:5.8,speed:1,color:'orange'};
  if(t.includes('uhf')||t.includes('etag'))return {width:1.05,height:.72,depth:.25,range:6,angle:55,color:'orange'};
  if(t.includes('loop'))return {width:5.6,height:.05,depth:3.4,range:1,color:'yellow'};
  if(t.includes('camera'))return {width:.85,height:.5,depth:.65,range:12,fov:70,color:'blue'};
  if(t.includes('roller'))return {width:2.8,height:3.2,depth:.28,speed:1,color:'gray'};
  if(t.includes('traffic'))return {width:.55,height:1.5,depth:.38,color:'dark'};
  if(t.includes('led'))return {width:1.8,height:1,depth:.22,color:'green'};
  if(t.includes('relay'))return {width:1,height:.7,depth:.7,color:'gray'};
  if(t.includes('controller'))return {width:1.3,height:1.5,depth:.8,color:'dark'};
  if(t.includes('card'))return {width:.4,height:1.25,depth:.35,color:'gray'};
  return {width:1,height:1,depth:1,color:'blue'};
}
export function terminalsFor(type='Generic'){
  const t=String(type).toLowerCase();
  if(t.includes('barrier'))return ['OPEN','CLOSE','STOP','SAFETY','COM','+24V','GND'];
  if(t.includes('uhf')||t.includes('etag'))return ['TRIGGER','DATA','RS485+','RS485-','LAN','+12V','GND'];
  if(t.includes('loop'))return ['OUT','COM','NO','NC','+12V','GND'];
  if(t.includes('controller'))return ['DI1','DI2','DI3','DO1','DO2','COM','LAN','RS485+','RS485-','+12V','GND'];
  if(t.includes('relay'))return ['COIL+','COIL-','COM','NO','NC'];
  if(t.includes('camera'))return ['LAN','PoE','12V','GND','ALARM IN','ALARM OUT'];
  if(t.includes('traffic'))return ['RED','GREEN','COM','+12V','GND'];
  if(t.includes('led'))return ['LAN','RS485+','RS485-','+12V','GND'];
  if(t.includes('card'))return ['D0','D1','LED','BEEP','+12V','GND'];
  if(t.includes('roller'))return ['OPEN','CLOSE','STOP','SAFETY','COM','+24V','GND'];
  return ['IN','OUT','COM','V+','GND'];
}
export function addModule(key,floor='1F'){
  const tpl=templateByKey(key);if(!tpl)return null;
  const id=nextDeviceId();
  const same=devices.filter(d=>d.name.startsWith(tpl.name)).length+1;
  devices.push({id,name:`${tpl.name}${String(same).padStart(2,'0')}`,type:tpl.type,floor,state:tpl.state||'READY'});
  const count=devices.length-1;
  state.deviceTransforms[id]={x:-3+(count%5)*1.8,y:0,z:-8+Math.floor(count/5)*2.2,rotationY:0,floor};
  state.deviceSettings[id]=defaultSettings(tpl.type);
  state.selectedDevice=id;
  return id;
}
export function removeModule(id){
  const idx=devices.findIndex(d=>d.id===id);if(idx<0)return false;
  devices.splice(idx,1);delete state.deviceTransforms[id];delete state.deviceSettings[id];
  state.connections=state.connections.filter(c=>c.fromDevice!==id&&c.toDevice!==id);
  if(state.selectedDevice===id)state.selectedDevice=devices[0]?.id||null;
  return true;
}
export function getSettings(id){
  const dev=devices.find(d=>d.id===id);if(!dev)return {};
  return state.deviceSettings[id]||(state.deviceSettings[id]=defaultSettings(dev.type));
}
export function updateSettings(id,patch){Object.assign(getSettings(id),patch);return getSettings(id);}
export function filterCatalog(search='',group='全部'){
  const q=String(search).trim().toLowerCase();
  return moduleCatalog.map(g=>({...g,items:g.items.filter(i=>(group==='全部'||group===g.group)&&(!q||`${i.name} ${i.type}`.toLowerCase().includes(q)))})).filter(g=>g.items.length);
}
