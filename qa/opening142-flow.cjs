const assert=require('node:assert/strict');
const {assertControlSpacing}=require('./ui-spacing.cjs');
const {openWithFrames}=require('./management-opening142.cjs');
async function exercise(page,capture){
 await page.waitForFunction(()=>window.__AGRO_UI_BOOT_READY__||window.__AGRO_UI_BOOT_FAULT__,null,{timeout:40000});
 assert.equal(await page.evaluate(()=>window.__AGRO_UI_BOOT_FAULT__||null),null);
 assert.equal(await page.evaluate(()=>TERRITORIO_VERSION),'0.12.142');
 assert.equal(await page.evaluate(()=>ERPPreview.model().data.dataContext.id),'place135-synthetic');
 const act=(n,d={})=>page.evaluate(async([n,d])=>ERPPreview.actions[n](d),[n,d]);
 const settle=async()=>{await page.waitForTimeout(100);await page.waitForFunction(()=>!document.getAnimations().some(a=>a.playState==='running'&&a.effect?.getComputedTiming().iterations!==Infinity),null,{timeout:15000});};
 const close=async()=>{if(await page.locator('#dialog').evaluate(d=>d.open))await act('close-modal');await settle();};
 const nav=async p=>{await close();await act('nav',{page:p});await settle();};
 const fit=async label=>{const r=await page.evaluate(()=>{const d=document.getElementById('dialog'),b=d.getBoundingClientRect();return {page:document.documentElement.scrollWidth,width:innerWidth,l:b.left,r:b.right,w:d.clientWidth,scroll:d.scrollWidth,open:d.open};});assert(r.page<=r.width+3,label+' overflow');if(r.open)assert(r.l>=-3&&r.r<=r.width+3&&r.scroll<=r.w+3,label+' sheet overflow');return assertControlSpacing(page,label);};
 await page.evaluate(()=>{const d=ERPPreview.model().data;d.productPeriodReports=TerritorioProductPeriodReports.reconcileProductPeriods(d).state;});
 const original=await page.evaluate(()=>JSON.stringify(ERPPreview.model().data)),checks={},measurements=[],samples=[];
 for(const p of ['Estoque','Clientes','Eventos','Gestão','Vender']){await nav(p);assert.equal(await page.evaluate(()=>ERPPreview.state().page),p);}
 checks.fiveTabs=true;await act('settings');await settle();assert.equal(await page.locator('.settings-about-name').innerText(),'AGRO Gestão Codex');assert.match(await page.locator('.settings-about-version').innerText(),/0\.12\.142.*Codex/);await act('settings-back');await settle();checks.codexIdentity=true;
 await nav('Gestão');assert.equal(await page.locator('.mgh-hub .mgh-link').count(),14);assert.equal(await page.locator('.records-entry').count(),0);checks.singleManagementHub=true;
 await page.evaluate(()=>{window.__o142Hub=TerritorioManagementHub;window.__o142Calls=0;TerritorioManagementHub={...TerritorioManagementHub,hubIndicators:(...args)=>{__o142Calls++;return __o142Hub.hubIndicators(...args);}};});await page.waitForTimeout(1600);assert.equal(await page.evaluate(()=>__o142Calls),0);checks.noClosedAreaKpiPrecompute=true;
 const sale=await page.evaluate(()=>{const m=ERPPreview.model(),p=m.product('qa-especial-0');Object.assign(p,{price:4500,cost:2500,costKnown:true});const s=m.complete({operationId:'opening142-sale',scope:'loja',items:[{productId:p.id,rawQty:'1'}],payment:'Pix',discountMode:'R$',discountValue:'0'});ERPPreview.persist();return s.id;});
 for(const key of ['ranking','vendas','resultado','caixa','custos','produtos','estoque','clientes','fornecedores','indicadores','comparacao','orientacoes','simulacoes','arquivos']){
  samples.push(await openWithFrames(page,key));await settle();assert.doesNotMatch(await page.locator('#dialog .dialog-content').innerText(),/Não foi possível montar|undefined|NaN/);assert.equal(await page.locator('#dialog [data-action="close-modal"]').count(),1);measurements.push(await fit(key));if(['ranking','resultado','orientacoes','arquivos'].includes(key))await capture('ready-'+key);await close();
 }
 checks.firstFrameContentAllSections=samples.length===14&&samples.every(s=>s.contentReadyAtOpening);checks.noBlankIntermediateFrame=samples.every(s=>s.threeFramesReady);checks.allManagementTopics=true;checks.firstFramesFromActualTaps=true;
 await act('mg-detail',{key:'orientacoes'});await settle();await page.locator('#mgh-question').fill('Qual foi a receita deste período?');await act('mgh-eye',{key:'orientacoes'});assert.equal(await page.locator('#mgh-question').inputValue(),'Qual foi a receita deste período?');assert.equal(await page.locator('.mgh-advisor-slot,[data-mgh-advisor]').count(),0);checks.questionAndPrivacyPreserved=true;await close();
 await page.evaluate(id=>{const s=ERPPreview.model().data.sales.find(s=>s.id===id);s.items[0].costKnown=false;},sale);await act('mg-detail',{key:'resultado'});assert.equal(await page.locator('.report-cost-warning').count(),1);await settle();await capture('ready-missing-cost');await close();checks.costWarningReadyWithoutSecondWindow=true;
 await act('mg-detail',{key:'ranking'});await act('close-modal');await act('settings');await settle();assert.equal(await page.locator('.settings-about-name').innerText(),'AGRO Gestão Codex');await act('settings-back');await settle();checks.openingCannotReplaceNextPage=true;
 await nav('Gestão');await act('mg-detail',{key:'resultado'});await settle();const before=await page.evaluate(()=>ERPPreview.selection().month);await act('mgh-shift',{key:'resultado',delta:-1});assert.notEqual(await page.evaluate(()=>ERPPreview.selection().month),before);assert.equal(await page.locator('.mgh-advisor-slot').count(),0);await settle();await act('mgh-shift',{key:'resultado',delta:1});await settle();checks.periodSwitchHasNoIntermediateWindow=true;await close();
 await page.evaluate(original=>{TerritorioManagementHub=__o142Hub;delete window.__o142Hub;delete window.__o142Calls;ERPPreview.model().data=JSON.parse(original);if(!ERPPreview.persist())throw Error('Restore failed');},original);await nav('Vender');assert.equal(await page.evaluate(()=>JSON.stringify(ERPPreview.model().data)),original);checks.syntheticDataRestored=true;checks.spacingMeasurements=measurements.reduce((n,r)=>n+r.checks,0);checks.openingSamples=samples;return checks;
}
module.exports={exercise};
