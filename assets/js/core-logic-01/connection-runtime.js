import {state} from '../state.js';
import {devices} from '../data.js';
import {updateRuntime} from '../core-module-01/module-manager.js';

const uniq=a=>[...new Set(a.filter(Boolean).map(x=>String(x).toUpperCase()))];

export function activeOutputTerminals(deviceType='',action=''){
  const t=String(deviceType).toLowerCase(),a=String(action).toLowerCase();
  if(t==='loop'&&a==='vehicle')return ['OUT','NO','PRESENCE'];
  if(t==='loopdetector'&&['presence','pulse'].includes(a))return ['OUT','NO',a==='pulse'?'PULSE':'PRESENCE'];
  if(t==='infrared'&&a==='blocked')return ['OUT','NO','BLOCKED'];
  if(t==='uhf'&&a==='read')return ['DATA','TAG_OK','OUT'];
  if(t==='cardreader'&&a==='valid')return ['D0','VALID','OUT'];
  if(t==='lpr'&&a==='valid')return ['ALARM OUT','PLATE_OK','OUT'];
  if(t==='relay'&&a==='on')return ['NO','OUT'];
  if(t==='relay'&&a==='off')return ['NC'];
  if(t==='accesscontroller'&&['di1','on','unlock'].includes(a))return ['DO1','LOCK'];
  if(t==='accesscontroller'&&a==='di2')return ['DO2','ALARM'];
  if(t==='timer'&&['start','done'].includes(a))return ['DO1'];
  if(['delaytimer','powerondelay'].includes(t)&&['start','on','done'].includes(a))return ['OUT','NO'];
  if(t==='poweroffdelay'&&a==='off')return ['NO','OUT'];
  if(t==='powersupply'&&a==='on')return ['V+','DC_OK'];
  if(t==='poeswitch'&&a==='on')return ['LAN1','LAN2','LAN3','LAN4','LAN5','LAN6','LAN7','LAN8','UPLINK'];
  if(t==='parkingdisplay'&&a==='full')return ['FULL'];
  if(t==='heightbar'&&a==='overheight')return ['ALARM','OVERHEIGHT'];
  if(a==='open')return ['OPEN','DO1','OUT'];
  if(a==='close')return ['CLOSE','DO2'];
  if(a==='stop')return ['STOP'];
  if(a==='safety')return ['SAFETY'];
  if(a==='red')return ['RED'];
  if(a==='green')return ['GREEN'];
  if(a==='on')return ['ON','OUT','NO','DO1'];
  if(a==='off')return ['OFF','NC'];
  return [String(action).toUpperCase()];
}

export function actionForTargetTerminal(targetType='',terminal=''){
  const t=String(targetType).toLowerCase(),term=String(terminal).toUpperCase();
  if(term==='OPEN')return 'open';
  if(term==='CLOSE')return 'close';
  if(term==='STOP')return 'stop';
  if(term==='SAFETY')return 'safety';
  if(term==='RED')return 'red';
  if(term==='GREEN')return 'green';
  if(term==='START')return 'start';
  if(term==='RESET')return 'reset';
  if(term==='TRIGGER')return t==='uhf'?'read':'on';
  if(/^DI\d+$/.test(term))return term.toLowerCase();
  if(term==='D0'||term==='D1'||term==='CARD')return 'valid';
  if(term==='COIL+'||term==='POWER'||term==='ON')return 'on';
  if(term==='OFF')return 'off';
  if(term==='ALARM IN')return 'alarm';
  if(term==='IN')return 'on';
  return term.toLowerCase();
}

export function connectionsTriggeredBy(deviceId,action){
  const dev=devices.find(d=>d.id===deviceId);if(!dev)return [];
  const active=uniq(activeOutputTerminals(dev.type,action));
  return (state.connections||[]).filter(c=>c.enabled!==false&&c.fromDevice===deviceId&&active.includes(String(c.fromTerminal).toUpperCase()));
}

export function noteSignal(connection){
  const from=devices.find(d=>d.id===connection.fromDevice),to=devices.find(d=>d.id===connection.toDevice);
  const msg=`${from?.name||connection.fromDevice}.${connection.fromTerminal} → ${to?.name||connection.toDevice}.${connection.toTerminal}`;
  state.eventLog=state.eventLog||[];
  state.eventLog.push(`${new Date().toLocaleTimeString('zh-TW',{hour12:false})} ${msg}`);
  if(state.eventLog.length>80)state.eventLog.splice(0,state.eventLog.length-80);
  updateRuntime(connection.toDevice,{lastSignal:msg,lastInput:connection.toTerminal});
  return msg;
}
