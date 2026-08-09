const UTOP_CONFIG = Object.freeze({
  DRIVE_FOLDER_ID: '16wbIF1uaybtxEiM1A5iptDkJ8L0C6zYy',
  SPREADSHEET_ID: '1s24UvsMS1kW05VmyK33P1UpoK9QlsV6ETO7xKKIgYaA',
  SHEET_NAME: 'UTOP3D_Projects',
  FILE_SUFFIX: '.utop3d.json'
});

function doGet(){return json_({ok:true,service:'UTOP-3Dv3 Cloud',version:'1.5.1'});}
function doPost(e){
  try{
    const body=JSON.parse((e&&e.postData&&e.postData.contents)||'{}');
    const action=String(body.action||'ping');
    if(action==='ping')return json_({ok:true,service:'UTOP-3Dv3 Cloud',time:new Date().toISOString()});
    if(action==='list')return json_({ok:true,projects:listProjects_()});
    if(action==='save')return json_(saveProject_(body));
    if(action==='load')return json_(loadProject_(body.projectId));
    if(action==='delete')return json_(deleteProject_(body.projectId));
    throw new Error('未知 action：'+action);
  }catch(err){return json_({ok:false,error:String(err&&err.message||err)});}
}
function folder_(){return DriveApp.getFolderById(UTOP_CONFIG.DRIVE_FOLDER_ID);}
function sheet_(){
  const ss=SpreadsheetApp.openById(UTOP_CONFIG.SPREADSHEET_ID);
  let sh=ss.getSheetByName(UTOP_CONFIG.SHEET_NAME);
  if(!sh){sh=ss.insertSheet(UTOP_CONFIG.SHEET_NAME);sh.appendRow(['projectId','projectName','fileId','updatedAt','version']);}
  return sh;
}
function safeName_(name){return String(name||'未命名專案').replace(/[\\/:*?"<>|]/g,'_').trim().slice(0,80)||'未命名專案';}
function saveProject_(body){
  const folder=folder_(),name=safeName_(body.projectName),now=new Date().toISOString();
  let projectId=String(body.projectId||'').trim(),file=null;
  if(projectId){try{file=DriveApp.getFileById(projectId);if(file.isTrashed())file=null;}catch(_){file=null;}}
  const payload={schema:'UTOP3D-CLOUD-1',version:String(body.clientVersion||''),projectId:'',projectName:name,updatedAt:now,state:body.state||{},devices:Array.isArray(body.devices)?body.devices:[]};
  if(!file){file=folder.createFile(name+UTOP_CONFIG.FILE_SUFFIX,'{}',MimeType.PLAIN_TEXT);projectId=file.getId();}
  payload.projectId=projectId;file.setName(name+UTOP_CONFIG.FILE_SUFFIX);file.setContent(JSON.stringify(payload));
  upsertIndex_(projectId,name,file.getId(),now,payload.version);
  return {ok:true,projectId,projectName:name,updatedAt:now};
}
function listProjects_(){
  const folder=folder_(),files=folder.getFiles(),out=[];
  while(files.hasNext()){
    const f=files.next();if(f.isTrashed()||!f.getName().endsWith(UTOP_CONFIG.FILE_SUFFIX))continue;
    let meta={};try{meta=JSON.parse(f.getBlob().getDataAsString())}catch(_){}
    out.push({projectId:f.getId(),projectName:meta.projectName||f.getName().replace(UTOP_CONFIG.FILE_SUFFIX,''),updatedAt:meta.updatedAt||f.getLastUpdated().toISOString(),version:meta.version||''});
  }
  out.sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));return out;
}
function loadProject_(projectId){
  if(!projectId)throw new Error('缺少 projectId');const f=DriveApp.getFileById(projectId);if(f.isTrashed())throw new Error('專案已刪除');
  const data=JSON.parse(f.getBlob().getDataAsString());return {ok:true,project:data};
}
function deleteProject_(projectId){
  if(!projectId)throw new Error('缺少 projectId');const f=DriveApp.getFileById(projectId);f.setTrashed(true);removeIndex_(projectId);return {ok:true,projectId};
}
function upsertIndex_(projectId,projectName,fileId,updatedAt,version){
  const sh=sheet_(),values=sh.getDataRange().getValues();let row=0;
  for(let i=1;i<values.length;i++)if(String(values[i][0])===projectId){row=i+1;break;}
  const v=[projectId,projectName,fileId,updatedAt,version];if(row)sh.getRange(row,1,1,v.length).setValues([v]);else sh.appendRow(v);
}
function removeIndex_(projectId){const sh=sheet_(),values=sh.getDataRange().getValues();for(let i=values.length-1;i>=1;i--)if(String(values[i][0])===projectId)sh.deleteRow(i+1);}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
