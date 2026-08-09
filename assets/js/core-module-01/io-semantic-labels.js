// UTOP-3Dv3 V1.7.11
// DI / DO / terminal semantic labels.
// Named real products use manufacturer terminology where available.
// Generic/simulated modules use the runtime behavior defined by UTOP.

const IO_LABELS={
  barrier:{
    DI:{OPEN:'開啟指令',CLOSE:'關閉指令',STOP:'停止指令',SAFETY:'防砸／安全輸入',RESET:'故障復歸'},
    DO:{FULLY_OPEN:'全開到位',FULLY_CLOSED:'全關到位',RUNNING:'運轉中',FAULT:'故障輸出'}
  },
  traffic:{
    DI:{RED:'紅燈控制',GREEN:'綠燈控制',OFF:'燈號全關'},
    DO:{RED_ON:'紅燈亮狀態',GREEN_ON:'綠燈亮狀態'}
  },
  loop:{
    DI:{VEHICLE:'車輛進入線圈'},
    DO:{PRESENCE:'有車偵測輸出'}
  },
  loopdetector:{
    DI:{LOOP_A:'地感線圈 A',LOOP_B:'地感線圈 B'},
    DO:{PRESENCE:'有車保持輸出',PULSE:'車輛通過脈衝',FAULT:'線圈故障輸出'}
  },
  infrared:{
    DI:{BEAM:'紅外線光束狀態'},
    DO:{BLOCKED:'光束遮斷輸出',CLEAR:'光束正常／恢復'}
  },
  radar:{
    DI:{DETECT:'雷達偵測觸發'},
    DO:{VEHICLE:'車輛偵測',PERSON:'人員偵測',DIRECTION:'行進方向判定'}
  },
  uhf:{
    DI:{TRIGGER:'啟動 UHF／eTag 讀取'},
    DO:{TAG_OK:'有效標籤／讀取成功',TAG_FAIL:'無效標籤／讀取失敗'}
  },
  lpr:{
    DI:{TRIGGER:'啟動車牌辨識'},
    DO:{PLATE_OK:'有效車牌／允許',PLATE_FAIL:'辨識失敗／拒絕'}
  },
  cardreader:{
    DI:{CARD:'刷卡／卡片讀取'},
    DO:{VALID:'有效卡',INVALID:'無效卡'}
  },
  intercom:{
    DI:{CALL:'呼叫按鍵輸入'},
    DO:{RING:'來電／響鈴',TALK:'通話中'}
  },
  beacon:{
    DI:{ON:'警示燈常亮',FLASH:'警示燈閃爍'},
    DO:{ACTIVE:'警示燈動作中'}
  },
  estop:{
    DI:{PRESS:'緊急停止按下'},
    DO:{NC:'常閉安全接點',NO:'常開觸發接點'}
  },
  laneindicator:{
    DI:{LEFT:'左轉顯示',RIGHT:'右轉顯示',STRAIGHT:'直行顯示',STOP:'紅叉／禁止通行'},
    DO:{ACTIVE:'方向牌顯示中'}
  },
  parkingdisplay:{
    DI:{IN:'入車計數輸入',OUT:'出車計數輸入'},
    DO:{FULL:'滿位輸出',AVAILABLE:'尚有車位輸出'}
  },
  bollard:{
    DI:{UP:'升柱指令',DOWN:'降柱指令',STOP:'停止指令'},
    DO:{UP_LIMIT:'升起到位',DOWN_LIMIT:'下降到位'}
  },
  heightbar:{
    DI:{SENSOR:'超高車輛偵測'},
    DO:{OVERHEIGHT:'超高狀態輸出',ALARM:'警報輸出'}
  },
  accesscontroller:{
    DI:{DI1:'開門按鈕／Egress',DI2:'門位／Door Status',EXIT:'開門按鈕語意',DOOR:'門位偵測語意'},
    DO:{LOCK:'門鎖控制輸出',ALARM:'警報輸出',BUZZER:'蜂鳴器輸出'}
  },
  ipcamera:{
    DI:{'ALARM IN':'外部警報輸入'},
    DO:{'ALARM OUT':'警報輸出',VIDEO:'網路影像串流'}
  },
  poeswitch:{
    DI:{POWER:'交換器電源狀態'},
    DO:{PORT1:'Port 1 網路／PoE',PORT2:'Port 2 網路／PoE',PORT3:'Port 3 網路／PoE',PORT4:'Port 4 網路／PoE',PORT5:'Port 5 網路／PoE',PORT6:'Port 6 網路／PoE',PORT7:'Port 7 網路／PoE',PORT8:'Port 8 網路／PoE'}
  },
  relay:{
    DI:{ON:'線圈吸合指令',OFF:'線圈釋放指令'},
    DO:{NO:'NO 常開接點導通',NC:'NC 常閉接點導通'}
  },
  powersupply:{
    DI:{AC:'AC 市電輸入'},
    DO:{DC_OK:'DC 輸出正常',FAULT:'電源故障'}
  },
  delaytimer:{
    DI:{START:'開始延遲',STOP:'停止計時',RESET:'重設計時'},
    DO:{RUNNING:'計時中',DONE:'延遲完成輸出'}
  },
  poweroffdelay:{
    DI:{POWER:'電源控制輸入'},
    DO:{NO:'延時 NO 輸出',NC:'延時 NC 輸出',TIMING:'斷電延時中'}
  },
  powerondelay:{
    DI:{POWER:'電源控制輸入'},
    DO:{NO:'延時 NO 輸出',NC:'延時 NC 輸出',TIMING:'通電延時中'}
  },
  signal2way:{
    DI:{A:'A 車道偵測輸入',B:'B 車道偵測輸入'},
    DO:{A_RED:'A 車道紅燈',A_GREEN:'A 車道綠燈',B_RED:'B 車道紅燈',B_GREEN:'B 車道綠燈'}
  },
  signal3way:{
    DI:{A:'A 車道偵測輸入',B:'B 車道偵測輸入',C:'C 車道偵測輸入'},
    DO:{A_RED:'A 車道紅燈',A_GREEN:'A 車道綠燈',B_RED:'B 車道紅燈',B_GREEN:'B 車道綠燈',C_RED:'C 車道紅燈',C_GREEN:'C 車道綠燈'}
  },
  timer:{
    DI:{DI1:'開始倒數',DI2:'暫停／繼續',DI3:'重設倒數'},
    DO:{DO1:'倒數完成輸出',DO2:'可程式輸出 2（目前未指派）',DO3:'可程式輸出 3（目前未指派）',DO4:'可程式輸出 4（目前未指派）'}
  },
  ledpanel:{
    DI:{RED:'紅燈控制',GREEN:'綠燈控制',START:'開始倒數',RESET:'重設倒數'},
    DO:{DONE:'倒數完成輸出（UTOP 模擬）'}
  },
  shutter:{
    DI:{OPEN:'上升／開門',CLOSE:'下降／關門',STOP:'停止',SAFETY:'防壓／安全輸入'},
    DO:{FULLY_OPEN:'全開到位',FULLY_CLOSED:'全關到位',RUNNING:'運轉中',FAULT:'故障輸出'}
  }
};

const TERMINAL_LABELS={
  accesscontroller:{DI1:'開門按鈕／Egress',DI2:'門位／Door Status',DO1:'門鎖控制輸出',DO2:'警報／輔助輸出'},
  timer:{DI1:'開始倒數',DI2:'暫停／繼續',DI3:'重設倒數',DO1:'倒數完成輸出',DO2:'可程式輸出 2',DO3:'可程式輸出 3',DO4:'可程式輸出 4'},
  signal2way:{'DI-A':'A 車道偵測','DI-B':'B 車道偵測','A-RED':'A 車道紅燈','A-GREEN':'A 車道綠燈','B-RED':'B 車道紅燈','B-GREEN':'B 車道綠燈'},
  signal3way:{'DI-A':'A 車道偵測','DI-B':'B 車道偵測','DI-C':'C 車道偵測','A-RED':'A 車道紅燈','A-GREEN':'A 車道綠燈','B-RED':'B 車道紅燈','B-GREEN':'B 車道綠燈','C-RED':'C 車道紅燈','C-GREEN':'C 車道綠燈'},
  ledpanel:{RED:'紅燈控制',GREEN:'綠燈控制',START:'開始倒數',RESET:'重設倒數'},
  barrier:{OPEN:'開啟',CLOSE:'關閉',STOP:'停止',SAFETY:'防砸安全',COM:'控制共點'},
  shutter:{OPEN:'上升',CLOSE:'下降',STOP:'停止',SAFETY:'防壓安全',COM:'控制共點'},
  infrared:{OUT:'遮斷輸出',NO:'常開接點',NC:'常閉接點'},
  loopdetector:{OUT:'地感輸出',NO:'常開接點',NC:'常閉接點'},
  relay:{'COIL+':'線圈正極','COIL-':'線圈負極',COM:'接點共點',NO:'常開接點',NC:'常閉接點'},
  cardreader:{D0:'Wiegand Data 0',D1:'Wiegand Data 1',LED:'LED 控制',BEEP:'蜂鳴器控制'},
  uhf:{TRIGGER:'讀取觸發',DATA:'標籤資料輸出'},
  ipcamera:{'ALARM IN':'外部警報輸入','ALARM OUT':'警報輸出'},
  powersupply:{'AC-L':'AC 火線','AC-N':'AC 中性線',FG:'保護接地','V+':'DC 正極','V-':'DC 負極'}
};

const SOURCE_NOTES={
  accesscontroller:'SOYAL E-Series：Egress / Door Status DI；Door Lock / Alarm Output',
  signal2way:'Garrison LK-103：A/B 車道偵測乾接點與雙向紅綠號誌控制',
  signal3way:'Garrison LK-103A：A/B/C 車道偵測與三向號誌控制',
  ledpanel:'Garrison LK-1045：紅／綠燈控制＋倒數計秒',
  uhf:'SOYAL AR-661UG：UHF 長距離停車場標籤讀取'
};

export function ioSemanticLabel(type,direction,signal){
  const t=String(type||'').toLowerCase();const dir=String(direction||'').toUpperCase();const key=String(signal||'');
  return IO_LABELS[t]?.[dir]?.[key]||key;
}
export function terminalSemanticLabel(type,terminal){
  const t=String(type||'').toLowerCase();const key=String(terminal||'');
  return TERMINAL_LABELS[t]?.[key]||'';
}
export function ioSourceNote(type){return SOURCE_NOTES[String(type||'').toLowerCase()]||'';}
export function ioSemanticCoverage(definitions=[]){
  return definitions.map(def=>{
    const missing=[];
    for(const x of def.inputs||[])if(ioSemanticLabel(def.type,'DI',x)===x)missing.push(`DI:${x}`);
    for(const x of def.outputs||[])if(ioSemanticLabel(def.type,'DO',x)===x)missing.push(`DO:${x}`);
    return {type:def.type,name:def.name,ok:missing.length===0,missing};
  });
}
