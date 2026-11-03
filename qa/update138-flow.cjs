const assert=require('node:assert/strict');
async function exerciseNew(page,capture){
 await page.waitForFunction(()=>window.ERPPreview&&window.TerritorioAgent&&window.__AGRO_UI_BOOT_READY__);
 const checks={},act=(name,data={})=>page.evaluate(async([name,data])=>ERPPreview.actions[name](data),[name,data]);
 const settle=async()=>{await page.waitForTimeout(120);await page.waitForFunction(()=>!document.getAnimations().some(a=>a.playState==='running'&&a.effect?.getComputedTiming().iterations!==Infinity));};
 const close=async()=>{if(await page.locator('#dialog').evaluate(d=>d.open))await act('close-modal');await settle();};
 const nav=async name=>{await close();await act('nav',{page:name});await settle();};
 const fit=async()=>{const r=await page.locator('#dialog').evaluate(d=>({width:d.clientWidth,scroll:d.scrollWidth,left:d.getBoundingClientRect().left,right:d.getBoundingClientRect().right,viewport:innerWidth}));assert(r.scroll<=r.width+3&&r.left>=-3&&r.right<=r.viewport+3,JSON.stringify(r));};
 assert.equal(await page.evaluate(()=>ERPPreview.model().data.dataContext.id),'place135-synthetic');
 const before=await page.evaluate(()=>JSON.stringify(ERPPreview.model().data));
 await nav('Vender');assert.equal(await page.locator('#app .stock-alert-chip').count(),1);assert.equal(await page.locator('#app [data-id="qa-salame-zero"] .out-dot').count(),1);checks.zeroStockInLoja=true;
 await act('stock-alert-open');await settle();assert.equal(await page.locator('[data-action="stock-alert-later"]').count(),1);
 const ackBefore=await page.evaluate(()=>JSON.stringify(ERPPreview.model().data.stockAlerts.ack||{}));
 await page.evaluate(()=>{window.__q138durable=TerritorioNative.durable;TerritorioNative.durable=async()=>false;});await act('stock-alert-later',{ids:'qa-salame-zero'});assert.equal(await page.evaluate(()=>JSON.stringify(ERPPreview.model().data.stockAlerts.ack||{})),ackBefore);
 await page.evaluate(()=>{TerritorioNative.durable=__q138durable;delete window.__q138durable;});await act('stock-alert-later',{ids:'qa-salame-zero'});await settle();assert.equal(await page.locator('#app .stock-alert-chip').count(),0);
 await page.evaluate(()=>{const m=ERPPreview.model();m.move('qa-salame-zero','add',1,'Reposição fictícia QA138');});await act('nav',{page:'Vender'});await settle();assert.equal(await page.evaluate(()=>!!ERPPreview.model().data.stockAlerts.ack?.['qa-salame-zero']),false);
 await page.evaluate(()=>{const m=ERPPreview.model();m.move('qa-salame-zero','loss',1,'Perda fictícia QA138');});await act('nav',{page:'Vender'});await settle();assert.equal(await page.locator('#app .stock-alert-chip').count(),1);checks.stockAckRollbackAndRearm=true;
 // Actual domain sales on the synthetic model, with historical names and one unknown cost.
 await page.evaluate(()=>{const m=ERPPreview.model();m.product('qa-queijo').costKnown=false;m.product('qa-queijo').cost=0;
  for(let i=0;i<7;i++){const sale=m.complete({operationId:'qa138-'+i,scope:'loja',items:[{productId:i===6?'qa-queijo':'qa-banana-prata',rawQty:'1'}],payment:'Pix',discountMode:'R$',discountValue:'0',clientName:'Cliente Fictício '+i,uf:'MG',city:'Carangola'});sale.date=new Date(Date.now()-3600000+i*120000).toISOString();}
  ERPPreview.render();});
 if(!await page.evaluate(()=>ERPPreview.model().data.settings.financialVisible))await act('toggle-financial');
 await act('day-summary');await settle();assert.equal(await page.locator('.ds-highlights').count(),1);assert.equal(await page.locator('.ds-sold-time').count(),1);assert.match(await page.locator('.ds-highlights').innerText(),/7 itens/);assert.match(await page.locator('.ds-sold-time').innerText(),/Pix/);assert.match(await page.locator('.ds-highlights').innerText(),/Cliente Fictício/);assert((await page.locator('.ds-sold-time details').count())>0);await page.locator('.ds-sold-time details summary').first().click();await fit();await capture('day-summary-expanded');checks.daySummaryTimeAndBuyers=true;
 await nav('Gestão');await act('management-scope',{scope:'all'});await act('mg-period-mode',{mode:'mes'});await settle();
 assert.equal(await page.locator('#app .mg-brain-entry').count(),1);assert.equal(await page.locator('#app .topbar [data-action="brain"]').count(),0);assert.equal(await page.locator('[data-explore-group="market"] .mg-advisor').count(),1);checks.managementReorganized=true;
 await act('mg-detail',{key:'horarios'});await settle();assert.equal(await page.locator('.mg-sales-time').count(),1);await page.locator('.mg-sales-time summary').first().click();await fit();await capture('management-sales-time');await close();checks.managementTimedSales=true;
 const shell=await page.evaluate(()=>{ERPPreview.actions.brain({source:'management'});return !!document.querySelector('.brain-shell[aria-busy="true"]');});assert(shell,'Brain opens an immediate shell');await page.waitForSelector('.brain-comparison');await settle();assert.equal(await page.locator('#brain-current,#brain-previous').count(),0);assert.match(await page.locator('.brain-comparison').innerText(),/Comparação com o período anterior/i);await fit();await capture('brain-comparison');checks.brainShellAndAutomaticComparison=true;
 const comparison=await page.locator('.brain-comparison').innerText();assert.match(comparison,/mesmo dia|andamento/);assert.match(comparison,/parcial/i);checks.comparisonEquivalentWindowAndUnknownCost=true;
 await close();await act('brain',{source:'management'});await act('close-modal');await act('profile');await page.waitForTimeout(1100);assert.equal(await page.locator('#dialog').getAttribute('data-kind'),'business');await close();checks.closedBrainNeverRevives=true;
 if(!await page.evaluate(()=>ERPPreview.model().data.settings.financialVisible))await act('toggle-financial');await page.evaluate(()=>TerritorioAgent.ask('quanto vendi hoje'));await settle();assert.match(await page.locator('.agent-answer').innerText(),/R\$\s*88,00 em 7 vendas/);await fit();await capture('local-question');await close();checks.localQuestionCanonicalTotal=true;
 await nav('Vender');await act('settings');await settle();await act('about-app');await settle();assert.equal(await page.locator('.about-app-card').count(),3);assert.match(await page.locator('#dialog').innerText(),/provedor externo/);await fit();await capture('about-app');await close();await act('settings-back');await settle();checks.aboutAppAccurate=true;
 await page.evaluate(before=>{ERPPreview.model().data=JSON.parse(before);ERPPreview.render();},before);await nav('Vender');checks.newJourneysSyntheticOnly=true;
 return checks;
}
module.exports={exerciseNew};
