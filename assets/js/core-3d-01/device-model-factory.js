function addBox(THREE,root,w,h,d,material,x=0,y=h/2,z=0,r=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.rotation.y=r;m.castShadow=true;m.receiveShadow=true;root.add(m);return m;}
function addCylinder(THREE,root,r1,r2,h,material,x=0,y=h/2,z=0,segments=24){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;}
function addPole(THREE,root,mats,h=2.2,x=0,z=0,r=.055){return addCylinder(THREE,root,r,r,h,mats.dark,x,h/2,z,18)}
function addLens(THREE,root,mats,x,y,z,r=.065){const ring=addCylinder(THREE,root,r*1.35,r*1.35,.05,mats.dark,x,y,z,20);ring.rotation.x=Math.PI/2;const glass=addCylinder(THREE,root,r,r,.055,mats.blue,x,y,z+.02,20);glass.rotation.x=Math.PI/2;return glass;}
function addLed(THREE,root,material,x,y,z,r=.04){const m=new THREE.Mesh(new THREE.SphereGeometry(r,18,12),material.clone?.()||material);m.position.set(x,y,z);root.add(m);return m;}
function addPanelFace(THREE,root,mats,w,h,d,y){addBox(THREE,root,w,h,d,mats.dark,0,y,0);return addBox(THREE,root,w*.86,h*.74,.012,mats.gray,0,y,d/2+.008)}

export function createRealisticDeviceModel(THREE,mats,device){
  const type=String(device.type||'').toLowerCase(),root=new THREE.Group();
  if(type==='barrier'){
    const body=addBox(THREE,root,.34,1.03,.28,mats.orange);addBox(THREE,root,.25,.55,.014,mats.dark,0,.46,.148);addLed(THREE,root,mats.green,.08,.86,.15,.022);
    const pivot=new THREE.Group();pivot.position.set(-.14,.88,0);const arm=addBox(THREE,pivot,2.5,.09,.09,mats.white,-1.23,0,0);for(let i=0;i<5;i++)addBox(THREE,pivot,.22,.095,.096,mats.red,-.25-i*.5,0,0);root.add(pivot);root.userData.body=body;root.userData.barrierPivot=pivot;root.userData.barrierArm=arm;
  }else if(type==='uhf'){
    addPole(THREE,root,mats,2.35);const bracket=addBox(THREE,root,.08,.18,.09,mats.dark,0,2.21,0);const reader=addBox(THREE,root,.228,.228,.052,mats.white,0,2.30,.036);addBox(THREE,root,.19,.19,.008,mats.orange,0,2.30,.066);addBox(THREE,root,.10,.012,.004,mats.dark,0,2.30,.072);root.userData.reader=reader;root.userData.bracket=bracket;
    const zone=new THREE.Mesh(new THREE.ConeGeometry(2.5,5.5,28,1,true),new THREE.MeshBasicMaterial({color:0xffa51d,transparent:true,opacity:.13,side:THREE.DoubleSide,depthWrite:false}));zone.rotation.x=Math.PI/2;zone.position.set(0,2.2,-2.7);root.add(zone);root.userData.zone=zone;
  }else if(type==='loop'){
    const g=new THREE.BoxGeometry(2,.035,1),mat=new THREE.MeshBasicMaterial({color:0xf3c53f,transparent:true,opacity:.16,side:THREE.DoubleSide,depthWrite:false});const zone=new THREE.Mesh(g,mat);zone.position.y=.035;root.add(zone);const edges=new THREE.LineSegments(new THREE.EdgesGeometry(g),new THREE.LineBasicMaterial({color:0xffcf39}));edges.position.y=.035;root.add(edges);root.userData.zone=zone;root.userData.zoneEdges=edges;
  }else if(type==='loopdetector'){
    const body=addBox(THREE,root,.19,.09,.22,mats.gray);addBox(THREE,root,.15,.055,.012,mats.dark,0,.065,.116);for(let i=0;i<4;i++)addLed(THREE,root,i===0?mats.green:mats.red,-.045+i*.03,.075,.126,.008);for(let i=0;i<8;i++)addBox(THREE,root,.012,.035,.025,mats.dark,-.07+i*.02,.018,-.12);root.userData.body=body;
  }else if(type==='infrared'){
    const tx=addBox(THREE,root,.085,.46,.075,mats.dark,-1.1,.23,0),rx=addBox(THREE,root,.085,.46,.075,mats.dark,1.1,.23,0);for(const x of [-1.1,1.1]){addLens(THREE,root,mats,x,.33,.043,.025);addLens(THREE,root,mats,x,.22,.043,.025);}const beam=addCylinder(THREE,root,.009,.009,2.2,new THREE.MeshBasicMaterial({color:0xff3b30,transparent:true,opacity:.48}),0,.29,0,10);beam.rotation.z=Math.PI/2;root.userData.beam=beam;root.userData.tx=tx;root.userData.rx=rx;
  }else if(type==='radar'){
    addPole(THREE,root,mats,1.65);const panel=addBox(THREE,root,.23,.17,.065,mats.dark,0,1.60,.03);addBox(THREE,root,.19,.13,.008,mats.blue,0,1.60,.067);root.userData.radarPanel=panel;
  }else if(type==='lpr'){
    addPole(THREE,root,mats,2.15);const body=addBox(THREE,root,.34,.16,.23,mats.white,0,2.07,0);addBox(THREE,root,.30,.13,.025,mats.dark,0,2.07,.127);addLens(THREE,root,mats,-.075,2.07,.145,.045);for(let i=0;i<4;i++)addLed(THREE,root,mats.red,.04+i*.042,2.07,.145,.012);root.userData.cameraBody=body;
  }else if(type==='cardreader'){
    const post=addBox(THREE,root,.14,1.05,.14,mats.dark);const reader=addBox(THREE,root,.11,.22,.038,mats.gray,0,.82,.09);addBox(THREE,root,.07,.10,.006,mats.dark,0,.83,.112);const lamp=addLed(THREE,root,mats.green,0,.91,.12,.012);root.userData.reader=reader;root.userData.statusLamp=lamp;root.userData.post=post;
  }else if(type==='intercom'){
    addBox(THREE,root,.18,1.12,.18,mats.dark);const panel=addBox(THREE,root,.14,.34,.035,mats.gray,0,.82,.108);for(let i=0;i<5;i++)addBox(THREE,root,.065,.007,.005,mats.dark,0,.91-i*.018,.128);const call=addLed(THREE,root,mats.red,0,.72,.13,.017);root.userData.statusLamp=call;root.userData.panel=panel;
  }else if(type==='beacon'){
    addPole(THREE,root,mats,1.05,0,0,.045);addCylinder(THREE,root,.13,.15,.08,mats.dark,0,1.08,0);const lamp=addCylinder(THREE,root,.11,.11,.22,mats.orange,0,1.23,0,24);addCylinder(THREE,root,.12,.12,.025,mats.dark,0,1.36,0);root.userData.beaconLamp=lamp;
  }else if(type==='estop'){
    addBox(THREE,root,.14,.10,.10,mats.gray,0,.05,0);const stem=addCylinder(THREE,root,.03,.03,.07,mats.dark,0,.135,0);const mushroom=addCylinder(THREE,root,.09,.12,.07,mats.red,0,.205,0,24);root.userData.estop=mushroom;root.userData.stem=stem;
  }else if(type==='laneindicator'){
    addPole(THREE,root,mats,1.95);const panel=addBox(THREE,root,.90,.38,.07,mats.dark,0,1.90,0);const light=addBox(THREE,root,.58,.07,.012,mats.green,0,1.90,.048);addBox(THREE,root,.17,.07,.014,mats.green,.20,1.90,.05,.78);root.userData.indicatorLight=light;root.userData.panel=panel;
  }else if(type==='parkingdisplay'){
    addPole(THREE,root,mats,2.05);const panel=addBox(THREE,root,1.30,.64,.09,mats.dark,0,1.98,0);const display=addBox(THREE,root,.82,.27,.014,mats.green,.12,1.98,.058);addBox(THREE,root,.26,.27,.014,mats.red,-.43,1.98,.058);root.userData.displayPanel=display;root.userData.panel=panel;
  }else if(type==='bollard'){
    const base=addCylinder(THREE,root,.16,.16,.05,mats.dark,0,.025,0);const cyl=addCylinder(THREE,root,.105,.105,.58,mats.gray,0,.34,0);for(let i=0;i<3;i++)addCylinder(THREE,root,.11,.11,.028,mats.orange,0,.20+i*.15,0);root.userData.bollard=cyl;root.userData.base=base;
  }else if(type==='heightbar'){
    addPole(THREE,root,mats,2.45,-1.7,0,.07);addPole(THREE,root,mats,2.45,1.7,0,.07);const bar=addBox(THREE,root,3.55,.16,.10,mats.orange,0,2.33,0);for(let i=0;i<7;i++)addBox(THREE,root,.22,.165,.106,mats.dark,-1.4+i*.46,2.33,0);root.userData.heightBar=bar;
  }else if(type==='accesscontroller'){
    const body=addBox(THREE,root,.34,.46,.12,mats.dark);addBox(THREE,root,.30,.40,.014,mats.gray,0,.24,.068);for(let i=0;i<4;i++)addLed(THREE,root,i===0?mats.green:mats.orange,-.09+i*.06,.36,.079,.012);for(let i=0;i<6;i++)addBox(THREE,root,.025,.018,.014,mats.dark,-.10+i*.04,.10,.079);root.userData.body=body;
  }else if(type==='ipcamera'){
    addCylinder(THREE,root,.17,.17,.07,mats.white,0,.035,0);const dome=new THREE.Mesh(new THREE.SphereGeometry(.16,28,18,0,Math.PI*2,0,Math.PI/2),mats.dark);dome.rotation.x=Math.PI;dome.position.y=.055;root.add(dome);addLens(THREE,root,mats,0,.055,.135,.045);root.userData.cameraBody=dome;
  }else if(type==='poeswitch'){
    const body=addBox(THREE,root,.44,.045,.24,mats.dark);for(let i=0;i<8;i++){addBox(THREE,root,.038,.022,.015,mats.gray,-.15+i*.043,.03,.128);addLed(THREE,root,mats.green,-.15+i*.043,.052,.137,.004);}addBox(THREE,root,.05,.022,.015,mats.orange,.20,.03,.128);root.userData.body=body;
  }else if(type==='relay'){
    const body=addBox(THREE,root,.055,.075,.065,mats.gray);addBox(THREE,root,.050,.022,.008,mats.dark,0,.055,.037);const lamp=addLed(THREE,root,mats.green,0,.064,.043,.006);for(let i=0;i<5;i++)addBox(THREE,root,.008,.016,.012,mats.dark,-.02+i*.01,.008,.035);root.userData.statusLamp=lamp;root.userData.body=body;
  }else if(type==='powersupply'){
    const body=addBox(THREE,root,.20,.05,.10,mats.gray);for(let i=0;i<9;i++)addBox(THREE,root,.006,.038,.106,mats.dark,-.08+i*.02,.027,0);for(let i=0;i<6;i++)addBox(THREE,root,.016,.014,.012,mats.dark,-.05+i*.02,.04,.056);root.userData.body=body;
  }else if(['delaytimer','poweroffdelay','powerondelay'].includes(type)){
    const body=addBox(THREE,root,.052,.085,.072,mats.dark);const dial=addCylinder(THREE,root,.014,.014,.008,mats.orange,0,.052,.04,20);dial.rotation.x=Math.PI/2;const lamp=addLed(THREE,root,mats.green,0,.070,.043,.005);for(let i=0;i<4;i++)addBox(THREE,root,.008,.020,.010,mats.gray,-.015+i*.01,.010,.038);root.userData.statusLamp=lamp;
  }else if(type==='signal2way'||type==='signal3way'){
    const count=type==='signal3way'?3:2,body=addBox(THREE,root,.25,.18,.08,mats.dark);for(let i=0;i<count;i++){addLed(THREE,root,i===0?mats.green:mats.red,(i-(count-1)/2)*.065,.11,.048,.020);}for(let i=0;i<6;i++)addBox(THREE,root,.018,.014,.012,mats.gray,-.075+i*.03,.025,.048);root.userData.body=body;
  }else if(type==='timer'){
    const body=addBox(THREE,root,.18,.11,.055,mats.dark);const screen=addBox(THREE,root,.10,.05,.012,mats.red,-.015,.065,.035);addLed(THREE,root,mats.green,.07,.082,.038,.008);addLed(THREE,root,mats.orange,.07,.055,.038,.008);root.userData.displayPanel=screen;
  }else if(type==='ledpanel'){
    addPole(THREE,root,mats,1.95);const panel=addBox(THREE,root,.487,.270,.032,mats.dark,0,1.92,0);const red=addLed(THREE,root,mats.red,-.165,1.965,.024,.040),green=addLed(THREE,root,mats.green,-.165,1.875,.024,.040);const display=addBox(THREE,root,.21,.15,.012,mats.green,.095,1.92,.024);root.userData.trafficRed=red;root.userData.trafficGreen=green;root.userData.displayPanel=display;root.userData.body=panel;
  }else if(type==='traffic'){
    addPole(THREE,root,mats,1.95);const box=addBox(THREE,root,.28,.55,.16,mats.dark,0,1.82,0);const red=addLed(THREE,root,mats.red,0,1.96,.10,.072),green=addLed(THREE,root,mats.green,0,1.68,.10,.072);addBox(THREE,root,.31,.04,.21,mats.dark,0,2.05,0);addBox(THREE,root,.31,.04,.21,mats.dark,0,1.77,0);root.userData.trafficRed=red;root.userData.trafficGreen=green;root.userData.box=box;
  }else if(type==='shutter'){
    const left=addBox(THREE,root,.12,2.7,.14,mats.dark,-1.45,1.35,0),right=addBox(THREE,root,.12,2.7,.14,mats.dark,1.45,1.35,0),top=addBox(THREE,root,3.05,.16,.16,mats.dark,0,2.64,0);const door=addBox(THREE,root,2.75,2.45,.055,mats.gray,0,1.26,.02);for(let y=.18;y<2.35;y+=.16)addBox(THREE,root,2.72,.015,.060,mats.dark,0,y,.025);root.userData.shutterDoor=door;root.userData.frame=[left,right,top];
  }else{
    const body=new THREE.Mesh(new THREE.IcosahedronGeometry(.35,1),mats.blue);body.position.y=.35;body.castShadow=true;root.add(body);root.userData.body=body;
  }
  root.userData.layer='devices';root.userData.type=type;return root;
}
