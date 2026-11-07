const assert=require('node:assert/strict');
const {assertControlSpacing}=require('./ui-spacing.cjs');

async function exercise(page,capture){
 await page.waitForFunction(()=>window.__AGRO_UI_BOOT_READY__||window.__AGRO_UI_BOOT_FAULT__,null,{timeout:40000});
 assert.equal(await page.evaluate(()=>window.__AGRO_UI_BOOT_FAULT__||null),null);
 assert.equal(await page.evaluate(()=>TERRITORIO_VERSION),'0.12.141');
 assert.equal(await page.evaluate(()=>ERPPreview.model().data.dataContext.id),'place135-synthetic');
 const act=(name,data={})=>page.evaluate(async([n,d])=>{if(!ERPPreview.actions[n])throw Error('Missing '+n);return ERPPreview.actions[n](d);},[name,data]);
 const settle=async()=>{await page.waitForTimeout(180);await page.waitForFunction(()=>!document.getAnimations().some(a=>a.playState==='running'&&a.effect?.getComputedTiming().iterations!==Infinity),null,{timeout:15000});await page.waitForFunction(()=>!document.querySelector('#dialog[open] > .dialog-content > .mgh-advisor-slot[aria-busy]'),null,{timeout:15000});await page.waitForTimeout(80);};
 const close=async()=>{if(await page.locator('#dialog').evaluate(d=>d.open))await act('close-modal');await settle();};
 const nav=async name=>{await close();await act('nav',{page:name});await settle();};
 const input=async(id,value)=>page.evaluate(([id,value])=>{const el=document.getElementById(id)||document.querySelector('[data-sup-field="'+id.replace(/^sup-/, '')+'"]');if(!el)throw Error('Missing '+id);el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},[id,value]);
 const checks={},measures=[];
 const fit=async label=>{
  const r=await page.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth,dialogs:[...document.querySelectorAll('dialog[open]')].map(d=>({l:d.getBoundingClientRect().left,r:d.getBoundingClientRect().right,w:d.clientWidth,sw:d.scrollWidth}))}));
  assert(r.sw<=r.w+3,label+' page overflow '+JSON.stringify(r));for(const d of r.dialogs)assert(d.l>=-3&&d.r<=r.w+3&&d.sw<=d.w+3,label+' dialog overflow '+JSON.stringify(d));
  measures.push(await assertControlSpacing(page,label));
 };
 // Canonical optional-state initialization precedes the snapshot. Otherwise an existing
 // asynchronous report check can legitimately add its empty container after restoration.
 await page.evaluate(()=>{const d=ERPPreview.model().data;d.productPeriodReports=TerritorioProductPeriodReports.reconcileProductPeriods(d).state;});
 const original=await page.evaluate(()=>JSON.stringify(ERPPreview.model().data));
 for(const name of ['Estoque','Clientes','Eventos','Gestão','Vender']){await nav(name);assert.equal(await page.evaluate(()=>ERPPreview.state().page),name);await fit(name);}
 checks.fiveTabs=true;
 await act('settings');await settle();assert.equal(await page.locator('.settings-about-name').innerText(),'AGRO Gestão Codex');assert.match(await page.locator('.settings-about-version').innerText(),/0\.12\.141.*Codex/);await act('settings-back');await settle();checks.codexIdentity=true;
 // The full historical-cost/card/ROI journey from 140, adapted only to the consolidated hub entry.
 Object.assign(checks,await require('./restock140-flow.cjs').exerciseRestock(page,capture));
 Object.assign(checks,await require('./update141-sales-flow.cjs').exerciseSales(page,capture));
 await nav('Gestão');assert.equal(await page.locator('.mgh-hub .mgh-card').count(),4);assert.equal(await page.locator('.mgh-hub .mgh-link').count(),14);assert.equal(await page.locator('.records-entry').count(),0);await fit('Gestão única');await page.waitForTimeout(3900);await capture('management-hub');checks.singleManagementHub=true;
 // Closing the hub performs no hidden KPI work, even after idle callbacks would have run.
 await page.evaluate(()=>{window.__u141Hub=TerritorioManagementHub;window.__u141Calls=0;TerritorioManagementHub={...TerritorioManagementHub,hubIndicators:(...args)=>{__u141Calls++;return __u141Hub.hubIndicators(...args);}};});
 await page.waitForTimeout(1800);assert.equal(await page.evaluate(()=>__u141Calls),0);checks.noClosedAreaKpiPrecompute=true;
 // Create an actual synthetic sale through the canonical model.
 const sale=await page.evaluate(()=>{const m=ERPPreview.model(),p=m.product('qa-especial-0');Object.assign(p,{price:4500,cost:2500,costKnown:true});const s=m.complete({operationId:'u141-sale',scope:'loja',items:[{productId:p.id,rawQty:'1'}],payment:'Pix',discountMode:'R$',discountValue:'0'});ERPPreview.persist();return {id:s.id,total:s.total};});
 const topics=['ranking','vendas','resultado','caixa','custos','produtos','estoque','clientes','fornecedores','indicadores','comparacao','orientacoes','simulacoes','arquivos'];
 for(const key of topics){await act('mg-detail',{key});await settle();const text=await page.locator('#dialog .dialog-content').innerText();assert(!/Não foi possível montar|Não foi possível abrir|undefined|NaN/.test(text),key+': '+text);assert(text.trim().length>30,key);assert.equal(await page.locator('#dialog [data-action="close-modal"]').count(),1,key+' must have one back action');await fit(key);if(['ranking','vendas','resultado','orientacoes'].includes(key))await capture(key);await close();}
 checks.allManagementTopics=true;
 // Cost edition survives the new receipt layout and returns to the original data.
 await act('sale-detail',{id:sale.id});await settle();assert.equal(await page.locator('[data-action="sale-cost-open"]').count(),1);assert.equal(await page.locator('.record-cost-note').count(),1);await fit('Venda com custo');checks.receiptCostEditorIntegrated=true;await close();
 // Register supplier, purchase on credit, cost link and payment using the normal forms.
 await act('sup-new');await settle();await input('sup-name','Fornecedor fictício 141');await act('sup-save');await settle();
 const vendor=await page.evaluate(()=>ERPPreview.model().data.supplierBook.suppliers.find(s=>s.name.toLocaleLowerCase('pt-BR')==='fornecedor fictício 141')?.id);assert(vendor);
 await act('sup-purchase-new');await settle();
 const today=await page.evaluate(()=>TerritorioSalesRecords.day());
 for(const [key,value] of Object.entries({supplierId:vendor,name:'Embalagem fictícia',specification:'Caixa de teste',unit:'Unidade',quantity:'10',occurredOn:today,goods:'10',freight:'0',discount:'0',charges:'0',paymentStatus:'open',dueDate:today}))await input('sup-'+key,value);
 await page.locator('[data-sup-field="confirmed"]').check();await act('sup-save');await settle();
 const purchase=await page.evaluate(()=>ERPPreview.model().data.supplierBook.purchases.find(p=>p.item.name.toLocaleLowerCase('pt-BR')==='embalagem fictícia'));assert(purchase);assert.equal(purchase.settlement.status,'open');await fit('Compra a pagar');await capture('supplier-payable');
 await act('sup-purchase-cost',{id:purchase.id});await settle();await page.evaluate(()=>{window.__u141Durable=TerritorioNative.durable;TerritorioNative.durable=async()=>false;});await act('fin-cost-save');await settle();await act('close-modal');assert.equal(await page.locator('#fin-cost-title').count(),1);assert.equal(await page.evaluate(id=>ERPPreview.model().data.expenses.filter(x=>x.purchaseId===id).length,purchase.id),1);await page.evaluate(()=>{TerritorioNative.durable=__u141Durable;delete window.__u141Durable;});await act('fin-cost-save');await settle();checks.linkedExpenseDurableRetryDoesNotDuplicate=true;
 assert.equal(await page.evaluate(id=>ERPPreview.model().data.expenses.filter(x=>x.purchaseId===id).length,purchase.id),1);
 await act('mg-detail',{key:'caixa'});await settle();await act('mgh-eye',{key:'caixa'});await settle();assert.match(await page.locator('[data-metric="cash"]').innerText(),/45,00/);assert.match(await page.locator('[data-payables]').innerText(),/10,00/);checks.openPurchaseDoesNotLeaveCash=true;await close();
 await act('sup-purchase-settle',{id:purchase.id});await settle();await input('sup-paidOn',today);await act('sup-save');await settle();
 assert.equal(await page.evaluate(id=>ERPPreview.model().data.supplierBook.purchases.find(p=>p.id===id).settlement.status,purchase.id),'paid');
 await act('mg-detail',{key:'caixa'});await settle();if(!await page.evaluate(()=>ERPPreview.model().data.settings.financialVisible)){await act('mgh-eye',{key:'caixa'});await settle();}
 assert.match(await page.locator('[data-metric="cash"]').innerText(),/35,00/);assert.match(await page.locator('[data-metric="purchases-paid"]').innerText(),/10,00/);await fit('Compra paga sem duplicar');await capture('cash-linked-payment');checks.paidPurchaseDeduplicatesLinkedExpense=true;
 await close();await act('mg-detail',{key:'resultado'});await settle();if(!await page.evaluate(()=>ERPPreview.model().data.settings.financialVisible)){await act('mgh-eye',{key:'resultado'});await settle();}assert.match(await page.locator('[data-metric="result"]').innerText(),/10,00/);checks.purchaseResultAndCashIntegrated=true;
 await close();await act('sup-purchase-cost',{id:purchase.id});assert.equal(await page.evaluate(id=>ERPPreview.model().data.expenses.filter(x=>x.purchaseId===id).length,purchase.id),1);checks.costLinkCannotDuplicate=true;
 // A pending refund does not credit stock twice or leave the confirmation before durable storage.
 await close();const beforeReturn=await page.evaluate(()=>({stock:ERPPreview.model().product('qa-especial-0').stock,returns:ERPPreview.model().data.movements.filter(m=>m.kind==='return').length}));await act('refund-confirm',{id:sale.id});await settle();await page.evaluate(()=>{window.__u141Durable=TerritorioNative.durable;TerritorioNative.durable=async()=>false;});await act('refund-sale',{id:sale.id});await settle();await act('close-modal');assert.equal(await page.locator('#dialog').getAttribute('data-kind'),'refund');await page.evaluate(()=>{TerritorioNative.durable=__u141Durable;delete window.__u141Durable;});await act('refund-sale',{id:sale.id});await settle();const afterReturn=await page.evaluate(()=>({stock:ERPPreview.model().product('qa-especial-0').stock,returns:ERPPreview.model().data.movements.filter(m=>m.kind==='return').length}));assert.equal(afterReturn.stock,beforeReturn.stock+1);assert.equal(afterReturn.returns,beforeReturn.returns+1);checks.refundDurableRetryDoesNotDuplicate=true;
 // No stale delayed opening may replace another window.
 await act('mg-detail',{key:'orientacoes'});await act('settings');await settle();assert.equal(await page.locator('.settings-about-name').innerText(),'AGRO Gestão Codex');checks.cancelledDeferredContentCannotReplaceNextPage=true;await act('settings-back');await settle();
 await close();await page.evaluate(original=>{TerritorioManagementHub=__u141Hub;delete window.__u141Hub;delete window.__u141Calls;ERPPreview.model().data=JSON.parse(original);if(!ERPPreview.persist())throw Error('Synthetic restore failed');},original);await nav('Vender');const actual=await page.evaluate(()=>JSON.stringify(ERPPreview.model().data));if(actual!==original){const a=JSON.parse(actual),b=JSON.parse(original),diff=[];const walk=(x,y,p)=>{if(diff.length>=16||JSON.stringify(x)===JSON.stringify(y))return;if(x&&y&&typeof x==='object'&&typeof y==='object'){for(const k of new Set([...Object.keys(x),...Object.keys(y)]))walk(x[k],y[k],p+'.'+k);}else diff.push({path:p,actual:JSON.stringify(x)?.slice(0,140),expected:JSON.stringify(y)?.slice(0,140)});};walk(a,b,'data');throw Error('Synthetic restore mismatch: '+JSON.stringify(diff));}checks.syntheticDataRestored=true;
 checks.spacingMeasurements=measures.reduce((n,r)=>n+r.checks,0);return checks;
}
module.exports={exercise};
