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


seed.clients=[{id:'fixture-client',name:'Cliente fictício',phone:'32999990000'}];
const {performance}=require('node:perf_hooks');
const sharp=require('../app/node_modules/sharp');
const report={isolated:true,nativeFPSMeasured:false,checks:[],errors:[]};let browser;
(async()=>{try{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==origin)return r.abort();let f=path.resolve(dist,'.'+u.pathname);if(!f.startsWith(dist+path.sep)&&f!==dist)return r.abort();if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=dist+'/index.html';return r.fulfill({body:fs.readFileSync(f),contentType:{'.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png'}[path.extname(f)]||'application/octet-stream'});});
 await context.addInitScript(seed=>{seed.settings.appearance='light';localStorage.setItem('territorio-gestao-prototipo-v1',JSON.stringify(seed));Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>8});Object.defineProperty(navigator,'deviceMemory',{get:()=>8});},seed);
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));await page.goto(origin);await page.waitForFunction(()=>!!window.TerritorioMotion);await page.waitForTimeout(900);
 const cdp=await context.newCDPSession(page);await cdp.send('Page.enable');
 let busyStart;const busy=new Promise(resolve=>page.on('console',m=>{if(m.text()==='qa:compositor-busy'){busyStart=performance.now();resolve();}}));
 const block=page.evaluate(async()=>{const b=document.createElement('button');b.dataset.action='fixture-load';b.textContent='Abrir';Object.assign(b.style,{position:'fixed',left:'10px',top:'100px',width:'44px',height:'44px',zIndex:999});b.onclick=()=>window.TerritorioWorkflowBridge.open('Teste isolado','<div style="background:rgb(25,233,26);width:200px;height:200px;margin:auto"></div>','<button data-action="close-modal">Voltar</button>','fixture-compositor-load');document.body.append(b);b.click();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));console.log('qa:compositor-busy');const start=performance.now();while(performance.now()-start<900){}return{blocked:performance.now()-start};});
 await Promise.race([busy,new Promise((_,reject)=>setTimeout(()=>reject(Error('Fixture did not start')),5000))]);
 const frames=[];
 for(const delay of [30,140]){await new Promise(r=>setTimeout(r,delay));const shot=await Promise.race([cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true}),new Promise((_,reject)=>setTimeout(()=>reject(Error('Screenshot channel timeout')),3000))]);const at=performance.now()-busyStart,buffer=Buffer.from(shot.data,'base64');const {data,info}=await sharp(buffer).raw().toBuffer({resolveWithObject:true});let green=0;for(let i=0;i<data.length;i+=info.channels)if(data[i]>=10&&data[i]<=50&&data[i+1]>200&&data[i+2]<60)green++;frames.push({at,green});fs.writeFileSync(path.join(__dirname,'fluid020-load-'+frames.length+'.png'),buffer);}
 const timing=await block;report.frames=frames;report.blockedMs=timing.blocked;report.verified=frames[1].at<850&&frames[1].green>frames[0].green*1.15&&frames[0].green>0;
 if(report.verified)report.checks.push('Real dialog pixels advance while its page JavaScript is blocked for 900 ms');else report.limitation='Capture timing did not establish compositor progress during the blocked interval.';
 await page.evaluate(()=>window.ERPPreview.actions['close-modal']());await page.waitForTimeout(700);
 for(const theme of ['light','dark']){await page.evaluate(theme=>{window.ERPPreview.model().data.settings.appearance=theme;window.ERPPreview.actions.settings();},theme);await page.waitForTimeout(700);await page.locator('.settings-version').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(__dirname,'fluid020-logo-'+theme+'.png')});}
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.errors.push(e.stack);process.exitCode=1;}finally{await browser?.close();fs.writeFileSync(path.join(__dirname,'fluid020-load-qa.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}})();
