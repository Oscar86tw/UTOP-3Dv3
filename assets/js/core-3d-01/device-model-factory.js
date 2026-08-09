function box(THREE,root,w,h,d,material,x=0,y=h/2,z=0,rx=0,ry=0,rz=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;}
function cyl(THREE,root,r1,r2,h,material,x=0,y=h/2,z=0,segments=24,rx=0,ry=0,rz=0){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;}
function sph(THREE,root,r,material,x=0,y=r,z=0,phi=0,phiLen=Math.PI*2,theta=0,thetaLen=Math.PI){const m=new THREE.Mesh(new THREE.SphereGeometry(r,24,18,phi,phiLen,theta,thetaLen),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;}
function lens(THREE,root,mats,x,y,z,r=.06){const ring=cyl(THREE,root,r*1.24,r*1.24,.03,mats.dark,x,y,z,20,Math.PI/2);const glass=cyl(THREE,root,r,r,.04,mats.blue,x,y,z+.013,20,Math.PI/2);ring.renderOrder=2;glass.renderOrder=3;return {ring,glass};}
function ledBulb(THREE,root,material,x,y,z,r=.022){const m=sph(THREE,root,r,material,x,y,z);return m;}
function pole(THREE,root,mats,h=2.1,x=0,z=0,r=.05){const m=cyl(THREE,root,r,r,h,mats.dark,x,h/2,z,18);return m;}
function panelFace(THREE,root,mats,w,h,d,y=0,screenColor='gray'){
  box(THREE,root,w,h,d,mats.dark,0,y,0);
  const faceMat=screenColor==='green'?mats.green:screenColor==='red'?mats.red:screenColor==='blue'?mats.blue:mats.gray;
  return box(THREE,root,w*.88,h*.76,.01,faceMat,0,y,d/2+.008);
}
function num(settings,key,fallback){const v=Number(settings?.[key]);return Number.isFinite(v)?v:fallback;}
function setScale(node,sx=1,sy=1,sz=1){if(node)node.scale.set(sx,sy,sz)}
function clearApply(root,fn){root.userData.applySettings=fn;return root;}

function makeBarrier(THREE,mats,settings){
  const root=new THREE.Group();
  const body=box(THREE,root,.34,1.03,.28,mats.orange,0,.515,0);
  box(THREE,root,.24,.52,.014,mats.dark,0,.46,.148);
  box(THREE,root,.22,.08,.24,mats.dark,0,1.03,0);
  ledBulb(THREE,root,mats.green,.09,.87,.15,.02);
  const pivot=new THREE.Group(); pivot.position.set(-.14,.87,0);
  const boomLen=num(settings,'boomLength',2.5);
  const arm=box(THREE,pivot,boomLen,.08,.08,mats.white,-boomLen/2,0,0);
  const stripeCount=Math.max(4,Math.floor(boomLen/.45));
  for(let i=0;i<stripeCount;i++) box(THREE,pivot,.16,.084,.084,mats.red,-.18-i*.36,0,0);
  root.add(pivot);
  cyl(THREE,root,.03,.03,.12,mats.dark,-.13,.95,0,18,0,0,Math.PI/2);
  root.userData.body=body; root.userData.barrierPivot=pivot; root.userData.barrierArm=arm;
  return clearApply(root,(s,def)=>{const w=num(s,'width',def.width||.34),h=num(s,'height',def.height||1.03),d=num(s,'depth',def.depth||.28),boom=num(s,'boomLength',def.boomLength||2.5);setScale(body,w/(def.width||.34),h/(def.height||1.03),d/(def.depth||.28));arm.scale.x=boom/(def.boomLength||2.5);});
}
function makeUhf(THREE,mats,settings){
  const root=new THREE.Group();
  const mountH=num(settings,'mountHeight',2.4); pole(THREE,root,mats,mountH,0,0,.045);
  const bracket=box(THREE,root,.07,.18,.08,mats.dark,0,mountH-.12,.01);
  const body=box(THREE,root,.228,.228,.052,mats.white,0,mountH,.045);
  const face=box(THREE,root,.196,.196,.008,mats.blue,0,mountH,.072);
  box(THREE,root,.10,.012,.004,mats.dark,0,mountH,.079);
  const hood=box(THREE,root,.235,.018,.06,mats.gray,0,mountH+.123,.044);
  const zoneMat=new THREE.MeshBasicMaterial({color:0xffa51d,transparent:true,opacity:.13,side:THREE.DoubleSide,depthWrite:false});
  const zone=new THREE.Mesh(new THREE.ConeGeometry(2.6,5.4,28,1,true),zoneMat); zone.rotation.x=Math.PI/2; zone.position.set(0,mountH,-2.7); root.add(zone);
  root.userData.reader=body; root.userData.zone=zone; root.userData.zoneMat=zoneMat; root.userData.bracket=bracket; root.userData.face=face;
  return clearApply(root,(s,def)=>{const w=num(s,'width',def.width||.228),h=num(s,'height',def.height||.228),d=num(s,'depth',def.depth||.052),mh=num(s,'mountHeight',def.mountHeight||2.4),range=num(s,'range',def.range||6); body.scale.set(w/(def.width||.228),h/(def.height||.228),d/(def.depth||.052)); face.scale.copy(body.scale); hood.scale.x=w/(def.width||.228); bracket.position.y=mh-.12; body.position.y=mh; face.position.y=mh; hood.position.y=mh+.123; zone.position.y=mh; zone.scale.set(Math.max(.35,range/(def.range||6)),1,Math.max(.35,range/(def.range||6)));});
}
function makeLoop(THREE,mats,settings){
  const root=new THREE.Group();
  const w=num(settings,'width',2),d=num(settings,'depth',1);
  const g=new THREE.BoxGeometry(w,.03,d); const zoneMat=new THREE.MeshBasicMaterial({color:0xf3c53f,transparent:true,opacity:.16,side:THREE.DoubleSide,depthWrite:false});
  const zone=new THREE.Mesh(g,zoneMat); zone.position.y=.03; root.add(zone);
  const edgeMat=new THREE.LineBasicMaterial({color:0xffcf39}); const edges=new THREE.LineSegments(new THREE.EdgesGeometry(g),edgeMat); edges.position.y=.03; root.add(edges);
  root.userData.zone=zone; root.userData.zoneEdges=edges; root.userData.zoneMat=zoneMat;
  return clearApply(root,(s,def)=>{const ww=num(s,'width',def.width||2),dd=num(s,'depth',def.depth||1); zone.scale.set(ww/(def.width||2),1,dd/(def.depth||1)); edges.scale.copy(zone.scale);});
}
function makeLoopDetector(THREE,mats){const root=new THREE.Group(); box(THREE,root,.19,.09,.22,mats.gray); box(THREE,root,.15,.055,.012,mats.dark,0,.065,.116); for(let i=0;i<4;i++)ledBulb(THREE,root,i===0?mats.green:mats.red,-.045+i*.03,.075,.126,.008); for(let i=0;i<8;i++)box(THREE,root,.012,.035,.025,mats.dark,-.07+i*.02,.018,-.12); return clearApply(root,()=>{});}
function makeInfrared(THREE,mats,settings){
  const root=new THREE.Group();
  const range=Math.max(1,num(settings,'range',20)); const half=Math.min(2.2,Math.max(.6,range/12)); const h=Math.max(.4,num(settings,'height',.6));
  const tx=box(THREE,root,.085,h,.075,mats.dark,-half,h/2,0),rx=box(THREE,root,.085,h,.075,mats.dark,half,h/2,0);
  for(const x of [-half,half]){lens(THREE,root,mats,x,h*.70,.043,.022);lens(THREE,root,mats,x,h*.48,.043,.022);}const beamMat=new THREE.MeshBasicMaterial({color:0xff3b30,transparent:true,opacity:.48}); const beam=cyl(THREE,root,.009,.009,half*2,beamMat,0,h*.59,0,10,0,0,Math.PI/2);
  root.userData.beam=beam; root.userData.tx=tx; root.userData.rx=rx;
  return clearApply(root,(s,def)=>{const rr=Math.max(1,num(s,'range',def.range||20)); const hh=Math.max(.4,num(s,'height',def.height||.6)); const hh2=Math.min(2.2,Math.max(.6,rr/12)); tx.scale.y=hh/(def.height||.6); rx.scale.y=hh/(def.height||.6); tx.position.set(-hh2,hh/2,0); rx.position.set(hh2,hh/2,0); beam.scale.y=hh2*2/(Math.min(2.2,Math.max(.6,(def.range||20)/12))*2); beam.position.set(0,hh*.59,0);});
}
function makeRadar(THREE,mats){const root=new THREE.Group(); pole(THREE,root,mats,1.65,0,0,.045); box(THREE,root,.18,.12,.06,mats.dark,0,1.58,.02); box(THREE,root,.16,.10,.008,mats.blue,0,1.58,.055); const cone=new THREE.Mesh(new THREE.ConeGeometry(.55,1.2,18,1,true),new THREE.MeshBasicMaterial({color:0x7dd3fc,transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false})); cone.position.set(0,1.58,-.55); cone.rotation.x=Math.PI/2; root.add(cone); root.userData.zone=cone; return clearApply(root,()=>{});}
function makeLpr(THREE,mats){const root=new THREE.Group(); pole(THREE,root,mats,2.1); const boxy=box(THREE,root,.34,.16,.24,mats.white,0,2.03,0); box(THREE,root,.31,.13,.02,mats.dark,0,2.03,.132); lens(THREE,root,mats,-.08,2.03,.148,.04); for(let i=0;i<4;i++)ledBulb(THREE,root,mats.red,.03+i*.045,2.03,.148,.01); root.userData.cameraBody=boxy; return clearApply(root,()=>{});}
function makeCardReader(THREE,mats){const root=new THREE.Group(); const post=box(THREE,root,.12,1.08,.12,mats.dark,0,.54,0); const reader=box(THREE,root,.11,.24,.04,mats.gray,0,.82,.09); box(THREE,root,.07,.11,.006,mats.dark,0,.84,.112); ledBulb(THREE,root,mats.green,0,.93,.12,.012); root.userData.post=post; root.userData.reader=reader; return clearApply(root,()=>{});}
function makeIntercom(THREE,mats){const root=new THREE.Group(); box(THREE,root,.16,1.15,.16,mats.dark,0,.575,0); box(THREE,root,.14,.36,.036,mats.gray,0,.84,.098); for(let i=0;i<5;i++)box(THREE,root,.07,.008,.004,mats.dark,0,.92-i*.02,.12); ledBulb(THREE,root,mats.red,0,.72,.123,.014); return clearApply(root,()=>{});}
function makeBeacon(THREE,mats){const root=new THREE.Group(); pole(THREE,root,mats,1.05,0,0,.04); cyl(THREE,root,.12,.12,.02,mats.dark,0,1.09,0); const lamp=cyl(THREE,root,.10,.10,.20,mats.orange,0,1.20,0,20); cyl(THREE,root,.11,.11,.018,mats.dark,0,1.31,0); root.userData.beaconLamp=lamp; return clearApply(root,()=>{});}
function makeEstop(THREE,mats){const root=new THREE.Group(); box(THREE,root,.15,.10,.10,mats.gray,0,.05,0); cyl(THREE,root,.03,.03,.06,mats.dark,0,.13,0); const estop=cyl(THREE,root,.085,.12,.08,mats.red,0,.20,0,24); root.userData.estop=estop; return clearApply(root,()=>{});}
function makeLaneIndicator(THREE,mats,settings){const root=new THREE.Group(); const w=num(settings,'width',1.2),h=num(settings,'height',.5); pole(THREE,root,mats,1.95); const panel=box(THREE,root,w,h,.08,mats.dark,0,1.90,0); const stripe=box(THREE,root,w*.64,h*.20,.012,mats.green,0,1.90,.05); box(THREE,root,w*.18,h*.22,.014,mats.green,w*.18,1.90,.052,0,0,.78); root.userData.indicatorLight=stripe; root.userData.panel=panel; return clearApply(root,(s,def)=>{panel.scale.set(num(s,'width',def.width||1.2)/(def.width||1.2),num(s,'height',def.height||.5)/(def.height||.5),1);stripe.scale.set(panel.scale.x,panel.scale.y,1);});}
function makeParkingDisplay(THREE,mats){const root=new THREE.Group(); pole(THREE,root,mats,2.05); const panel=box(THREE,root,1.30,.64,.09,mats.dark,0,1.98,0); const display=box(THREE,root,.82,.27,.014,mats.green,.12,1.98,.058); box(THREE,root,.26,.27,.014,mats.red,-.43,1.98,.058); root.userData.displayPanel=display; root.userData.panel=panel; return clearApply(root,()=>{});}
function makeBollard(THREE,mats,settings){const root=new THREE.Group(); const d=num(settings,'diameter',.22),h=num(settings,'height',.6); cyl(THREE,root,d*.75,d*.75,.05,mats.dark,0,.025,0); const main=cyl(THREE,root,d/2,d/2,h,mats.gray,0,h/2+.05,0); for(let i=0;i<3;i++)cyl(THREE,root,d*.52,d*.52,.024,mats.orange,0,.16+i*(h*.22),0); root.userData.bollard=main; return clearApply(root,(s,def)=>{const hh=num(s,'height',def.height||.6),dd=num(s,'diameter',def.diameter||.22); main.scale.set(dd/(def.diameter||.22),hh/(def.height||.6),dd/(def.diameter||.22));});}
function makeHeightBar(THREE,mats,settings){const root=new THREE.Group(); const width=num(settings,'width',3.5),limit=num(settings,'limitHeight',2.1); pole(THREE,root,mats,limit+.35,-width/2,0,.06); pole(THREE,root,mats,limit+.35,width/2,0,.06); const bar=box(THREE,root,width,.14,.10,mats.orange,0,limit+.23,0); for(let i=0;i<Math.max(5,Math.floor(width/.48));i++)box(THREE,root,.20,.145,.106,mats.dark,-width/2+.18+i*.46,limit+.23,0); root.userData.heightBar=bar; return clearApply(root,(s,def)=>{bar.scale.x=num(s,'width',def.width||3.5)/(def.width||3.5);});}
function makeAccessController(THREE,mats){const root=new THREE.Group(); box(THREE,root,.34,.46,.12,mats.dark,0,.23,0); box(THREE,root,.30,.40,.014,mats.gray,0,.24,.068); for(let i=0;i<4;i++)ledBulb(THREE,root,i===0?mats.green:mats.orange,-.09+i*.06,.36,.079,.012); for(let i=0;i<6;i++)box(THREE,root,.025,.018,.014,mats.dark,-.10+i*.04,.10,.079); return clearApply(root,()=>{});}
function makeIpCamera(THREE,mats){const root=new THREE.Group(); cyl(THREE,root,.18,.18,.07,mats.white,0,.035,0); const dome=sph(THREE,root,.17,mats.dark,0,.055,0,0,Math.PI*2,0,Math.PI/2); dome.rotation.x=Math.PI; lens(THREE,root,mats,0,.055,.138,.045); root.userData.cameraBody=dome; return clearApply(root,()=>{});}
function makePoeSwitch(THREE,mats){const root=new THREE.Group(); box(THREE,root,.44,.045,.24,mats.dark,0,.022,0); for(let i=0;i<8;i++){box(THREE,root,.038,.022,.015,mats.gray,-.15+i*.043,.03,.128); ledBulb(THREE,root,mats.green,-.15+i*.043,.052,.137,.004);} box(THREE,root,.05,.022,.015,mats.orange,.20,.03,.128); return clearApply(root,()=>{});}
function makeRelay(THREE,mats){const root=new THREE.Group(); box(THREE,root,.055,.075,.065,mats.gray,0,.037,0); box(THREE,root,.050,.022,.008,mats.dark,0,.055,.037); const lamp=ledBulb(THREE,root,mats.green,0,.064,.043,.006); for(let i=0;i<5;i++)box(THREE,root,.008,.016,.012,mats.dark,-.02+i*.01,.008,.035); root.userData.statusLamp=lamp; return clearApply(root,()=>{});}
function makePowerSupply(THREE,mats){const root=new THREE.Group(); box(THREE,root,.20,.05,.10,mats.gray,0,.025,0); for(let i=0;i<9;i++)box(THREE,root,.006,.038,.106,mats.dark,-.08+i*.02,.027,0); for(let i=0;i<6;i++)box(THREE,root,.016,.014,.012,mats.dark,-.05+i*.02,.04,.056); return clearApply(root,()=>{});}
function makeSmallDinTimer(THREE,mats){const root=new THREE.Group(); box(THREE,root,.052,.085,.072,mats.dark,0,.042,0); const dial=cyl(THREE,root,.014,.014,.008,mats.orange,0,.052,.04,20,Math.PI/2); const lamp=ledBulb(THREE,root,mats.green,0,.070,.043,.005); for(let i=0;i<4;i++)box(THREE,root,.008,.020,.010,mats.gray,-.015+i*.01,.010,.038); root.userData.statusLamp=lamp; root.userData.dial=dial; return clearApply(root,()=>{});}
function makeSignalHost(THREE,mats,type='signal2way'){const root=new THREE.Group(); const count=type==='signal3way'?3:2; box(THREE,root,.25,.18,.08,mats.dark,0,.09,0); for(let i=0;i<count;i++)ledBulb(THREE,root,i===0?mats.green:mats.red,(i-(count-1)/2)*.065,.11,.048,.020); for(let i=0;i<6;i++)box(THREE,root,.018,.014,.012,mats.gray,-.075+i*.03,.025,.048); return clearApply(root,()=>{});}
function makeTimer(THREE,mats,settings){const root=new THREE.Group(); const w=num(settings,'width',.487),h=num(settings,'height',.270),d=num(settings,'depth',.032); const mountH=num(settings,'mountHeight',2.0); pole(THREE,root,mats,mountH); const body=box(THREE,root,w,h,d,mats.dark,0,mountH,0); const display=box(THREE,root,w*.46,h*.38,.01,mats.red,-w*.12,mountH,d/2+.008); ledBulb(THREE,root,mats.green,w*.26,mountH+h*.17,d/2+.014,.008); ledBulb(THREE,root,mats.orange,w*.26,mountH+h*.02,d/2+.014,.008); root.userData.displayPanel=display; root.userData.body=body; return clearApply(root,(s,def)=>{body.scale.set(num(s,'width',def.width||.487)/(def.width||.487),num(s,'height',def.height||.270)/(def.height||.270),num(s,'depth',def.depth||.032)/(def.depth||.032)); display.scale.copy(body.scale);});}
function makeLedPanel(THREE,mats,settings){const root=new THREE.Group(); pole(THREE,root,mats,1.95); const body=box(THREE,root,.487,.270,.032,mats.dark,0,1.92,0); const red=ledBulb(THREE,root,mats.red,-.165,1.965,.024,.040),green=ledBulb(THREE,root,mats.green,-.165,1.875,.024,.040); const display=box(THREE,root,.21,.15,.012,mats.green,.095,1.92,.024); root.userData.trafficRed=red; root.userData.trafficGreen=green; root.userData.displayPanel=display; root.userData.body=body; return clearApply(root,()=>{});}
function makeTraffic(THREE,mats,settings){const root=new THREE.Group(); const h=num(settings,'height',1.5); pole(THREE,root,mats,h-.4); const boxy=box(THREE,root,.28,.55,.16,mats.dark,0,h-.22,0); const red=ledBulb(THREE,root,mats.red,0,h-.06,.09,.06),green=ledBulb(THREE,root,mats.green,0,h-.35,.09,.06); root.userData.trafficRed=red; root.userData.trafficGreen=green; root.userData.body=boxy; return clearApply(root,()=>{});}
function makeShutter(THREE,mats,settings){const root=new THREE.Group(); const w=num(settings,'width',3),h=num(settings,'height',2.6); const frame=box(THREE,root,w+.18,h+.18,.18,mats.dark,0,(h+.18)/2,0); const opening=box(THREE,root,w,h,.10,mats.gray,0,h/2,.05); for(let i=0;i<10;i++)box(THREE,root,w*.96,.02,.102,mats.dark,0,.22+i*(h*.08),.052); const topBox=box(THREE,root,w+.10,.16,.20,mats.dark,0,h+.09,0); root.userData.shutterDoor=opening; root.userData.shutterFrame=frame; root.userData.topBox=topBox; return clearApply(root,(s,def)=>{const ww=num(s,'width',def.width||3),hh=num(s,'height',def.height||2.6); frame.scale.set(ww/(def.width||3),hh/(def.height||2.6),1); opening.scale.set(ww/(def.width||3),hh/(def.height||2.6),1); topBox.scale.x=ww/(def.width||3); topBox.position.y=hh+.09;});}
function makeFallback(THREE,mats){const root=new THREE.Group(); const geo=new THREE.DodecahedronGeometry(.25); const mesh=new THREE.Mesh(geo,mats.gray); mesh.castShadow=true; mesh.receiveShadow=true; root.add(mesh); return clearApply(root,()=>{});}

export function createRealisticDeviceModel(THREE,mats,device,settings={}){
  const type=String(device.type||'').toLowerCase();
  let root;
  if(type==='barrier')root=makeBarrier(THREE,mats,settings);
  else if(type==='uhf' || type==='etag')root=makeUhf(THREE,mats,settings);
  else if(type==='loop')root=makeLoop(THREE,mats,settings);
  else if(type==='loopdetector')root=makeLoopDetector(THREE,mats,settings);
  else if(type==='infrared')root=makeInfrared(THREE,mats,settings);
  else if(type==='radar')root=makeRadar(THREE,mats,settings);
  else if(type==='lpr')root=makeLpr(THREE,mats,settings);
  else if(type==='cardreader')root=makeCardReader(THREE,mats,settings);
  else if(type==='intercom')root=makeIntercom(THREE,mats,settings);
  else if(type==='beacon')root=makeBeacon(THREE,mats,settings);
  else if(type==='estop')root=makeEstop(THREE,mats,settings);
  else if(type==='laneindicator')root=makeLaneIndicator(THREE,mats,settings);
  else if(type==='parkingdisplay')root=makeParkingDisplay(THREE,mats,settings);
  else if(type==='bollard')root=makeBollard(THREE,mats,settings);
  else if(type==='heightbar')root=makeHeightBar(THREE,mats,settings);
  else if(type==='accesscontroller')root=makeAccessController(THREE,mats,settings);
  else if(type==='ipcamera')root=makeIpCamera(THREE,mats,settings);
  else if(type==='poeswitch')root=makePoeSwitch(THREE,mats,settings);
  else if(type==='relay')root=makeRelay(THREE,mats,settings);
  else if(type==='powersupply')root=makePowerSupply(THREE,mats,settings);
  else if(['delaytimer','poweroffdelay','powerondelay'].includes(type))root=makeSmallDinTimer(THREE,mats,settings);
  else if(type==='signal2way'||type==='signal3way')root=makeSignalHost(THREE,mats,type);
  else if(type==='timer')root=makeTimer(THREE,mats,settings);
  else if(type==='ledpanel')root=makeLedPanel(THREE,mats,settings);
  else if(type==='traffic')root=makeTraffic(THREE,mats,settings);
  else if(type==='shutter')root=makeShutter(THREE,mats,settings);
  else root=makeFallback(THREE,mats,settings);
  root.userData.modelType=type; root.userData.isReal3DModel=true; return root;
}
