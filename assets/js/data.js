export const categories = [
  {id:'overview',label:'整體總覽'}, {id:'simulator',label:'3D模擬'}, {id:'scene',label:'場景/視野'},
  {id:'hotkeys',label:'快捷鍵'}, {id:'display',label:'多螢幕'}, {id:'mission',label:'任務'},
  {id:'engineering',label:'工程'}, {id:'network',label:'網路/電源'}, {id:'field',label:'現場'}, {id:'project',label:'專案/Debug'}
];
export const featureGroups = [
  ['建模','地形、道路、坡道、建築、樓層、標線、Smart Snap、量測、群組/圖層'],
  ['工程','真實/Generic設備、端子、Wiring、Cable Path、BOM、施工階段'],
  ['模擬','車輛/機車、DI/DO、Relay、Timer、感應區、碰撞、Signal Trace、Skill Tree'],
  ['展示','視野記錄、情境場景、快捷鍵、簡報、標註、多螢幕、手機遙控器'],
  ['分析','Debug、接線驗證、碰撞檢查、PoE、流量、錄影容量、驗收測試'],
  ['平台','Undo/Redo、Autosave、快照、Schema升級、Asset、Offline/LAN、API/AI、版本管理']
];
export const scenes = ['社區入口','地下室坡道','停車場','市區道路','高速公路','山坡彎道','賽道','隧道'];
export const events = ['正常進場','尾隨車輛','ETAG故障','地感異常','柵欄機故障','緊急車輛','施工模式','停電'];
export const devices = [
  {id:'DEV-001',name:'入口柵欄機',type:'Barrier Gate',floor:'1F',state:'CLOSED'},
  {id:'DEV-002',name:'ETAG讀頭01',type:'UHF / ETAG',floor:'1F',state:'READY'},
  {id:'DEV-003',name:'地感01',type:'Loop Detector',floor:'1F',state:'OFF'},
  {id:'DEV-004',name:'Controller01',type:'Controller',floor:'1F',state:'ONLINE'},
  {id:'DEV-005',name:'Camera01',type:'Camera',floor:'1F',state:'ONLINE'}
];
