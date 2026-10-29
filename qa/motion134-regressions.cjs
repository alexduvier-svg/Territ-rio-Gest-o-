const assert=require('node:assert/strict');

// Only synthetic browser/fixture sessions call this flow; no sale or registration is saved.
async function exerciseMotion(page){
 const checks={},act=(name,data={})=>page.evaluate(([name,data])=>ERPPreview.actions[name](data),[name,data]);
 const settle=async()=>{await page.waitForTimeout(80);await page.waitForFunction(()=>!document.getAnimations().some(a=>a.playState==='running'&&a.effect?.getComputedTiming().iterations!==Infinity)&&!TerritorioMotion.diagnostics().pageTransition,null,{timeout:15000});await page.waitForTimeout(80);};
 const clickNav=async name=>{await page.locator('#nav button[data-page="'+name+'"]').click({force:true});};
 const domain=()=>page.evaluate(()=>JSON.stringify(Object.fromEntries(['products','sales','clients','events','movements','expenses'].map(k=>[k,ERPPreview.model().data[k]]))));
 const original=await domain();
 await clickNav('Vender');await settle();
 const moving=await page.evaluate(()=>!matchMedia('(prefers-reduced-motion: reduce)').matches&&document.documentElement.dataset.reduceEffects!=='true');
 if(moving){
  await clickNav('Estoque');await page.waitForTimeout(510);
  const before=await page.evaluate(()=>{window.__motion134Incoming=document.getElementById('app').getAnimations({subtree:true}).filter(a=>a.playState==='running');return {count:__motion134Incoming.length,owned:TerritorioMotion.diagnostics().pageTransition};});
  assert(before.count>0&&before.owned,'Incoming tab spring lost ownership before settling');
  await clickNav('Vender');
  assert(await page.evaluate(()=>__motion134Incoming.every(a=>a.playState!=='running')),'A late interruption left the old incoming animations running');
  await settle();checks.lateInterruptionCancelsWholeGroup=true;
 }
 for(const name of ['Clientes','Gestão','Estoque','Eventos','Vender']){await clickNav(name);await page.waitForTimeout(35);}
 await settle();assert.equal(await page.evaluate(()=>ERPPreview.state().page),'Vender');
 assert.equal(await page.locator('.fluid-page-morph-layer,.stock-leaving').count(),0);
 assert.equal(await page.locator('#nav .nav-physical-part').count(),0,'Navigation icon styles were not restored');checks.rapidTabsAndIconCleanup=true;
 await page.locator('#app [data-action="profile"]').first().click();await settle();assert(await page.locator('dialog[open]').count());await act('close-modal');await settle();checks.profileSheet=true;
 await clickNav('Estoque');await settle();
 // Change stock levels while the old spring is still running; each new intent replaces it.
 for(let i=0;i<3;i++){
  await page.locator('#app [data-action="stock-area"][data-area="Cafés"]').click({force:true});
  await page.locator('#app [data-action="stock-sub"]').first().click({force:true});
  await act('stock-sub-back');await act('stock-area-home');
  assert((await page.locator('.stock-leaving').count())<=1,'Stock snapshots accumulated');
 }
 await settle();assert.equal(await page.locator('.stock-leaving').count(),0);assert.equal(await page.locator('#feira-list').evaluate(el=>el.style.transformOrigin),'');checks.rapidStockLevels=true;
 await page.locator('#app [data-action="new-product"]').first().click();await settle();assert.equal(await page.evaluate(()=>ERPPreview.state().page),'Produto');
 assert((await page.locator('#stock-picker-search').count())>0,'Product entry picker did not open');await act('cancel-product');await settle();
 await act('duplicate-existing-edit',{id:'qa-banana-prata'});await settle();
 assert((await page.locator('#app .registration-dimensions .dimension-pill.acc').count())>0,'Existing product dimensions were not decorated');await act('cancel-product');await settle();checks.productDraftAndCancel=true;
 await clickNav('Clientes');await settle();await page.locator('#app [data-action="new-client"]').first().click();await settle();assert((await page.locator('#dialog input').count())>0);await act('close-modal');await settle();checks.clientDraftAndClose=true;
 await clickNav('Eventos');await settle();await page.locator('#app [data-action="new-event"]').first().click();await settle();assert((await page.locator('#dialog input').count())>0);await act('close-modal');await settle();checks.eventDraftAndClose=true;
 await clickNav('Vender');await settle();assert.equal(await domain(),original,'Motion/registration drafts changed persisted business records');
 assert.equal(await page.locator('.fluid-page-morph-layer,.stock-leaving,.fluid-exit-layer,.fluid-sheet-ghost-layer').count(),0);checks.domainUnchanged=true;checks.finalCleanup=true;return checks;
}
module.exports={exerciseMotion};
