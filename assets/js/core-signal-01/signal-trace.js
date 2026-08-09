import {state} from '../state.js';
import {devices} from '../data.js';

function enabledConnections(){return state.connections.filter(c=>c.enabled!==false);}
function deviceName(id){return devices.find(d=>d.id===id)?.name||id;}
function unique(arr){return [...new Set(arr)];}

export function getDirectUpstream(id){return unique(enabledConnections().filter(c=>c.toDevice===id).map(c=>c.fromDevice));}
export function getDirectDownstream(id){return unique(enabledConnections().filter(c=>c.fromDevice===id).map(c=>c.toDevice));}

function walk(start,dir){
  const seen=new Set([start]), queue=[start], links=[];
  while(queue.length){
    const id=queue.shift();
    const cs=enabledConnections().filter(c=>dir==='up'?c.toDevice===id:c.fromDevice===id);
    for(const c of cs){
      links.push(c);
      const next=dir==='up'?c.fromDevice:c.toDevice;
      if(!seen.has(next)){seen.add(next);queue.push(next);}
    }
  }
  return {devices:[...seen],connections:unique(links.map(c=>c.id))};
}

export function traceNetwork(id,mode='full'){
  if(!id)return {devices:[],connections:[]};
  const up=walk(id,'up'),down=walk(id,'down');
  if(mode==='upstream')return up;
  if(mode==='downstream')return down;
  return {devices:unique([...up.devices,...down.devices]),connections:unique([...up.connections,...down.connections])};
}

export function connectionSummary(c){return `${deviceName(c.fromDevice)}.${c.fromTerminal} → ${deviceName(c.toDevice)}.${c.toTerminal}`;}

export function buildDependencyGraph(){
  const cs=enabledConnections();
  const incoming=new Map(devices.map(d=>[d.id,0]));
  cs.forEach(c=>incoming.set(c.toDevice,(incoming.get(c.toDevice)||0)+1));
  const roots=devices.filter(d=>(incoming.get(d.id)||0)===0);
  const nodes=devices.map(d=>({
    id:d.id,name:d.name,type:d.type,
    incoming:cs.filter(c=>c.toDevice===d.id).length,
    outgoing:cs.filter(c=>c.fromDevice===d.id).length,
    status: cs.some(c=>c.fromDevice===d.id||c.toDevice===d.id)?'connected':'unconnected'
  }));
  return {roots,nodes,connections:cs};
}

export function buildSkillTree(){
  const graph=buildDependencyGraph();
  const depth=new Map();
  const queue=graph.roots.map(r=>[r.id,0]);
  while(queue.length){
    const [id,d]=queue.shift();
    if(depth.has(id)&&depth.get(id)<=d)continue;
    depth.set(id,d);
    graph.connections.filter(c=>c.fromDevice===id).forEach(c=>queue.push([c.toDevice,d+1]));
  }
  return graph.nodes.map(n=>({...n,depth:depth.get(n.id)??0,unlocked:n.incoming===0||graph.connections.some(c=>c.toDevice===n.id)})).sort((a,b)=>a.depth-b.depth||a.name.localeCompare(b.name,'zh-Hant'));
}

export function setTraceFocus(deviceId,mode='full'){
  state.signalTrace=state.signalTrace||{};
  state.signalTrace.focusDevice=deviceId;
  state.signalTrace.mode=mode;
  state.signalTrace.enabled=true;
  return traceNetwork(deviceId,mode);
}
export function clearTraceFocus(){state.signalTrace=state.signalTrace||{};state.signalTrace.enabled=false;state.signalTrace.focusDevice=null;}
