import{Capacitor,registerPlugin}from'@capacitor/core';
import{createAdaptivePolicy,createResourceQueue,frameOverrunRatio}from'./policy.js';
import'./resources.css';
const native=registerPlugin('AgroAgentScheduler');
export function installResourcePolicy(){
 const root=document.documentElement,b=()=>window.TerritorioWorkflowBridge,media=matchMedia('(prefers-reduced-motion: reduce)'),transparency=matchMedia('(prefers-reduced-transparency: reduce)'),slow=matchMedia('(update: slow)');
 const queue=createResourceQueue(),history=[],observations=[],windows=new Map();let nativeSignals={},timer=0,isMoving=()=>false,frame=0,previousFrame=0,burstAt=0,intervals=[];
 const policy=createAdaptivePolicy({onChange:s=>{const simplify=s.workloadMode==='serial';root.classList.toggle('lite',simplify);root.dataset.motionLite=String(simplify);root.dataset.resourceLayout=s.layoutMode;root.dataset.window=s.layoutMode;root.dataset.height=s.shortWindow?'compact':'normal';root.dataset.effects=s.effectsMode;root.dataset.workload=s.workloadMode;root.dataset.shortWindow=String(s.shortWindow);queue.setLimit(s.heavyTaskConcurrency);history.push({at:Math.round(performance.now()),reason:s.reasonCode,mode:s.effectsMode});if(history.length>30)history.shift();document.dispatchEvent(new CustomEvent('territorio:resource-policy',{detail:s}));}});
 const refresh=()=>policy.update({width:window.visualViewport?.width||innerWidth,height:window.visualViewport?.height||innerHeight,cores:navigator.hardwareConcurrency,memoryGB:navigator.deviceMemory,saveData:navigator.connection?.saveData===true,reduceMotion:media.matches||root.dataset.reduceEffects==='true',reduceTransparency:transparency.matches||root.dataset.reduceTransparency==='true',slowDisplay:slow.matches,noBlur:!globalThis.CSS?.supports?.('backdrop-filter','blur(1px)'),foreground:!document.hidden,...nativeSignals},b()?.data()?.settings.performanceMode||'auto');
 const schedule=()=>{clearTimeout(timer);timer=setTimeout(refresh,80);};
 window.TerritorioResourcePolicy=Object.freeze({snapshot:()=>policy.snapshot(),watchMotion:getter=>{isMoving=getter;},limitFor:(key,total)=>Math.min(total,windows.get(key)||policy.snapshot().productPageSize),more:key=>windows.set(key,(windows.get(key)||policy.snapshot().productPageSize)+policy.snapshot().productPageSize),refresh,observe:sample=>{if(Number.isFinite(sample?.duration)){observations.push({kind:sample.kind,duration:Math.round(sample.duration)});if(observations.length>64)observations.shift();}const result=policy.observe(sample);if(result){clearTimeout(timer);timer=setTimeout(refresh,120100);}return result;},run:(work,options)=>document.hidden?Promise.reject(Error('Consulta adiada até voltar ao app.')):queue.run(work,options),diagnostics:()=>({policy:policy.snapshot(),queue:queue.snapshot(),changes:history.slice(),observations:observations.slice()}),cancelOptional:()=>queue.cancelOptional()});
 window.TerritorioAdaptation=Object.freeze({policy:()=>window.TerritorioResourcePolicy.snapshot()});
 const updateNative=async()=>{if(Capacitor.isNativePlatform())try{nativeSignals=await native.capabilities();}catch{}refresh();};
 media.addEventListener('change',schedule);transparency.addEventListener('change',schedule);slow.addEventListener('change',schedule);navigator.connection?.addEventListener?.('change',schedule);window.addEventListener('resize',schedule,{passive:true});window.visualViewport?.addEventListener('resize',schedule,{passive:true});new MutationObserver(schedule).observe(root,{attributes:true,attributeFilter:['data-reduce-effects','data-reduce-transparency']});
 document.addEventListener('visibilitychange',()=>{clearTimeout(timer);if(document.hidden){queue.cancelOptional(0);policy.update({foreground:false});}else{policy.resetForeground();void updateNative();}});window.addEventListener('territorio:resume',()=>void updateNative());
 // Sample only actual user-triggered motions; never run an idle frame loop or persist a device ranking.
 const startedAt=performance.now();
 const stopFrames=()=>{cancelAnimationFrame(frame);frame=0;previousFrame=0;intervals=[];};
 const sampleFrames=time=>{
  if(document.hidden||window.__AGRO_DIAGNOSTIC_SESSION__){stopFrames();return;}
  if(previousFrame)intervals.push(time-previousFrame);previousFrame=time;
  if(!isMoving()||time-burstAt>=1000){
   if(intervals.length>=8){const ratio=frameOverrunRatio(intervals,nativeSignals.refreshRateHz);
    window.TerritorioResourcePolicy.observe({kind:'frame-burst',duration:ratio*100,budget:10});}
   stopFrames();return;
  }frame=requestAnimationFrame(sampleFrames);
 };
 document.addEventListener('territorio:motion-start',()=>{const t=performance.now();if(frame||document.hidden||window.__AGRO_DIAGNOSTIC_SESSION__||t-startedAt<3000||t-userAt>1200)return;burstAt=t;frame=requestAnimationFrame(sampleFrames);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopFrames();});
 let userAt=-Infinity;for(const type of ['pointerdown','keydown'])document.addEventListener(type,()=>{userAt=performance.now();},{capture:true,passive:true});
 document.addEventListener('territorio:before-page',()=>{if(document.hidden||performance.now()-userAt>1200)return;const started=performance.now();queueMicrotask(()=>requestAnimationFrame(()=>{if(!document.hidden)window.TerritorioResourcePolicy.observe({kind:'local-render',duration:performance.now()-started,budget:500});}));});
 refresh();void updateNative();
}
export function installResourceControls(){const b=window.TerritorioWorkflowBridge;if(!b)return;
 const panel=()=>{if(!document.querySelector('#dialog[data-kind=appearance]')||document.querySelector('#resource-options'))return;const mode=b.data().settings.performanceMode||'auto';document.querySelector('#dialog .dialog-content')?.insertAdjacentHTML('beforeend','<section id="resource-options" class="resource-options"><h3>Desempenho</h3><p>O app se ajusta ao celular. O modo leve simplifica os efeitos e prioriza suas operações.</p><div class="two">'+b.button('resource-mode','Automático','choice'+(mode==='auto'?' selected':''),{mode:'auto'})+b.button('resource-mode','Leve','choice'+(mode==='lite'?' selected':''),{mode:'lite'})+'</div></section>');};
 b.actions['resource-more']=d=>{const keys=[...document.querySelectorAll('#app details[open][data-resource-group]')].map(e=>e.dataset.resourceGroup);window.TerritorioResourcePolicy.more(d.key);b.render();for(const el of document.querySelectorAll('#app details[data-resource-group]'))if(keys.includes(el.dataset.resourceGroup))el.open=true;};
 b.actions['resource-mode']=d=>{if(!['auto','lite'].includes(d.mode))return;const old=b.data().settings.performanceMode;b.data().settings.performanceMode=d.mode;if(!b.persist()){b.data().settings.performanceMode=old;return b.toast('Não foi possível guardar sua preferência.');}window.TerritorioResourcePolicy.refresh();document.querySelector('#resource-options')?.remove();panel();};
 document.addEventListener('territorio:sheet',panel);new MutationObserver(()=>window.TerritorioResourcePolicy.refresh()).observe(document.getElementById('app'),{childList:true});window.TerritorioResourcePolicy.refresh();
}
