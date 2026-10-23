const assert=require('node:assert/strict');
async function exercise(p,capture){
 await p.waitForFunction(()=>window.TerritorioEvents&&window.TerritorioWorkflowBridge);
 assert(await p.evaluate(()=>window.__AGRO_DIAGNOSTIC_SESSION__));
 await p.evaluate(()=>{window.__event075Reports=[];const prior=window.fetch;window.fetch=(url,options)=>{if(String(url).includes('/reports')){__event075Reports.push({url:String(url),body:options?.body});return Promise.resolve(new Response('{}',{status:200,headers:{'content-type':'application/json'}}));}return prior(url,options);};});
 const act=(n,d={})=>p.evaluate(([n,d])=>ERPPreview.actions[n](d),[n,d]),close=async()=>{await act('close-modal');await p.waitForTimeout(450);};
 const records=()=>p.evaluate(()=>JSON.stringify([ERPPreview.model().data.products,ERPPreview.model().data.sales,ERPPreview.model().data.movements]));
 const original=await records();
 await act('nav',{page:'Vender'});await p.waitForTimeout(450);
 assert.match(await p.locator('.event-live-indicator').innerText(),/Feira em Andamento QA/i);
 assert.equal(await p.evaluate(()=>ERPPreview.model().data.events.find(e=>e.id==='event075-stale').status),'finished');
 assert.equal(await p.evaluate(()=>ERPPreview.model().data.events.find(e=>e.id==='event075-legacy').status),'finished');
 await act('nav',{page:'Eventos'});await p.waitForTimeout(450);
 if(await p.locator('.fair-history-list').count()){await act('event-history');await p.waitForTimeout(450);}
 const card=id=>p.locator('.event-card').filter({has:p.locator('[data-action=event-detail][data-id="'+id+'"]')});
 const scheduled=card('event075-scheduled');assert.equal(await scheduled.count(),1);assert.equal(await scheduled.locator('.event-status').innerText(),'Agendado');
 const green=await scheduled.locator('.event-status').evaluate(e=>{const probe=document.createElement('i');probe.style.color='var(--accent-ink,var(--action-green))';e.append(probe);const expected=getComputedStyle(probe).color;probe.remove();return{actual:getComputedStyle(e).color,expected};});assert.equal(green.actual,green.expected);
 for(const id of ['event075-stale','event075-legacy','event075-pending','event075-cancelled'])assert.equal(await card(id).count(),0);
 await act('event-history');await p.waitForTimeout(450);
 for(const id of ['event075-stale','event075-legacy','event075-pending','event075-cancelled'])assert.equal(await card(id).locator('xpath=ancestor::*[contains(@class,"fair-history-list")]').count(),1);
 assert.equal(await card('event075-stale').locator('.event-status').innerText(),'Encerrada');
 assert.equal(await card('event075-cancelled').locator('.event-status').innerText(),'Cancelado');
 for(const id of ['event075-legacy','event075-pending']){
  const badge=card(id).locator('.event-status');assert.equal(await badge.innerText(),'Conferência Pendente');assert.equal(await badge.locator('.event-pending-icon').count(),1);
  const fit=await badge.evaluate(e=>({fill:e.querySelector('svg').getAttribute('fill'),color:getComputedStyle(e).color,cut:e.scrollWidth>e.clientWidth+1}));assert.equal(fit.fill,'none');assert(!fit.cut);assert(['rgb(150, 80, 0)','rgb(255, 179, 64)'].includes(fit.color),JSON.stringify(fit));
 }
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 if(capture){await card('event075-legacy').scrollIntoViewIfNeeded();await capture('history');}
 // Adiar does not claim a completed closure, nor write a sale or stock adjustment.
 await act('event-detail',{id:'event075-pending'});assert.equal(await p.locator('#dialog .event-status').innerText(),'Conferência Pendente');
 assert.equal(await p.locator('#dialog [data-action=fair-finish]').innerText(),'Conferir Evento');
 await act('fair-finish',{id:'event075-pending'});await act('surplus-skip');await p.waitForSelector('#dialog[data-kind=fair-done]');await close();
 assert(await p.evaluate(()=>ERPPreview.model().eventLifecycle('event075-pending').pending));
 await act('event-detail',{id:'event075-pending'});await act('fair-finish',{id:'event075-pending'});await act('surplus-confirm');await p.waitForSelector('#dialog[data-kind=fair-done]');await close();
 assert(await p.evaluate(()=>ERPPreview.model().eventLifecycle('event075-pending').closed));
 await act('event-detail',{id:'event075-pending'});assert.equal(await p.locator('#dialog .event-status').innerText(),'Encerrada');assert.equal(await p.locator('#dialog [data-action=fair-finish]').count(),0);await close();
 // An old skipped official closing is resumable despite its historical closedAt.
 await act('event-detail',{id:'event075-legacy'});await act('fair-finish',{id:'event075-legacy'});assert.equal(await p.locator('#dialog .surplus-correction-card').count(),3);
 assert.equal(await p.evaluate(()=>__event075Reports.length),0,'No completed report before confirmation');
 await act('surplus-confirm');await p.waitForSelector('#dialog[data-kind=fair-done]');await close();
 // Closing during the scheduled hours must still end ALL sale routing immediately.
 await act('fair-finish',{id:'event075-live'});await act('surplus-confirm');await p.waitForSelector('#dialog[data-kind=fair-done]');await close();
 await act('nav',{page:'Vender'});assert.equal(await p.locator('.event-live-indicator').count(),0);
 assert.equal(await p.evaluate(()=>ERPPreview.model().data.events.find(e=>e.id==='event075-live').status),'finished');
 await p.locator('.glass-location').click();assert.equal(await p.locator('#dialog [data-action=set-scope][data-id=event075-live]').count(),0);await close();
 assert.equal(await records(),original,'Lifecycle updates must not alter products/sales/movements');
 assert.equal(await p.evaluate(()=>__event075Reports.length),2,'One report per confirmed official fair');
 await p.reload();await p.waitForFunction(()=>window.TerritorioEvents&&window.TerritorioWorkflowBridge);await p.waitForTimeout(500);
 if(await p.evaluate(()=>window.Capacitor?.isNativePlatform?.()))await p.evaluate(()=>Capacitor.nativePromise('KeepAwake','keepAwake',{}));
 await act('nav',{page:'Vender'});assert.equal(await p.locator('.event-live-indicator').count(),0);
 await act('nav',{page:'Eventos'});if(!await card('event075-live').count())await act('event-history');
 assert.equal(await card('event075-live').locator('.event-status').innerText(),'Encerrada');
 assert.equal(await scheduled.locator('.event-status').innerText(),'Agendado');
 return{staleOfficialArchived:true,noFalseActive:true,scheduledGreen:true,pendingOrangeTriangle:true,deferredResumable:true,legacyResumable:true,confirmedClosed:true,noStockOrSaleMutation:true,officialReportOnce:true,reload:true};
}
module.exports={exercise};
