// Synthetic fixtures only. Production APK assets can be tested with --url and --baseline.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const app=path.resolve(__dirname,'../app'),baseline=process.argv.includes('--baseline'),i=process.argv.indexOf('--url'),url=i<0?'http://127.0.0.1:5178/':process.argv[i+1],origin=new URL(url).origin,assets=process.argv.includes('--assets')?path.resolve(process.argv[process.argv.indexOf('--assets')+1]):null;
const result={baseline,url,isolated:true,pages:[],dialogs:[],crawls:[],icons:[],errors:[],blocked:[],longTasks:[]};
const core={Date,Math,JSON,Intl};core.window=core;vm.createContext(core);vm.runInContext(fs.readFileSync(app+'/src/legacy/erp-core.js','utf8'),core);const seed=JSON.parse(JSON.stringify(core.ERP.seed()));seed.settings={...seed.settings,onboarding:'demo',appearance:'light',layout:'feira',financialVisible:true,city:'Carangola',uf:'MG',largeText:false,reduceEffects:false};
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});let context,page;
try{for(const mode of (baseline?['normal']:['normal','lite','reduced'])){
 context=await browser.newContext({viewport:{width:360,height:792},isMobile:true,hasTouch:true,reducedMotion:mode==='reduced'?'reduce':'no-preference'});await context.route('**/*',async r=>{const u=r.request().url();if(assets&&u.startsWith(origin+'/')){let rel=decodeURIComponent(new URL(u).pathname);let file=path.resolve(assets,'.'+rel);if(!file.startsWith(assets+path.sep)&&file!==assets)return r.abort();if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(assets,'index.html');return r.fulfill({contentType:({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream'),body:fs.readFileSync(file)});}if(u.startsWith(origin+'/')||u.startsWith('data:')||u.startsWith('blob:'))return r.continue();result.blocked.push(u);return r.abort();});await context.addInitScript(({seed,mode})=>{Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>mode==='lite'?4:8});Object.defineProperty(navigator,'deviceMemory',{get:()=>mode==='lite'?2:8});localStorage.setItem('territorio-gestao-prototipo-v1',JSON.stringify(seed));window.qaLongTasks=[];new PerformanceObserver(es=>window.qaLongTasks.push(...es.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});},{seed,mode});page=await context.newPage();page.setDefaultTimeout(12000);page.setDefaultNavigationTimeout(12000);page.on('pageerror',e=>result.errors.push(String(e)));console.log('start '+mode+' '+url);await page.goto(url);await page.waitForFunction(()=>!!window.ERPPreview);console.log('ready '+mode);await page.waitForTimeout(600);
 const act=(action,data={})=>page.evaluate(({action,data})=>window.ERPPreview.actions[action](data),{action,data});
 const before=await page.evaluate(()=>JSON.stringify(['products','sales','movements','expenses','clients'].map(k=>window.ERPPreview.model().data[k])));
 for(const theme of ['light','dark']){
  await act('nav',{page:'Vender'});
  await page.evaluate(theme=>{window.ERPPreview.model().data.settings.appearance=theme;window.ERPPreview.render();},theme);
  for(const route of ['Vender','Estoque','Clientes','Eventos','Gestão']){
   await act('close-modal');const b=page.locator('#nav [data-page="'+route+'"]');await b.click();await page.waitForTimeout(35);
   const evidence=await page.evaluate(()=>[...document.querySelectorAll('#app .fluid-animating')].filter(e=>getComputedStyle(e).scale!=='none').map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect(),scale=parseFloat(s.scale)||1,[x,y]=s.translate.split(' ').map(parseFloat),[ox,oy]=s.transformOrigin.split(' ').map(parseFloat);return{scale,originX:r.left-(x||0)+ox*scale,originY:r.top-(y||0)+oy*scale};}));
   const spread=evidence.length>1?Math.max(...evidence.map(e=>e.originX))-Math.min(...evidence.map(e=>e.originX))+Math.max(...evidence.map(e=>e.originY))-Math.min(...evidence.map(e=>e.originY)):0;result.pages.push({mode,theme,route,panels:evidence.length,pivotSpread:spread});if(!baseline)assert(spread<.3,'cards have independent page pivots: '+spread);
   await page.waitForTimeout(650);
   const glyph=await b.locator('.nav-physical-part').count();result.icons.push({mode,theme,route,physicalParts:glyph});
  }
  for(const [action,data,kind] of [['brain',{},'brain'],['sales-history',{},'day-summary'],['appearance-settings',{},'appearance'],['new-client',{},'client']]){
   await act(action,data);await page.waitForTimeout(600);const d=page.locator('dialog[open]').last();
   const geo=await d.evaluate(d=>{const r=d.getBoundingClientRect(),s=getComputedStyle(d);return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,color:s.color,background:s.backgroundColor,blur:s.backdropFilter};});assert(geo.left>=15&&geo.right<=345&&geo.top>=23&&geo.bottom<=769);assert.equal(geo.blur,'none');
   const frames=await d.evaluate(d=>new Promise(resolve=>{const body=d.querySelector('.dialog-content');if(body)body.scrollTop=body.scrollHeight/2;const expected=body?.scrollTop||0;const nodes=[...d.children].filter(e=>e.getBoundingClientRect().height>0);const base=nodes.map(e=>{const r=e.getBoundingClientRect(),q=d.getBoundingClientRect();return{y:(r.top-q.top)/q.height,h:r.height/q.height};});const frames=[];d.close('fluid-test');const assertClose=!d.open;const start=performance.now();const sample=()=>{const q=d.getBoundingClientRect(),s=getComputedStyle(d);if(q.height&&+s.opacity>.05){let shift=0;nodes.forEach((e,i)=>{const r=e.getBoundingClientRect();shift=Math.max(shift,Math.abs((r.top-q.top)/q.height-base[i].y),Math.abs(r.height/q.height-base[i].h));});frames.push({t:performance.now()-start,opacity:+s.opacity,shift,scroll:body?.scrollTop||0,expected});}if(performance.now()-start<620)requestAnimationFrame(sample);else resolve({synchronousClose:assertClose,frames,open:d.open,display:getComputedStyle(d).display,ghosts:document.querySelectorAll('.fluid-exit-layer,.fluid-page-exit-layer').length});};requestAnimationFrame(sample);}));
   assert(frames.synchronousClose);assert.equal(frames.display,'none');assert.equal(frames.ghosts,0);if(!baseline)for(const f of frames.frames){assert(f.shift<.005,'content reflows during close '+f.shift);assert(Math.abs(f.scroll-f.expected)<=1,'scroll jumps on close');}
   result.dialogs.push({mode,theme,kind,geometry:geo,...frames});
  }
  if(mode==='normal'&&!process.argv.includes('--quick')){
   await page.evaluate(fs.readFileSync(app+'/tests/app-crawl.js','utf8'));const crawl=await page.evaluate(()=>window.crawlApp());result.crawls.push({theme,...crawl});console.log('crawl '+theme+': '+crawl.screens+' surfaces');assert.deepEqual(crawl.overflow,[]);
   // Explicit settings → data → backup and management → details → nested report families.
   for(const [a,d] of [['settings',{}],['appearance-settings',{}],['data',{}],['mg-detail',{kind:'products'}],['mg-detail',{kind:'clients'}],['mg-detail',{kind:'finance'}]]){if(await page.evaluate(a=>!!window.ERPPreview.actions[a],a)){await act(a,d);await page.waitForTimeout(600);await act('close-modal');}}
  }
 }
 if(!baseline){
  await act('nav',{page:'Estoque'});await act('settings');await page.waitForTimeout(600);await act('settings-back');await page.waitForTimeout(45);
  const group=await page.evaluate(()=>{const c=document.querySelector('.fluid-page-exit-context');return c?{children:c.children.length,nodes:c.querySelectorAll('*').length,animated:c.classList.contains('fluid-animating'),separate:[...c.children].some(e=>getComputedStyle(e).scale!=='none'||getComputedStyle(e).translate!=='none')}:null;});
  if(mode==='normal'){assert(group?.animated,'page return must animate one group');assert(!group.separate,'page copies carry independent transforms');assert(group.nodes<=328);}
  await page.waitForTimeout(650);await act('brain');await page.waitForTimeout(90);await act('close-modal');await page.waitForTimeout(45);await act('brain');await page.waitForTimeout(600);assert(await page.locator('dialog[open]').count());await page.evaluate(()=>document.getElementById('dialog').close());
  await page.waitForTimeout(700);const idle=await page.evaluate(()=>window.TerritorioMotion?.diagnostics());if(idle){assert.equal(idle.active,0);assert.equal(idle.pendingFrame,false);}result.pages.push({mode,returnGroup:group,rapidReopen:true,idle});
 }
 if(!baseline){
  await act('nav',{page:'Vender'});await act('sell-product',{id:seed.products[0].id});await act('digit',{digit:1});
  for(const [action,kind] of [['expand-client','sale-client'],['toggle-origin','sale-origin']]){
   await act(action);await page.waitForTimeout(600);const opened=await page.locator('dialog[open]').getAttribute('data-kind');assert.equal(opened,kind);
   await act('close-modal');await page.waitForTimeout(45);const exit=await page.locator('#dialog').evaluate(d=>({open:d.open,kind:d.dataset.kind,content:d.childElementCount,native:d.classList.contains('fluid-native-exit'),display:getComputedStyle(d).display,opacity:+getComputedStyle(d).opacity}));
   assert(!exit.open&&exit.content>0,'sale option erased its visual during close');if(mode!=='reduced')assert(exit.native&&exit.opacity>0,'sale option exit was cancelled');result.dialogs.push({mode,kind,visualPreserved:exit});await page.waitForTimeout(650);
  }
  await act('cancel-sale');
 }
 const after=await page.evaluate(()=>JSON.stringify(['products','sales','movements','expenses','clients'].map(k=>window.ERPPreview.model().data[k])));assert.equal(after,before,'read-only audit changed business data');await page.waitForTimeout(800);result.longTasks.push({mode,entries:await page.evaluate(()=>window.qaLongTasks)});await context.close();context=null;
 }
 result.passed=true;
}catch(e){result.failure=String(e.stack||e);if(page&&!page.isClosed())await page.screenshot({path:path.join(__dirname,'fluid-failure.png')}).catch(()=>{});throw e;}finally{await context?.close();await browser.close();fs.writeFileSync(path.join(__dirname,baseline?'fluid-baseline.json':'fluid-qa.json'),JSON.stringify(result,null,2));}
console.log(JSON.stringify({passed:result.passed,pages:result.pages.length,dialogs:result.dialogs.length,crawls:result.crawls.map(x=>({theme:x.theme,screens:x.screens})),errors:result.errors}));assert.deepEqual(result.errors,[]);
})().catch(e=>{console.error(e);process.exitCode=1;});
