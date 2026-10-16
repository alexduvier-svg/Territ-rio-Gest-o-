// Isolated local fixtures only. Does not connect to the phone or finalize sales.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const app=path.resolve(__dirname,'../app'),urlArg=process.argv.indexOf('--url'),url=urlArg>=0?process.argv[urlArg+1]:'http://127.0.0.1:5178/',origin=new URL(url).origin;
const STORE='territorio-gestao-prototipo-v1';
const report={isolated:true,url,checks:[],layouts:[],cart:[],blockedExternalRequests:[],consoleErrors:[],requestFailures:[],errors:[]};
const blocked=new Set();
Object.defineProperty(report.checks,'push',{value(...items){const n=Array.prototype.push.apply(this,items);for(const item of items)console.log('[event-preparation] '+item);return n;}});
const isLocal=value=>{try{return new URL(value).origin===origin;}catch{return false;}};
function classifyNetwork(){
 for(const entry of report.consoleErrors){if(entry.classified)continue;entry.classified=true;if(entry.location.url&&blocked.has(entry.location.url)&&/^Failed to load resource: net::ERR_/.test(entry.text))entry.expected='explicit external test isolation';else report.errors.push({type:'console',...entry});}
 for(const entry of report.requestFailures){if(entry.classified)continue;entry.classified=true;if(!entry.blockedByHarness)report.errors.push({type:'requestfailed',...entry});}
}
const quantity=item=>Number(String(item?.raw??item?.qty??'').replace(',','.'))||0;
async function chooseDate(page,id,day){
 await page.locator('[data-action="date-picker"][data-input="'+id+'"]').click();
 const month=await page.evaluate(()=>window.ERPPreview.datePickerState().month),target=day.slice(0,7);
 const distance=(Number(target.slice(0,4))-Number(month.slice(0,4)))*12+Number(target.slice(5))-Number(month.slice(5));
 for(let i=0;i<Math.abs(distance);i++)await page.locator('#date-picker-dialog [data-action="date-picker-shift"][data-delta="'+Math.sign(distance)+'"]').click();
 await page.locator('#date-picker-dialog [data-action="date-picker-day"][data-day="'+day+'"]').click();
}

async function main(){let browser,context;
 try{
  const core={Date,Math,JSON,Intl};core.window=core;vm.createContext(core);vm.runInContext(fs.readFileSync(app+'/src/legacy/erp-core.js','utf8'),core);
  const seed=JSON.parse(JSON.stringify(core.ERP.seed()));seed.settings={onboarding:'demo',appearance:'light',layout:'feira',financialVisible:true,city:'Carangola',uf:'MG'};seed.events=[];seed.sales=[];seed.movements=[];seed.expenses=[];seed.eventLoads=[];
  seed.products=[{id:'qa-banana',name:'Banana Prata',baseName:'Banana Prata',category:'Hortifruti-Granjeiro',unit:'Dúzia',price:1000,cost:500,costKnown:true,stock:500,min:2},{id:'qa-taioba',name:'Taioba',baseName:'Taioba',category:'Hortifruti-Granjeiro',unit:'Maço',price:400,cost:100,costKnown:true,stock:0,min:1}];
  browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  context=await browser.newContext({viewport:{width:360,height:740},isMobile:true,hasTouch:true});
  await context.addInitScript(({seed,key})=>{Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>8});Object.defineProperty(navigator,'deviceMemory',{get:()=>8});if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(seed));},{seed,key:STORE});
  await context.route('**/*',route=>{const req=route.request(),href=req.url();if(isLocal(href)||href.startsWith('data:'))return route.continue();blocked.add(href);report.blockedExternalRequests.push({url:href,method:req.method(),resourceType:req.resourceType()});return route.abort('blockedbyclient');});
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push({type:'pageerror',error:String(e)}));page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push({text:m.text(),location:m.location()});});page.on('requestfailed',r=>report.requestFailures.push({url:r.url(),failure:r.failure(),blockedByHarness:blocked.has(r.url())}));
  await page.goto(url);await page.waitForFunction(()=>typeof window.ERPPreview?.eventPreparationState==='function');
  const act=(action,data={})=>page.evaluate(({action,data})=>window.ERPPreview.actions[action](data),{action,data});
  const model=()=>page.evaluate(()=>JSON.parse(JSON.stringify(window.ERPPreview.model().data)));
  const prep=()=>page.evaluate(()=>JSON.parse(JSON.stringify(window.ERPPreview.eventPreparationState())));
  const activeDraft=async()=>{const state=await prep();return state.draft||state;};
  const durable=ok=>page.evaluate(ok=>{window.qaDurableOK=ok;window.TerritorioNative={...window.TerritorioNative,isNative:false,durable:async()=>window.qaDurableOK};},ok);
  const waitLoad=async id=>{await page.waitForFunction(id=>{const s=window.ERPPreview.eventPreparationState(),d=s?.draft||s;return document.querySelector('dialog[open]')?.dataset.kind==='event-load'&&d?.eventId===id;},id);await page.waitForTimeout(500);};
  const waitDetail=async id=>{await page.waitForFunction(id=>{const d=document.querySelector('dialog[open]'),e=window.ERPPreview.model().data.events.find(e=>e.id===id);return d?.dataset.kind==='event-detail'&&d.querySelector('h2')?.textContent===e?.name;},id);};
  const inputFor=async id=>{const d=await activeDraft(),index=d.products.findIndex(p=>p.productId===id);assert(index>=0,'product missing from event preparation: '+id);return page.locator('#event-load-'+index);};
  const fillLoad=async(id,value)=>(await inputFor(id)).fill(String(value));
  const loadValue=async id=>quantity({raw:await(await inputFor(id)).inputValue()});
  const pendingOf=async id=>(await model()).events.find(e=>e.id===id)?.preparation;
  const plus=async id=>{await waitLoad(id);await page.locator('dialog[open] [data-action="event-load-add"]').click();await page.waitForFunction(()=>window.ERPPreview.state().page==='Produto');await page.waitForTimeout(300);};
  const dateAfter=days=>new Date(Date.now()+days*86400000).toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'});
  const createEvent=async(name,offset)=>{
   const before=new Set((await model()).events.map(e=>e.id));await act('new-event');await page.locator('#event-name').fill(name);await page.locator('#event-place').fill('Praça QA');await page.locator('#event-city').fill('Carangola');await page.locator('#event-uf').fill('MG');
   await chooseDate(page,'event-start',dateAfter(offset));await chooseDate(page,'event-end',dateAfter(offset));await page.locator('#event-from').fill('08:00');await page.locator('#event-until').fill('18:00');await page.locator('[data-action="save-event"]').click();
   const id=(await model()).events.find(e=>!before.has(e.id))?.id;assert(id,'event creation failed');await waitLoad(id);return id;
  };
  const A=await createEvent('Encontro QA Alfa',1);await fillLoad('qa-banana',7);const baseline=await model();
  await plus(A);await act('quick-category',{value:'Hortifruti-Granjeiro'});await page.locator('[data-action="stock-custom-product"]').first().click();await page.locator('#product-name').fill('Quiabo QA exclusivo');await act('unit',{index:0,value:'Maço'});
  await page.locator('#price-0').fill('4,00');await page.locator('#cost-0').fill('1,00');await page.locator('#initial-0').fill('5');await page.locator('#minimum-0').fill('1');
  await durable(false);await act('save-product');const failedCustom=await model(),custom=failedCustom.products.find(p=>!baseline.products.some(q=>q.id===p.id));assert(custom);assert.equal(custom.stock,5);assert.equal(failedCustom.products.length,baseline.products.length+1);assert.match(await page.locator('#form-error').innerText(),/grava|confirm|pendente/i);
  await durable(true);await act('save-product');await waitLoad(A);assert.equal((await model()).products.filter(p=>p.id===custom.id).length,1);assert.equal((await model()).products.find(p=>p.id===custom.id).stock,5);assert.equal(await loadValue(custom.id),5);assert.equal(await loadValue('qa-banana'),7);
  report.checks.push('actual + opens the stock flow, new custom product and event draft survive durable failure/retry once, other quantities preserved');

  const beforeRestock=await model(),countBefore=beforeRestock.productMemory.entries['qa-taioba']?.stockEntries||0;
  await plus(A);await act('quick-category',{value:'Hortifruti-Granjeiro'});await page.locator('[data-action="stock-own-pick"][data-id="qa-taioba"]').click();assert.equal(await page.locator('#move-quantity').inputValue(),'');await page.locator('#move-quantity').fill('3');await durable(false);await act('save-movement');assert.equal((await model()).products.find(p=>p.id==='qa-taioba').stock,3);assert.match(await page.locator('#move-error').innerText(),/pendente/i);
  await durable(true);await act('save-movement');await waitLoad(A);const afterRestock=await model();assert.equal(afterRestock.products.find(p=>p.id==='qa-taioba').stock,3);assert.equal(afterRestock.productMemory.entries['qa-taioba'].stockEntries,countBefore+1);assert.equal(await loadValue('qa-taioba'),3);assert.equal(await loadValue(custom.id),5);assert.equal(await loadValue('qa-banana'),7);
  report.checks.push('existing zero-stock shortcut replenishes the original ID, transfers only the confirmed amount to the event, retry never duplicates quantity or learned entry');

  const beforeCancel=await model();await plus(A);await page.locator('[data-action="cancel-product"]').first().click();await waitLoad(A);assert.equal(await loadValue('qa-banana'),7);const afterCancel=await model();assert.deepEqual(afterCancel.products,beforeCancel.products);assert.deepEqual(afterCancel.movements,beforeCancel.movements);assert.deepEqual(afterCancel.productMemory,beforeCancel.productMemory);
  report.checks.push('cancelling stock selection returns to the same event with quantities and inventory untouched');

  await plus(A);await act('quick-category',{value:'Hortifruti-Granjeiro'});await page.locator('#stock-picker-search').fill('alface lisa');await page.locator('[data-action="stock-family-pick"]').first().click();if(await page.locator('[data-action="stock-presentation-pick"]').count())await page.locator('[data-action="stock-presentation-pick"]').first().click();await page.locator('[data-action="stock-confirm-unit"]').first().click();await page.locator('#price-0').fill('3,00');await page.locator('#cost-0').fill('1,00');await page.locator('#initial-0').fill('2');
  const beforeCatalog=await model();await act('save-product');await waitLoad(A);const afterCatalog=await model(),catalog=afterCatalog.products.find(p=>!beforeCatalog.products.some(q=>q.id===p.id));assert(catalog);assert.equal(catalog.stock,2);assert.equal(await loadValue(catalog.id),2);assert.equal(await loadValue(custom.id),5);assert.equal(await loadValue('qa-banana'),7);
  report.checks.push('catalog presentation adds one producer product, returns to the same load and transfers its new amount without replacing earlier choices');

  await context.setOffline(true);await page.locator('dialog[open] [data-action="event-load-later"]').click();await waitDetail(A);await context.setOffline(false);const pendingA=await pendingOf(A);assert.equal(pendingA.status,'pending');assert.equal(quantity(pendingA.items.find(i=>i.productId==='qa-banana')),7);assert.equal((await model()).eventLoads.length,0);
  const B=await createEvent('Encontro QA Beta',2);await fillLoad('qa-banana',4);await page.locator('dialog[open] [data-action="event-load-later"]').click();assert.equal(quantity((await pendingOf(B)).items.find(i=>i.productId==='qa-banana')),4);assert.equal(quantity((await pendingOf(A)).items.find(i=>i.productId==='qa-banana')),7);
  await page.reload();await page.waitForFunction(()=>!!window.ERPPreview?.eventPreparationState);await act('event-detail',{id:A});const resume=page.locator('dialog[open] [data-action="event-load"][data-id="'+A+'"]');assert.match(await resume.innerText(),/Continuar|Adicionar|prepar/i);await resume.click();await waitLoad(A);assert.equal(await loadValue('qa-banana'),7);assert.equal(await loadValue(custom.id),5);assert.equal(await loadValue(catalog.id),2);await act('event-load-later');await act('event-load',{id:B});await waitLoad(B);assert.equal(await loadValue('qa-banana'),4);assert.equal(await loadValue(custom.id),0);await act('event-load-later');
  report.checks.push('Adicionar depois works offline, stays pending instead of committing a load, survives cold reload and resumes two events by ID without cross-event quantities');

  await act('event-load',{id:A});await waitLoad(A);await fillLoad('qa-banana',9);await durable(false);await act('event-load-later');assert.equal(await page.locator('dialog[open]').getAttribute('data-kind'),'event-load');assert.match(await page.locator('#event-load-error').innerText(),/grava|pendente|confirm/i);await durable(true);await act('event-load-later');assert.equal(quantity((await pendingOf(A)).items.find(i=>i.productId==='qa-banana')),9);
  await act('event-load',{id:A});await waitLoad(A);await fillLoad('qa-banana',10);const beforeCommit=await model();await durable(false);await act('save-event-load');const firstCommit=await model(),loadA=firstCommit.eventLoads.find(l=>l.eventId===A);assert(loadA);assert.equal(loadA.items.find(i=>i.productId==='qa-banana').qty,10);assert.equal(await page.locator('dialog[open]').getAttribute('data-kind'),'event-load');assert.match(await page.locator('#event-load-error').innerText(),/grava|pendente|confirm/i);
  await durable(true);await act('save-event-load');const committed=await model();await waitDetail(A);assert.equal(committed.eventLoads.filter(l=>l.eventId===A).length,1);assert.deepEqual(committed.eventLoads.find(l=>l.eventId===A),loadA);assert(!committed.events.find(e=>e.id===A).preparation);assert.equal(committed.events.find(e=>e.id===B).preparation.status,'pending');assert.deepEqual(committed.products,beforeCommit.products);assert.deepEqual(committed.movements,beforeCommit.movements);
  const fairReport=await page.evaluate(id=>window.ERPPreview.fairReportFor(id),A);assert.equal(fairReport.totals.tookKnown,1);assert.equal(fairReport.totals.sold,0);for(const item of loadA.items){const line=fairReport.products.find(p=>p.id===item.productId&&p.unit===item.unit);assert(line);assert.equal(line.took,item.qty);assert.equal(line.left,item.qty);}report.fairReport=fairReport;
  report.checks.push('defer and load commit wait for durable confirmation; retry keeps one identical event load, preserves other pending event and changes no general stock; report takes the confirmed load');

  for(const theme of ['light','dark'])for(const width of [320,360]){
   await page.setViewportSize({width,height:740});await page.evaluate(theme=>{window.ERPPreview.model().data.settings.appearance=theme;window.ERPPreview.render();},theme);await act('event-load',{id:A});await waitLoad(A);
   const geometry=await page.locator('dialog[open]').evaluate(d=>{const r=d.getBoundingClientRect(),b=d.querySelector('[data-action="event-load-add"]'),a=b.getBoundingClientRect();return{dialog:{left:r.left,top:r.top,width:r.width},plus:{left:a.left,top:a.top,width:a.width,height:a.height},label:b.getAttribute('aria-label'),overflow:document.documentElement.scrollWidth>innerWidth,dialogOverflow:d.scrollWidth>d.clientWidth+1};});assert(geometry.plus.left<=geometry.dialog.left+55);assert(geometry.plus.top<=geometry.dialog.top+95);assert(geometry.plus.width>=40&&geometry.plus.height>=40);assert(geometry.label);assert(!geometry.overflow&&!geometry.dialogOverflow);
   const footer=page.locator('dialog[open] [data-action="event-load-later"]');await footer.scrollIntoViewIfNeeded();const fr=await footer.boundingBox();assert(fr.y>=0&&fr.y+fr.height<=740&&fr.width>=40&&fr.height>=40);await page.screenshot({path:path.join(__dirname,'event-preparation-'+theme+'-'+width+'.png')});report.layouts.push({theme,width,geometry,footer:fr});await act('event-load-later');
  }
  await act('close-modal');await page.waitForTimeout(500);
  // Editing the sale draft must change only the numeric glyphs, never stock or completed sales.
  const beforeCart=await model();for(const theme of ['light','dark']){
   await page.setViewportSize({width:360,height:740});await page.evaluate(theme=>{window.ERPPreview.model().data.settings.appearance=theme;window.ERPPreview.render();},theme);await act('sell-product',{id:'qa-banana'});await act('clear-quantity');
   for(const digit of [1,2,3]){
    await act('digit',{digit});const item=await page.locator('#sale-quantity').evaluate(e=>({value:e.value,color:getComputedStyle(e).color,legend:getComputedStyle(document.querySelector('.quantity-caption')).color,unit:getComputedStyle(document.querySelector('.quantity-caption .muted')).color,price:getComputedStyle(document.querySelector('.sale-unit-price')).color,key:getComputedStyle(document.querySelector('.keypad button')).color}));assert.equal(item.value,digit===1?'1':digit===2?'12':'123');const rgb=item.color.match(/[\d.]+/g).map(Number);assert(rgb[0]>rgb[1]&&rgb[0]>rgb[2]);assert.notEqual(item.color,item.unit);assert.notEqual(item.color,item.price);assert.notEqual(item.color,item.key);report.cart.push({theme,...item});
   }
   await page.locator('[data-action="open-cart"]').click();await page.waitForTimeout(650);const summary=await page.locator('.cart-item-quantity').evaluate(e=>({text:e.textContent,color:getComputedStyle(e).color,unitColor:getComputedStyle(e.parentElement).color,rest:e.parentElement.textContent.replace(e.textContent,'')}));assert.equal(summary.text,'123');assert.notEqual(summary.color,summary.unitColor);assert.match(summary.rest,/dúzias/i);await page.screenshot({path:path.join(__dirname,'event-preparation-cart-'+theme+'.png')});report.cart.push({theme,summary});await act('close-modal');await act('cancel-sale');
  }
  const afterCart=await model();for(const key of ['products','sales','movements','eventLoads'])assert.deepEqual(afterCart[key],beforeCart[key]);assert.equal(afterCart.sales.length,0);report.checks.push('sale quantity stays red only on 1→12→123 numeric input and cart numeric span in both themes; unit, price and keypad stay neutral; no sale completed');
  // Creating an event must also work before the producer has registered any stock.
  await context.close();context=null;const emptySeed=JSON.parse(JSON.stringify(seed));emptySeed.products=[];emptySeed.productMemory={version:1,entries:{}};
  context=await browser.newContext({viewport:{width:320,height:740},isMobile:true,hasTouch:true});await context.addInitScript(({seed,key})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(seed));},{seed:emptySeed,key:STORE});
  await context.route('**/*',route=>{const req=route.request(),href=req.url();if(isLocal(href)||href.startsWith('data:'))return route.continue();blocked.add(href);report.blockedExternalRequests.push({url:href,method:req.method(),resourceType:req.resourceType(),fixture:'empty inventory'});return route.abort('blockedbyclient');});
  const ep=await context.newPage();ep.on('pageerror',e=>report.errors.push({type:'pageerror',fixture:'empty inventory',error:String(e)}));ep.on('console',m=>{if(m.type()==='error')report.consoleErrors.push({text:m.text(),location:m.location(),fixture:'empty inventory'});});ep.on('requestfailed',r=>report.requestFailures.push({url:r.url(),failure:r.failure(),blockedByHarness:blocked.has(r.url()),fixture:'empty inventory'}));
  await ep.goto(url);await ep.waitForFunction(()=>!!window.ERPPreview?.eventPreparationState);const ea=(action,data={})=>ep.evaluate(({action,data})=>window.ERPPreview.actions[action](data),{action,data});await ea('new-event');
  for(const [id,value] of Object.entries({'event-name':'Encontro QA sem estoque','event-place':'Praça QA','event-city':'Carangola','event-uf':'MG','event-from':'08:00','event-until':'18:00'}))await ep.locator('#'+id).fill(value);
  await chooseDate(ep,'event-start',dateAfter(3));await chooseDate(ep,'event-end',dateAfter(3));
  await ep.locator('[data-action="save-event"]').click();await ep.waitForFunction(()=>document.querySelector('dialog[open]')?.dataset.kind==='event-load');assert.equal(await ep.locator('.event-load-row').count(),0);assert.equal(await ep.locator('[data-action="event-load-add"]').count(),1);
  const emptyEventId=await ep.evaluate(()=>window.ERPPreview.model().data.events[0].id);await ep.locator('[data-action="event-load-later"]').click();await ep.waitForFunction(()=>document.querySelector('dialog[open]')?.dataset.kind==='event-detail');await ep.reload();await ep.waitForFunction(()=>!!window.ERPPreview?.eventPreparationState);
  const emptyState=await ep.evaluate(()=>window.ERPPreview.model().data);assert.equal(emptyState.products.length,0);assert.equal(emptyState.eventLoads.length,0);assert.equal(emptyState.events.find(e=>e.id===emptyEventId).preparation.status,'pending');await ea('event-detail',{id:emptyEventId});await ep.locator('dialog[open] [data-action="event-load"][data-id="'+emptyEventId+'"]').click();await ep.waitForFunction(()=>document.querySelector('dialog[open]')?.dataset.kind==='event-load');
  await ep.locator('[data-action="event-load-add"]').click();await ep.waitForFunction(()=>window.ERPPreview.state().page==='Produto');await ep.locator('[data-action="cancel-product"]').first().click();await ep.waitForFunction(()=>document.querySelector('dialog[open]')?.dataset.kind==='event-load');assert.equal(await ep.locator('.event-load-row').count(),0);report.checks.push('event creation with zero products still opens preparation; defer/reload/resume and +/cancel remain available without requiring stock');
  classifyNetwork();assert.deepEqual(report.errors,[]);report.passed=true;
 }catch(error){report.failure=String(error.stack||error);throw error;}finally{await context?.close();await browser?.close();classifyNetwork();if(report.errors.length)report.passed=false;fs.writeFileSync(path.join(__dirname,'event-preparation-qa.json'),JSON.stringify(report,null,2));}
 console.log(JSON.stringify({passed:report.passed,checks:report.checks,layouts:report.layouts.length,cart:report.cart.length,blocked:report.blockedExternalRequests,errors:report.errors}));assert.deepEqual(report.errors,[]);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
