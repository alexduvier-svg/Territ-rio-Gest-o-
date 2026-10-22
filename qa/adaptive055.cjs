const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {seed:base}=require('./touch051.cjs'),{exercise:payment}=require('./payment052.cjs');
const seed=JSON.parse(JSON.stringify(base));seed.clients=[{id:'client-maria',name:'Maria Silva',uf:'MG',personType:'PF'}];
seed.onlineShop={enabled:false,orders:[]};seed.settings.weather={enabled:false};
const dist=path.resolve(__dirname,'../app/dist'),origin='https://adaptive055.test';
async function exercise(page,cfg){
 await page.waitForFunction(()=>window.TerritorioResourcePolicy&&window.TerritorioAgent&&window.TerritorioWorkflowBridge);await page.waitForTimeout(450);
 const act=(name,data={})=>page.evaluate(([name,data])=>window.ERPPreview.actions[name](data),[name,data]);
 const initial=await page.evaluate(()=>window.TerritorioResourcePolicy.diagnostics());assert.equal(initial.policy.generativeAvailable,false);if(!cfg.physical)assert.equal(initial.policy.intelligenceProfile,'essential');else assert.equal(initial.native.detectorVersion,2);
 await act('nav',{page:'Ajustes'});await act('appearance-settings');await page.locator('#resource-options').waitFor();
 assert.match(await page.locator('#resource-status').innerText(),/auditoria continuam disponíveis/);await page.locator('[data-action=resource-mode][data-mode=lite]').click();assert.equal(await page.evaluate(()=>window.TerritorioResourcePolicy.snapshot().intelligenceProfile),'essential');
 await page.locator('[data-action=resource-reassess]').click();await page.waitForFunction(()=>!document.querySelector('[data-action=resource-reassess]').disabled);
 await page.locator('[data-action=resource-mode][data-mode=auto]').click();const rect=await page.locator('#dialog').boundingBox();assert(rect.x>=10);assert(rect.width+rect.x<=await page.evaluate(()=>innerWidth)-10);
 await page.locator('#resource-options').scrollIntoViewIfNeeded();if(!cfg.physical)await page.screenshot({path:path.join(__dirname,'adaptive055-'+cfg.theme+(cfg.large?'-small':'')+'.png')});
 await act('close-modal');await page.waitForTimeout(400);await act('nav',{page:'Vender'});
 // Actual worker and read-only answer with all network unavailable.
 await page.evaluate(()=>window.TerritorioAgent.ask('Quanto café tenho?'));await page.waitForFunction(()=>document.querySelector('#dialog .agent-answer')?.textContent.includes('saldo geral'));
 assert.equal(await page.evaluate(()=>window.ERPPreview.model().data.sales.length),0);await act('close-modal');await page.waitForTimeout(450);
 // Reuse the established complete three-product payment, Fiado/calendar/receipt/reload journey.
 const checkout=await payment(page,cfg);const audited=await page.evaluate(()=>{const d=window.ERPPreview.model().data;return{trail:d.domainAudit,sale:d.sales[0],hardwareInBusiness:JSON.stringify(d).includes('storageFreeBytes')||JSON.stringify(d).includes('capabilitiesKnown')};});
 assert.equal(audited.trail.length,2);assert.equal(audited.trail[1].phase,'postcommit');assert.equal(audited.sale.credit.receipts[0].audit.ruleId,'domain.receivable');assert.equal(audited.hardwareInBusiness,false);
 return{theme:cfg.theme,small:!!cfg.large,physical:!!cfg.physical,profile:initial.policy.intelligenceProfile,actualNativeSignals:!!initial.native.capabilitiesKnown,mandatoryAudit:true,offlineQuery:true,manualEssential:true,hardwareExcludedFromBusiness:true,checkout,geometry:{left:rect.x,width:rect.width}};
}
module.exports={seed,exercise};
if(require.main===module)(async()=>{const report={version:'0.12.55',synthetic:true,productionDatabaseAccessed:false,cases:[],errors:[]};let browser;try{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 for(const theme of ['light','dark'])for(const large of [false,true]){
 const data=JSON.parse(JSON.stringify(seed));data.settings.appearance=theme;data.settings.largeText=large;
 const context=await browser.newContext({viewport:{width:large?320:393,height:large?640:820},isMobile:true,hasTouch:true,reducedMotion:large?'reduce':'no-preference'});
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==origin)return route.abort();let f=path.resolve(dist,'.'+u.pathname);if(!f.startsWith(dist+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory())f=dist+'/index.html';return route.fulfill({body:fs.readFileSync(f),contentType:({'.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png'}[path.extname(f)]||'application/octet-stream')});});
 await context.addInitScript(({data,large})=>{window.__AGRO_DIAGNOSTIC_SESSION__=true;if(large){Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>2});Object.defineProperty(navigator,'deviceMemory',{get:()=>2});}if(!localStorage.getItem('territorio-gestao-prototipo-v1'))localStorage.setItem('territorio-gestao-prototipo-v1',JSON.stringify(data));},{data,large});
 const p=await context.newPage();p.on('pageerror',e=>report.errors.push(String(e)));await p.goto(origin);report.cases.push(await exercise(p,{theme,large,name:large?'small':'normal'}));await context.close();}
 assert.equal(report.errors.length,0);report.passed=true;
 }catch(e){report.errors.push(e.stack||String(e));process.exitCode=1;}finally{await browser?.close();fs.writeFileSync(path.join(__dirname,'adaptive055-review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}})();
