export const state = {
  route:'overview', presentation:false, savedAt:new Date(),
  simulator:{carY:0,carX:0,barrier:false,loop:false,signals:false},
  scene:{place:'社區入口',time:'白天',weather:'晴天',event:'正常進場'},
  viewpoints:['入口車道全景','B1 地感俯視','ETAG 近景'],
  hotkeys:[
    {key:'G',target:'入口柵欄機',action:'OPEN'},
    {key:'Shift + G',target:'入口柵欄機',action:'CLOSE'},
    {key:'L',target:'地感01',action:'ON/OFF'},
    {key:'E',target:'ETAG讀頭01',action:'TRIGGER'},
    {key:'V',target:'視野系統',action:'NEXT VIEW'}
  ],
  displays:[
    {name:'會議室電視',mode:'簡報同步',resolution:'4K',state:'ONLINE'},
    {name:'工程平板',mode:'多視角',resolution:'1920×1200',state:'ONLINE'},
    {name:'投影機',mode:'Display Mode',resolution:'1080p',state:'STANDBY'}
  ],
  snapshots:['施工前','第一次配置'],
  issues:[{id:'#001',title:'B1 紅外線位置需確認',state:'待處理'}]
};
