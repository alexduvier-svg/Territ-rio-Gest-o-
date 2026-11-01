import {createRequire} from 'node:module';import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
const require=createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/qa.cjs'),{chromium}=require('playwright');
const root=new URL('../',import.meta.url).pathname,ctx={Date,Math,crypto:globalThis.crypto};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(root+'app/src/legacy/erp-core.js','utf8'),ctx);
const seed=JSON.parse(JSON.stringify(ctx.ERP.seed()));seed.settings={...seed.settings,onboarding:'demo',financialVisible:true,appearance:'light',layout:'feira'};seed.dataContext={id:'evolution-browser',type:'demo'};seed.events=[];seed.sales=[];seed.movements=[];seed.clients=[];seed.products=['Taioba','Tomate','Goiabada'].map((name,i)=>({id:'p'+i,name,baseName:name,category:'Outros',unit:'Unidade',stock:100,min:1,price:500,cost:100,costKnown:true}));
const server=spawn(process.execPath,[root+'app/node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5192'],{cwd:root+'app',stdio:'ignore'});let browser;
const report={synthetic:true,androidPhysical:false,checks:[],errors:[]};
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const theme of ['light','dark']){
 const context=await browser.newContext({viewport:{width:360,height:800},isMobile:true,hasTouch:true});seed.settings.appearance=theme;
 await context.addInitScript(data=>localStorage.setItem('territorio-gestao-prototipo-v1',JSON.stringify(data)),seed);await context.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:5192')||r.request().url().startsWith('data:')?r.continue():r.abort());
 const p=await context.newPage();p.on('pageerror',e=>report.errors.push(String(e)));await p.goto('http://127.0.0.1:5192');await p.waitForFunction(()=>window.ERPPreview&&window.TerritorioAgent);
 const card=p.locator('#app [data-action="sell-product"][data-id="p0"]');await card.waitFor();const rect=await card.boundingBox();await p.touchscreen.tap(rect.x+rect.width/2,rect.y+rect.height/2);await p.waitForTimeout(70);await p.touchscreen.tap(rect.x+rect.width/2,rect.y+rect.height/2);await p.waitForTimeout(400);
 assert.equal(await p.evaluate(()=>ERPPreview.state().page),'Vender');assert.equal(await p.evaluate(()=>TerritorioWorkflowBridge.modal()?.kind),'stock-peek');assert.equal(await p.evaluate(()=>ERPPreview.state().draft),null);await p.evaluate(()=>ERPPreview.actions['close-modal']());await p.waitForTimeout(400);
 await card.tap();await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>ERPPreview.state().page),'Venda');await p.evaluate(()=>ERPPreview.actions['cancel-sale']());await p.waitForTimeout(400);
 await p.evaluate(()=>{ERPPreview.actions['sell-multiple']({ids:'p0,p1,p2'});ERPPreview.actions.digit({digit:1});});
 // Use the actual quantity workflow, then shrink the existing cart to one product and edit it.
 await p.evaluate(()=>{let s=ERPPreview.state();for(const item of s.draft.items)item.rawQty='1';s.draft.quantityReviewCollapsed=true;ERPPreview.actions['open-cart']();});
 await p.evaluate(()=>{ERPPreview.actions['remove-cart-item']({index:'2'});ERPPreview.actions['remove-cart-item']({index:'1'});ERPPreview.actions['edit-cart-item']({index:'0'});});await p.waitForTimeout(400);
 assert.equal(await p.locator('#app [data-action="open-cart"]').isDisabled(),false);await p.locator('#app [data-action="open-cart"]').click();await p.waitForTimeout(300);assert.equal(await p.locator('dialog [data-action="finalize-purchase"]').isDisabled(),false);
 await p.evaluate(()=>ERPPreview.actions['continue-shopping']());await p.waitForTimeout(350);await p.evaluate(()=>ERPPreview.actions['resume-sale']());await p.waitForTimeout(350);assert.equal(await p.locator('dialog [data-action="finalize-purchase"]').isDisabled(),false);await p.evaluate(()=>ERPPreview.actions['reject-sale']());
 await p.evaluate(()=>ERPPreview.actions.nav({page:'Gestão'}));await p.waitForTimeout(500);assert.equal(await p.locator('#management-question').count(),1);assert.equal(await p.evaluate(()=>{const chart=document.querySelector('.feira-chart');return chart?.nextElementSibling?.classList.contains('management-intelligence');}),true);
 await p.locator('#management-question').fill('Quantos produtos tenho em estoque?');await p.locator('[data-action="management-ask"]').click();await p.waitForTimeout(400);assert.match(await p.locator('dialog').textContent(),/Estoque físico/);assert.equal(await p.evaluate(()=>ERPPreview.model().data.sales.length),0);
 report.checks.push(theme+': touch double/single, cart edit/resume reduced to one product, Gestão placement and shared query; no sale posted');await context.close();
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.status='blocked';report.blocker=String(error);throw error;}finally{await browser?.close();server.kill();fs.writeFileSync(root+'qa/evolution-browser.json',JSON.stringify(report,null,2));}
console.log(JSON.stringify(report));
