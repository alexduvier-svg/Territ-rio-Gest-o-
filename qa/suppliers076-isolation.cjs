const assert=require('node:assert/strict');
async function training(p){
 const act=(n,d={})=>p.evaluate(([n,d])=>ERPPreview.actions[n](d),[n,d]);
 const real=await p.evaluate(()=>JSON.stringify(ERPPreview.model().data.supplierBook));
 await Promise.all([p.waitForEvent('load'),act('training-examples')]);await p.waitForFunction(()=>window.TerritorioSuppliers&&TerritorioWorkspace.active);await p.waitForTimeout(600);
 if(await p.evaluate(()=>window.Capacitor?.isNativePlatform?.()))await p.evaluate(()=>Capacitor.nativePromise('KeepAwake','keepAwake',{}));
 assert.equal(await p.evaluate(()=>ERPPreview.model().data.supplierBook),undefined);await act('nav',{page:'Estoque'});await act('sup-toggle');await act('sup-new');await p.locator('#sup-name').fill('Fornecedor Apenas do Treino');await act('sup-save');await p.waitForSelector('#dialog[data-kind=workflow-supplier-detail]');assert.equal(await p.evaluate(()=>ERPPreview.model().data.supplierBook.suppliers.length),1);await act('sup-back');
 await Promise.all([p.waitForEvent('load'),act('training-exit')]);await p.waitForFunction(()=>window.TerritorioSuppliers&&!TerritorioWorkspace.active);await p.waitForTimeout(600);if(await p.evaluate(()=>window.Capacitor?.isNativePlatform?.()))await p.evaluate(()=>Capacitor.nativePromise('KeepAwake','keepAwake',{}));assert.equal(await p.evaluate(()=>JSON.stringify(ERPPreview.model().data.supplierBook)),real);return true;
}
async function budget(p){
 const act=(n,d={})=>p.evaluate(([n,d])=>ERPPreview.actions[n](d),[n,d]);
 const raw=await p.evaluate(()=>JSON.stringify(ERPPreview.model().data));await p.evaluate(()=>{const d=ERPPreview.model().data,s=d.supplierBook;for(let i=0;i<500;i++)s.suppliers.push({id:'budget-'+i,name:'Fornecedor Orçamento '+i,clientId:'',phone:'',category:'Material',updatedAt:new Date().toISOString(),archived:false});const base=d.products[0];for(let i=0;i<2500;i++)d.products.push({...base,id:'item-budget-'+i,name:'Material Orçamento '+i});});
 await act('nav',{page:'Estoque'});await act('sup-toggle');assert.equal(await p.locator('#sup-results .sup-entry').count(),20);await act('sup-request-new');assert(await p.locator('#sup-productId option').count()<=51);await p.locator('[data-sup-picker=productId]').evaluate(e=>{e.value='Orçamento';e.dispatchEvent(new Event('input',{bubbles:true}));});assert(await p.locator('#sup-productId option').count()<=51);await act('sup-back');await p.evaluate(raw=>{ERPPreview.model().data=new ERP.ERPModel(JSON.parse(raw)).data;ERPPreview.persist();ERPPreview.render();},raw);return true;
}
module.exports={training,budget};
