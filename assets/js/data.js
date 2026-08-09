import {MODULE_CATALOG} from './core-module-01/module-definitions.js';

export const categories = [
  {id:'overview',label:'整體總覽'},
  {id:'simulator',label:'3D工作區'},
  {id:'sync2d',label:'2D/3D同步'},
  {id:'scene',label:'場景/視野'},
  {id:'layers',label:'樓層/群組'},
  {id:'hotkeys',label:'快捷鍵'},
  {id:'display',label:'多螢幕'},
  {id:'mission',label:'任務'},
  {id:'engineering',label:'工程/接線'},
  {id:'network',label:'網路/電源'},
  {id:'diagrams',label:'圖表/流程'},
  {id:'field',label:'現場'},
  {id:'project',label:'專案/Debug'}
];

export const featureGroups = [
  ['建模','地形、道路、B1/B2坡道、建築、樓層、標線、Smart Snap、量測、群組/圖層'],
  ['3D編輯','左側模組庫、中央滿版3D、右側設備設定、設備點選、拖移、旋轉、2D/3D共用座標'],
  ['設備','模組圖片、名稱、型號、屬性、規格、實體尺寸、控制、DI/DO、快捷鍵'],
  ['工程','端子、Wiring、卡片式接線、Cable Path、BOM、施工階段、問題清單'],
  ['模擬','車輛、DI/DO、Relay、Timer、感應區、Signal Trace、Skill Tree、Replay'],
  ['平台','Saved View、場景、簡報、多螢幕、Autosave、快照、Offline/LAN、API/AI、Debug']
];

export const scenes = ['社區入口','地下室坡道','停車場','市區道路','高速公路','山坡彎道','賽道','隧道'];
export const events = ['正常進場','尾隨車輛','ETAG故障','地感異常','柵欄機故障','緊急車輛','施工模式','停電'];

export const devices = [
  {id:'DEV-001',modelCode:'PARKING-BARRIER-001',name:'入口柵欄機',type:'barrier',floor:'1F',state:'CLOSED'},
  {id:'DEV-002',modelCode:'LANE-UHF-001',name:'ETAG讀頭01',type:'uhf',floor:'1F',state:'READY'},
  {id:'DEV-003',modelCode:'LANE-LOOP-001',name:'地感01',type:'loop',floor:'1F',state:'OFF'},
  {id:'DEV-004',modelCode:'ACCESS-CTRL-001',name:'Controller01',type:'accesscontroller',floor:'1F',state:'ONLINE'},
  {id:'DEV-005',modelCode:'CCTV-IPCAM-001',name:'Camera01',type:'ipcamera',floor:'1F',state:'ONLINE'},
  {id:'DEV-006',modelCode:'PARKING-BARRIER-002',name:'柵欄機02（出口）',type:'barrier',floor:'1F',state:'CLOSED'},
  {id:'DEV-007',modelCode:'PARKING-LIGHT-001',name:'紅綠燈01',type:'traffic',floor:'1F',state:'RED'},
  {id:'DEV-008',modelCode:'COUNTDOWN-TIMER-001',name:'倒數計時器01',type:'timer',floor:'1F',state:'IDLE'}
];

export const moduleCatalog = MODULE_CATALOG;
export const diagramOutputs = ['結構流程圖','分析圖','心智圖','SOP圖'];
