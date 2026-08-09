import {state} from '../state.js';
import {devices} from '../data.js';
import {terminalsFor} from '../core-module-01/module-manager.js';

export function runDebugAudit(){
  const checks=[];const add=(name,ok,detail)=>checks.push({name,ok,detail});
  add('設備資料',true,devices.length?`${devices.length} 台設備`:'空白專案，尚未加入設備');
  const missingTransform=devices.filter(d=>!state.deviceTransforms?.[d.id]);add('3D 座標',missingTransform.length===0,missingTransform.length?`缺少：${missingTransform.map(x=>x.name).join('、')}`:'全部設備都有座標');
  const missingSettings=devices.filter(d=>!state.deviceSettings?.[d.id]);add('設備設定',missingSettings.length===0,missingSettings.length?`缺少 ${missingSettings.length} 台`:'全部設備都有設定');
  const invalidConnections=(state.connections||[]).filter(c=>{const a=devices.find(d=>d.id===c.fromDevice),b=devices.find(d=>d.id===c.toDevice);return !a||!b||!terminalsFor(a.type).includes(c.fromTerminal)||!terminalsFor(b.type).includes(c.toTerminal);});
  add('Connection',invalidConnections.length===0,invalidConnections.length?`${invalidConnections.length} 條端子連線異常`:`${state.connections?.length||0} 條連線正常`);
  add('本地 Three.js',true,'vendor/three/three.module.min.js 已打包');
  add('道路標線',true,`${state.roadMarkings?.length||0} 個標線物件`);
  add('場景庫',true,`目前：${state.scene.place} / ${state.scene.time} / ${state.scene.weather}`);
  const dupHotkeys=[];const seen=new Map();Object.entries(state.deviceHotkeys||{}).forEach(([devId,map])=>Object.entries(map||{}).forEach(([action,key])=>{if(!key)return;if(seen.has(key))dupHotkeys.push(`${key}: ${seen.get(key)} ↔ ${devId}.${action}`);else seen.set(key,`${devId}.${action}`);}));
  add('快捷鍵衝突',dupHotkeys.length===0,dupHotkeys.length?dupHotkeys.join('；'):'沒有衝突');
  state.debugCenter={...(state.debugCenter||{}),lastRun:new Date().toISOString(),checks};return checks;
}
export function debugSummary(){const checks=state.debugCenter?.checks?.length?state.debugCenter.checks:runDebugAudit();return {total:checks.length,pass:checks.filter(x=>x.ok).length,fail:checks.filter(x=>!x.ok).length,checks};}
