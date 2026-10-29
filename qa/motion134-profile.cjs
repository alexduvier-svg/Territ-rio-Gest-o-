// One targeted compiled-app diagnostic round. CPU sampling/tracing overhead is not a benchmark.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {makeSeed}=require('./motion134-seed.cjs');
const root=path.resolve(__dirname,'..'),assets=path.join(root,'app/dist');
const output='C:/Users/alexd/.codex/visualizations/2026/10/28/01a1835c-018b-7352-95a2-037da69102a6/motion134-profile';
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
function inventory(dir){const entries=[];function walk(current){for(const item of fs.readdirSync(current,{withFileTypes:true})){const file=path.join(current,item.name);if(item.isDirectory())walk(file);else entries.push([path.relative(dir,file).replaceAll(path.sep,'/'),hash(fs.readFileSync(file))]);}}walk(dir);return hash(JSON.stringify(entries.sort()));}
const sources=new Map();
function location(frame){
 const relative=String(frame.url||'').replace(/^https:\/\/localhost\//,'');
 const result={function:frame.functionName||'(anonymous)',asset:relative,line:(frame.lineNumber??-1)+1,column:(frame.columnNumber??-1)+1};
 if(relative.startsWith('assets/')&&relative.endsWith('.js')){
  if(!sources.has(relative))sources.set(relative,fs.readFileSync(path.join(assets,relative),'utf8').split('\n'));
  const line=sources.get(relative)[frame.lineNumber];
  if(line)result.excerpt=line.slice(Math.max(0,frame.columnNumber-35),frame.columnNumber+235);
 }
 return result;
}
function profileSummary(profile){
 const nodes=new Map(profile.nodes.map(node=>[node.id,node])),parents=new Map();
 for(const node of profile.nodes)for(const child of node.children||[])parents.set(child,node.id);
 const functions=new Map(),categories={idleMs:0,programMs:0,garbageCollectorMs:0,otherRuntimeMs:0};
 const key=frame=>[frame.url,frame.lineNumber,frame.columnNumber,frame.functionName].join('|');
 const row=node=>{const id=key(node.callFrame);if(!functions.has(id))functions.set(id,{...location(node.callFrame),selfMs:0,inclusiveMs:0,samples:0});return functions.get(id);};
 for(let i=0;i<(profile.samples||[]).length;i++){
  const node=nodes.get(profile.samples[i]),ms=(profile.timeDeltas?.[i]||0)/1000;if(!node)continue;
  if(node.callFrame.url?.startsWith('https://localhost/assets/')){const value=row(node);value.selfMs+=ms;value.samples++;}
  else if(node.callFrame.functionName==='(idle)')categories.idleMs+=ms;
  else if(node.callFrame.functionName==='(program)')categories.programMs+=ms;
  else if(node.callFrame.functionName==='(garbage collector)')categories.garbageCollectorMs+=ms;
  else categories.otherRuntimeMs+=ms;
  const seen=new Set();let cursor=node;
  while(cursor){const id=key(cursor.callFrame);if(cursor.callFrame.url?.startsWith('https://localhost/assets/')&&!seen.has(id)){row(cursor).inclusiveMs+=ms;seen.add(id);}cursor=nodes.get(parents.get(cursor.id));}
 }
 const appSelfMs=[...functions.values()].reduce((sum,value)=>sum+value.selfMs,0);
 const format=value=>({...value,selfMs:+value.selfMs.toFixed(2),inclusiveMs:+value.inclusiveMs.toFixed(2)});
 return{sampleWindowMs:(profile.endTime-profile.startTime)/1000,sampleCount:profile.samples?.length||0,appSelfMs:+appSelfMs.toFixed(2),categories,
  topSelf:[...functions.values()].sort((a,b)=>b.selfMs-a.selfMs).slice(0,10).map(format),topInclusive:[...functions.values()].sort((a,b)=>b.inclusiveMs-a.inclusiveMs).slice(0,8).map(format)};
}
function traceSummary(trace){
 const mainThreads=new Set(trace.traceEvents.filter(event=>event.ph==='M'&&event.name==='thread_name'&&event.args?.name==='CrRendererMain').map(event=>event.pid+':'+event.tid));
 const events=trace.traceEvents.filter(event=>event.ph==='X'&&mainThreads.has(event.pid+':'+event.tid));
 const counts={};for(const event of events){if(!['Layout','UpdateLayoutTree','RecalculateStyles','Paint','PrePaint','CompositeLayers','RunTask','FunctionCall'].includes(event.name))continue;const old=counts[event.name]||{count:0,totalMs:0,maxMs:0};old.count++;old.totalMs+=event.dur/1000;old.maxMs=Math.max(old.maxMs,event.dur/1000);counts[event.name]=old;}
 const expensiveLayouts=events.filter(event=>['Layout','UpdateLayoutTree','RecalculateStyles'].includes(event.name)).sort((a,b)=>b.dur-a.dur).slice(0,8).map(event=>({name:event.name,durationMs:event.dur/1000,stack:(event.args?.beginData?.stackTrace||event.args?.data?.stackTrace||[]).slice(0,5).map(frame=>location({...frame,lineNumber:frame.lineNumber-1,columnNumber:frame.columnNumber-1}))}));
 return{eventDurationsMayNest:true,mainRendererThreadCount:mainThreads.size,counts,expensiveLayouts};
}
async function stopTrace(cdp){const done=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));await cdp.send('Tracing.end');const {stream}=await done;let json='';while(true){const value=await cdp.send('IO.read',{handle:stream});json+=value.base64Encoded?Buffer.from(value.data,'base64').toString('utf8'):value.data;if(value.eof)break;}await cdp.send('IO.close',{handle:stream});return JSON.parse(json);}
async function metrics(cdp){return Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(value=>[value.name,value.value]));}
const durationNames=['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration'];
async function capture(page,cdp,target,pass){
 const slug=(target==='Gestão'?'management':target==='Vender'?'selling':'stock')+'-'+pass;
 await page.evaluate(()=>{window.__motion134ProfileTasks=[];});
 await cdp.send('Tracing.start',{categories:'devtools.timeline,disabled-by-default-devtools.timeline.stack,blink.user_timing,toplevel',transferMode:'ReturnAsStream'});
 await cdp.send('Profiler.start');const before=await metrics(cdp);
 const begin=await page.evaluate(()=>performance.now());await page.locator('#nav button[data-page="'+target+'"]').click();await page.waitForTimeout(1650);
 const observed=await page.evaluate(begin=>({elapsedMs:performance.now()-begin,page:ERPPreview.state().page,longTasks:window.__motion134ProfileTasks.filter(value=>value.startTime>=begin),ghosts:document.querySelectorAll('.fluid-page-morph-layer,.stock-leaving').length,motion:TerritorioMotion.diagnostics()}),begin);
 const after=await metrics(cdp),{profile}=await cdp.send('Profiler.stop'),trace=await stopTrace(cdp);
 fs.writeFileSync(path.join(output,slug+'.cpuprofile'),JSON.stringify(profile));fs.writeFileSync(path.join(output,slug+'-trace.json'),JSON.stringify(trace));
 const delta={};for(const name of durationNames)delta[name+'Ms']=(after[name]-before[name])*1000;for(const name of ['LayoutCount','RecalcStyleCount'])delta[name]=after[name]-before[name];
 assert.equal(observed.page,target);assert.equal(observed.ghosts,0);
 const result={target,pass:pass===1?'first-measured-entry':'second-measured-entry',...observed,performanceMetrics:delta,cpu:profileSummary(profile),trace:traceSummary(trace)};
 console.log(JSON.stringify({target,pass,taskMs:delta.TaskDurationMs,scriptMs:delta.ScriptDurationMs,layoutMs:delta.LayoutDurationMs,styleMs:delta.RecalcStyleDurationMs,layouts:delta.LayoutCount,maxLongTaskMs:Math.max(...observed.longTasks.map(value=>value.duration),0),topSelf:result.cpu.topSelf.slice(0,3).map(value=>({function:value.function,selfMs:value.selfMs,asset:value.asset}))}));return result;
}
async function main(){
 fs.mkdirSync(output,{recursive:true});const report={version:'0.12.134',scope:'one-targeted-compiled-route-profile',synthetic:true,productionDataRead:false,physical:false,theme:'light',viewport:{width:393,height:820},cpuRate:6,samplingIntervalMicroseconds:1000,startedAt:new Date().toISOString(),cases:[],errors:[],limitations:[
  'Desktop CPU throttling simulates main-thread pressure; it is not a physical low-cost phone or GPU FPS measurement.',
  'CPU sampling and tracing add overhead; these absolute durations are diagnostic and cannot replace the unprofiled benchmark.',
  'Vender is the initial boot route and already rendered once before the first measured navigation back to it.',
  'Compiled files have no source maps; function names are minified and source attribution uses asset locations/excerpts.',
  'Inclusive function/event durations overlap and must not be added together.',
  'The fixture disables adaptive diagnostic sampling and external network calls; no saved user data is read.'
 ]};let browser;
 try{report.assetsBefore=inventory(assets);browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const context=await browser.newContext({viewport:report.viewport,isMobile:true,hasTouch:true,deviceScaleFactor:1,colorScheme:'light',locale:'pt-BR',timezoneId:'America/Sao_Paulo'});
  await context.addInitScript(seed=>{window.__AGRO_DIAGNOSTIC_SESSION__=true;localStorage.setItem('territorio-gestao-prototipo-v1',JSON.stringify(seed));localStorage.setItem('agro-notification-prompt-v1','answered');window.__motion134ProfileTasks=[];new PerformanceObserver(list=>{for(const value of list.getEntries())window.__motion134ProfileTasks.push({startTime:value.startTime,duration:value.duration});}).observe({entryTypes:['longtask']});},makeSeed({appearance:'light',reduceEffects:false,performanceMode:'auto'}));
  await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!=='https://localhost')return route.abort();const file=path.resolve(assets,decodeURIComponent(url.pathname).replace(/^\/+/,'' )||'index.html');if(!file.startsWith(assets+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.abort();return route.fulfill({body:fs.readFileSync(file),contentType:({'.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png','.json':'application/json','.svg':'image/svg+xml'}[path.extname(file)]||'text/plain')});});
  const page=await context.newPage(),cdp=await context.newCDPSession(page);page.on('pageerror',error=>report.errors.push(String(error)));await cdp.send('Performance.enable');await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:1000});await cdp.send('Emulation.setCPUThrottlingRate',{rate:6});
  await page.goto('https://localhost');await page.waitForFunction(()=>window.__AGRO_UI_BOOT_READY__,null,{timeout:90000});await page.evaluate(async()=>{await document.fonts.ready;if(document.getElementById('dialog').open)ERPPreview.actions['close-modal']();});await page.waitForTimeout(1800);
  const beforeDomain=await page.evaluate(()=>JSON.stringify(['products','sales','movements','expenses'].map(key=>ERPPreview.model().data[key])));
  for(const pass of [1,2])for(const target of ['Gestão','Vender','Estoque'])report.cases.push(await capture(page,cdp,target,pass));
  const afterDomain=await page.evaluate(()=>JSON.stringify(['products','sales','movements','expenses'].map(key=>ERPPreview.model().data[key])));report.domainUnchanged=beforeDomain===afterDomain;assert(report.domainUnchanged);assert.equal(report.errors.length,0);
  report.assetsAfter=inventory(assets);assert.equal(report.assetsAfter,report.assetsBefore);report.assetsUnchanged=true;report.passed=true;await context.close();
 }catch(error){report.errors.push(String(error.stack||error));report.passed=false;process.exitCode=1;}
 finally{await browser?.close();report.finishedAt=new Date().toISOString();report.findings=[];fs.writeFileSync(path.join(__dirname,'motion134-profile-summary.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,cases:report.cases.length,errors:report.errors,output}));}
 return report;
}
if(require.main===module)main();
