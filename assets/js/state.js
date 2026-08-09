export const state = {
  route:'overview', presentation:false, savedAt:new Date(), selectedDevice:'DEV-001',
  editor:{mode:'select',floorFocus:'1F',snap:true,gridSize:.25},
  simulator:{
    barrier:false,loop:false,signals:true,zones:true,follow:false,
    cameraPreset:0,
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
    'DEV-001':{x:3.8,y:0,z:-4.6,rotationY:0,floor:'1F'},
    'DEV-002':{x:-4.6,y:0,z:7.2,rotationY:0,floor:'1F'},
    'DEV-003':{x:0,y:0,z:2.2,rotationY:0,floor:'1F'},
    'DEV-004':{x:-4.9,y:0,z:-4.2,rotationY:0,floor:'1F'},
    'DEV-005':{x:5.2,y:0,z:7.6,rotationY:0,floor:'1F'}
  },
  hotkeys:[
    {key:'G',target:'入口柵欄機',action:'OPEN',enabled:true},
    {key:'Shift + G',target:'入口柵欄機',action:'CLOSE',enabled:true},
    {key:'L',target:'地感01',action:'ON/OFF',enabled:true},
    {key:'E',target:'ETAG讀頭01',action:'TRIGGER',enabled:true},
    {key:'V',target:'視野系統',action:'NEXT VIEW',enabled:true}
  ],
  displays:[
    {name:'會議室電視',mode:'簡報同步',view:'跟隨主控',resolution:'4K',quality:'高',state:'ONLINE',signals:true,hud:true},
    {name:'工程平板',mode:'多視角',view:'地感俯視',resolution:'1920×1200',quality:'平衡',state:'ONLINE',signals:true,hud:true},
    {name:'投影機',mode:'Display Mode',view:'入口車道全景',resolution:'1080p',quality:'平衡',state:'STANDBY',signals:false,hud:true}
  ],
  snapshots:['施工前','第一次配置'],
  issues:[{id:'#001',title:'B1 紅外線位置需確認',state:'待處理'}],
  photos:[
    {id:'P-001',title:'1F 入口控制箱',device:'DEV-004'},
    {id:'P-002',title:'B1 地感施工點',device:'DEV-003'}
  ],
  tests:[
    {name:'ETAG 讀取',result:'未測試'},
    {name:'地感觸發',result:'未測試'},
    {name:'Controller DI1',result:'未測試'},
    {name:'Relay NO',result:'未測試'},
    {name:'DO1 輸出',result:'未測試'},
    {name:'柵欄 OPEN / CLOSE',result:'未測試'}
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
  docsDevice:'DEV-001',
  moduleLibrary:{search:'',group:'全部'},
  deviceSettings:{
    'DEV-001':{width:1.05,height:2.05,depth:1.05,boomLength:5.8,speed:1.0,color:'orange'},
    'DEV-002':{width:1.05,height:.72,depth:.25,range:6.0,angle:55,color:'orange'},
    'DEV-003':{width:5.6,height:.05,depth:3.4,range:1.0,color:'yellow'},
    'DEV-004':{width:1.3,height:1.5,depth:.8,color:'dark'},
    'DEV-005':{width:.85,height:.5,depth:.65,range:12,fov:70,color:'blue'}
  },
  connections:[
    {id:'CON-001',fromDevice:'DEV-003',fromTerminal:'OUT',toDevice:'DEV-004',toTerminal:'DI1',type:'DI',enabled:true},
    {id:'CON-002',fromDevice:'DEV-004',fromTerminal:'DO1',toDevice:'DEV-001',toTerminal:'OPEN',type:'DO',enabled:true}
  ],
  signalTrace:{enabled:false,focusDevice:'DEV-003',mode:'full'}
,
  wiringBuilder:{fromDevice:'',fromTerminal:'',toDevice:'',toTerminal:'',step:'from',message:'請先點選一個模組的來源端子，再點另一個模組的目標端子。'}

};
