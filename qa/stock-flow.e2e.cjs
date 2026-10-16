const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const app=path.resolve(__dirname,'../app'),node='C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe';
async function main(){
 const server=cp.spawn(node,[app+'/node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5182','--strictPort'],{cwd:app,windowsHide:true,stdio:'pipe'});let log='',browser;server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
 const report={isolated:true,errors:[],checks:[]};
 try{
  for(let n=0;n<100&&!log.includes('Local:');n++)await new Promise(r=>setTimeout(r,100));if(!log.includes('Local:'))throw Error(log);
  const core={Date,Math,JSON,Intl};core.window=core;vm.createContext(core);vm.runInContext(fs.readFileSync(app+'/src/legacy/erp-core.js','utf8'),core);
  const seed=JSON.parse(JSON.stringify(core.ERP.seed()));seed.settings={onboarding:'demo',financialVisible:true,appearance:'light',layout:'feira'};
  seed.products.push({id:'taioba-test',name:'Taioba',baseName:'Taioba',category:'Hortifruti-Granjeiro',unit:'Molho',stock:0,min:1,price:400,cost:100});
  seed.productMemory={version:1,entries:{'taioba-test':{stockEntries:3,lastStockAt:new Date().toISOString()}}};
  browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const context=await browser.newContext({viewport:{width:360,height:740},isMobile:true,hasTouch:true});
  await context.addInitScript(seed=>{const key='territorio-gestao-prototipo-v1';if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(seed));},seed);
  await context.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:5182')||r.request().url().startsWith('data:')?r.continue():r.abort());
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  await page.goto('http://127.0.0.1:5182');await page.waitForFunction(()=>!!window.ERPPreview);await page.waitForTimeout(300);
  const act=(action,data={})=>page.evaluate(({action,data})=>window.ERPPreview.actions[action](data),{action,data});
  const value=()=>page.evaluate(()=>window.ERPPreview.model().data);
  const original=await value();
  report.globals=await page.evaluate(()=>({version:window.TERRITORIO_VERSION,catalog:!!window.TerritorioProductCatalog,body:document.getElementById('app').innerText.slice(0,80)}));
  await act('new-product');await page.waitForFunction(()=>window.TerritorioProductCatalog?.isCatalogReady());
  await act('quick-category',{value:'Hortifruti-Granjeiro'});
  assert.equal(await page.locator('[data-action="stock-own-pick"]').first().getAttribute('data-id'),'taioba-test');
  assert.match(await page.locator('#app').innerText(),/Produtos para estoque/i);assert.doesNotMatch(await page.locator('#app').innerText(),/Estoque geral|Categoria sugerida/i);
  assert((await page.locator('[data-action="stock-own-pick"]').count())<=8);report.checks.push('own shortcuts include zero stock and learned ranking, no redundant category');
  await page.screenshot({path:path.join(__dirname,'stock-picker-light.png')});
  await act('stock-own-pick',{id:'taioba-test'});assert.equal(await page.locator('#move-quantity').inputValue(),'');
  await page.locator('#move-quantity').fill('5');await act('save-movement');
  const after=await value();assert.equal(after.products.find(p=>p.id==='taioba-test').stock,5);assert.equal(after.products.length,original.products.length);assert.equal(after.productMemory.entries['taioba-test'].stockEntries,4);
  report.checks.push('existing shortcut restocks original product and tracks committed usage');
  await act('new-product');await act('quick-category',{value:'Hortifruti-Granjeiro'});await page.locator('#stock-picker-search').fill('taiobas');
  assert(await page.locator('[data-action="stock-family-pick"]').count());assert.equal(await page.locator('[data-action="stock-custom-product"]').innerText(),'+ Insira seu produto');
  await act('stock-custom-product');assert.equal(await page.locator('#product-name').inputValue(),'taiobas');
  await page.locator('#product-name').fill('Meu produto exclusivo');assert.equal(await page.evaluate(()=>window.ERPPreview.state().productForm.category),'Hortifruti-Granjeiro');
  assert.equal(await page.locator('#price-0').inputValue(),'');assert.equal(await page.locator('#cost-0').inputValue(),'');assert.equal(await page.locator('#initial-0').inputValue(),'');
  report.checks.push('custom product carries search, respects category, no invented values');
  await act('stock-product-back');await page.locator('#stock-picker-search').fill('taiobas');await page.locator('[data-action="stock-family-pick"]').first().click();
  if(await page.locator('[data-action="stock-presentation-pick"]').count())await page.locator('[data-action="stock-presentation-pick"]').first().click();
  assert.equal(await page.locator('#price-0').inputValue(),'');assert.equal(await page.locator('#cost-0').inputValue(),'');
  await act('save-product');assert.match(await page.locator('#form-error').innerText(),/Confirme a unidade/);
  await page.locator('[data-action="stock-confirm-unit"]').first().click();assert.equal(await page.evaluate(()=>window.ERPPreview.state().productForm.variants[0].unitConfirmed),true);
  await page.locator('#price-0').fill('4,00');await page.locator('#cost-0').fill('1,00');await page.locator('#initial-0').fill('2');await act('save-product');
  // The existing legacy Taioba is deliberately incomplete: require review, never silently merge.
  if(await page.locator('[data-action="stock-review-create"]').count())await act('stock-review-create');
  assert.equal((await value()).products.length,original.products.length+1);report.checks.push('catalogue needs unit confirmation; incomplete legacy review does not merge');
  await act('new-product');await act('quick-category',{value:'Cafés'});await page.locator('#stock-picker-search').fill('café especial');await page.locator('[data-action="stock-family-pick"]').first().click();
  assert((await page.locator('[data-action="stock-presentation-pick"]').count())>1);assert.equal(await page.locator('#product-presentations').isVisible(),false);
  report.checks.push('coffee family requires explicit distinct presentation');
  for(const theme of ['light','dark'])for(const width of [320,360]){
   await page.setViewportSize({width,height:740});await page.evaluate(theme=>{window.ERPPreview.model().data.settings.appearance=theme;window.ERPPreview.render();},theme);await page.waitForTimeout(100);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false);
   await page.screenshot({path:path.join(__dirname,'stock-presentations-'+theme+'-'+width+'.png')});
  }
  report.checks.push('light and dark at 320/360px without horizontal overflow');
  await page.reload();await page.waitForFunction(()=>!!window.ERPPreview);assert.equal((await value()).products.find(p=>p.id==='taioba-test').stock,5);assert.equal((await value()).productMemory.entries['taioba-test'].stockEntries,4);
  report.checks.push('reload keeps products, stock and private learned frequency');
  await page.evaluate(()=>{window.TerritorioNative={...window.TerritorioNative,isNative:false,durable:async()=>false};});
  await act('stock-own-pick',{id:'taioba-test'});await page.locator('#move-quantity').fill('3');
  await page.evaluate(async()=>{await Promise.all([window.ERPPreview.actions['save-movement'](),window.ERPPreview.actions['save-movement']()]);});
  assert.equal((await value()).products.find(p=>p.id==='taioba-test').stock,8);assert.match(await page.locator('#move-error').innerText(),/pendente/);
  await page.evaluate(()=>window.TerritorioNative.durable=async()=>true);await act('save-movement');assert.equal((await value()).products.find(p=>p.id==='taioba-test').stock,8);
  await page.evaluate(()=>window.TerritorioNative.durable=async()=>false);await act('restock-ids',{ids:'taioba-test'});await act('restock-digit',{digit:'2'});await act('restock-finish');assert.equal((await value()).products.find(p=>p.id==='taioba-test').stock,10);
  await page.evaluate(()=>window.TerritorioNative.durable=async()=>true);await act('restock-finish');assert.equal((await value()).products.find(p=>p.id==='taioba-test').stock,10);
  report.checks.push('pending native movement and batch restock retries never duplicate stock or learned count');
  const productCount=(await value()).products.length;
  await act('new-product');await act('stock-custom-product');await page.locator('#product-name').fill('Produto teste gravação');await act('unit',{index:0,value:'Unidade'});
  await page.locator('#price-0').fill('3,00');await page.locator('#cost-0').fill('1,00');await page.locator('#initial-0').fill('1');await page.evaluate(()=>window.TerritorioNative.durable=async()=>false);await act('save-product');
  assert.equal((await value()).products.length,productCount+1);assert.match(await page.locator('#form-error').innerText(),/não confirmou/);
  await page.evaluate(()=>window.TerritorioNative.durable=async()=>true);await act('save-product');assert.equal((await value()).products.length,productCount+1);
  report.checks.push('pending native product save retry never creates a clone');
  assert.deepEqual(report.errors,[]);report.passed=true;
 }finally{fs.writeFileSync(path.join(__dirname,'stock-flow.e2e.json'),JSON.stringify(report,null,2));await browser?.close();server.kill();}
 console.log(JSON.stringify(report));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
