// Synthetic route benchmark. rAF intervals describe main-thread scheduling, never GPU FPS.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),cp=require('node:child_process');
const {chromium}=require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {makeSeed}=require('./codex133-seed.cjs');
const root=path.resolve(__dirname,'..'),args=process.argv.slice(2),port=args.includes('--cdp')?Number(args[args.indexOf('--cdp')+1]):0;
const phase=process.env.AGRO_MOTION_PHASE||'baseline',device=args.includes('--device')?args[args.indexOf('--device')+1]:'browser';
const output=process.env.AGRO_MOTION_OUTPUT||`C:/Users/alexd/.codex/visualizations/2026/10/28/01a1835c-018b-7352-95a2-037da69102a6/motion134-${phase}-${device}`;
const assets=process.env.AGRO_MOTION_ASSETS||path.join(root,'app/dist'),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
function physicalForeground(){
 if(!port)return;
 const serial=process.env.AGRO_MOTION_SERIAL||{reno:'adb-NJJ7OJRKIF8XFYSO-ybQC0W._adb-tls-connect._tcp',pkj:'adb-3a945035-mL9gnS._adb-tls-connect._tcp'}[device];assert(serial);
 const adb=path.resolve(root,'../New project/android-sdk/platform-tools/adb.exe');
 const read=(...args)=>cp.execFileSync(adb,['-s',serial,'shell',...args],{encoding:'utf8',windowsHide:true,timeout:10000});
 assert(!/showing=true/.test(read('dumpsys','window','policy')),'Human unlock required; physical sample invalid');
 const top=read('dumpsys','activity','activities').split('\n').find(l=>/topResumedActivity=|ResumedActivity:/.test(l));
 const expected=phase==='baseline'?'br.com.territorio.gestao2.integration133/':'br.com.territorio.gestao2.motion134/';
 assert((top||'').includes(expected),'The exact synthetic fixture must stay in the foreground');
}
function inventory(dir){const list=[];function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())walk(f);else list.push([path.relative(dir,f).replaceAll(path.sep,'/'),hash(fs.readFileSync(f))]);}}walk(dir);return hash(JSON.stringify(list.sort()));}
function installProbe(){
 if(window.__motion134Probe)return;
 const state={active:false,rect:0,computed:0,rewinds:0,writes:0,gaps:[],longTasks:[],before:[],last:0};
 window.__motion134Probe=state;
 const originalRect=Element.prototype.getBoundingClientRect,originalStyle=window.getComputedStyle;
 Element.prototype.getBoundingClientRect=function(...a){if(state.active)state.rect++;return originalRect.apply(this,a);};
 window.getComputedStyle=function(...a){if(state.active)state.computed++;return originalStyle.apply(this,a);};
 const d=Object.getOwnPropertyDescriptor(Animation.prototype,'currentTime');
 if(d?.set&&d.configurable)Object.defineProperty(Animation.prototype,'currentTime',{...d,set(v){if(state.active){state.writes++;if(Number(v)<Number(d.get.call(this))-.5)state.rewinds++;}return d.set.call(this,v);}});
 new PerformanceObserver(list=>{if(state.active)for(const e of list.getEntries())state.longTasks.push(e.duration);}).observe({entryTypes:['longtask']});
 document.addEventListener('territorio:before-page',e=>{if(state.active)state.before.push({page:e.detail.page,at:performance.now()});},true);
 function tick(t){if(state.active&&state.last)state.gaps.push(t-state.last);state.last=state.active?t:0;requestAnimationFrame(tick);}requestAnimationFrame(tick);
 state.reset=()=>{Object.assign(state,{active:true,rect:0,computed:0,rewinds:0,writes:0,gaps:[],longTasks:[],before:[],last:0,startedAt:performance.now()});};
 state.read=()=>{state.active=false;return {rectReads:state.rect,computedStyleReads:state.computed,timelineWrites:state.writes,timelineRewinds:state.rewinds,frameIntervals:state.gaps,longTasks:state.longTasks,before:state.before.map(e=>({page:e.page,delay:e.at-state.startedAt})),page:ERPPreview.state().page,ghosts:document.querySelectorAll('.fluid-page-morph-layer,.stock-leaving').length,liveMotions:TerritorioMotion.diagnostics().active,elapsed:performance.now()-state.startedAt};};
}
const stats=a=>{const s=[...a].sort((a,b)=>a-b);return {count:s.length,max:s.at(-1)||0,p95:s[Math.floor((s.length-1)*.95)]||0,over34:s.filter(x=>x>34).length,over50:s.filter(x=>x>50).length};};
const metrics=async c=>Object.fromEntries((await c.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
async function inspect(page,cdp,spec){
 await page.evaluate(installProbe);await page.waitForTimeout(200);
 const entry={...spec,cases:[]};
 for(let pass=0;pass<2;pass++)for(const target of ['Estoque','Clientes','Eventos','Gestão','Vender']){
  physicalForeground();
  const before=await metrics(cdp);await page.evaluate(()=>__motion134Probe.reset());
  await page.locator('#nav button[data-page="'+target+'"]').click();
  await page.waitForTimeout(1150);
  const measured=await page.evaluate(()=>__motion134Probe.read()),after=await metrics(cdp);
  physicalForeground();assert.equal(measured.page,target);assert.equal(measured.ghosts,0,'Stale page layer after '+target);
  entry.cases.push({pass:pass+1,target,...measured,frameScheduling:stats(measured.frameIntervals),longTaskTiming:stats(measured.longTasks),layoutCount:after.LayoutCount-before.LayoutCount,recalcStyleCount:after.RecalcStyleCount-before.RecalcStyleCount,taskMs:(after.TaskDuration-before.TaskDuration)*1000,layoutMs:(after.LayoutDuration-before.LayoutDuration)*1000,styleMs:(after.RecalcStyleDuration-before.RecalcStyleDuration)*1000});
 }
 // Reproduce a missed main-thread interval; the compositor's timeline must still move forward.
 physicalForeground();await page.evaluate(()=>__motion134Probe.reset());await page.locator('#nav button[data-page="Estoque"]').click();
 await page.evaluate(()=>new Promise(resolve=>setTimeout(()=>{const end=performance.now()+100;while(performance.now()<end){}resolve();},50)));
 await page.waitForTimeout(1100);entry.injected100msStall=await page.evaluate(()=>__motion134Probe.read());
 // Last intent wins when another tab is selected while the incoming spring is still active.
 await page.evaluate(()=>__motion134Probe.reset());
 for(const target of ['Vender','Clientes','Gestão','Estoque','Eventos','Vender']){await page.locator('#nav button[data-page="'+target+'"]').click({force:true});await page.waitForTimeout(55);}
 await page.waitForTimeout(1200);entry.rapid=await page.evaluate(()=>__motion134Probe.read());assert.equal(entry.rapid.page,'Vender');assert.equal(entry.rapid.ghosts,0);
 physicalForeground();entry.foregroundGuarded=!!port;entry.passed=true;console.log(JSON.stringify({phase,device,...spec,passed:true,rewinds:entry.cases.reduce((n,c)=>n+c.timelineRewinds,0),injectedRewinds:entry.injected100msStall.timelineRewinds,maxTask:Math.max(...entry.cases.flatMap(c=>c.longTasks),0)}));return entry;
}
async function main(){
 fs.mkdirSync(output,{recursive:true});const report={phase,device,synthetic:true,productionDataRead:false,frameMeasure:'main-thread-rAF-intervals-not-GPU-FPS',startedAt:new Date().toISOString(),cases:[],errors:[]};let browser;
 try{
  if(port){browser=await chromium.connectOverCDP('http://127.0.0.1:'+port);const page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith('https://localhost'));assert(page);await page.waitForFunction(()=>window.__AGRO_UI_BOOT_READY__,null,{timeout:60000});assert(await page.evaluate(()=>['codex133','motion134'].includes(window.__AGRO_NATIVE_FIXTURE__)&&['codex133-synthetic','motion134-synthetic'].includes(ERPPreview.model().data.dataContext.id)),'Synthetic fixture required');const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');for(const theme of ['light','dark']){await page.evaluate(async theme=>{ERPPreview.model().data.settings.appearance=theme;ERPPreview.persist();await TerritorioNative.durable();},theme);await page.reload();await page.waitForFunction(()=>window.__AGRO_UI_BOOT_READY__,null,{timeout:60000});await page.evaluate(()=>Capacitor.nativePromise('KeepAwake','keepAwake',{}));report.cases.push(await inspect(page,cdp,{physical:true,cpuRate:1,theme}));}}
  else{
   report.assetsBefore=inventory(assets);browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
   for(const rate of [1,4,6])for(const theme of ['light','dark']){
    const context=await browser.newContext({viewport:{width:393,height:820},isMobile:true,hasTouch:true,deviceScaleFactor:1,colorScheme:theme,locale:'pt-BR',timezoneId:'America/Sao_Paulo'});
    const seed=makeSeed({appearance:theme,reduceEffects:false,performanceMode:'auto'});
    await context.addInitScript(seed=>{window.__AGRO_DIAGNOSTIC_SESSION__=true;localStorage.setItem('territorio-gestao-prototipo-v1',JSON.stringify(seed));localStorage.setItem('agro-notification-prompt-v1','answered');},seed);
    await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!=='https://localhost')return route.abort();const f=path.resolve(assets,decodeURIComponent(u.pathname).replace(/^\/+/,'' )||'index.html');if(!f.startsWith(assets+path.sep)||!fs.existsSync(f))return route.abort();const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.png':'image/png','.webp':'image/webp','.json':'application/json','.svg':'image/svg+xml'};return route.fulfill({body:fs.readFileSync(f),contentType:types[path.extname(f)]||'text/plain'});});
    const page=await context.newPage(),cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');await cdp.send('Emulation.setCPUThrottlingRate',{rate});
    await page.goto('https://localhost');await page.waitForFunction(()=>window.__AGRO_UI_BOOT_READY__,null,{timeout:90000});await page.evaluate(async()=>{await document.fonts.ready;if(document.getElementById('dialog').open)ERPPreview.actions['close-modal']();});
    report.cases.push(await inspect(page,cdp,{physical:false,simulation:true,cpuRate:rate,theme}));await context.close();
   }
   report.assetsAfter=inventory(assets);assert.equal(report.assetsAfter,report.assetsBefore);
  }
  report.passed=true;
 }catch(e){report.errors.push(String(e.stack||e));report.passed=false;process.exitCode=1;}
 finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(output,'review.json'),JSON.stringify(report,null,2));if(!port)await Promise.race([browser?.close(),new Promise(r=>setTimeout(r,500))]);console.log(JSON.stringify({phase,device,passed:report.passed,cases:report.cases.length,errors:report.errors,output}));}
}
main().then(()=>process.exit(process.exitCode||0));
