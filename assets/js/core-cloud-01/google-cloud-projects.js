function cleanUrl(url=''){return String(url||'').trim();}
async function callWebApp(url,payload){
  const endpoint=cleanUrl(url);if(!endpoint)throw new Error('尚未設定 Google Apps Script Web App 網址');
  const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),redirect:'follow',cache:'no-store'});
  const text=await res.text();let data;try{data=JSON.parse(text)}catch{throw new Error(`Google 雲端回應不是 JSON：${text.slice(0,160)}`)}
  if(!res.ok||data?.ok===false)throw new Error(data?.error||`Google 雲端 HTTP ${res.status}`);
  return data;
}
export async function pingCloud(url){return callWebApp(url,{action:'ping'});}
export async function listCloudProjects(url){const r=await callWebApp(url,{action:'list'});return Array.isArray(r.projects)?r.projects:[];}
export async function saveCloudProject(url,{projectId='',projectName='未命名專案',state,devices}){
  return callWebApp(url,{action:'save',projectId,projectName,state,devices,clientVersion:'1.5.1'});
}
export async function loadCloudProject(url,projectId){return callWebApp(url,{action:'load',projectId});}
export async function deleteCloudProject(url,projectId){return callWebApp(url,{action:'delete',projectId});}
