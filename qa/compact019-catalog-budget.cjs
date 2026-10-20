// Isolated presentation/interaction checks; never reads a producer database.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../app'),dist=path.join(root,'dist'),origin='https://compact-fixture.test';
const core={Date,Math,Intl,JSON};core.window=core;vm.createContext(core);vm.runInContext(fs.readFileSync(root+'/src/legacy/erp-core.js','utf8'),core);
const seed=core.ERP.seed();seed.dataContext={id:'compact019-fixture',type:'real'};
seed.settings={onboarding:'clean',layout:'feira',businessName:'Teste fictício',producerName:'Teste',financialVisible:false};
seed.products=['Especial','Gourmet'].flatMap(type=>[250,500,1000].map(weight=>({id:type+weight,name:'Café '+type,baseName:'Café '+type,category:'Cafés',type,format:'Moído',unit:'Pacote',weight,price:2500,stock:9,min:1,cost:1000,costKnown:true})));
seed.products.find(p=>p.id==='Especial500').stock=0;
seed.products.push({...seed.products[5],id:'Tradicional1000',name:'Café Tradicional',baseName:'Café Tradicional',type:'Tradicional'});
seed.products.push(...[
 {id:'banana',name:'Banana Prata',category:'Hortifruti-Granjeiro',unit:'Dúzia'},
 {id:'banana-maca',name:'Banana Maçã',category:'Hortifruti-Granjeiro',unit:'Dúzia'},
 {id:'banana-nanica',name:'Banana Nanica',category:'Hortifruti-Granjeiro',unit:'Caixa',contentCount:12,contentUnit:'dúzias'},
 {id:'cheese',name:'Queijo Meia Cura',category:'Laticínios',unit:'kg'},
 {id:'salami',name:'Salame Artesanal',category:'Charcutaria',unit:'kg'},
].map(p=>({...p,price:3500,stock:8,min:1,cost:1000,costKnown:true})));
seed.sales=[];seed.events=[];seed.clients=[];seed.movements=[];seed.expenses=[];seed.eventLoads=[];
const report={isolated:true,desktopSimulation:true,nativeFPSMeasured:false,checks:[],errors:[]};let browser,page;
(async()=>{try{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 for(const theme of ['light','dark'])for(const mode of ['normal','lite']){
  const context=await browser.newContext({viewport:{width:360,height:800},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==origin)return r.abort();let f=path.resolve(dist,'.'+u.pathname);if(f!==dist&&!f.startsWith(dist+path.sep))return r.abort();if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=dist+'/index.html';return r.fulfill({body:fs.readFileSync(f),contentType:{'.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png'}[path.extname(f)]||'application/octet-stream'});});
  await context.addInitScript(({seed,theme,mode})=>{seed.settings.appearance=theme;localStorage.setItem('territorio-gestao-prototipo-v1',JSON.stringify(seed));Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>mode==='lite'?4:8});Object.defineProperty(navigator,'deviceMemory',{get:()=>mode==='lite'?2:8});},{seed,theme,mode});
  page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));if(mode==='lite'){const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});}
  await page.goto(origin);await page.waitForFunction(()=>!!window.TerritorioProductCatalog);await page.waitForTimeout(900);
  await page.locator('#nav [data-page=Estoque]').click();await page.waitForTimeout(900);
  assert.equal(await page.evaluate(()=>window.TerritorioProductCatalog.isCatalogReady()),false);
  await page.evaluate(()=>{window.catalogBudget={frames:[],beats:0,longTasks:[],start:performance.now()};const tick=t=>{window.catalogBudget.frames.push(t);if(!window.catalogBudget.done)requestAnimationFrame(tick);};requestAnimationFrame(tick);window.catalogBudget.timer=setInterval(()=>window.catalogBudget.beats++,0);new PerformanceObserver(es=>window.catalogBudget.longTasks.push(...es.getEntries().map(e=>({t:e.startTime,duration:e.duration})))).observe({type:'longtask'});});
  await page.locator('body>#app .glass-family-heading [data-action=new-product]').click();
  await page.waitForFunction(()=>window.TerritorioProductCatalog.isCatalogReady());
  const evidence=await page.evaluate(()=>{const b=window.catalogBudget;b.done=true;clearInterval(b.timer);return {duration:performance.now()-b.start,frames:b.frames.length,beats:b.beats,longTasks:b.longTasks,ready:window.TerritorioProductCatalog.catalogInfo().total};});
  assert(evidence.frames>=2,'vocabulary must yield frames during first open');assert(evidence.beats>=2,'vocabulary must yield input tasks');assert.equal(evidence.ready,2480);
  await page.waitForTimeout(900);await page.locator('body>#app [data-action=stock-own-pick]').first().click();await page.waitForTimeout(900);
  assert.equal(await page.evaluate(()=>window.ERPPreview.state().page),'Produto');assert.equal(await page.locator('.fluid-page-morph-layer').count(),0);assert.equal(await page.locator('#dialog').getAttribute('data-kind'),'movement');
  await page.locator('#dialog .movement-back').click();await page.waitForTimeout(900);assert.equal(await page.locator('#dialog').evaluate(d=>d.open),false);assert.equal(await page.evaluate(()=>window.TerritorioMotion.diagnostics().active),0);
  report.checks.push({theme,mode,cpuSlowdown:mode==='lite'?4:1,...evidence});await context.close();
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.errors.push(e.stack);process.exitCode=1;if(page&&!page.isClosed())await page.screenshot({path:path.join(__dirname,'compact019-catalog-budget-failure.png')}).catch(()=>{});}
finally{await browser?.close();fs.writeFileSync(path.join(__dirname,'compact019-catalog-budget-qa.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}})();
