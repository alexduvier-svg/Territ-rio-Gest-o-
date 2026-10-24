const assert=require('node:assert/strict');const{seedWorkflows}=require('./continuity086-flow.cjs');
async function exercise(p,capture){
 const act=(n,d={})=>p.evaluate(([n,d])=>ERPPreview.actions[n](d),[n,d]),stage=(s,v)=>process.stdout.write('DIAGNOSTIC '+s+(v?' '+JSON.stringify(v):'')+'\n');
 await act('cancel-product');if(await p.locator('#dialog').evaluate(d=>d.open))await act('close-modal');
 stage('baseline-nav');await act('nav',{page:'Gestão'});await p.waitForTimeout(700);await p.evaluate(async()=>{await TerritorioJourneys.refresh(true);});stage('baseline-reviewed');
 await p.locator('#app [data-action=agent-journey-open]').click();await p.waitForSelector('#dialog[data-kind=agent-journeys]');stage('baseline-opened');await act('close-modal');await p.waitForTimeout(800);
 await p.evaluate(seedWorkflows);stage('seeded-canonical');
 stage('source-shape',await p.evaluate(()=>({events:ERPPreview.model().data.events.map(e=>TerritorioAgentBridge.eventLifecycle(e.id)),agent:TerritorioAgent.diagnostics(),journeys:TerritorioJourneys.diagnostics()})));
 const cd=await p.context().newCDPSession(p);await cd.send('Debugger.enable');let done=false;
 const refresh=p.evaluate(async()=>{await TerritorioJourneys.refresh(true);}).then(()=>{done=true;stage('review-finished');},e=>{done=true;stage('review-error',String(e));});
 await new Promise(r=>setTimeout(r,1500));
 if(!done){const stopped=new Promise(r=>cd.once('Debugger.paused',r));await cd.send('Debugger.pause');const pause=await stopped;stage('paused-stack',pause.callFrames.map(f=>({name:f.functionName,url:f.url,loc:f.location})));stage('heap',await cd.send('Runtime.getHeapUsage'));await cd.send('Debugger.resume');throw Error('Diagnostic pause captured before renderer failure');}
 await refresh;await p.locator('#app [data-action=agent-journey-open]').click();await p.waitForSelector('#dialog[data-kind=agent-journeys]');assert.equal(await p.locator('#dialog .agent-journey-card').count(),4);stage('three-domains-opened');if(capture)await capture('diagnostic-three-domains');return{diagnosticOnly:true};
}
module.exports={exercise};
