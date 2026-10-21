const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {seed:base}=require('./touch051.cjs');
const seed=JSON.parse(JSON.stringify(base)),dist=path.resolve(__dirname,'../app/dist'),origin='https://hierarchy053.test';
seed.dataContext={id:'hierarchy053-synthetic',type:'real'};
const product=(id,name,category,unit='Pacote')=>({id,name,baseName:name,category,unit,price:1000,cost:400,costKnown:true,stock:9,min:1});
seed.products.push(...['Nanica','Maçã','Prata','Caturra'].map(v=>product('banana-'+v,'Banana '+v,'Hortifruti-Granjeiro','Dúzia')),product('fuba1','Fubá Mimoso','Grãos'),product('fuba2','Fubá de Milho','Grãos'),product('mandioca1','Mandioca Amarela','Hortifruti-Granjeiro','kg'),product('mandioca2','Aipim','Hortifruti-Granjeiro','kg'),product('queijo','Queijo Meia Cura','Laticínios','kg'));
const event=(id,name,reviewed=false)=>({id,name,status:'finished',date:'2026-10-01',start:'2026-10-01T09:00',end:'2026-10-01T14:00',city:'Carangola',uf:'MG',lossReviewPending:!reviewed,...(reviewed?{lossReviewedAt:'2026-10-01T15:00:00-03:00'}:{})});
seed.events=[event('fair1','Feira da Praça'),event('fair2','Feira do Bairro'),event('reviewed','Feira Conferida',true)];
seed.clients=[{id:'client-maria',name:'Maria Silva',uf:'MG',personType:'PF'}];
const snapshot=()=>{const d=window.ERPPreview.model().data;return JSON.stringify({products:d.products,sales:d.sales,movements:d.movements,expenses:d.expenses,events:d.events,eventLoads:d.eventLoads});};
async function exercise(page,cfg){
 const act=(name,data={})=>page.evaluate(([n,d])=>window.ERPPreview.actions[n](d),[name,data]);
 const wait=ms=>page.waitForTimeout(ms),tap=async el=>{await el.scrollIntoViewIfNeeded();if(!cfg.physical)return el.tap();const r=await el.boundingBox();assert(r);const s=await page.context().newCDPSession(page);await s.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2}]});await wait(50);await s.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await s.detach();};
 const shot=async suffix=>{const file=path.join(__dirname,`hierarchy053-${cfg.name}-${cfg.theme}-${suffix}.png`);if(!cfg.physical)return page.screenshot({path:file});const exec=require('child_process').execFileSync,adb=path.resolve(__dirname,'../android-sdk/platform-tools/adb.exe'),serial=process.env.AGRO_QA_SERIAL;exec(adb,['-s',serial,'shell','screencap','-p','/sdcard/agro-fixture053.png']);exec(adb,['-s',serial,'pull','/sdcard/agro-fixture053.png',file]);};
 await page.waitForFunction(()=>window.TerritorioWorkflows&&window.TerritorioStockOrder);await wait(900);
 assert.equal(await page.evaluate(()=>window.ERPPreview.model().data.dataContext.id),'hierarchy053-synthetic');
 const before=await page.evaluate(snapshot),baseline=!!cfg.baseline;
 const selling=await page.evaluate(()=>{const grid=document.querySelector('#app .feira-grid'),r=[...grid.querySelectorAll('.feira-card')].slice(0,3).map(b=>b.getBoundingClientRect());return{columns:new Set(r.map(x=>Math.round(x.x))).size,widths:r.map(x=>x.width),gap:r[1].x-r[0].right};});assert.equal(selling.columns,3);
 if(!baseline)assert.equal(await page.getByRole('button',{name:'Resumo do dia',exact:true}).count(),1);
 await act('nav',{page:'Estoque'});await wait(800);
 const titles=await page.locator('#app .glass-family-heading h3').allTextContents();
 const review=page.locator('#app .stock-loss-reminder'),collapsedHeight=(await review.boundingBox()).height;
 if(baseline)return{...cfg,selling,titles,reviewHeight:collapsedHeight};
 assert(titles.includes('Bananas'),JSON.stringify(titles));assert(titles.includes('Cafés'));assert(titles.includes('Fubás'));assert(titles.includes('Mandiocas'));assert(titles.includes('Queijo Meia Cura'));
 assert.equal(await review.evaluate(e=>e.open),false);assert.match(await review.locator('summary').innerText(),/2 feiras aguardam conferência/i);assert(collapsedHeight<105);
 await page.evaluate(()=>window.scrollTo(0,0));await wait(350);await shot('inicio-estoque');
 const family=page.locator('#app .workflow-stock-family').filter({has:page.locator('.glass-family-heading h3',{hasText:/^Bananas$/})});
 assert.equal(await family.locator(':scope > .feira-rows [data-action=stock-product]').count(),3);
 await tap(family.locator('.workflow-stock-more>summary'));await wait(500);assert.equal(await family.locator('.workflow-stock-more[open] [data-action=stock-product]').count(),1);await tap(family.locator('.workflow-stock-more>summary'));await wait(500);
 const familyIds=await family.locator('[data-action=stock-product]').evaluateAll(xs=>xs.map(e=>e.dataset.id));assert.equal(new Set(familyIds).size,4);
 await shot('estoque');
 await tap(review.locator('summary'));await wait(550);assert.equal(await review.evaluate(e=>e.open),true);assert.equal(await review.locator('[data-action=event-loss-review]').count(),2);
 assert.match(await review.innerText(),/Feira da Praça/);assert.doesNotMatch(await review.innerText(),/Feira Conferida/);
 await tap(review.locator('[data-action=event-loss-review]').first());await wait(650);assert.equal(await page.locator('#dialog[open][data-kind=event-loss]').count(),1);
 await tap(page.locator('#dialog [data-action=close-modal]').last());await wait(650);
 assert.equal(await page.evaluate(snapshot),before,'Opening a review must not acknowledge it or mutate business records');
 if(cfg.timer){await tap(review.locator('summary'));await wait(400);if(!await review.evaluate(e=>e.open))await tap(review.locator('summary'));await wait(15500);assert.equal(await review.evaluate(e=>e.open),false,'Shared 15-second collapse');}
 else if(await review.evaluate(e=>e.open)){await tap(review.locator('summary'));await wait(400);}
 await tap(family.getByRole('button',{name:'Adicionar em Bananas',exact:true}));await wait(750);
 assert.equal(await page.locator('#stock-picker-search').inputValue(),'banana');
 const own=page.locator('#app .stock-own-pills [data-action=stock-own-pick]');assert.equal(await own.count(),4);
 const ownNames=await own.allTextContents();for(const name of ['Nanica','Maçã','Prata','Caturra'])assert(ownNames.some(n=>n.includes(name)));
 await shot('adicionar-bananas');
 await act('nav',{page:'Estoque'});await wait(650);
 const mandiocas=page.locator('#app .workflow-stock-family').filter({has:page.locator('.glass-family-heading h3',{hasText:/^Mandiocas$/})});
 await tap(mandiocas.getByRole('button',{name:'Adicionar em Mandiocas',exact:true}));await wait(650);
 assert.equal(await page.locator('#stock-picker-search').inputValue(),'mandioca');assert.equal(await page.locator('.stock-own-pills [data-action=stock-own-pick]').count(),2,'Aipim remains in its canonical family query');
 await act('nav',{page:'Estoque'});await wait(650);
 await act('settings');await wait(650);assert.equal(await page.locator('#app [data-action=settings-back]').count(),1);assert.equal(await page.locator('.subheader [data-action=settings-back]').count(),0);
 assert.equal(await page.locator('.settings-about-name').innerText(),'AGRO Gestão 2');
 await page.evaluate(()=>window.scrollTo(0,0));await shot('ajustes');
 const back=page.locator('#app .workflow-settings-back');await tap(back);await wait(650);assert.equal(await page.evaluate(()=>window.ERPPreview.state().page),'Estoque');
 const overflow=await page.evaluate(()=>({w:innerWidth,doc:document.documentElement.scrollWidth,app:document.querySelector('#app').scrollWidth,appW:document.querySelector('#app').clientWidth}));assert(overflow.doc<=overflow.w+1,JSON.stringify(overflow));
 assert.equal(await page.evaluate(snapshot),before,'Business records preserved across expansion, add navigation and settings');
 return{...cfg,selling,titles,reviewHeight:collapsedHeight,familyIds,ownNames,summaryAccessible:true,oneSettingsBack:true,pendingReviews:2,businessRecordsPreserved:true,overflow};
}
module.exports={seed,exercise};
if(require.main===module)(async()=>{const baseline=process.env.BASELINE053==='1',report={version:baseline?'0.12.52':'0.12.53',synthetic:true,externalNetworkBlocked:true,productionDatabaseAccessed:false,cases:[],errors:[]};let browser;try{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const configs=baseline?[{name:'baseline',width:393,height:820,theme:'light'}]:['light','dark'].flatMap(theme=>[{name:'normal',width:393,height:820,theme},{name:'small-large-lite',width:320,height:640,theme,large:true}]);
 for(const cfg of configs){const data=JSON.parse(JSON.stringify(seed));data.settings.appearance=cfg.theme;data.settings.largeText=!!cfg.large;const context=await browser.newContext({viewport:{width:cfg.width,height:cfg.height},isMobile:true,hasTouch:true,reducedMotion:cfg.large?'reduce':'no-preference'});await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==origin)return route.abort();let f=path.resolve(dist,'.'+u.pathname);if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=dist+'/index.html';return route.fulfill({body:fs.readFileSync(f),contentType:({'.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png'}[path.extname(f)]||'application/octet-stream')});});await context.addInitScript(({data,cfg})=>{window.__AGRO_DIAGNOSTIC_SESSION__=true;if(cfg.large){Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>2});Object.defineProperty(navigator,'deviceMemory',{get:()=>2});}if(!localStorage.getItem('territorio-gestao-prototipo-v1'))localStorage.setItem('territorio-gestao-prototipo-v1',JSON.stringify(data));},{data,cfg});const page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));await page.goto(origin);report.cases.push(await exercise(page,{...cfg,baseline,timer:!baseline&&cfg.name==='normal'&&cfg.theme==='light'}));await context.close();}
 assert.equal(report.errors.length,0);report.passed=true;
 }catch(e){report.errors.push(String(e.stack||e));process.exitCode=1;}finally{await browser?.close();fs.writeFileSync(path.join(__dirname,baseline?'hierarchy053-baseline.json':'hierarchy053-review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}})();
