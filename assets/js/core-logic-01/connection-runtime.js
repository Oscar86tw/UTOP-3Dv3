import {state} from '../state.js';
import {devices} from '../data.js';
import {updateRuntime} from '../core-module-01/module-manager.js';

const uniq=a=>[...new Set(a.filter(Boolean).map(x=>String(x).toUpperCase()))];
const upper=v=>String(v||'').toUpperCase();
const lower=v=>String(v||'').toLowerCase();

export function activeOutputTerminals(deviceType='',action=''){
  const t=lower(deviceType),a=lower(action);
  if(t==='loop'&&a==='vehicle')return ['OUT','NO','PRESENCE'];
  if(t==='loop'&&a==='clear')return ['NC','CLEAR'];
  if(t==='loopdetector'&&['presence','pulse'].includes(a))return ['OUT','NO',a==='pulse'?'PULSE':'PRESENCE'];
  if(t==='loopdetector'&&['clear','reset'].includes(a))return ['NC','CLEAR'];
  if(t==='infrared'&&a==='blocked')return ['OUT','NO','BLOCKED'];
  if(t==='infrared'&&a==='clear')return ['NC','CLEAR'];
  if(t==='radar'&&a==='vehicle')return ['OUT1','VEHICLE','OUT'];
  if(t==='radar'&&a==='clear')return ['CLEAR'];
  if(t==='uhf'&&a==='read')return ['DATA','TAG_OK','OUT'];
  if(t==='uhf'&&['invalid','reject','fail'].includes(a))return ['TAG_FAIL'];
  if(t==='cardreader'&&a==='valid')return ['D0','VALID','OUT'];
  if(t==='lpr'&&a==='valid')return ['ALARM OUT','PLATE_OK','OUT'];
  if(t==='lpr'&&['invalid','reject','fail'].includes(a))return ['PLATE_FAIL'];
  if(t==='relay'&&a==='on')return ['NO','OUT'];
  if(t==='relay'&&a==='off')return ['NC'];
  if(t==='accesscontroller'&&['di1','on','unlock'].includes(a))return ['DO1','LOCK'];
  if(t==='accesscontroller'&&a==='di2')return ['DO2','ALARM'];
  if(t==='accesscontroller'&&a==='di3')return ['DO3'];
  if(t==='timer'&&a==='done')return ['DO1','DONE'];
  if(['delaytimer','powerondelay'].includes(t)&&a==='done')return ['OUT','NO','DONE'];
  if(t==='poweroffdelay'&&a==='off')return ['NO','OUT'];
  if(t==='powersupply'&&a==='on')return ['V+','DC_OK'];
  if(t==='poeswitch'&&a==='on')return ['LAN1','LAN2','LAN3','LAN4','LAN5','LAN6','LAN7','LAN8','UPLINK'];
  if(t==='parkingdisplay'&&a==='full')return ['FULL'];
  if(t==='ledpanel'&&a==='done')return ['DONE','OUT'];
  if(t==='signal2way'&&a==='lanea')return ['A-GREEN','B-RED'];
  if(t==='signal2way'&&a==='laneb')return ['A-RED','B-GREEN'];
  if(t==='signal2way'&&a==='allstop')return ['A-RED','B-RED'];
  if(t==='signal3way'&&a==='lanea')return ['A-GREEN','B-RED','C-RED'];
  if(t==='signal3way'&&a==='laneb')return ['A-RED','B-GREEN','C-RED'];
  if(t==='signal3way'&&a==='lanec')return ['A-RED','B-RED','C-GREEN'];
  if(t==='signal3way'&&a==='allstop')return ['A-RED','B-RED','C-RED'];
  if(t==='heightbar'&&a==='overheight')return ['ALARM','OVERHEIGHT'];
  if(a==='open')return ['OPEN','DO1','OUT'];
  if(a==='close')return ['CLOSE','DO2'];
  if(a==='stop')return ['STOP'];
  if(a==='safety')return ['SAFETY'];
  if(a==='red')return ['RED'];
  if(a==='green')return ['GREEN'];
  if(a==='on')return ['ON','OUT','NO','DO1'];
  if(a==='off')return ['OFF','NC'];
  return [upper(action)];
}

export function actionForTargetTerminal(targetType='',terminal=''){
  const t=lower(targetType),term=upper(terminal);
  if(t==='timer'){
    if(term==='DI1'||term==='START')return 'start';
    if(term==='DI2'||term==='PAUSE')return 'pause';
    if(term==='DI3'||term==='RESET')return 'reset';
  }
  if(['delaytimer','powerondelay','poweroffdelay'].includes(t)){
    if(['START','DI1','POWER'].includes(term))return t==='poweroffdelay'?'on':'start';
    if(['STOP','DI2','OFF'].includes(term))return 'stop';
    if(['RESET','DI3'].includes(term))return 'reset';
  }
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

export function connectionsTriggeredBy(deviceId,action,connections=state.connections||[]){
  const dev=devices.find(d=>d.id===deviceId);if(!dev)return [];
  const active=uniq(activeOutputTerminals(dev.type,action));
  return connections.filter(c=>c.enabled!==false&&c.fromDevice===deviceId&&active.includes(upper(c.fromTerminal)));
}

export function buildActionChain(startDeviceId,startAction,{connections=state.connections||[],maxSteps=64}={}){
  const queue=[{deviceId:startDeviceId,action:lower(startAction),via:null,depth:0}],steps=[],seen=new Set();
  while(queue.length&&steps.length<maxSteps){
    const cur=queue.shift(),key=`${cur.deviceId}:${cur.action}`;if(seen.has(key))continue;seen.add(key);
    const dev=devices.find(d=>d.id===cur.deviceId);if(!dev)continue;
    steps.push({...cur,type:dev.type,name:dev.name});
    for(const conn of connectionsTriggeredBy(cur.deviceId,cur.action,connections)){
      const target=devices.find(d=>d.id===conn.toDevice);if(!target)continue;
      queue.push({deviceId:target.id,action:actionForTargetTerminal(target.type,conn.toTerminal),via:conn.id,depth:cur.depth+1});
    }
  }
  return steps;
}

export function verifyConnectionActionChains(){
  const checks=[];
  const add=(name,ok,detail)=>checks.push({name,ok:!!ok,detail});
  const entry=buildActionChain('DEV-003','vehicle');
  add('入口進車鏈',entry.some(s=>s.deviceId==='DEV-001'&&s.action==='open')&&entry.some(s=>s.deviceId==='DEV-007'&&s.action==='green')&&entry.some(s=>s.deviceId==='DEV-008'&&s.action==='start'),entry.map(s=>`${s.deviceId}:${s.action}`).join(' → '));
  const entryClear=buildActionChain('DEV-003','clear');
  add('入口離車鏈',entryClear.some(s=>s.deviceId==='DEV-001'&&s.action==='close')&&entryClear.some(s=>s.deviceId==='DEV-007'&&s.action==='red')&&entryClear.some(s=>s.deviceId==='DEV-008'&&s.action==='reset'),entryClear.map(s=>`${s.deviceId}:${s.action}`).join(' → '));
  const exit=buildActionChain('DEV-009','vehicle');
  add('出口進車鏈',exit.some(s=>s.deviceId==='DEV-006'&&s.action==='open')&&exit.some(s=>s.deviceId==='DEV-011'&&s.action==='green')&&exit.some(s=>s.deviceId==='DEV-012'&&s.action==='start'),exit.map(s=>`${s.deviceId}:${s.action}`).join(' → '));
  const exitClear=buildActionChain('DEV-009','clear');
  add('出口離車鏈',exitClear.some(s=>s.deviceId==='DEV-006'&&s.action==='close')&&exitClear.some(s=>s.deviceId==='DEV-011'&&s.action==='red')&&exitClear.some(s=>s.deviceId==='DEV-012'&&s.action==='reset'),exitClear.map(s=>`${s.deviceId}:${s.action}`).join(' → '));
  return checks;
}

export function noteSignal(connection,context={}){
  const from=devices.find(d=>d.id===connection.fromDevice),to=devices.find(d=>d.id===connection.toDevice);
  const vehicleIds=[...new Set((context.vehicleIds||context.sourceVehicleIds||[]).filter(Boolean).map(String))];
  const vehicleSuffix=vehicleIds.length?` · ${vehicleIds.join(', ')}`:'';
  const msg=`${from?.name||connection.fromDevice}.${connection.fromTerminal} → ${to?.name||connection.toDevice}.${connection.toTerminal}${vehicleSuffix}`;
  state.eventLog=state.eventLog||[];
  state.eventLog.push(`${new Date().toLocaleTimeString('zh-TW',{hour12:false})} ${msg}`);
  if(state.eventLog.length>80)state.eventLog.splice(0,state.eventLog.length-80);
  state.activeSignals=state.activeSignals||{};const until=Date.now()+900;state.activeSignals[connection.id]=until;
  state.activePorts=state.activePorts||{};state.activePorts[`${connection.fromDevice}|DO|${connection.fromTerminal}`]=until;state.activePorts[`${connection.toDevice}|DI|${connection.toTerminal}`]=until;
  updateRuntime(connection.toDevice,{lastSignal:msg,lastInput:connection.toTerminal,lastVehicleIds:vehicleIds,sourceVehicleIds:vehicleIds});
  return msg;
}
