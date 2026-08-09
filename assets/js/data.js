export const categories = [
  {id:'overview',label:'整體總覽'},
  {id:'simulator',label:'3D編輯/模擬'},
  {id:'sync2d',label:'2D/3D同步'},
  {id:'scene',label:'場景/視野'},
  {id:'layers',label:'樓層/群組'},
  {id:'hotkeys',label:'快捷鍵'},
  {id:'display',label:'多螢幕'},
  {id:'mission',label:'任務'},
  {id:'engineering',label:'工程'},
  {id:'network',label:'網路/電源'},
  {id:'diagrams',label:'圖表/流程'},
  {id:'field',label:'現場'},
  {id:'project',label:'專案/Debug'}
];
export const featureGroups = [
  ['建模','地形、道路、B1/B2坡道、建築、樓層、標線、Smart Snap、量測、群組/圖層'],
  ['3D編輯','設備點選、拖移、旋轉、樓層切換、屬性面板、視角記錄、2D/3D共用座標'],
  ['工程','真實/Generic設備、端子、Wiring、Cable Path、BOM、施工階段、問題清單'],
  ['模擬','車輛/機車、DI/DO、Relay、Timer、感應區、Signal Trace、Skill Tree、Replay'],
  ['展示','視野記錄、情境場景、快捷鍵、簡報、標註、多螢幕、手機遙控器、QR'],
  ['平台','Undo/Redo、Autosave、快照、Asset、Offline/LAN、API/AI、版本管理、3D模組庫']
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
export const moduleCatalog = [
  {group:'車道設備',items:[
    {key:'barrier',name:'柵欄機',type:'Barrier Gate',state:'CLOSED'},
    {key:'etag',name:'ETAG讀頭',type:'UHF / ETAG',state:'READY'},
    {key:'loop',name:'地感線圈',type:'Loop Detector',state:'OFF'},
    {key:'traffic',name:'紅綠燈',type:'Traffic Light',state:'READY'},
    {key:'led',name:'LED顯示器',type:'LED Display',state:'ONLINE'}
  ]},
  {group:'控制設備',items:[
    {key:'controller',name:'控制器',type:'Controller',state:'ONLINE'},
    {key:'relay',name:'繼電器',type:'Relay',state:'READY'},
    {key:'card',name:'卡機',type:'Card Reader',state:'READY'},
    {key:'roller',name:'鐵捲門',type:'Roller Shutter',state:'CLOSED'}
  ]},
  {group:'監控與其他',items:[
    {key:'camera',name:'攝影機',type:'Camera',state:'ONLINE'}
  ]}
];
export const diagramOutputs = ['結構流程圖','分析圖','心智圖','SOP圖'];
