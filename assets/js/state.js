export const state = {
  route:'overview',presentation:false,savedAt:new Date(),selectedDevice:null,
  workspace:{mode:'3d',leftOpen:true,rightOpen:false,fullscreen3d:false,inspectorTab:'controls'},
  editor:{mode:'unified',floorFocus:'1F',snap:true,gridSize:.25,showTransformGizmo:true},
  simulator:{
    barrier:false,loop:false,signals:true,zones:true,labels:true,follow:false,cameraPreset:0,vehicleType:'car',laneType:'mixed',loopDetectionState:'clear',
    activeVehicleId:'VEH-001',vehicles:[{id:'VEH-001',type:'car',x:-2.05,z:15,rotation:0,plate:'ABC-1234',etag:'ETAG-001',identity:'resident',authorized:true,lanePermission:'mixed',note:'住戶示範車輛'}],
    liveCamera:{yaw:.62,pitch:.42,radius:27,target:[0,1,0]},
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
    {id:'B1',name:'B1 地下室',visible:false,opacity:.72,elevation:-4,height:3.2},
    {id:'B2',name:'B2 地下室',visible:false,opacity:.55,elevation:-8,height:3.2}
  ],
  groups:[
    {id:'road',name:'道路/標線',visible:true,opacity:1},
    {id:'building',name:'建築/警衛室',visible:true,opacity:1},
    {id:'devices',name:'弱電設備',visible:true,opacity:1},
    {id:'vehicle',name:'車輛',visible:true,opacity:1},
    {id:'signals',name:'DI/DO / 感應',visible:true,opacity:1}
  ],
  deviceTransforms:{},
  deviceSettings:{},
  deviceRuntime:{},
  /* 每個模組的每個功能預設都沒有快捷鍵，使用者自行設定 */
  deviceHotkeys:{},
  hotkeys:[],
  hotkeyEditor:{deviceId:'',actionId:'',capture:false,message:'請先從模組庫加入設備，再選擇模組與功能。'},
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
  activeSignals:{},activePorts:{},
  eventLog:['10:02:14 ETAG01 DETECTED','10:02:15 DI1 ON','10:02:15 Relay01 NO CLOSED','10:02:16 DO1 ON','10:02:16 Barrier01 OPEN'],
  field:{comparePercent:50,replaySpeed:'1x',currentView:'入口車道全景',barrierState:'CLOSED',scriptIndex:0,remoteState:'遙控器待命。'},
  scripts:[
    {id:'01',view:'入口全景',note:'說明原本車道與本次改善內容'},
    {id:'02',view:'ETAG近景',note:'顯示ETAG讀取範圍與授權流程'},
    {id:'03',view:'地感俯視',note:'說明地感觸發與車輛位置'},
    {id:'04',view:'DI/DO視圖',note:'顯示訊號追蹤與設備連動'},
    {id:'05',view:'完成畫面',note:'說明施工後整體效果'}
  ],
  docsDevice:'',moduleLibrary:{search:'',group:'全部'},
  connections:[],
  signalTrace:{enabled:false,focusDevice:'',mode:'full'},
  accessDecision:{mode:'OR',lastBuiltAt:'',lastMessage:'尚未建立標準通行決策鏈。'},
  wiringBuilder:{fromDevice:'',fromTerminal:'',toDevice:'',toTerminal:'',step:'from',message:'請先點選一個模組的來源端子，再點另一個模組的目標端子。'}
,
  sceneLibrary:{activePreset:'community-day'},
  roadMarkings:[
    {id:'RM-001',typeId:'solid-white',name:'白色實線',kind:'line',floor:'1F',x:-2,z:-6,rotation:0,width:.12,length:8,visible:true},
    {id:'RM-002',typeId:'stop-line',name:'停止線',kind:'stop',floor:'1F',x:0,z:4,rotation:0,width:5,length:.35,visible:true}
  ],
  selectedRoadMarking:'RM-001',
  cloud:{webAppUrl:'',projectId:'',selectedProjectId:'',projectName:'未命名專案',lastCloudSavedAt:'',status:'尚未連線 Google 雲端',dirty:false,projects:[]},
  debugCenter:{lastRun:'',checks:[]}

};
