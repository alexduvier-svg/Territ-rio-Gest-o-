// Compare production web assets with the user-approved 0.12.14 APK, never producer records.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const app=path.resolve(__dirname,'../app'),assets=path.resolve(process.argv[process.argv.indexOf('--assets')+1]),reference=process.argv.includes('--reference'),origin='http://glass018-motion.test';
const core={Date,Math,JSON,Intl};core.window=core;vm.createContext(core);vm.runInContext(fs.readFileSync(app+'/src/legacy/erp-core.js','utf8'),core);const seed=JSON.parse(JSON.stringify(core.ERP.seed()));seed.settings={...seed.settings,onboarding:'demo',appearance:'light',layout:'feira',financialVisible:true,reduceEffects:false,city:'Carangola',uf:'MG'};
const report={reference,isolated:true,sequences:[],errors:[],blocked:[],idle:[],longTasks:[]};
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});let context,page;
try{for(const mode of (reference?['normal']:['normal','lite','reduced'])){
 context=await browser.newContext({viewport:{width:360,height:792},isMobile:true,hasTouch:true,reducedMotion:mode==='reduced'?'reduce':'no-preference',serviceWorkers:'block'});
 await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==origin){report.blocked.push(u.href);return r.abort();}let f=path.resolve(assets,'.'+decodeURIComponent(u.pathname));if(!f.startsWith(assets+path.sep)&&f!==assets)return r.abort();if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(assets,'index.html');return r.fulfill({contentType:{'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2','.svg':'image/svg+xml'}[path.extname(f)]||'application/octet-stream',body:fs.readFileSync(f)});});
 await context.addInitScript(({seed,mode})=>{Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>mode==='lite'?4:8});Object.defineProperty(navigator,'deviceMemory',{get:()=>mode==='lite'?2:8});localStorage.setItem('territorio-gestao-prototipo-v1',JSON.stringify(seed));window.qaLongTasks=[];new PerformanceObserver(es=>window.qaLongTasks.push(...es.getEntries().map(e=>({t:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});},{seed,mode});
 page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>report.errors.push(String(e)));await page.goto(origin);await page.waitForFunction(()=>!!window.ERPPreview);await page.waitForTimeout(650);
 const act=(action,data={})=>page.evaluate(({action,data})=>window.ERPPreview.actions[action](data),{action,data});
 const business=()=>page.evaluate(()=>JSON.stringify(['products','sales','movements','expenses','clients'].map(k=>window.ERPPreview.model().data[k])));const before=await business();
 async function motion(selector,label,type='dialog'){
  console.log(mode+' '+label);const button=page.locator(selector).first();await button.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await page.waitForTimeout(40);
  const evidence=await button.evaluate(async(button,{type})=>{
   const source=button.closest('.product-card,.feira-card,.feira-stock-count,.feira-row,.kpi-item')||button,sr=source.getBoundingClientRect(),frames=[],start=performance.now();
   function measure(e){if(!e)return null;const c=getComputedStyle(e),r=e.getBoundingClientRect();return{kind:e.dataset.kind,display:c.display,opacity:+c.opacity,scale:parseFloat(c.scale)||1,clip:c.clipPath,background:c.backgroundColor,blur:c.backdropFilter,left:r.left,top:r.top,width:r.width,height:r.height,open:e.open,children:e.childElementCount,scroll:e.querySelector('.dialog-content')?.scrollTop||0};}
   const sample=()=>{const d=document.getElementById('dialog'),card=document.querySelector('.fluid-page-morph-layer .fluid-page-morph-surface.fluid-animating'),ghost=document.querySelector('.fluid-sheet-ghost-layer dialog');frames.push({t:performance.now()-start,d:measure(d),card:measure(card),ghost:measure(ghost),pageLayers:document.querySelectorAll('.fluid-page-morph-layer').length});};
   button.click();await Promise.resolve();await Promise.resolve();sample();await new Promise(resolve=>{const tick=()=>{sample();if(performance.now()-start<1000)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});return{source:{left:sr.left,top:sr.top,width:sr.width,height:sr.height},frames};
  },{type});
  const last=evidence.frames.at(-1);assert.equal(last.pageLayers,0,'page snapshot not cleaned');assert.equal(last.ghost,null,'nested snapshot not cleaned');
  if(type==='open'||type==='nested'){
   assert(last.d.open);assert(Math.abs(last.d.scale-1)<.001);assert.equal(last.d.clip,'none');
   if(mode!=='reduced'){const moving=evidence.frames.map(f=>f.d).filter(d=>d?.open&&d.clip!=='none');assert(moving.length>2,'missing container morph '+label);assert(moving.some(d=>d.scale<.99||d.clip!=='none'));}
  } else if(type==='page'){
   if(mode!=='reduced')assert(evidence.frames.some(f=>f.card&&f.card.clip!=='none'),'page did not morph '+label);
  } else if(type==='nested-back'){
   assert(last.d.open);if(mode!=='reduced')assert(evidence.frames.some(f=>f.ghost?.clip!=='none'&&f.ghost),'nested return not above parent');
  } else if(type==='close'){
   assert.equal(last.d.open,false);assert.equal(last.d.display,'none');
   let invisible=false;for(const f of evidence.frames){const d=f.d;if(!d||d.display==='none'||d.opacity<.01)invisible=true;if(invisible)assert(!d||d.display==='none'||d.opacity<.05,'close flashed back');}
  }
  report.sequences.push({mode,theme:await page.evaluate(()=>document.documentElement.dataset.theme),label,type,...evidence});return evidence;
 }
 for(const theme of ['light','dark']){
  await act('nav',{page:'Vender'});await page.evaluate(theme=>{window.ERPPreview.model().data.settings.appearance=theme;window.ERPPreview.render();},theme);await page.waitForTimeout(650);
  await motion('body > #app [data-action="settings"]','settings opens','page');await motion('body > #app [data-action="settings-back"]','settings returns','page');
  await act('nav',{page:'Estoque'});await page.waitForTimeout(650);await motion('body > #app [data-action="stock-product"]:not([disabled])','stock product opens','open');await motion('#dialog [data-action="close-modal"]:visible','stock product closes','close');
  await act('nav',{page:'Vender'});await page.waitForTimeout(650);await motion('body > #app [data-action="day-summary"]','day summary opens','open');
  await motion('#dialog [data-action="close-modal"]','day summary closes','close');
  await act('nav',{page:'Gestão'});await page.waitForTimeout(650);await motion('body > #app [data-action="brain"]','brain opens','open');await motion('#dialog [data-action="advisor-guide"]','guide nested','nested');await motion('#dialog [data-action="advisor-topic"]','topic nested twice','nested');await motion('#dialog [data-action="advisor-back"]','topic returns to brain','nested-back');await motion('#dialog [data-action="brain-back"]','brain closes','close');
  await act('nav',{page:'Vender'});await page.waitForTimeout(650);await motion('body > #app [data-action="sell-product"]:not([disabled])','sale page opens','page');await motion('body > #app [data-action="cancel-sale"]','sale page returns','page');
  console.log(mode+' '+theme+' sequences passed');
 }
 if(!reference){
  // Fast reversal, synchronous native close and focus, delayed frame, and body replacement.
  await act('nav',{page:'Gestão'});await page.waitForTimeout(600);await page.locator('body > #app [data-action="brain"]').click();await page.waitForTimeout(80);await page.evaluate(()=>document.getElementById('dialog').close('qa-rapid'));assert.equal(await page.locator('#dialog').evaluate(d=>d.open),false);await page.waitForTimeout(40);await page.locator('body > #app [data-action="brain"]').click();await page.waitForTimeout(650);assert.equal(await page.locator('#dialog').evaluate(d=>d.open&&!d.inert),true);await page.evaluate(()=>{const d=document.getElementById('dialog');d.close();d.innerHTML='';});await page.waitForTimeout(650);assert.equal(await page.locator('.fluid-exit-layer,.fluid-sheet-ghost-layer').count(),0);
  await page.waitForTimeout(500);const idle=await page.evaluate(()=>window.TerritorioMotion.diagnostics());assert.equal(idle.active,0);assert.equal(idle.pendingFrame,false);report.idle.push({mode,...idle});
 }
 assert.equal(await business(),before,'audit changed business records');report.longTasks.push({mode,entries:await page.evaluate(()=>window.qaLongTasks)});await context.close();context=null;
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e.stack||e);if(page&&!page.isClosed())await page.screenshot({path:path.join(__dirname,'glass018-motion-failure.png')}).catch(()=>{});throw e;}finally{await context?.close();await browser.close();fs.writeFileSync(path.join(__dirname,reference?'glass018-motion-reference.json':'glass018-motion-qa.json'),JSON.stringify(report,null,2));}console.log(JSON.stringify({passed:report.passed,sequences:report.sequences.length,errors:report.errors}));
})().catch(e=>{console.error(e);process.exitCode=1;});
