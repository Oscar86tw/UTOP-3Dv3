import {state} from '../state.js';

export const SCENE_PRESETS=[
  {id:'community-day',name:'社區入口・白天',place:'社區入口',time:'白天',weather:'晴天',event:'正常進場',view:0,desc:'標準社區入口展示。'},
  {id:'community-night',name:'社區入口・夜間',place:'社區入口',time:'夜間',weather:'晴天',event:'正常進場',view:0,desc:'夜間照明與設備燈號。'},
  {id:'community-rain',name:'社區入口・大雨',place:'社區入口',time:'黃昏',weather:'大雨',event:'正常進場',view:0,desc:'濕地、低能見度情境。'},
  {id:'basement-ramp',name:'B1 地下室坡道',place:'地下室坡道',time:'白天',weather:'晴天',event:'正常進場',view:3,desc:'B1 坡道、車道設備配置。'},
  {id:'etag-fault',name:'ETAG 故障',place:'社區入口',time:'白天',weather:'晴天',event:'ETAG故障',view:2,desc:'讀取失敗與人工處理情境。'},
  {id:'loop-fault',name:'地感異常',place:'社區入口',time:'白天',weather:'晴天',event:'地感異常',view:1,desc:'地感持續 ON / 無觸發診斷。'},
  {id:'barrier-fault',name:'柵欄機故障',place:'社區入口',time:'白天',weather:'晴天',event:'柵欄機故障',view:0,desc:'柵欄機不動作診斷。'},
  {id:'power-loss',name:'停電模式',place:'社區入口',time:'夜間',weather:'晴天',event:'停電',view:0,desc:'停電與備援電源展示。'},
  {id:'construction',name:'施工模式',place:'停車場',time:'白天',weather:'晴天',event:'施工模式',view:0,desc:'施工期間設備、標線與安全區域。'},
  {id:'emergency',name:'緊急車輛',place:'社區入口',time:'白天',weather:'晴天',event:'緊急車輛',view:0,desc:'緊急放行流程。'}
];

export function applyScenePreset(id){
  const p=SCENE_PRESETS.find(x=>x.id===id);if(!p)return null;
  state.scene={place:p.place,time:p.time,weather:p.weather,event:p.event};
  state.sceneLibrary={...(state.sceneLibrary||{}),activePreset:id};
  if(Number.isInteger(p.view))state.simulator.cameraPreset=p.view;
  return p;
}
export function activeScenePreset(){return SCENE_PRESETS.find(x=>x.id===state.sceneLibrary?.activePreset)||null;}
