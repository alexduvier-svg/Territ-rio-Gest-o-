const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const app=path.resolve(__dirname,'../app');
(async()=>{
 const core={Date,Math,JSON,Intl};core.window=core;vm.createContext(core);vm.runInContext(fs.readFileSync(app+'/src/legacy/erp-core.js','utf8'),core);
 const result={version:'0.12.7',isolated:true,errors:[],themes:[]};let browser;
 try{
  browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  for(const theme of ['light','dark']){
   const seed=JSON.parse(JSON.stringify(core.ERP.seed()));seed.settings={onboarding:'demo',appearance:theme,layout:'feira',financialVisible:true,reduceEffects:false};seed.events=[];seed.sales=[];seed.movements=[];
   seed.products=[{id:'labels-qa',name:'Taioba',baseName:'Taioba',category:'Hortifruti-Granjeiro',unit:'Maço',stock:10,min:1,price:400,cost:100,costKnown:true}];
   const context=await browser.newContext({viewport:{width:360,height:740},isMobile:true,hasTouch:true,reducedMotion:'no-preference'});
   await context.addInitScript(()=>{Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>8});Object.defineProperty(navigator,'deviceMemory',{get:()=>8});});
   await context.addInitScript(seed=>localStorage.setItem('territorio-gestao-prototipo-v1',JSON.stringify(seed)),seed);
   await context.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:5178')||r.request().url().startsWith('data:')?r.continue():r.abort());
   const page=await context.newPage();page.on('pageerror',e=>result.errors.push(String(e)));await page.goto('http://127.0.0.1:5178');await page.waitForFunction(()=>!!window.ERPPreview);
   const act=(action,data={})=>page.evaluate(({action,data})=>window.ERPPreview.actions[action](data),{action,data});
   await act('new-product');await page.waitForFunction(()=>window.TerritorioProductCatalog.isCatalogReady());await act('quick-category',{value:'Hortifruti-Granjeiro'});await page.locator('#stock-picker-search').fill('taioba');await page.locator('[data-action="stock-family-pick"]').first().click();
   if(await page.locator('[data-action="stock-presentation-pick"]').count())await page.locator('[data-action="stock-presentation-pick"]').first().click();
   await page.locator('[data-action="stock-confirm-unit"]').first().click();
   const labels=await page.locator('.values-stock-panel label[for]').evaluateAll(nodes=>nodes.map(e=>({text:e.textContent,color:getComputedStyle(e).color,inputColor:getComputedStyle(document.getElementById(e.htmlFor)).color})));
   assert.equal(labels.length,4);for(const label of labels){const rgb=label.color.match(/[\d.]+/g).map(Number);assert(rgb[0]>rgb[1]&&rgb[0]>rgb[2]);assert.notEqual(label.color,label.inputColor);}
   await page.locator('.values-stock-panel').screenshot({path:path.join(__dirname,'values-labels-'+theme+'.png')});
   await act('cancel-product');await act('sell-product',{id:'labels-qa'});await act('digit',{digit:2});await act('nav',{page:'Vender'});await page.locator('.draft-resume').waitFor();
   await page.waitForTimeout(1500);
   const animations=await page.locator('.draft-resume').evaluate(e=>e.getAnimations({subtree:true}).filter(a=>a.playState==='running').map(a=>a.animationName));console.log(JSON.stringify({theme,animations,root:await page.locator('html').getAttribute('class'),button:await page.locator('.draft-resume').getAttribute('class'),effects:await page.locator('html').getAttribute('data-reduce-effects')}));assert(animations.length>=2);
   const first=await page.locator('.draft-resume > span:first-child > .icon').evaluate(e=>getComputedStyle(e).transform);await page.waitForTimeout(450);const next=await page.locator('.draft-resume > span:first-child > .icon').evaluate(e=>getComputedStyle(e).transform);assert.notEqual(first,next);
   await page.screenshot({path:path.join(__dirname,'pending-sale-'+theme+'.png')});
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(120);const reduced=await page.locator('.draft-resume').evaluate(e=>e.getAnimations({subtree:true}).length);assert.equal(reduced,0);
   await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>document.documentElement.classList.add('lite'));await page.waitForTimeout(120);assert.equal(await page.locator('.draft-resume').evaluate(e=>e.getAnimations({subtree:true}).length),0);
   const integrity=await page.evaluate(()=>{const d=window.ERPPreview.model().data;return{sales:d.sales.length,movements:d.movements.length,stock:d.products.find(p=>p.id==='labels-qa').stock};});assert.deepEqual(integrity,{sales:0,movements:0,stock:10});
   result.themes.push({theme,labels,animations,reduced,integrity});await context.close();
  }
  assert.deepEqual(result.errors,[]);result.passed=true;
 }finally{await browser?.close();fs.writeFileSync(path.join(__dirname,'labels-pending-smoke.json'),JSON.stringify(result,null,2));}
 console.log(JSON.stringify(result));
})().catch(e=>{console.error(e);process.exitCode=1;});
