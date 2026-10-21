export const POLICY_VERSION=1;
const MB=1024*1024;
// Pure classification. Width and hardware are independent axes; labels never use brand/chip.
export function classifyResources(s={},preference='auto',overloaded=false){
 const width=Number(s.width)||393,height=Number(s.height)||800;
 const layoutMode=width<360?'narrow':width<600?'compact':width<840?'medium':'expanded';
 const capacity=s.lowRam===true||(s.memoryGB>0&&s.memoryGB<=3)||(s.cores>0&&s.cores<=4)||(s.memoryClassMB>0&&s.memoryClassMB<=128);
 const constrained=capacity||s.powerSave===true||(s.thermalStatus>=3)||s.saveData===true||s.noBlur===true||s.slowDisplay===true;
 const light=preference==='lite'||constrained||overloaded||s.reduceTransparency===true;
 const reasonCode=preference==='lite'?'user':s.reduceMotion?'motion_preference':constrained?'capacity_or_system':overloaded?'observed_cost':'automatic';
 return{version:POLICY_VERSION,preference,layoutMode,shortWindow:height<480,effectsMode:s.reduceMotion?'none':light?'lite':'standard',workloadMode:light?'serial':'bounded',imageCacheBudget:(light?8:16)*MB,heavyTaskConcurrency:1,productPageSize:light?36:60,reasonCode};
}
export function createAdaptivePolicy({now=()=>performance.now(),onChange=()=>{}}={}){
 let signals={},preference='auto',overloaded=false,lastSlow=-Infinity,stableSince=now(),samples=[],current=classifyResources(),first=true;
 function update(patch={},choice=preference){signals={...signals,...patch};preference=choice==='lite'?'lite':'auto';const t=now();
  if(signals.foreground===false)stableSince=t;
  if(overloaded&&signals.foreground!==false&&t-Math.max(lastSlow,stableSince)>=120000){overloaded=false;samples=[];}
  const next=classifyResources(signals,preference,overloaded);if(first||JSON.stringify(next)!==JSON.stringify(current)){first=false;current=next;onChange({...current});}return{...current};}
 return{update,snapshot:()=>({...current}),observe({duration,budget=500,kind='local',valid=true}={}){if(!valid||signals.foreground===false||!Number.isFinite(duration)||!Number.isFinite(budget)||budget<=0||['network','typing','diagnostic','queue'].includes(kind))return false;
  const t=now();samples=samples.filter(x=>t-x.at<=30000);if(duration>budget){samples.push({at:t,kind});lastSlow=t;stableSince=t;if(samples.filter(x=>x.kind===kind).length>=3)overloaded=true;}update();return overloaded;},resetForeground(){stableSince=now();update({foreground:true});}};
}
// Reconstructible optional work only. Financial commands never enter this queue.
export function createResourceQueue({limit=1,maxPending=12}={}){
 let active=0,serial=0;const waiting=[];
 const drain=()=>{while(active<limit&&waiting.length){const task=waiting.shift();if(task.signal?.aborted){task.reject(Error('Tarefa cancelada.'));continue;}active++;Promise.resolve().then(()=>task.work(task.signal)).then(task.resolve,task.reject).finally(()=>{active--;drain();});}};
 return{run(work,{priority=2,signal}={}){if(waiting.length>=maxPending)return Promise.reject(Error('Aguarde a consulta atual antes de iniciar outra.'));return new Promise((resolve,reject)=>{waiting.push({work,priority,signal,serial:serial++,resolve,reject});waiting.sort((a,b)=>a.priority-b.priority||a.serial-b.serial);drain();});},cancelOptional(threshold=3){for(let i=waiting.length-1;i>=0;i--)if(waiting[i].priority>=threshold)waiting.splice(i,1)[0].reject(Error('Análise adiada para priorizar sua operação.'));},snapshot:()=>({active,pending:waiting.length}),setLimit(n){limit=Math.max(1,Math.min(2,Number(n)||1));drain();}};
}

// A120Hz display may deliberately pace the WebView at60Hz. Avoid treating that steady cadence
// as repeated jank; never calibrate below60Hz, which would disguise a uniformly slow30Hz view.
export function frameOverrunRatio(intervals,refreshRateHz=60){
 const sorted=intervals.filter(n=>Number.isFinite(n)&&n>0).sort((a,b)=>a-b);if(!sorted.length)return 0;
 const observed=sorted[Math.floor((sorted.length-1)*.2)],nativePeriod=1000/(refreshRateHz>0?refreshRateHz:60);
 const deadline=Math.max(nativePeriod,Math.min(1000/60,observed));return sorted.filter(n=>n>deadline*1.5).length/sorted.length;
}
