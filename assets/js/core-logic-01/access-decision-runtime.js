import {state} from '../state.js';
import {devices} from '../data.js';
import {addModule} from '../core-module-01/module-manager.js';
import {addConnection} from '../core-wiring-01/wiring-manager.js';

const byType=type=>devices.find(d=>String(d.type||'').toLowerCase()===String(type).toLowerCase())||null;
const connectionExists=(a,at,b,bt)=>(state.connections||[]).some(c=>c.enabled!==false&&c.fromDevice===a&&String(c.fromTerminal).toUpperCase()===String(at).toUpperCase()&&c.toDevice===b&&String(c.toTerminal).toUpperCase()===String(bt).toUpperCase());
const deviceLabel=d=>d?`${d.name} (${d.id})`:'未建立';

function getOrCreate(type,key,floor='1F'){
  let d=byType(type);let created=false;
  if(!d){const id=addModule(key,floor);d=devices.find(x=>x.id===id)||null;created=!!d;}
  return {device:d,created};
}
function expectedPlan(parts){
  const rows=[];const add=(kind,from,fromTerminal,to,toTerminal,label)=>{if(from&&to)rows.push({kind,fromDevice:from.id,fromTerminal,toDevice:to.id,toTerminal,label});};
  add('ALLOW',parts.uhf,'TAG_OK',parts.controller,'DI1','UHF 授權成功 → Controller DI1');
  add('ALLOW',parts.lpr,'PLATE_OK',parts.controller,'DI1','LPR 授權成功 → Controller DI1');
  add('DENY',parts.uhf,'TAG_FAIL',parts.controller,'DI2','UHF 拒絕 → Controller DI2');
  add('DENY',parts.lpr,'PLATE_FAIL',parts.controller,'DI2','LPR 拒絕 → Controller DI2');
  add('ALLOW',parts.controller,'DO1',parts.relay,'ON','Controller DO1 → Relay 吸合');
  add('ALLOW',parts.relay,'NO',parts.barrier,'OPEN','Relay NO → 柵欄 OPEN');
  add('DENY',parts.controller,'DO2',parts.beacon,'FLASH','Controller DO2 → 警示燈 FLASH');
  if(parts.traffic)add('DENY',parts.controller,'DO2',parts.traffic,'RED','Controller DO2 → 車道紅燈');
  return rows;
}
export function inspectAccessDecisionChain(){
  const parts={uhf:byType('uhf'),lpr:byType('lpr'),controller:byType('accesscontroller'),relay:byType('relay'),barrier:byType('barrier'),beacon:byType('beacon'),traffic:byType('traffic')};
  const required=['uhf','lpr','controller','relay','barrier','beacon'];
  const missing=required.filter(k=>!parts[k]);
  const expected=expectedPlan(parts).map(x=>({...x,present:connectionExists(x.fromDevice,x.fromTerminal,x.toDevice,x.toTerminal)}));
  const configured=expected.some(x=>x.present);
  const complete=missing.length===0&&expected.filter(x=>x.kind==='ALLOW'||x.kind==='DENY').every(x=>x.present);
  const allow=expected.filter(x=>x.kind==='ALLOW');const deny=expected.filter(x=>x.kind==='DENY');
  return {parts,missing,expected,configured,complete,allowComplete:allow.length>0&&allow.every(x=>x.present),denyComplete:deny.length>0&&deny.every(x=>x.present),mode:'OR',summary:missing.length?`缺少模組：${missing.join(' / ')}`:complete?'✅ 標準通行決策鏈完整':`已接 ${expected.filter(x=>x.present).length}/${expected.length} 條標準通行線`};
}
export function buildStandardAccessDecisionChain(){
  const made=[];
  const defs=[['uhf','uhf'],['lpr','lpr'],['accesscontroller','accesscontroller'],['relay','relay'],['barrier','barrier'],['beacon','beacon']];
  const parts={};
  for(const [type,key] of defs){const r=getOrCreate(type,key);parts[type==='accesscontroller'?'controller':type]=r.device;if(r.created)made.push(deviceLabel(r.device));}
  parts.traffic=byType('traffic');
  const added=[];const skipped=[];
  for(const row of expectedPlan(parts)){
    if(connectionExists(row.fromDevice,row.fromTerminal,row.toDevice,row.toTerminal)){skipped.push(row.label);continue;}
    const r=addConnection(row.fromDevice,row.fromTerminal,row.toDevice,row.toTerminal,row.kind==='ALLOW'?'DO':'SIGNAL');
    if(r.ok)added.push(row.label);
  }
  state.accessDecision??={};state.accessDecision.mode='OR';state.accessDecision.lastBuiltAt=new Date().toISOString();
  const audit=inspectAccessDecisionChain();state.accessDecision.lastMessage=`${audit.complete?'✅':'⚠'} 通行鏈 ${audit.expected.filter(x=>x.present).length}/${audit.expected.length} · 新增模組 ${made.length} · 新增接線 ${added.length}`;
  return {...audit,createdDevices:made,addedConnections:added,skippedConnections:skipped};
}
export function accessDecisionRuntimeText(context={}){
  const access=String(context.access||'').toUpperCase();const rows=Array.isArray(context.accessDecisions)?context.accessDecisions:[];
  if(!access&&!rows.length)return '';
  const profiles=rows.map(r=>`${r.vehicleId||'?'}${r.plate?' '+r.plate:''} ${r.allowed===false?'DENY':'ALLOW'}${r.reason?'('+r.reason+')':''}`).join(', ');
  return `${access||'ACCESS'}${profiles?' · '+profiles:''}`;
}
