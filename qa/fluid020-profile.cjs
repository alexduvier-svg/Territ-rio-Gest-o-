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

const report={isolated:true,nativeFPSMeasured:false,cases:[],errors:[]};
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 for(const theme of ['light','dark'])for(const size of [12,120]){
  const data=structuredClone(seed);data.settings.appearance=theme;data.products=Array.from({length:size},(_,i)=>({...seed.products[i%12],id:'fixture-'+i,stock:9}));
  const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==origin)return r.abort();let f=path.resolve(dist,'.'+u.pathname);if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=dist+'/index.html';return r.fulfill({body:fs.readFileSync(f),contentType:{'.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png'}[path.extname(f)]||'application/octet-stream'});});
  await context.addInitScript(data=>{localStorage.setItem('territorio-gestao-prototipo-v1',JSON.stringify(data));Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>8});Object.defineProperty(navigator,'deviceMemory',{get:()=>8});},data);
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));await page.goto(origin);await page.waitForFunction(()=>!!window.ERPPreview);await page.waitForTimeout(750);
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  for(const via of ['click','action']){
   if(via==='action'){await page.evaluate(()=>window.ERPPreview.actions['cancel-sale']());await page.waitForTimeout(750);}
   const sample=await page.evaluate(async(via)=>{
    let reads=0,old=window.getComputedStyle;window.getComputedStyle=(...a)=>{reads++;return old(...a);};
    const t=performance.now(),frames=[],tasks=[];let firstSale=null,prev=t;
    const observer=new PerformanceObserver(list=>tasks.push(...list.getEntries().filter(e=>e.startTime>=t).map(e=>({start:e.startTime-t,duration:e.duration}))));observer.observe({type:'longtask',buffered:true});
    const card=document.querySelector('body>#app [data-action="sell-product"]');
    const changed=new MutationObserver(()=>{if(!firstSale&&document.documentElement.dataset.page==='Venda')firstSale=performance.now()-t;});changed.observe(document.getElementById('app'),{childList:true});
    const invoke=performance.now();if(via==='action')window.ERPPreview.actions['sell-product']({id:card.dataset.id});else card.click();const invokeMs=performance.now()-invoke;
    await new Promise(resolve=>{function sample(now){frames.push(now-prev);prev=now;if(now-t<1100)requestAnimationFrame(sample);else resolve();}requestAnimationFrame(sample);});
    observer.disconnect();changed.disconnect();window.getComputedStyle=old;
    return {invokeMs,firstSale,reads,maxGap:Math.max(...frames),gaps50:frames.filter(t=>t>50),frames:frames.length,tasks,diagnostics:window.TerritorioMotion.diagnostics()};
   },via);report.cases.push({theme,size,via,...sample});console.log(JSON.stringify(report.cases.at(-1)));
  }await context.close();
 }
 report.passed=!report.errors.length;
}finally{await browser.close();fs.writeFileSync(path.join(__dirname,process.env.PROFILE_OUTPUT||'fluid020-profile.json'),JSON.stringify(report,null,2));}})().catch(e=>{console.error(e);process.exitCode=1;});
