// Compare the compiled Claude reference and Codex candidate with the same synthetic records.
// This harness never reads or writes a producer database.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require('../app/node_modules/sharp');
const {makeSeed}=require('./motion134-seed.cjs');
const root=path.resolve(__dirname,'..');
const reference=process.env.AGRO_PARITY_REFERENCE||'C:/Users/alexd/.codex/visualizations/2026/10/28/01a1835c-018b-7352-95a2-037da69102a6/motion134-baseline-web';
const candidate=path.join(root,'app/dist');
const output=process.env.AGRO_PARITY_OUTPUT||'C:/Users/alexd/.codex/visualizations/2026/10/28/01a1835c-018b-7352-95a2-037da69102a6/motion134-parity';
const fixedNow=Date.parse('2026-10-28T12:00:00.000Z');
const sha256=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.md':'text/plain'};
function inventory(directory){
 const found=[];
 const visit=dir=>{for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())visit(file);else if(item.isFile()){const data=fs.readFileSync(file);found.push({path:path.relative(directory,file).replaceAll(path.sep,'/'),bytes:data.length,sha256:sha256(data)});}}};
 visit(directory);found.sort((a,b)=>a.path.localeCompare(b.path,'en'));
 return{fingerprint:sha256(JSON.stringify(found)),files:found};
}
function styles(snapshot){return snapshot.files.filter(x=>x.path.endsWith('.css')).map(x=>({path:x.path,sha256:x.sha256}));}
function staticFiles(snapshot){return snapshot.files.filter(x=>!['.js','.html','.css'].includes(path.extname(x.path))).map(x=>({path:x.path,sha256:x.sha256}));}
async function open(browser,directory,theme,width,errors){
 const context=await browser.newContext({viewport:{width,height:width===320?640:820},hasTouch:true,isMobile:true,deviceScaleFactor:1,colorScheme:theme,reducedMotion:'reduce',locale:'pt-BR',timezoneId:'America/Sao_Paulo'});
 await context.route('**/*',route=>{
  const url=new URL(route.request().url());if(url.origin!=='https://localhost')return route.abort();
  const relative=decodeURIComponent(url.pathname).replace(/^\/+/,''),file=path.resolve(directory,relative||'index.html'),inside=path.relative(directory,file);
  if(inside.startsWith('..')||path.isAbsolute(inside)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.abort();
  return route.fulfill({body:fs.readFileSync(file),contentType:mime[path.extname(file)]||'application/octet-stream'});
 });
 const seed=makeSeed({appearance:theme,largeText:width===320,performanceMode:width===320?'lite':'auto',reduceEffects:false,weatherEnabled:false,weatherBackgroundEnabled:false,firstUseAt:new Date(fixedNow).toISOString()});
 // Ensure the example event remains future relative to the fixed application clock.
 seed.events.forEach(event=>{event.start='2026-10-29';event.end='2026-10-29';});
 await context.addInitScript(({seed,now})=>{
  const NativeDate=Date;
  class FrozenDate extends NativeDate{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
  window.Date=FrozenDate;
  let id=0,random=0x132;
  Object.defineProperty(crypto,'randomUUID',{configurable:true,value:()=> '00000000-0000-4000-8000-'+String(++id).padStart(12,'0')});
  Math.random=()=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return random/4294967296;};
  window.__AGRO_DIAGNOSTIC_SESSION__=true;
  localStorage.setItem('territorio-gestao-prototipo-v1',JSON.stringify(seed));
  localStorage.setItem('agro-notification-prompt-v1','answered');
 },{seed,now:fixedNow});
 const page=await context.newPage();page.on('pageerror',error=>errors.push(String(error)));
 await page.goto('https://localhost');
 await page.waitForFunction(()=>window.__AGRO_UI_BOOT_READY__||window.__AGRO_UI_BOOT_FAULT__,null,{timeout:30000});
 assert.equal(await page.evaluate(()=>window.__AGRO_UI_BOOT_FAULT__||null),null,'UI bootstrap fault');
 await page.waitForFunction(()=>window.ERPPreview&&window.TerritorioSellModes);
 assert.equal(await page.evaluate(()=>window.TERRITORIO_VERSION),directory===candidate?'0.12.134':'0.12.133','Reference/candidate version mismatch');
 await page.evaluate(async()=>{await document.fonts.ready;if(document.getElementById('dialog').open)ERPPreview.actions['close-modal']();});
 await settle(page);
 return{context,page};
}
async function settle(page){
 await page.waitForTimeout(300);
 await page.waitForFunction(()=>!document.getAnimations().some(a=>a.playState==='running'&&a.effect?.getComputedTiming().iterations!==Infinity),null,{timeout:10000});
 await page.waitForTimeout(100);
}
async function action(page,name,data={}){await page.evaluate(([name,data])=>{if(typeof ERPPreview.actions[name]!=='function')throw Error('Missing action '+name);return ERPPreview.actions[name](data);},[name,data]);await settle(page);}
async function picture(page,file){
 await page.evaluate(()=>window.scrollTo(0,0));await settle(page);
 // Animated cursors/indicators are irrelevant to static style parity; the transition has settled.
 return page.screenshot({path:file,animations:'disabled',caret:'hide'});
}
async function comparePictures(referencePng,candidatePng,file){
 const a=await sharp(referencePng).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const b=await sharp(candidatePng).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(a.info.width,b.info.width);assert.equal(a.info.height,b.info.height);assert.equal(a.info.channels,b.info.channels);
 const delta=Buffer.alloc(a.data.length);let pixels=0,total=0,max=0;
 for(let i=0;i<a.data.length;i+=4){let changed=false;for(let channel=0;channel<3;channel++){const n=Math.abs(a.data[i+channel]-b.data[i+channel]);delta[i+channel]=n;total+=n;max=Math.max(max,n);changed||=n!==0;}delta[i+3]=255;if(changed)pixels++;}
 await sharp(delta,{raw:a.info}).png().toFile(file);
 return{width:a.info.width,height:a.info.height,differingPixels:pixels,totalPixels:a.info.width*a.info.height,meanAbsoluteChannelDifference:total/(a.info.width*a.info.height*3),maxChannelDifference:max,exact:pixels===0,referenceSHA256:sha256(referencePng),candidateSHA256:sha256(candidatePng)};
}
async function state(page){return page.evaluate(()=>({page:ERPPreview.state().page,domain:JSON.stringify({products:ERPPreview.model().data.products,sales:ERPPreview.model().data.sales,expenses:ERPPreview.model().data.expenses}),text:document.getElementById('app').innerText.replace(/\s+/g,' ').trim(),viewport:{width:innerWidth,scrollWidth:document.documentElement.scrollWidth}}));}
async function run(){
 fs.mkdirSync(output,{recursive:true});
 const report={version:'0.12.134',scope:'Claude-to-Codex-static-visual-parity',synthetic:true,networkBlocked:true,productionDatabaseRead:false,fixedNow:new Date(fixedNow).toISOString(),reference,candidate,startedAt:new Date().toISOString(),cases:[],errors:[]};
 let browser;
 try{
  report.referenceAssetsBefore=inventory(reference);report.candidateAssetsBefore=inventory(candidate);
  report.stylesIdentical=JSON.stringify(styles(report.referenceAssetsBefore))===JSON.stringify(styles(report.candidateAssetsBefore));
  report.staticAssetsIdentical=JSON.stringify(staticFiles(report.referenceAssetsBefore))===JSON.stringify(staticFiles(report.candidateAssetsBefore));
  assert(report.stylesIdentical,'Compiled CSS differs from Claude133');assert(report.staticAssetsIdentical,'Static assets/data differ from Claude133');
  browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const cases=(process.env.AGRO_SINGLE?['light']:['light','dark']).flatMap(theme=>(process.env.AGRO_SINGLE?[320]:[320,360,393,412]).map(width=>({theme,width})));
  const queue=[...cases];
  async function worker(){while(queue.length){const spec=queue.shift(),entry={...spec,reducedMotion:true,largeText:spec.width===320,scenes:[]},errors=[];let a,b;
   try{
    [a,b]=await Promise.all([open(browser,reference,spec.theme,spec.width,errors),open(browser,candidate,spec.theme,spec.width,errors)]);
    const pair=async(name,prepare)=>{
     if(prepare)await Promise.all([prepare(a.page),prepare(b.page)]);
     const prefix=spec.theme+'-'+spec.width+'-'+name;
     const [left,right]=await Promise.all([picture(a.page,path.join(output,prefix+'-claude.png')),picture(b.page,path.join(output,prefix+'-codex.png'))]);
     const difference=await comparePictures(left,right,path.join(output,prefix+'-diff.png'));
     const [x,y]=await Promise.all([state(a.page),state(b.page)]);
     assert.equal(x.text,y.text,name+' visible text differs');assert.equal(x.domain,y.domain,name+' synthetic data differs');
     assert(x.viewport.scrollWidth<=x.viewport.width+3&&y.viewport.scrollWidth<=y.viewport.width+3,name+' horizontal overflow');
     entry.scenes.push({name,...difference,textIdentical:true,dataIdentical:true,viewportFit:true});
     assert(difference.exact,name+' has '+difference.differingPixels+' differing pixels');
    };
    await pair('home',p=>action(p,'nav',{page:'Vender'}));
    await pair('home-expanded',async p=>{await p.locator('#app .fam[data-fam="Café Especial"] [data-fam-more]').click();await settle(p);});
    await pair('section-map',async p=>{
     await p.locator('#app [data-action="fam-map"]').first().click();await settle(p);
     const labels=p.locator('#dialog .fam-thumb-art i');
     assert((await labels.count())>0,'Section map thumbnail labels missing');
     assert(await labels.evaluateAll(nodes=>nodes.every(node=>getComputedStyle(node).textAlign==='center')),'Claude133 thumbnail label centering missing');
    });
    await Promise.all([action(a.page,'close-modal'),action(b.page,'close-modal')]);
    await pair('stock-areas',p=>action(p,'nav',{page:'Estoque'}));
    await pair('stock-subgroups',async p=>{await p.locator('#app [data-action="stock-area"][data-area="Cafés"]').click();await settle(p);});
    await pair('stock-products',async p=>{await p.locator('#app [data-action="stock-sub"]').first().click();await settle(p);});
    assert.equal(errors.length,0,'Page errors: '+errors.join('; '));entry.passed=true;
   }catch(error){entry.errors=[...errors,String(error.stack||error)];report.errors.push(...entry.errors);entry.passed=false;}
   finally{await Promise.allSettled([a?.context.close(),b?.context.close()]);report.cases.push(entry);console.log(JSON.stringify({theme:spec.theme,width:spec.width,passed:entry.passed,scenes:entry.scenes.length,errors:entry.errors}));}
  }}
  await Promise.all([worker(),worker()]);
  report.referenceAssetsAfter=inventory(reference);report.candidateAssetsAfter=inventory(candidate);
  report.referenceAssetsUnchanged=report.referenceAssetsBefore.fingerprint===report.referenceAssetsAfter.fingerprint;
  report.candidateAssetsUnchanged=report.candidateAssetsBefore.fingerprint===report.candidateAssetsAfter.fingerprint;
  assert(report.referenceAssetsUnchanged&&report.candidateAssetsUnchanged,'Compiled assets changed during parity QA');
  report.passed=report.errors.length===0&&report.cases.length===cases.length&&report.cases.every(x=>x.passed);
  assert(report.passed,'Visual parity failed');
 }catch(error){report.errors.push(String(error.stack||error));report.passed=false;process.exitCode=1;}
 finally{await browser?.close();report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(output,'review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,cases:report.cases.length,scenes:report.cases.reduce((n,c)=>n+c.scenes.length,0),errors:report.errors,output}));}
 return report;
}
module.exports={run};
if(require.main===module)void run();
