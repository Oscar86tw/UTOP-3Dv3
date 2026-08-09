import {defaultSettings} from '../core-module-01/module-manager.js';

function isPlainObject(v){return !!v&&typeof v==='object'&&!Array.isArray(v)&&!(v instanceof Date);}
export function deepMergeDefaults(target,defaults){
  if(!isPlainObject(target)||!isPlainObject(defaults))return target;
  for(const [k,dv] of Object.entries(defaults)){
    const tv=target[k];
    if(tv===undefined||tv===null){target[k]=cloneValue(dv);continue;}
    if(isPlainObject(tv)&&isPlainObject(dv))deepMergeDefaults(tv,dv);
  }
  return target;
}
function cloneValue(v){
  if(typeof structuredClone==='function')return structuredClone(v);
  return JSON.parse(JSON.stringify(v));
}
function finite(v,fallback=0){const n=Number(v);return Number.isFinite(n)?n:fallback;}
function ensureArray(v,fallback=[]){return Array.isArray(v)?v:cloneValue(fallback);}

export function migrateProjectState(state,devices,defaultState,defaultDevices){
  deepMergeDefaults(state,defaultState);
  if(!Array.isArray(devices)||!devices.length){devices.splice?.(0,devices.length,...cloneValue(defaultDevices));}
  const defaultById=new Map((defaultDevices||[]).map(d=>[d.id,d]));
  for(const d of devices){
    if(!d||!d.id)continue;
    const fallback=defaultById.get(d.id)||{};
    d.name=String(d.name||fallback.name||d.id);
    d.type=String(d.type||fallback.type||'relay');
    d.floor=String(d.floor||fallback.floor||'1F');
    d.state=String(d.state||fallback.state||'READY');
    state.deviceTransforms??={};
    const t=state.deviceTransforms[d.id]||(state.deviceTransforms[d.id]={});
    t.x=finite(t.x,0);t.y=finite(t.y,0);t.z=finite(t.z,0);
    t.rotationX=finite(t.rotationX,0);t.rotationY=finite(t.rotationY,0);t.rotationZ=finite(t.rotationZ,0);
    t.floor=String(t.floor||d.floor||'1F');
    state.deviceSettings??={};
    const def=defaultSettings(d.type);const s=state.deviceSettings[d.id]||(state.deviceSettings[d.id]={});deepMergeDefaults(s,def);
    state.deviceRuntime??={};deepMergeDefaults(state.deviceRuntime[d.id]||(state.deviceRuntime[d.id]={}),{status:d.state||'READY',lastAction:'',active:false});
    state.deviceHotkeys??={};if(!isPlainObject(state.deviceHotkeys[d.id]))state.deviceHotkeys[d.id]={};
  }
  const validIds=new Set(devices.map(d=>d.id));
  for(const mapName of ['deviceTransforms','deviceSettings','deviceRuntime','deviceHotkeys']){
    const map=state[mapName]||{};for(const id of Object.keys(map))if(!validIds.has(id))delete map[id];
  }
  state.connections=ensureArray(state.connections,defaultState.connections).filter(c=>c&&validIds.has(c.fromDevice)&&validIds.has(c.toDevice));
  const existingConnectionIds=new Set(state.connections.map(c=>c.id));
  for(const c of (defaultState.connections||[])){
    if(c?.id&&!existingConnectionIds.has(c.id)&&validIds.has(c.fromDevice)&&validIds.has(c.toDevice)){
      state.connections.push(cloneValue(c));existingConnectionIds.add(c.id);
    }
  }
  state.activeSignals=isPlainObject(state.activeSignals)?state.activeSignals:{};
  state.roadMarkings=ensureArray(state.roadMarkings,defaultState.roadMarkings);
  state.floors=ensureArray(state.floors,defaultState.floors);state.groups=ensureArray(state.groups,defaultState.groups);
  state.displays=ensureArray(state.displays,defaultState.displays);state.tests=ensureArray(state.tests,defaultState.tests);
  state.photos=ensureArray(state.photos,defaultState.photos);state.scripts=ensureArray(state.scripts,defaultState.scripts);
  state.simulator.viewpoints=ensureArray(state.simulator?.viewpoints,defaultState.simulator.viewpoints);
  if(!validIds.has(state.selectedDevice))state.selectedDevice=devices[0]?.id||null;
  if(!validIds.has(state.hotkeyEditor?.deviceId))state.hotkeyEditor.deviceId=state.selectedDevice||'';
  if(!state.floors.some(f=>f.id===state.editor.floorFocus))state.editor.floorFocus=state.floors[0]?.id||'1F';
  if(['select','move','rotate'].includes(state.editor?.mode)||!state.editor?.mode)state.editor.mode='unified';
  const routes=new Set(['overview','simulator','sync2d','scene','layers','hotkeys','display','mission','engineering','network','diagrams','field','project']);
  if(!routes.has(state.route))state.route='overview';
  state.runtimeHealth={...(state.runtimeHealth||{}),webglReady:false,simulatorReady:false,lastError:'',lastValidatedAt:''};
  return state;
}

export function cloneDefaults(state,devices){return {state:cloneValue(state),devices:cloneValue(devices)};}
