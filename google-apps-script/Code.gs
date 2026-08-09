const UTOP_CONFIG = Object.freeze({
  DRIVE_FOLDER_ID: '16wbIF1uaybtxEiM1A5iptDkJ8L0C6zYy',
  SPREADSHEET_ID: '1s24UvsMS1kW05VmyK33P1UpoK9QlsV6ETO7xKKIgYaA',
  SHEET_NAME: 'UTOP3D_Projects',
  FILE_SUFFIX: '.utop3d.json'
});

function doGet(){return json_({ok:true,service:'UTOP-3Dv3 Cloud',version:'1.6.0'});}
function doPost(e){
  try{
    const body=JSON.parse((e&&e.postData&&e.postData.contents)||'{}');
    const action=String(body.action||'ping');
    if(action==='ping')return json_({ok:true,service:'UTOP-3Dv3 Cloud',version:'1.6.0',time:new Date().toISOString()});
    if(action==='selfTest')return json_(selfTest_());
    if(action==='verifyWrite')return json_(withLock_(function(){return verifyWrite_();}));
    if(action==='repairIndex')return json_(repairIndex_());
    if(action==='list')return json_({ok:true,projects:listProjects_()});
    if(action==='save')return json_(withLock_(function(){return saveProject_(body);}));
    if(action==='load')return json_(loadProject_(body.projectId));
    if(action==='delete')return json_(withLock_(function(){return deleteProject_(body.projectId);}));
    throw new Error('未知 action：'+action);
  }catch(err){return json_({ok:false,error:String(err&&err.message||err),code:String(err&&err.code||'')});}
}
function withLock_(fn){const lock=LockService.getScriptLock();lock.waitLock(20000);try{return fn();}finally{lock.releaseLock();}}
function folder_(){return DriveApp.getFolderById(UTOP_CONFIG.DRIVE_FOLDER_ID);}
function sheet_(){
  const ss=SpreadsheetApp.openById(UTOP_CONFIG.SPREADSHEET_ID);
  let sh=ss.getSheetByName(UTOP_CONFIG.SHEET_NAME);
  if(!sh){sh=ss.insertSheet(UTOP_CONFIG.SHEET_NAME);sh.appendRow(['projectId','projectName','fileId','updatedAt','version']);}
  return sh;
}
function safeName_(name){return String(name||'未命名專案').replace(/[\\/:*?"<>|]/g,'_').trim().slice(0,80)||'未命名專案';}
function assertManagedFile_(projectId){
  if(!projectId)throw new Error('缺少 projectId');
  const file=DriveApp.getFileById(projectId);if(file.isTrashed())throw new Error('專案已刪除');
  let inFolder=false;const parents=file.getParents();while(parents.hasNext())if(parents.next().getId()===UTOP_CONFIG.DRIVE_FOLDER_ID){inFolder=true;break;}
  if(!inFolder)throw new Error('此檔案不在 UTOP 指定專案資料夾');
  if(!file.getName().endsWith(UTOP_CONFIG.FILE_SUFFIX))throw new Error('檔案格式不是 UTOP3D 專案');
  return file;
}
function readMeta_(file){try{return JSON.parse(file.getBlob().getDataAsString());}catch(_){return {};}}
function saveProject_(body){
  const folder=folder_(),name=safeName_(body.projectName),now=new Date().toISOString();
  let projectId=String(body.projectId||'').trim(),file=null,old={};
  if(projectId){try{file=assertManagedFile_(projectId);old=readMeta_(file);}catch(_){file=null;projectId='';}}
  const baseUpdatedAt=String(body.baseUpdatedAt||'');
  if(file&&!body.force&&baseUpdatedAt&&old.updatedAt&&baseUpdatedAt!==old.updatedAt){
    const err=new Error('雲端專案已有較新的版本，請先重新開啟或確認覆蓋。');err.code='REVISION_CONFLICT';throw err;
  }
  const payload={schema:'UTOP3D-CLOUD-2',version:String(body.clientVersion||''),projectId:'',projectName:name,updatedAt:now,state:body.state||{},devices:Array.isArray(body.devices)?body.devices:[]};
  if(!file){file=folder.createFile(name+UTOP_CONFIG.FILE_SUFFIX,'{}',MimeType.PLAIN_TEXT);projectId=file.getId();}
  payload.projectId=projectId;file.setName(name+UTOP_CONFIG.FILE_SUFFIX);file.setContent(JSON.stringify(payload));
  upsertIndex_(projectId,name,file.getId(),now,payload.version);
  return {ok:true,projectId,projectName:name,updatedAt:now,version:payload.version,fileName:file.getName()};
}
function listProjects_(){
  const folder=folder_(),files=folder.getFiles(),out=[];
  while(files.hasNext()){
    const f=files.next();if(f.isTrashed()||!f.getName().endsWith(UTOP_CONFIG.FILE_SUFFIX))continue;
    const meta=readMeta_(f);
    out.push({projectId:f.getId(),projectName:meta.projectName||f.getName().replace(UTOP_CONFIG.FILE_SUFFIX,''),updatedAt:meta.updatedAt||f.getLastUpdated().toISOString(),version:meta.version||'',fileName:f.getName()});
  }
  out.sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));return out;
}
function loadProject_(projectId){const f=assertManagedFile_(projectId);const data=JSON.parse(f.getBlob().getDataAsString());return {ok:true,project:data,fileName:f.getName()};}
function deleteProject_(projectId){const f=assertManagedFile_(projectId);f.setTrashed(true);removeIndex_(projectId);return {ok:true,projectId};}

function verifyWrite_(){
  const folder=folder_(),stamp=Utilities.getUuid(),name='UTOP3D_WRITE_TEST_'+stamp+'.tmp';
  const file=folder.createFile(name,'UTOP3D_WRITE_TEST',MimeType.PLAIN_TEXT);
  const fileId=file.getId();
  const readBack=file.getBlob().getDataAsString();
  const ok=readBack==='UTOP3D_WRITE_TEST';
  file.setTrashed(true);
  if(!ok)throw new Error('Google Drive 測試檔寫入後讀回內容不一致');
  return {ok:true,folderId:folder.getId(),folderName:folder.getName(),fileId:fileId,write:true,read:true,delete:true,time:new Date().toISOString()};
}
function selfTest_(){
  const folder=folder_(),ss=SpreadsheetApp.openById(UTOP_CONFIG.SPREADSHEET_ID),sh=sheet_();
  return {ok:true,service:'UTOP-3Dv3 Cloud',version:'1.6.0',folderId:folder.getId(),folderName:folder.getName(),spreadsheetId:ss.getId(),spreadsheetName:ss.getName(),sheetName:sh.getName(),projects:listProjects_().length,time:new Date().toISOString()};
}
function repairIndex_(){
  const sh=sheet_();sh.clearContents();sh.appendRow(['projectId','projectName','fileId','updatedAt','version']);
  const projects=listProjects_();projects.forEach(function(p){sh.appendRow([p.projectId,p.projectName,p.projectId,p.updatedAt,p.version]);});
  return {ok:true,count:projects.length};
}
function upsertIndex_(projectId,projectName,fileId,updatedAt,version){
  const sh=sheet_(),values=sh.getDataRange().getValues();let row=0;
  for(let i=1;i<values.length;i++)if(String(values[i][0])===projectId){row=i+1;break;}
  const v=[projectId,projectName,fileId,updatedAt,version];if(row)sh.getRange(row,1,1,v.length).setValues([v]);else sh.appendRow(v);
}
function removeIndex_(projectId){const sh=sheet_(),values=sh.getDataRange().getValues();for(let i=values.length-1;i>=1;i--)if(String(values[i][0])===projectId)sh.deleteRow(i+1);}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
