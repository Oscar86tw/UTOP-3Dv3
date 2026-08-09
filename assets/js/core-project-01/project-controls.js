import {state} from '../state.js';

export function getSceneProfile(){
  const {time,weather,event}=state.scene;
  const profile={sky:0xbdd7e5,fog:0xbdd7e5,ambient:1.8,sun:2.6,road:0x42464a,warning:false};
  if(time==='黃昏'){profile.sky=0xd7a978;profile.fog=0xc99b78;profile.ambient=1.35;profile.sun=1.8;}
  if(time==='夜間'||time==='凌晨'){profile.sky=0x101b2a;profile.fog=0x132033;profile.ambient=.72;profile.sun=.5;}
  if(weather==='小雨'){profile.fog=0x91a7b3;profile.sun*=.72;profile.ambient*=.88;}
  if(weather==='大雨'){profile.fog=0x718895;profile.sun*=.48;profile.ambient*=.72;profile.road=0x30353a;}
  if(weather==='霧'){profile.fog=0xb9c3c7;profile.sun*=.42;profile.ambient*=.9;}
  if(['ETAG故障','地感異常','柵欄機故障','停電'].includes(event)) profile.warning=true;
  if(event==='停電'){profile.sun=.08;profile.ambient=.25;profile.sky=0x080d14;profile.fog=0x0b1118;}
  return profile;
}

export function floorVisible(floor){return state.floors.find(f=>f.id===floor)?.visible!==false;}
export function groupVisible(group){return state.groups.find(g=>g.id===group)?.visible!==false;}
export function groupOpacity(group){return state.groups.find(g=>g.id===group)?.opacity ?? 1;}

export function addViewpoint(view){state.simulator.viewpoints.push(view);syncViewNames();}
export function renameViewpoint(index,name){if(state.simulator.viewpoints[index])state.simulator.viewpoints[index].name=name;syncViewNames();}
export function deleteViewpoint(index){if(state.simulator.viewpoints.length<=1)return false;state.simulator.viewpoints.splice(index,1);state.simulator.cameraPreset=Math.min(state.simulator.cameraPreset,state.simulator.viewpoints.length-1);syncViewNames();return true;}
export function syncViewNames(){state.viewpoints=state.simulator.viewpoints.map(v=>v.name);}

export function toggleFloor(id){const f=state.floors.find(x=>x.id===id);if(f)f.visible=!f.visible;return f;}
export function toggleGroup(id){const g=state.groups.find(x=>x.id===id);if(g)g.visible=!g.visible;return g;}
export function setGroupOpacity(id,value){const g=state.groups.find(x=>x.id===id);if(g)g.opacity=Math.max(0,Math.min(1,Number(value)));return g;}

export function updateDisplay(index,patch){Object.assign(state.displays[index]||{},patch);}
export function hotkeyConflict(key,index=-1){return state.hotkeys.find((h,i)=>i!==index&&h.key===key);}
export function isReservedHotkey(key){return ['F5','F11','F12','Ctrl + R','Ctrl + W','Ctrl + P','Ctrl + F','Alt + ArrowLeft','Alt + ArrowRight'].includes(key);}
