import {state} from '../state.js';

export const ROAD_MARKING_TYPES=[
  {id:'solid-white',name:'白色實線',kind:'line',width:.12,length:8},
  {id:'dashed-white',name:'白色虛線',kind:'dash',width:.12,length:8},
  {id:'double-yellow',name:'雙黃線',kind:'double',width:.12,length:8},
  {id:'zebra',name:'斑馬線',kind:'zebra',width:5,length:3},
  {id:'stop-line',name:'停止線',kind:'stop',width:5,length:.35},
  {id:'arrow-forward',name:'直行箭頭',kind:'arrow',width:1.6,length:3},
  {id:'arrow-left',name:'左轉箭頭',kind:'arrow-left',width:1.6,length:3},
  {id:'arrow-right',name:'右轉箭頭',kind:'arrow-right',width:1.6,length:3},
  {id:'no-parking',name:'網狀禁停區',kind:'hatch',width:5,length:5}
];
function nextId(){const max=Math.max(0,...(state.roadMarkings||[]).map(x=>Number(String(x.id||'').split('-')[1])||0));return `RM-${String(max+1).padStart(3,'0')}`;}
export function addRoadMarking(typeId,floor='1F'){
  const def=ROAD_MARKING_TYPES.find(x=>x.id===typeId);if(!def)return null;
  state.roadMarkings??=[];
  const n=state.roadMarkings.length;
  const item={id:nextId(),typeId,name:def.name,kind:def.kind,floor,x:(n%3-1)*2.2,z:-8+Math.floor(n/3)*3,rotation:0,width:def.width,length:def.length,visible:true};
  state.roadMarkings.push(item);state.selectedRoadMarking=item.id;return item;
}
export function updateRoadMarking(id,patch){const m=(state.roadMarkings||[]).find(x=>x.id===id);if(m)Object.assign(m,patch);return m;}
export function deleteRoadMarking(id){state.roadMarkings=(state.roadMarkings||[]).filter(x=>x.id!==id);if(state.selectedRoadMarking===id)state.selectedRoadMarking=state.roadMarkings[0]?.id||'';}
export function selectedRoadMarking(){return (state.roadMarkings||[]).find(x=>x.id===state.selectedRoadMarking)||state.roadMarkings?.[0]||null;}
