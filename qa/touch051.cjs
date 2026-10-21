// A fresh synthetic origin. Samples layout, not only node connectivity/opacity.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../app'),dist=root+'/dist',origin='https://touch051.test',key='territorio-gestao-prototipo-v1';
const core={Date,Math,Intl,JSON};core.window=core;vm.createContext(core);vm.runInContext(fs.readFileSync(root+'/src/legacy/erp-core.js','utf8'),core);
const seed=core.ERP.seed();seed.dataContext={id:'touch051-synthetic',type:'real'};seed.settings={onboarding:'clean',layout:'feira',appearance:'light',businessName:'Produtor fictício',producerName:'Teste',financialVisible:false};
seed.products=['Especial','Gourmet','Tradicional'].flatMap(type=>[250,500,1000].map(weight=>({id:type+weight,name:'Café '+type,baseName:'Café '+type,category:'Cafés',type,format:'Moído',unit:'Pacote',weight,price:2500,stock:9,min:1,cost:1000,costKnown:true})));
for(const name of ['sales','events','clients','movements','expenses','eventLoads'])seed[name]=[];
const probe=()=>{
 const cards=[...document.querySelectorAll('#app .feira-card')],t=performance.now();
 const layout=()=>cards.map(c=>({id:c.dataset.id,h:c.offsetHeight,top:c.offsetTop,w:c.offsetWidth,left:c.offsetLeft,connected:c.isConnected}));
 window.__touch31={base:layout(),frames:[],shifts:[],on:true};
 try{window.__touch31observer=new PerformanceObserver(list=>{for(const e of list.getEntries())window.__touch31.shifts.push({value:e.value,recentInput:e.hadRecentInput});});window.__touch31observer.observe({type:'layout-shift',buffered:false});}catch{}
 function frame(){if(!window.__touch31.on)return;const d=document.getElementById('dialog');window.__touch31.frames.push({t:performance.now()-t,cards:layout(),maxLightsPerCard:Math.max(...cards.map(c=>c.querySelectorAll(':scope>.glass-touch-light').length)),lights:[...document.querySelectorAll('.glass-touch-light')].map(el=>({position:getComputedStyle(el).position,h:el.offsetHeight,tag:el.tagName})),page:window.ERPPreview.state().page,open:d.open,kind:d.dataset.kind,scrollY,backdrop:getComputedStyle(d,'::backdrop').opacity});window.__touch31raf=requestAnimationFrame(frame);}frame();
};
const summarize=data=>({frames:data.frames.length,maxLightsPerCard:Math.max(...data.frames.map(f=>f.maxLightsPerCard||0)),maxHeightDelta:Math.max(...data.frames.flatMap(f=>f.cards.map((c,i)=>Math.abs(c.h-data.base[i].h)))),maxTopDelta:Math.max(...data.frames.flatMap(f=>f.cards.map((c,i)=>Math.abs(c.top-data.base[i].top)))),disconnected:data.frames.some(f=>f.cards.some(c=>!c.connected)),badLight:data.frames.some(f=>f.lights.some(l=>l.position!=='absolute')),saleFrame:data.frames.some(f=>f.page==='Venda'),shifts:data.shifts});
module.exports={seed,probe,summarize};
if(require.main===module)(async()=>{
 const baseline=!!process.env.BASELINE051,report={baseline,version:JSON.parse(fs.readFileSync(root+'/package.json')).version,synthetic:true,cases:[],errors:[]};let browser;
 try{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 for(const theme of ['light','dark'])for(const [width,large,mode] of (baseline?[[393,false,'normal']]:[[320,true,'normal'],[360,false,'lite'],[393,false,'normal'],[412,false,'reduced']]))for(const method of (width===393?['touch','mouse']:['touch']))for(const pressure of (baseline?[65]:[30,65,140])){
 const cfg={theme,width,large,mode,method,pressure};
 const context=await browser.newContext({viewport:{width,height:852},isMobile:true,hasTouch:true,reducedMotion:mode==='reduced'?'reduce':'no-preference'});
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==origin)return route.abort();let f=path.resolve(dist,'.'+u.pathname);if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=dist+'/index.html';return route.fulfill({body:fs.readFileSync(f),contentType:({'.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png'}[path.extname(f)]||'application/octet-stream')});});
 await context.addInitScript(({seed,key,cfg})=>{window.__AGRO_DIAGNOSTIC_SESSION__=true;seed.settings.appearance=cfg.theme;seed.settings.largeText=cfg.large;localStorage.setItem(key,JSON.stringify(seed));Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>cfg.mode==='lite'?2:8});Object.defineProperty(navigator,'deviceMemory',{get:()=>cfg.mode==='lite'?2:8});},{seed,key,cfg});
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));await page.addInitScript(()=>{window.__AGRO_DIAGNOSTIC_SESSION__=true;localStorage.setItem('agro-frame-budget-v1',JSON.stringify({lite:false,at:new Date().toISOString()}));});await page.goto(origin);await page.waitForFunction(()=>!!window.TerritorioProductGestures);await page.waitForTimeout(1100);
 const before=await page.evaluate(()=>JSON.stringify(window.ERPPreview.model().data.products));
 await page.evaluate(probe);const r=await page.locator('#app [data-action=sell-product]').first().boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2;
 const cdp=await context.newCDPSession(page);
 for(let n=0;n<2;n++){if(method==='touch'){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await page.waitForTimeout(pressure);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else await page.mouse.click(x,y,{clickCount:n+1,delay:pressure});if(!n)await page.waitForTimeout(75);}
 await cdp.detach();
 await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>window.TerritorioWorkflowBridge.modal()?.kind),'stock-peek');
 await page.locator('#dialog .sheet-back[data-action=close-modal]').tap();await page.waitForTimeout(700);
 const data=await page.evaluate(()=>{window.__touch31.on=false;cancelAnimationFrame(window.__touch31raf);window.__touch31observer?.disconnect();return window.__touch31;});
 const stats=summarize(data);report.cases.push({...cfg,...stats});
 assert.equal(await page.evaluate(()=>JSON.stringify(window.ERPPreview.model().data.products)),before);
 if(!baseline){assert.equal(stats.maxHeightDelta,0);assert.equal(stats.maxTopDelta,0);assert(stats.maxLightsPerCard<=1);assert(!stats.badLight);assert(!stats.disconnected);assert(!stats.saleFrame);assert.equal(await page.locator('.glass-touch-light').count(),0,'finished effects must be released');}
 await context.close();
 }
 report.passed=report.errors.length===0;
 }catch(e){report.errors.push(String(e.stack||e));process.exitCode=1;}finally{await browser?.close();fs.writeFileSync(path.join(__dirname,baseline?'touch051-before.json':'touch051-review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
})();
