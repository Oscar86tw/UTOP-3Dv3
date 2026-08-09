import {state} from '../state.js';
import {devices} from '../data.js';
import {terminalsFor} from '../core-module-01/module-manager.js';

function nextConnectionId(){const max=Math.max(0,...state.connections.map(c=>Number((c.id||'').split('-')[1])||0));return `CON-${String(max+1).padStart(3,'0')}`;}
export function deviceTerminals(id){const d=devices.find(x=>x.id===id);return d?terminalsFor(d.type):[];}
export function terminalRole(terminal=''){
  const t=String(terminal).toUpperCase();
  if(/^(DI\d+|OPEN|CLOSE|STOP|SAFETY|ALARM IN|D0|D1|RED|GREEN)$/.test(t))return 'IN';
  if(/^(DO\d+|OUT|NO|NC|TRIGGER|DATA|ALARM OUT|LED|BEEP)$/.test(t))return 'OUT';
  if(t.includes('LAN')||t.includes('RS485'))return 'COMM';
  if(t.includes('GND')||t.includes('12V')||t.includes('24V')||t.includes('POE')||t==='COM'||t==='COIL+'||t==='COIL-')return 'POWER';
  return 'OTHER';
}
export function connectableTerminals(id,role='ALL'){
  const terms=deviceTerminals(id);
  return role==='ALL'?terms:terms.filter(t=>terminalRole(t)===role);
}
export function resetWiringBuilder(msg='請先點選一個模組的來源端子，再點另一個模組的目標端子。'){
  state.wiringBuilder={fromDevice:'',fromTerminal:'',toDevice:'',toTerminal:'',step:'from',message:msg};
  return state.wiringBuilder;
}
export function selectTerminalForBuilder(deviceId,terminal){
  if(!deviceId||!terminal)return {ok:false,message:'請選擇端子。'};
  const role=terminalRole(terminal);
  if(state.wiringBuilder.step==='from'){
    state.wiringBuilder.fromDevice=deviceId;
    state.wiringBuilder.fromTerminal=terminal;
    state.wiringBuilder.toDevice='';
    state.wiringBuilder.toTerminal='';
    state.wiringBuilder.step='to';
    state.wiringBuilder.message=`已選來源：${deviceName(deviceId)}.${terminal}，請再點另一個模組的目標端子。`;
    return {ok:true,step:'to',message:state.wiringBuilder.message,role};
  }
  if(deviceId===state.wiringBuilder.fromDevice){
    state.wiringBuilder.message='來源與目標需為不同模組，請改點另一個模組。';
    return {ok:false,message:state.wiringBuilder.message};
  }
  state.wiringBuilder.toDevice=deviceId;
  state.wiringBuilder.toTerminal=terminal;
  const type=inferSignalType(state.wiringBuilder.fromTerminal,terminal);
  const result=addConnection(state.wiringBuilder.fromDevice,state.wiringBuilder.fromTerminal,deviceId,terminal,type);
  if(result.ok){
    const msg=`✅ 已建立 ${result.connection.id} · ${connectionLabel(result.connection)}`;
    resetWiringBuilder(msg);
    return {ok:true,created:true,connection:result.connection,message:msg};
  }
  state.wiringBuilder.message=`⚠️ ${result.message}`;
  return {ok:false,message:state.wiringBuilder.message};
}
export function addConnection(fromDevice,fromTerminal,toDevice,toTerminal,type='SIGNAL'){
  if(!fromDevice||!toDevice||fromDevice===toDevice)return {ok:false,message:'來源與目標設備不可相同。'};
  const duplicate=state.connections.find(c=>c.fromDevice===fromDevice&&c.fromTerminal===fromTerminal&&c.toDevice===toDevice&&c.toTerminal===toTerminal);
  if(duplicate)return {ok:false,message:'這條連線已存在。'};
  const c={id:nextConnectionId(),fromDevice,fromTerminal,toDevice,toTerminal,type,enabled:true};state.connections.push(c);return {ok:true,connection:c};
}
export function deleteConnection(id){state.connections=state.connections.filter(c=>c.id!==id);}
function deviceName(id){return devices.find(d=>d.id===id)?.name||id;}
export function connectionLabel(c){
  const a=deviceName(c.fromDevice);
  const b=deviceName(c.toDevice);
  return `${a}.${c.fromTerminal} → ${b}.${c.toTerminal}`;
}
export function inferSignalType(fromTerminal,toTerminal){
  const s=`${fromTerminal} ${toTerminal}`.toUpperCase();
  if(s.includes('LAN'))return 'NETWORK';
  if(s.includes('RS485'))return 'RS485';
  if(s.includes('GND')||s.includes('12V')||s.includes('24V')||s.includes('POE')||s.includes('COIL')||s.includes('COM'))return 'POWER';
  if(s.includes('DI'))return 'DI';
  if(s.includes('DO')||s.includes('OPEN')||s.includes('CLOSE')||s.includes('STOP')||s.includes('OUT')||s.includes('NO')||s.includes('NC'))return 'DO';
  return 'SIGNAL';
}
