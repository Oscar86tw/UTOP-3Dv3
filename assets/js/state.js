export const state = {
  route:'overview',presentation:false,savedAt:new Date(),selectedDevice:'DEV-001',
  workspace:{mode:'3d',leftOpen:true,rightOpen:false,fullscreen3d:false,inspectorTab:'controls'},
  editor:{mode:'select',floorFocus:'1F',snap:true,gridSize:.25},
  simulator:{
    barrier:false,loop:false,signals:true,zones:true,follow:false,cameraPreset:0,
    viewpoints:[
      {name:'入口車道全景',yaw:0.62,pitch:0.42,radius:27,target:[0,1,0],floor:'1F'},
      {name:'地感俯視',yaw:0.02,pitch:1.17,radius:22,target:[0,0,1],floor:'1F'},
      {name:'ETAG近景',yaw:-0.86,pitch:0.34,radius:12,target:[-3.8,1.6,5.5],floor:'1F'},
      {name:'B1坡道總覽',yaw:.42,pitch:.34,radius:34,target:[0,-3,8],floor:'B1'}
    ]
  },
  scene:{place:'社區入口',time:'白天',weather:'晴天',event:'正常進場'},
  floors:[
    {id:'1F',name:'1F 入口層',visible:true,opacity:1,elevation:0,height:3.2},
    {id:'B1',name:'B1 地下室',visible:true,opacity:.72,elevation:-4,height:3.2},
    {id:'B2',name:'B2 地下室',visible:true,opacity:.55,elevation:-8,height:3.2}
  ],
  groups:[
    {id:'road',name:'道路/標線',visible:true,opacity:1},
    {id:'building',name:'建築/警衛室',visible:true,opacity:1},
    {id:'devices',name:'弱電設備',visible:true,opacity:1},
    {id:'vehicle',name:'車輛',visible:true,opacity:1},
    {id:'signals',name:'DI/DO / 感應',visible:true,opacity:1}
  ],
  deviceTransforms:{
    'DEV-001':{x:3.8,y:0,z:-4.6,rotationX:0,rotationY:0,rotationZ:0,floor:'1F'},
    'DEV-002':{x:-4.6,y:0,z:7.2,rotationX:0,rotationY:0,rotationZ:0,floor:'1F'},
    'DEV-003':{x:0,y:0,z:2.2,rotationX:0,rotationY:0,rotationZ:0,floor:'1F'},
    'DEV-004':{x:-4.9,y:0,z:-4.2,rotationX:0,rotationY:0,rotationZ:0,floor:'1F'},
    'DEV-005':{x:5.2,y:0,z:7.6,rotationX:0,rotationY:0,rotationZ:0,floor:'1F'},
    'DEV-006':{x:2.2,y:0,z:5.4,rotationX:0,rotationY:Math.PI,rotationZ:0,floor:'1F'},
    'DEV-007':{x:3.25,y:0,z:2.8,rotationX:0,rotationY:0,rotationZ:0,floor:'1F'},
    'DEV-008':{x:-2.9,y:0,z:-3.6,rotationX:0,rotationY:0,rotationZ:0,floor:'1F'}
  },
  deviceSettings:{
    'DEV-001':{width:.34,height:1.03,depth:.28,boomLength:2.5,openTime:3,closeTime:3,installationHeight:0,showLabel:true,positionLocked:false},
    'DEV-002':{width:.23,height:.23,depth:.06,range:6,angle:55,installationHeight:2.4,showLabel:true,positionLocked:false},
    'DEV-003':{width:2,depth:1,turns:4,installationHeight:0,showLabel:true,positionLocked:false},
    'DEV-004':{doorCount:2,width:1.1,height:.7,depth:.15,installationHeight:1.2,showLabel:true,positionLocked:false},
    'DEV-005':{range:20,fov:80,width:.18,height:.14,depth:.18,installationHeight:2.8,showLabel:true,positionLocked:false},
    'DEV-006':{width:.34,height:1.03,depth:.28,boomLength:2.8,openTime:3,closeTime:3,installationHeight:0,showLabel:true,positionLocked:false},
    'DEV-007':{width:.55,height:1.5,depth:.38,installationHeight:0,showLabel:true,positionLocked:false},
    'DEV-008':{width:.487,height:.270,depth:.032,mountHeight:2.0,seconds:10,installationHeight:0,showLabel:true,positionLocked:false}
  },
  deviceRuntime:{
    'DEV-001':{status:'CLOSED',lastAction:'',active:false},
    'DEV-002':{status:'READY',lastAction:'',active:false},
    'DEV-003':{status:'OFF',lastAction:'',active:false},
    'DEV-004':{status:'ONLINE',lastAction:'',active:false},
    'DEV-005':{status:'ONLINE',lastAction:'',active:false},
    'DEV-006':{status:'CLOSED',lastAction:'',active:false},
    'DEV-007':{status:'RED',lastAction:'',active:true},
    'DEV-008':{status:'IDLE',lastAction:'',active:false}
  },
  /* 每個模組的每個功能預設都沒有快捷鍵，使用者自行設定 */
  deviceHotkeys:{'DEV-001':{},'DEV-002':{},'DEV-003':{},'DEV-004':{},'DEV-005':{},'DEV-006':{},'DEV-007':{},'DEV-008':{}},
  hotkeys:[],
  hotkeyEditor:{deviceId:'DEV-001',actionId:'',capture:false,message:'請先選擇模組與功能，再按「設定按鍵」。'},
  displays:[
    {name:'會議室電視',mode:'簡報同步',view:'跟隨主控',resolution:'4K',quality:'高',state:'ONLINE',signals:true,hud:true},
    {name:'工程平板',mode:'多視角',view:'地感俯視',resolution:'1920×1200',quality:'平衡',state:'ONLINE',signals:true,hud:true},
    {name:'投影機',mode:'Display Mode',view:'入口車道全景',resolution:'1080p',quality:'平衡',state:'STANDBY',signals:false,hud:true}
  ],
  snapshots:['施工前','第一次配置'],
  issues:[{id:'#001',title:'B1 紅外線位置需確認',state:'待處理'}],
  photos:[{id:'P-001',title:'1F 入口控制箱',device:'DEV-004'},{id:'P-002',title:'B1 地感施工點',device:'DEV-003'}],
  tests:[
    {name:'ETAG 讀取',result:'未測試'},{name:'地感觸發',result:'未測試'},{name:'Controller DI1',result:'未測試'},
    {name:'Relay NO',result:'未測試'},{name:'DO1 輸出',result:'未測試'},{name:'柵欄 OPEN / CLOSE',result:'未測試'}
  ],
  eventLog:['10:02:14 ETAG01 DETECTED','10:02:15 DI1 ON','10:02:15 Relay01 NO CLOSED','10:02:16 DO1 ON','10:02:16 Barrier01 OPEN'],
  field:{comparePercent:50,replaySpeed:'1x',currentView:'入口車道全景',barrierState:'CLOSED',scriptIndex:0,remoteState:'遙控器待命。'},
  scripts:[
    {id:'01',view:'入口全景',note:'說明原本車道與本次改善內容'},
    {id:'02',view:'ETAG近景',note:'顯示ETAG讀取範圍與授權流程'},
    {id:'03',view:'地感俯視',note:'說明地感觸發與車輛位置'},
    {id:'04',view:'DI/DO視圖',note:'顯示訊號追蹤與設備連動'},
    {id:'05',view:'完成畫面',note:'說明施工後整體效果'}
  ],
  docsDevice:'DEV-001',moduleLibrary:{search:'',group:'全部'},
  connections:[
    {id:'CON-001',fromDevice:'DEV-003',fromTerminal:'OUT',toDevice:'DEV-004',toTerminal:'DI1',type:'DI',enabled:true},
    {id:'CON-002',fromDevice:'DEV-004',fromTerminal:'DO1',toDevice:'DEV-001',toTerminal:'OPEN',type:'DO',enabled:true},
    {id:'CON-003',fromDevice:'DEV-004',fromTerminal:'DO2',toDevice:'DEV-007',toTerminal:'GREEN',type:'DO',enabled:true},
    {id:'CON-004',fromDevice:'DEV-007',fromTerminal:'GREEN',toDevice:'DEV-008',toTerminal:'DI1',type:'DI',enabled:true}
  ],
  signalTrace:{enabled:false,focusDevice:'DEV-003',mode:'full'},
  wiringBuilder:{fromDevice:'',fromTerminal:'',toDevice:'',toTerminal:'',step:'from',message:'請先點選一個模組的來源端子，再點另一個模組的目標端子。'}
,
  sceneLibrary:{activePreset:'community-day'},
  roadMarkings:[
    {id:'RM-001',typeId:'solid-white',name:'白色實線',kind:'line',floor:'1F',x:-2,z:-6,rotation:0,width:.12,length:8,visible:true},
    {id:'RM-002',typeId:'stop-line',name:'停止線',kind:'stop',floor:'1F',x:0,z:4,rotation:0,width:5,length:.35,visible:true}
  ],
  selectedRoadMarking:'RM-001',
  debugCenter:{lastRun:'',checks:[]}

};
