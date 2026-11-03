const assert=require('node:assert/strict');
async function exerciseUpdate(page,capture){
 await page.waitForFunction(()=>window.ERPPreview&&window.__AGRO_UI_BOOT_READY__&&window.TerritorioSelection&&window.TerritorioStockLotsUI);
 const checks={},act=(name,data={})=>page.evaluate(async([name,data])=>ERPPreview.actions[name](data),[name,data]);
 const settle=async()=>{await page.waitForTimeout(100);await page.waitForFunction(()=>!document.getAnimations().some(a=>a.playState==='running'&&a.effect?.getComputedTiming().iterations!==Infinity));};
 const close=async()=>{if(await page.locator('#dialog').evaluate(d=>d.open))await act('close-modal');await settle();};
 const nav=async name=>{await close();await act('nav',{page:name});await settle();};
 assert.equal(await page.evaluate(()=>ERPPreview.model().data.dataContext.id),'place135-synthetic');
 const before=await page.evaluate(()=>JSON.stringify(ERPPreview.model().data));
 await nav('Vender');
 // Trusted pointers, including the narrow one-product row and the three-column grid.
 await page.locator('#app .feira-card[data-action="sell-product"]').first().dblclick({delay:60});
 await settle();assert.equal(await page.locator('#dialog').getAttribute('data-kind'),'stock-peek');assert.equal(await page.evaluate(()=>ERPPreview.state().page),'Vender');await close();checks.doubleTapStock=true;
 for(const selector of ['#app .fam-rows .fam-row[data-action="sell-product"]','#app .feira-card[data-action="sell-product"]']){
  const card=page.locator(selector).first();await card.scrollIntoViewIfNeeded();const r=await card.boundingBox();assert(r);
  await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.waitForTimeout(420);
  assert.equal(await page.evaluate(()=>TerritorioSelection.active()),true,'Long hold must select');await page.mouse.up();await page.evaluate(()=>TerritorioSelection.cancel());await settle();
 }
 checks.holdWideAndGrid=true;
 await act('sell-multiple',{ids:'qa-banana-prata,qa-queijo'});await settle();
 await page.evaluate(()=>{ERPPreview.state().draft.items.forEach(i=>i.rawQty='1');ERPPreview.state().draft.quantityReviewCollapsed=false;ERPPreview.render();});
 await act('open-cart');await settle();assert.equal(await page.locator('#dialog').getAttribute('data-kind'),'cart');await close();
 await act('open-cart');await settle();assert.equal(await page.locator('#dialog').getAttribute('data-kind'),'cart');await close();await act('cancel-sale');await settle();checks.cartReopenAndReview=true;
 await nav('Estoque');await act('new-product');await settle();
 await page.locator('[data-action="stock-category-open"]').first().click();await settle();assert.equal(await page.locator('#dialog').getAttribute('data-kind'),'stock-category');await capture('category-picker');await close();
 await act('stock-custom-product');await settle();assert.equal(await page.evaluate(()=>ERPPreview.state().productForm.category),'');
 await act('save-product');await settle();assert.equal(await page.locator('#product-name').getAttribute('aria-invalid'),'true');
 await page.locator('#product-name').fill('Café QA137');await settle();assert.equal(await page.locator('#product-name').getAttribute('aria-invalid'),null);checks.requiredFieldFeedback=true;
 await act('stock-category-pick',{value:'Cafés'});await act('presentation-pick',{index:0,field:'format',value:'Verde'});await settle();
 assert.deepEqual(await page.evaluate(()=>{const v=ERPPreview.state().productForm.variants[0];return [v.unit,v.weight,v.unitConfirmed];}),['Saca',60000,false]);
 await act('presentation-pick',{index:0,field:'format',value:'Moído'});await settle();assert.equal(await page.evaluate(()=>ERPPreview.state().productForm.variants[0].unit),'');checks.greenCoffeeSack=true;
 await act('presentation-more',{index:0,field:'unit'});await settle();assert((await page.locator('[data-action="presentation-option"][data-value="Balde"]').count())>0);
 await page.locator('#dimension-new-value').fill('Caixote QA137');await act('presentation-custom-save');await settle();assert.equal(await page.evaluate(()=>ERPPreview.state().productForm.variants[0].unit),'Caixote QA137');await act('cancel-product');await settle();checks.categoryAndFreePackaging=true;
 // Last member of a family remains restorable after leaving that family.
 await act('stock-remove-do',{id:'qa-queijo'});await settle();assert.equal(await page.evaluate(()=>ERPPreview.model().product('qa-queijo').archived),true);await close();
 await nav('Vender');assert.equal(await page.locator('#app [data-action="sell-product"][data-id="qa-queijo"]').count(),0);
 await nav('Estoque');await page.locator('[data-action="stock-removed"]').first().click();await settle();assert((await page.locator('[data-action="stock-restore"][data-id="qa-queijo"]').count())>0);await act('stock-restore',{id:'qa-queijo'});await settle();assert.equal(await page.evaluate(()=>ERPPreview.model().product('qa-queijo').archived),false);await close();checks.archiveLastFamilyAndRestore=true;
 // A refused native durable write rolls the flag and timestamp back exactly.
 await page.evaluate(()=>{window.__u137Durable=TerritorioNative.durable;TerritorioNative.durable=async()=>false;});
 await act('stock-remove-do',{id:'qa-queijo'});await settle();assert.equal(await page.evaluate(()=>ERPPreview.model().product('qa-queijo').archived),false);assert.equal(await page.evaluate(()=>ERPPreview.model().product('qa-queijo').archivedAt),undefined);
 await page.evaluate(()=>{TerritorioNative.durable=__u137Durable;delete window.__u137Durable;});checks.archiveDurableRollback=true;
 await page.evaluate(()=>{const m=ERPPreview.model();m.move('qa-queijo','add',2,'Entrada fictícia QA137',{lotInput:{state:'unknown',lotCode:'QA137-ENTRADA'}});});
 await act('stock-product',{id:'qa-queijo'});await settle();assert.equal(await page.locator('.movement-available .lot-line').count(),1);assert.equal(await page.locator('.checkout-header .movement-subtitle').count(),1);
 await page.locator('.movement-available .lot-line').click();await settle();await page.locator('#lots-search').fill('QA137-ENTRADA');await page.waitForTimeout(400);await settle();assert.match(await page.locator('.dialog-content').innerText(),/chegaram 2/);assert.equal(await page.locator('#lots-search').evaluate(el=>el===document.activeElement),true);await capture('lot-search');await page.locator('#lots-search').fill('busca-cancelada');await close();checks.lotEntrySearchAndHeader=true;
 await page.evaluate(()=>{const m=ERPPreview.model(),date=ERP.dayKey(Date.now());m.data.supplierBook={version:1,actorId:m.data.dataContext.id,suppliers:[{id:'qa137-supplier',name:'Fornecedor Fictício QA137',clientId:''}],comparisons:[],purchases:[{id:'qa137-purchase',supplierId:'qa137-supplier',quantity:'5',occurredOn:date,createdAt:new Date().toISOString(),item:{productId:'qa-queijo',name:'Queijo',unit:'Unidade',specification:'QA'},source:'producer-confirmed-history'}]};});
 await act('sup-open',{id:'qa137-supplier'});await page.waitForTimeout(400);await settle();assert.equal(await page.locator('#dialog').getAttribute('data-kind'),'workflow-supplier-detail');checks.lotSearchNeverReopensClosedSheet=true;assert.match(await page.locator('.sup-stock').innerText(),/Comprado 5/);assert.match(await page.locator('.sup-stock').innerText(),/Estimativa/);await capture('supplier-stock');await close();checks.supplierTraceExplained=true;
 // Real 30-second expiry must conceal totals without rebuilding an in-progress form.
 await nav('Vender');if(await page.evaluate(()=>ERPPreview.model().data.settings.financialVisible))await act('toggle-financial');
 await act('toggle-financial');await nav('Estoque');await act('new-product');await act('stock-custom-product');await settle();await page.locator('#product-name').fill('Rascunho preservado QA137');
 await page.waitForTimeout(30300);assert.equal(await page.evaluate(()=>ERPPreview.model().data.settings.financialVisible),false);assert.equal(await page.locator('#product-name').inputValue(),'Rascunho preservado QA137');await act('cancel-product');await settle();checks.financialAutoHideAndDraft=true;
 await close();await page.evaluate(before=>{ERPPreview.model().data=JSON.parse(before);ERPPreview.render();},before);await nav('Vender');
 assert.equal(await page.evaluate(()=>JSON.stringify(ERPPreview.model().data)),before,'Synthetic update journey must restore the entire original dataset');checks.updateSyntheticCleanup=true;
 return checks;
}
module.exports={exerciseUpdate};
