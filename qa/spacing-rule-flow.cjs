const assert=require('node:assert/strict');
const {assertControlSpacing}=require('./ui-spacing.cjs');
async function exerciseSpacing(page,capture){
 await page.waitForFunction(()=>window.__AGRO_UI_BOOT_READY__||window.__AGRO_UI_BOOT_FAULT__);assert.equal(await page.evaluate(()=>window.__AGRO_UI_BOOT_FAULT__||null),null);
 assert.equal(await page.evaluate(()=>ERPPreview.model().data.dataContext.id),'place135-synthetic');
 const act=(n,d={})=>page.evaluate(async([n,d])=>ERPPreview.actions[n](d),[n,d]),settle=async()=>{await page.waitForTimeout(120);await page.waitForFunction(()=>!document.getAnimations().some(a=>a.playState==='running'&&a.effect?.getComputedTiming().iterations!==Infinity));},rows=[];
 const close=async()=>{if(await page.locator('#dialog').evaluate(d=>d.open))await act('close-modal');await settle();};
 const inspect=async label=>{await settle();rows.push(await assertControlSpacing(page,label));const fit=await page.evaluate(()=>({w:innerWidth,scroll:document.documentElement.scrollWidth}));assert(fit.scroll<=fit.w+3,label+' horizontal overflow');};
 await close();await act('nav',{page:'Gestão'});await inspect('Gestão · blocos independentes');
 await act('sales-records');await inspect('Vendas · filtros e rodapé');await close();
 await act('restock-ids',{ids:'qa-especial-0,qa-especial-1,qa-especial-2,qa-especial-3,qa-especial-4,qa-especial-5'});await inspect('Reposição · teclado e ações');await capture('restock-spacing');await act('restock-list');await inspect('Reposição · lista');await close();
 await page.evaluate(()=>{const m=ERPPreview.model();if(m.data.dataContext.id!=='place135-synthetic')throw Error('Synthetic only');m.complete({operationId:'spacing-sale',scope:'loja',items:[{productId:'qa-banana-prata',rawQty:'1'}],payment:'Pix',discountMode:'R$',discountValue:'0'});});
 await act('mg-detail',{key:'produtos'});await settle();assert.equal(await page.locator('.mg-pareto-curve').count(),2);await inspect('Produtos · concentração de receita e lucro');await capture('pareto-spacing');await close();
 await act('metrics-open');await page.locator('.indicator-group').evaluateAll(es=>es.forEach(e=>e.open=true));await inspect('Indicadores · grupos expandidos');await close();
 await act('metrics-roi');await inspect('ROI · campos e ações');await close();
 await act('nav',{page:'Vender'});await act('sell-product',{id:'qa-banana-prata'});await settle();await page.evaluate(()=>{document.getElementById('sale-quantity').value='1';document.getElementById('sale-quantity').dispatchEvent(new Event('input',{bubbles:true}));});await act('open-cart');await inspect('Revisão da venda');await act('payment',{value:'Crédito'});await settle();await page.evaluate(()=>{document.getElementById('card-installment-count').value='3';document.getElementById('card-installment-count').dispatchEvent(new Event('input',{bubbles:true}));});await act('number-pad-close');await inspect('Parcelamento · datas e ações');await capture('installment-spacing');await act('card-save');await inspect('Crédito · resumo e alteração');
 const checks=rows.reduce((n,r)=>n+r.checks,0);assert(checks>20,'Spacing contract must inspect actual controls');return {spacingContract:true,noIndependentControlOverlap:true,scenes:rows,measurements:checks};
}
module.exports={exerciseSpacing};
