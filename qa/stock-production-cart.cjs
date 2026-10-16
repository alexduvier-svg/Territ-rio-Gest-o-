const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const app=path.resolve(__dirname,'../app'),node='C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe';
async function main(){
 const server=cp.spawn(node,[app+'/node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5183','--strictPort'],{cwd:app,windowsHide:true,stdio:'pipe'});let log='',browser;server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
 const report={production:true,isolated:true,errors:[],checks:[],themes:[]};
 try{
  for(let n=0;n<100&&!log.includes('Local:');n++)await new Promise(r=>setTimeout(r,100));if(!log.includes('Local:'))throw Error(log);
  const core={Date,Math,JSON,Intl};core.window=core;vm.createContext(core);vm.runInContext(fs.readFileSync(app+'/src/legacy/erp-core.js','utf8'),core);
  browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  for(const theme of ['light','dark']){
   const seed=JSON.parse(JSON.stringify(core.ERP.seed()));seed.settings={onboarding:'demo',financialVisible:true,appearance:theme,layout:'feira'};seed.events=[];seed.sales=[];seed.movements=[];
   seed.products=[{id:'cart-qa',name:'Taioba',baseName:'Taioba',category:'Hortifruti-Granjeiro',unit:'Maço',stock:10,min:1,price:400,cost:100,costKnown:true}];
   const context=await browser.newContext({viewport:{width:360,height:740},isMobile:true,hasTouch:true});await context.addInitScript(seed=>localStorage.setItem('territorio-gestao-prototipo-v1',JSON.stringify(seed)),seed);
   await context.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:5183')||r.request().url().startsWith('data:')?r.continue():r.abort());
   const p=await context.newPage();p.on('pageerror',e=>report.errors.push(String(e)));await p.goto('http://127.0.0.1:5183');await p.waitForFunction(()=>!!window.ERPPreview);
   const before=await p.evaluate(()=>{const d=window.ERPPreview.model().data;return {products:d.products,sales:d.sales,movements:d.movements};});
   await p.evaluate(()=>window.ERPPreview.actions['sell-product']({id:'cart-qa'}));await p.evaluate(()=>window.ERPPreview.actions.digit({digit:2}));await p.evaluate(()=>window.ERPPreview.actions['open-cart']());
   await p.locator('dialog[open] .cart-item-quantity').waitFor();const qty=await p.locator('dialog[open] .cart-item-quantity').evaluate(e=>({text:e.textContent,color:getComputedStyle(e).color,parentColor:getComputedStyle(e.parentElement).color,fontWeight:getComputedStyle(e).fontWeight}));
   assert.equal(qty.text,'2');assert.notEqual(qty.color,qty.parentColor);const rgb=qty.color.match(/[\d.]+/g).map(Number);assert(rgb[0]>rgb[1]&&rgb[0]>rgb[2]);assert(Number(qty.fontWeight)>=600);
   await p.waitForTimeout(750);await p.screenshot({path:path.join(__dirname,'stock-production-cart-'+theme+'.png')});
   const after=await p.evaluate(()=>{const d=window.ERPPreview.model().data;return {products:d.products,sales:d.sales,movements:d.movements};});assert.deepEqual(after,before);report.themes.push({theme,quantity:qty});await context.close();
  }
  report.checks.push('cart quantity is bold red in light and dark; product stock, transactions and movements remain unchanged because checkout never finalized');assert.deepEqual(report.errors,[]);report.passed=true;
 }finally{fs.writeFileSync(path.join(__dirname,'stock-production-cart.json'),JSON.stringify(report,null,2));await browser?.close();server.kill();}
 console.log(JSON.stringify(report));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
