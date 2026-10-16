// Local, isolated UI verification. No device, real browser tabs or completed transactions.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const app=path.resolve(__dirname,'../app');
const urlArg=process.argv.indexOf('--url');const url=urlArg>=0?process.argv[urlArg+1]:'http://127.0.0.1:5178/';
const base=new URL(url).origin;
const report={isolated:true,url,errors:[],motion:[],labels:[],memory:[],blockedExternalRequests:[],requestFailures:[],consoleErrors:[],expectedNetworkErrors:[]};
const blockedExternalURLs=new Set();
function isLocalRequest(value){try{return new URL(value).origin===base;}catch{return false;}}
function networkEvidence(){
 // Only a concrete URL that this harness explicitly blocked can be an expected failure.
 // Blank-location and generic console errors remain failures, as do all local/JS errors.
 for(const item of report.consoleErrors){if(item.classified)continue;item.classified=true;const requestURL=item.location.url;
  if(requestURL&&blockedExternalURLs.has(requestURL)&&/^Failed to load resource: net::ERR_/.test(item.text))report.expectedNetworkErrors.push({...item,reason:'external URL explicitly blocked by test isolation'});
  else report.errors.push({type:'console',...item});
 }
 for(const item of report.requestFailures){if(item.classified)continue;item.classified=true;if(!item.blockedByHarness)report.errors.push({type:'requestfailed',...item});}
}
function contrast(a,b){const lum=color=>{const rgb=color.match(/[\d.]+/g).slice(0,3).map(x=>Number(x)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];};const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}

async function startFrames(page){
 await page.evaluate(()=>{
  window.qaBrainFrames=[];window.qaBrainRecording=true;window.qaBrainStart=performance.now();
  const sample=()=>{
   if(!window.qaBrainRecording)return;
   const d=document.getElementById('dialog');if(d){const c=getComputedStyle(d),r=d.getBoundingClientRect();window.qaBrainFrames.push({t:performance.now()-window.qaBrainStart,open:d.open,kind:d.dataset.kind,display:c.display,opacity:+c.opacity,scale:c.scale,translate:c.translate,active:d.classList.contains('fluid-animating'),exiting:d.classList.contains('fluid-native-exit'),hidden:d.classList.contains('fluid-exit-closed'),top:r.top,left:r.left,right:r.right,bottom:r.bottom,width:r.width,height:r.height});}
   requestAnimationFrame(sample);
  };requestAnimationFrame(sample);
 });
}
async function endFrames(page){return page.evaluate(()=>{window.qaBrainRecording=false;return window.qaBrainFrames;});}
function openedBounds(frames,mode){
 const visible=frames.filter(f=>f.kind==='brain'&&f.open&&f.display!=='none'&&f.width>0);
 assert(visible.length>5,'expected live frames from a real brain trigger');
 const rest=visible.at(-1);assert(rest.opacity>=.99);assert(!rest.active,'entry must settle');
 const maxTravel=Math.max(...visible.flatMap(f=>['top','left','right','bottom'].map(k=>Math.abs(f[k]-rest[k]))));
 assert(maxTravel<=(mode==='lite'?35:65),'brain traveled too far: '+maxTravel);
 const active=visible.filter(f=>f.active);const settleMs=active.length?active.at(-1).t-visible[0].t:0;
 assert(settleMs<=850,'brain opening took too long: '+settleMs);
 return {maxTravel,settleMs,rest,frames};
}
function closedBounds(frames,mode){
 const closed=frames.filter(f=>!f.open&&f.kind==='brain');assert(closed.length,'close must immediately remove open');
 let faded=false;for(const f of closed){const visible=f.display!=='none'&&!f.hidden&&f.width>0;if(!visible||f.opacity<=.01)faded=true;if(faded)assert(!visible||f.opacity<=.05,'closed surface flashed back after fading');}
 const moving=closed.filter(f=>f.exiting&&f.opacity>.01),durationMs=moving.length?moving.at(-1).t-moving[0].t:0;assert(durationMs<=850,'brain close took too long');
 const first=moving[0],maxTravel=first?Math.max(...moving.flatMap(f=>['top','left','right','bottom'].map(k=>Math.abs(f[k]-first[k])))):0;assert(maxTravel<=(mode==='lite'?35:65),'brain close traveled too far: '+maxTravel);
 assert(!closed.at(-1).exiting);return {durationMs,maxTravel,frames};
}

async function main(){let browser;
 try{
  const core={Date,Math,JSON,Intl};core.window=core;vm.createContext(core);vm.runInContext(fs.readFileSync(app+'/src/legacy/erp-core.js','utf8'),core);
  const seed=JSON.parse(JSON.stringify(core.ERP.seed()));seed.settings={onboarding:'demo',appearance:'light',layout:'feira',financialVisible:true,reduceEffects:false};seed.events=[];seed.sales=[];seed.movements=[];
  seed.products=[{id:'qa-brain-values',name:'Taioba',baseName:'Taioba',category:'Hortifruti-Granjeiro',unit:'Maço',stock:10,min:1,price:400,cost:100,costKnown:true}];
  browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  for(const mode of ['normal','lite','reduced']){
   const context=await browser.newContext({viewport:{width:360,height:740},isMobile:true,hasTouch:true,reducedMotion:mode==='reduced'?'reduce':'no-preference'});
   await context.addInitScript(({seed,lite})=>{Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>lite?4:8});Object.defineProperty(navigator,'deviceMemory',{get:()=>lite?2:8});const k='territorio-gestao-prototipo-v1';if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify(seed));},{seed,lite:mode==='lite'});
   await context.route('**/*',r=>{const req=r.request(),requestURL=req.url();if(isLocalRequest(requestURL)||requestURL.startsWith('data:'))return r.continue();blockedExternalURLs.add(requestURL);report.blockedExternalRequests.push({mode,url:requestURL,method:req.method(),resourceType:req.resourceType(),reason:'network isolation: external request blocked'});return r.abort('blockedbyclient');});
   const page=await context.newPage();page.on('pageerror',e=>report.errors.push({type:'pageerror',mode,error:String(e)}));page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push({mode,text:m.text(),location:m.location()});});
   page.on('requestfailed',req=>report.requestFailures.push({mode,url:req.url(),method:req.method(),resourceType:req.resourceType(),failure:req.failure(),blockedByHarness:blockedExternalURLs.has(req.url())}));
   await page.goto(url);await page.waitForFunction(()=>!!window.ERPPreview&&document.documentElement.classList.contains('fluid-motion'));await page.waitForTimeout(650);
   const act=(action,data={})=>page.evaluate(({action,data})=>window.ERPPreview.actions[action](data),{action,data});
   const integrity=()=>page.evaluate(()=>{const d=window.ERPPreview.model().data;return{products:d.products,sales:d.sales,movements:d.movements};});const before=await integrity();
   const state=await page.locator('html').evaluate(e=>({lite:e.classList.contains('lite'),reduced:matchMedia('(prefers-reduced-motion: reduce)').matches}));assert.equal(state.lite,mode==='lite');
   for(const theme of ['light','dark']){
    await page.evaluate(theme=>{window.ERPPreview.model().data.settings.appearance=theme;window.ERPPreview.render();},theme);
    await page.locator('#nav [data-page="Gestão"]').click();await page.waitForTimeout(650);
    const trigger=page.locator('#app [data-action="brain"]');await trigger.waitFor();
    const source=await trigger.boundingBox();await startFrames(page);await trigger.click();await page.waitForTimeout(1000);
    assert.equal(await page.locator('dialog[open]').getAttribute('data-kind'),'brain');
    const entry=openedBounds(await endFrames(page),mode);
    if(mode==='reduced')assert.equal(entry.settleMs,0);
    assert.equal(await page.locator('.fluid-exit-ghost,.fluid-page-exit-layer').count(),0);
    const material=await page.locator('dialog[open]').evaluate(e=>{const c=getComputedStyle(e);return{background:c.backgroundColor,backgroundImage:c.backgroundImage,shadow:c.boxShadow,border:c.borderColor,opacity:c.opacity,filter:c.backdropFilter,width:e.clientWidth,scrollWidth:e.scrollWidth};});assert.equal(+material.opacity,1);assert(material.scrollWidth<=material.width+1);if(mode==='lite'||mode==='reduced')assert(['none',''].includes(material.filter));
    if(mode==='normal')await page.screenshot({path:path.join(__dirname,'brain-values-brain-'+theme+'.png')});
    await startFrames(page);await page.locator('dialog[open] [data-action="brain-back"]').click();assert.equal(await page.locator('dialog[open]').count(),0);await page.waitForTimeout(1000);
    const exit=closedBounds(await endFrames(page),mode);assert.equal(await page.locator('.fluid-exit-layer,.fluid-exit-ghost').count(),0);
    // A new open during the previous exit must cleanly retarget the same native sheet.
    for(let i=0;i<3;i++){
     await trigger.click();await page.waitForTimeout(45);
     const close=await page.evaluate(i=>{const d=document.getElementById('dialog');d.close('qa-return-'+i);return{open:d.open,value:d.returnValue};},i);assert.deepEqual(close,{open:false,value:'qa-return-'+i});await page.waitForTimeout(45);
    }
    await trigger.click();await page.waitForTimeout(1000);assert.equal(await page.locator('dialog[open]').count(),1);assert.equal(await page.locator('dialog[open]').evaluate(e=>+getComputedStyle(e).opacity),1);assert.equal(await page.locator('.fluid-exit-layer,.fluid-exit-ghost').count(),0);
    await act('close-modal');await page.waitForTimeout(1000);report.motion.push({mode,theme,source,material,entry,exit,interruptions:3});

    if(mode!=='normal')continue;
    await act('new-product');await page.waitForFunction(()=>window.TerritorioProductCatalog.isCatalogReady());await act('quick-category',{value:'Hortifruti-Granjeiro'});await act('stock-custom-product');await page.locator('#product-name').fill('Produto QA valores');
    for(const unit of ['Maço','Dúzia','Pacote']){
     await act('unit',{index:0,value:unit});await page.waitForTimeout(650);
     for(const largeText of [false,true]){
     await page.evaluate(largeText=>{window.ERPPreview.model().data.settings.largeText=largeText;window.ERPPreview.render();},largeText);await page.waitForTimeout(100);
     for(const width of [320,360]){
      await page.setViewportSize({width,height:740});await page.waitForTimeout(80);
      const labels=await page.locator('.values-stock-panel label[for]').evaluateAll(nodes=>nodes.map(e=>{const c=getComputedStyle(e),r=e.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);const tr=range.getBoundingClientRect();let parent=e,bg='';while(parent){bg=getComputedStyle(parent).backgroundColor;if(bg!=='transparent'&&bg!=='rgba(0, 0, 0, 0)')break;parent=parent.parentElement;}return{text:e.textContent,color:c.color,background:bg,inputColor:getComputedStyle(document.getElementById(e.htmlFor)).color,font:c.fontFamily,size:parseFloat(c.fontSize),weight:+c.fontWeight,lineHeight:c.lineHeight,clientWidth:e.clientWidth,scrollWidth:e.scrollWidth,textLeft:tr.left,textRight:tr.right,left:r.left,right:r.right};}));
      assert.equal(labels.length,4);assert.match(labels[0].text,/Preço por/);assert.match(labels[1].text,/Custo por/);assert.match(labels[2].text,/Estoque inicial/);assert.match(labels[3].text,/Estoque mínimo/);
      for(const label of labels){const rgb=label.color.match(/[\d.]+/g).map(Number);assert(rgb[0]>rgb[1]&&rgb[0]>rgb[2]);assert.notEqual(label.color,label.inputColor);assert.equal(label.size,largeText?16:14);assert.equal(label.weight,600);assert(label.scrollWidth<=label.clientWidth+1);assert(label.textLeft>=label.left-1&&label.textRight<=label.right+1,'label text cut: '+label.text);label.contrast=contrast(label.color,label.background);assert(label.contrast>=4.5,'label contrast below 4.5: '+label.text);}
      assert(labels[0].text.toLocaleLowerCase('pt-BR').includes(unit.toLocaleLowerCase('pt-BR')));assert(labels[1].text.toLocaleLowerCase('pt-BR').includes(unit.toLocaleLowerCase('pt-BR')));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      if(unit==='Maço')await page.locator('.values-stock-panel').screenshot({path:path.join(__dirname,'brain-values-labels-'+theme+'-'+width+(largeText?'-large':'')+'.png')});report.labels.push({theme,unit,width,largeText,labels});
     }
     }
    }
    await page.evaluate(()=>{window.ERPPreview.model().data.settings.largeText=false;window.ERPPreview.render();});
    await act('cancel-product');await page.setViewportSize({width:360,height:740});
   }
   assert.deepEqual(await integrity(),before);
   const memory=await page.evaluate(()=>window.ERPPreview.model().data.interfaceGuidelines);assert(memory&&typeof memory==='object','permanent interface guidelines missing');
   const text=JSON.stringify(memory).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();for(const word of ['volume','nitidez','estilo','textura','profundidade'])assert(text.includes(word),'missing visual rule: '+word);
   await page.reload();await page.waitForFunction(()=>!!window.ERPPreview);await page.waitForTimeout(200);assert.deepEqual(await page.evaluate(()=>window.ERPPreview.model().data.interfaceGuidelines),memory);assert.deepEqual(await integrity(),before);
   report.memory.push({mode,persistent:true,guidelines:memory,integrity:true});await context.close();
  }
  networkEvidence();assert.deepEqual(report.errors,[]);report.passed=true;
 }catch(error){report.failure=String(error.stack||error);throw error;}finally{await browser?.close();networkEvidence();if(report.errors.length)report.passed=false;fs.writeFileSync(path.join(__dirname,'brain-values-qa.json'),JSON.stringify(report,null,2));}
 console.log(JSON.stringify({passed:report.passed,motion:report.motion.map(x=>({mode:x.mode,theme:x.theme,travel:x.entry.maxTravel,entryMs:x.entry.settleMs,exitMs:x.exit.durationMs})),labels:report.labels.length,memory:report.memory.length,blockedExternalRequests:report.blockedExternalRequests,expectedNetworkErrors:report.expectedNetworkErrors,errors:report.errors}));
 assert.deepEqual(report.errors,[]);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
