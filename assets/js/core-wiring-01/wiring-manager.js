import {state} from '../state.js';
import {devices} from '../data.js';
import {terminalsFor} from '../core-module-01/module-manager.js';

function nextConnectionId(){const max=Math.max(0,...state.connections.map(c=>Number((c.id||'').split('-')[1])||0));return `CON-${String(max+1).padStart(3,'0')}`;}
export function deviceTerminals(id){const d=devices.find(x=>x.id===id);return d?terminalsFor(d.type):[];}
export function addConnection(fromDevice,fromTerminal,toDevice,toTerminal,type='SIGNAL'){
  if(!fromDevice||!toDevice||fromDevice===toDevice)return {ok:false,message:'來源與目標設備不可相同。'};
  const duplicate=state.connections.find(c=>c.fromDevice===fromDevice&&c.fromTerminal===fromTerminal&&c.toDevice===toDevice&&c.toTerminal===toTerminal);
  if(duplicate)return {ok:false,message:'這條連線已存在。'};
  const c={id:nextConnectionId(),fromDevice,fromTerminal,toDevice,toTerminal,type,enabled:true};state.connections.push(c);return {ok:true,connection:c};
}
export function deleteConnection(id){state.connections=state.connections.filter(c=>c.id!==id);}
export function connectionLabel(c){
  const a=devices.find(d=>d.id===c.fromDevice)?.name||c.fromDevice;
  const b=devices.find(d=>d.id===c.toDevice)?.name||c.toDevice;
  return `${a}.${c.fromTerminal} → ${b}.${c.toTerminal}`;
}
export function inferSignalType(fromTerminal,toTerminal){
  const s=`${fromTerminal} ${toTerminal}`.toUpperCase();
  if(s.includes('LAN'))return 'NETWORK';
  if(s.includes('RS485'))return 'RS485';
  if(s.includes('GND')||s.includes('12V')||s.includes('24V')||s.includes('POE'))return 'POWER';
  if(s.includes('DI'))return 'DI';
  if(s.includes('DO')||s.includes('OPEN')||s.includes('CLOSE')||s.includes('STOP'))return 'DO';
  return 'SIGNAL';
}
