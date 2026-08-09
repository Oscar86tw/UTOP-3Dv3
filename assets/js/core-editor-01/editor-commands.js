import {state} from '../state.js';

export function getDeviceTransform(id){
  return state.deviceTransforms[id] || (state.deviceTransforms[id]={x:0,y:0,z:0,rotationY:0,floor:'1F'});
}

export function updateDeviceTransform(id,patch={}){
  const t=getDeviceTransform(id);
  Object.assign(t,patch);
  state.selectedDevice=id;
  return t;
}

export function selectDevice(id){
  state.selectedDevice=id||null;
  return state.selectedDevice;
}

export function getFloor(id){
  return state.floors.find(f=>f.id===id)||state.floors[0];
}

export function floorElevation(id){
  return Number(getFloor(id)?.elevation||0);
}

export function setFloorFocus(id){
  state.editor.floorFocus=id;
}

export function setEditorMode(mode){
  state.editor.mode=mode;
}
