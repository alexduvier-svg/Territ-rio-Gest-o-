const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {seed:base}=require('./touch051.cjs'),dist=path.resolve(__dirname,'../app/dist'),origin='https://checkout053.test';
const report={version:'0.12.53',synthetic:true,externalNetworkBlocked:true,cases:[],errors:[]};
async function exercise(page,cfg){
 const cdp=cfg.physical?await page.context().newCDPSession(page):null;
 const tap=async loc=>{if(!cdp)return loc.tap();await loc.scrollIntoViewIfNeeded();const r=await loc.boundingBox();assert(r);const x=r.x+r.width/2,y=r.y+r.height/2;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await page.waitForTimeout(65);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
 const shot=async suffix=>{const file=path.join(__dirname,`checkout053-${cfg.name}-${cfg.theme}-${suffix}.png`);if(!cfg.physical)return page.screenshot({path:file});const serial=process.env.AGRO_QA_SERIAL,adb=path.resolve(__dirname,'../android-sdk/platform-tools/adb.exe'),exec=require('child_process').execFileSync;exec(adb,['-s',serial,'shell','screencap','-p','/sdcard/agro-fixture052.png']);exec(adb,['-s',serial,'pull','/sdcard/agro-fixture052.png',file]);};
 const act=(name,data={})=>page.evaluate(([name,data])=>window.ERPPreview.actions[name](data),[name,data]),wait=ms=>page.waitForTimeout(ms);
 await page.waitForFunction(()=>window.TerritorioReceivables?.entry);await wait(800);
 assert.equal(await page.locator('.glass-area-label [data-action=weather-open]').count(),1);const weatherInline=await page.evaluate(()=>{const label=document.querySelector('.glass-area-label'),pill=label.querySelector('.weather-pill'),r=document.createRange();r.selectNodeContents(label.firstChild);const t=r.getBoundingClientRect(),p=pill.getBoundingClientRect();return p.left>=t.right-1&&Math.abs(p.y+p.height/2-t.y-t.height/2)<8;});assert(weatherInline);
 await act('sell-product',{id:'Especial250'});await wait(600);
 await page.evaluate(()=>{const d=window.ERPPreview.state().draft;d.items=['Especial250','Gourmet250','Tradicional1000'].map(productId=>({productId,rawQty:'1',discountMode:'R$',discountValue:'0'}));d.quantityReviewCollapsed=true;window.ERPPreview.render();});
 await act('open-cart');await wait(650);
 if(cfg.large){assert.equal(await page.locator('#checkout-product-items').isVisible(),false);await tap(page.locator('[data-action=checkout-items-toggle]'));assert.equal(await page.locator('.cart-line').count(),3);await tap(page.locator('[data-action=checkout-items-toggle]'));await wait(300);}
 const geom=await page.evaluate(()=>{const d=document.getElementById('dialog'),content=d.querySelector('.dialog-content').getBoundingClientRect(),head=d.querySelector('.sale-payment-heading').getBoundingClientRect();return {viewport:{w:innerWidth,h:innerHeight,dpr:devicePixelRatio},buttons:[...d.querySelectorAll('.payment-choice')].map(b=>{const r=b.getBoundingClientRect();return{text:b.innerText,x:r.x,y:r.y,w:r.width,h:r.height,visible:r.top>=content.top-1&&r.bottom<=content.bottom+1&&r.bottom<=innerHeight};}),headingOffset:Math.abs(head.x+head.width/2-(d.getBoundingClientRect().x+d.offsetWidth/2)),scrollHeight:d.querySelector('.dialog-content').scrollHeight,clientHeight:d.querySelector('.dialog-content').clientHeight};});
 assert.deepEqual(geom.buttons.map(b=>b.text.replace(/\s+/g,' ').trim()),['Pix','Dinheiro','Crédito','Débito','Continuar comprando','Outro']);
 assert(geom.headingOffset<2);assert(geom.buttons[0].x<geom.buttons[1].x);assert(geom.buttons[2].y>geom.buttons[0].y);assert(geom.buttons[4].y>geom.buttons[2].y);assert(geom.buttons[4].x<geom.buttons[5].x);assert(geom.buttons.every(b=>b.h>=44));
 assert(geom.buttons.every(b=>b.visible),JSON.stringify(geom));
 assert.equal(await page.locator('.sale-payment-heading [data-action=split-payment]').count(),0);
 const gap=await page.evaluate(()=>{const d=document.getElementById('dialog');return d.querySelector('.checkout-actions').getBoundingClientRect().top-d.querySelector('.checkout-total').getBoundingClientRect().bottom;});assert(gap>=16);

 await shot('checkout');
 for(const method of ['Dinheiro','Crédito','Débito','Pix']){await tap(page.locator('[data-action=payment][data-value="'+method+'"]'));await wait(180);assert.equal(await page.evaluate(()=>window.ERPPreview.state().draft.payment),method);}
 await tap(page.locator('[data-action=payment-other]'));await wait(450);await tap(page.locator('[data-action=credit-split]'));await wait(450);assert.equal(await page.evaluate(()=>window.ERPPreview.state().draft.split),true);assert(await page.locator('.checkout-split-body').isVisible());assert.equal(await page.locator('[data-action=finalize-purchase]').isEnabled(),true);await tap(page.locator('[data-action=payment][data-value=Pix]'));await wait(300);assert.equal(await page.locator('.checkout-split-body').count(),0);
 await tap(page.locator('[data-action=payment-other]'));await wait(600);await tap(page.locator('[data-action=credit-terms]'));await wait(600);
 assert(await page.locator('#credit-due-date-button').isVisible());await tap(page.locator('[data-action=credit-save]'));assert.match(await page.locator('#credit-terms-error').innerText(),/cliente/i);
 const clients=await page.locator('#credit-client-pick').count();if(clients)await page.locator('#credit-client-pick').selectOption('client-maria');else await page.locator('#credit-client-name').fill('Maria Silva');
 const tomorrow=await page.evaluate(()=>new Date(Date.now()+864e5).toISOString().slice(0,10));
 await tap(page.locator('#credit-due-date-button'));await wait(600);assert(await page.locator('#date-picker-dialog[open]').count());
 if(!await page.locator('#date-picker-dialog [data-day="'+tomorrow+'"]').count())await tap(page.locator('#date-picker-dialog [data-action=date-picker-shift][data-delta="1"]'));
 const calendar=await page.evaluate(()=>{const d=document.getElementById('date-picker-dialog'),r=d.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,w:innerWidth,h:innerHeight,overflow:d.scrollWidth>d.clientWidth+1};});assert(calendar.left>=10&&calendar.right<=calendar.w-10&&!calendar.overflow);await shot('calendario');
 await tap(page.locator('#date-picker-dialog [data-day="'+tomorrow+'"]'));await wait(600);assert.equal(await page.locator('#credit-due-date').inputValue(),tomorrow);assert.equal(await page.locator('#credit-terms-error').innerText(),'');
 await shot('fiado');
 await tap(page.locator('[data-action=credit-save]'));await wait(600);assert.equal(await page.evaluate(()=>window.ERPPreview.state().draft.payment),'Fiado');
 await tap(page.locator('[data-action=finalize-purchase]'));await page.waitForFunction(()=>window.ERPPreview.model().data.sales.length===1);await wait(650);
 let data=await page.evaluate(()=>{const m=window.ERPPreview.model().data,s=m.sales[0];return{sale:s,clients:m.clients,stock:m.products.filter(p=>s.items.some(i=>i.productId===p.id)).map(p=>p.stock),balance:window.TerritorioReceivables.balance(s),statement:window.TerritorioFinance.statement({sales:[s],expenses:[],settings:{}})};});
 assert.equal(data.sale.customerName,'Maria Silva');assert.equal(data.sale.credit.dueDate,tomorrow);assert.equal(data.balance,7500);assert.equal(data.statement.cash,0);assert.equal(data.statement.revenue,7500);assert.deepEqual(data.stock,[8,8,8]);
 const id=data.sale.id;
 await page.reload();await page.waitForFunction(()=>window.TerritorioReceivables?.entry);await wait(650);assert.equal(await page.evaluate(()=>window.ERPPreview.model().data.sales.length),1);
 await act('nav',{page:'Clientes'});await wait(650);assert(await page.locator('[data-action=receivables]').count());await tap(page.locator('[data-action=receivables]').first());await wait(600);await tap(page.locator('[data-action=receivable-open]'));await wait(600);
 await shot('receber');
 await tap(page.locator('[data-action=receivable-settle]'));await wait(750);assert.match(await page.locator('#dialog').innerText(),/Nenhum valor pendente/);
 data=await page.evaluate(()=>{const m=window.ERPPreview.model().data,s=m.sales[0];return{count:m.sales.length,balance:window.TerritorioReceivables.balance(s),receipts:s.credit.receipts,statement:window.TerritorioFinance.statement({sales:[s],expenses:[],settings:{}})};});
 assert.equal(data.count,1);assert.equal(data.balance,0);assert.equal(data.receipts.length,1);assert.equal(data.statement.cash,7500);assert.equal(data.statement.revenue,7500);
 await page.reload();await page.waitForFunction(()=>window.TerritorioReceivables?.entry);assert.equal(await page.evaluate(()=>window.ERPPreview.model().data.sales[0].credit.receipts.length),1);
 await cdp?.detach();
 return{...cfg,geometry:geom,calendar,footerGap:gap,weatherInline,splitPaymentPreserved:true,creditSaleId:id,fiado:7500,collected:7500,duplicateSales:0};
}
module.exports={exercise};
if(require.main===module)(async()=>{let browser;try{browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 for(const theme of (process.env.SMOKE052?['light']:['light','dark']))for(const cfg of (process.env.SMOKE052?[{name:'reno',width:359,height:760}]:[{name:'regression',width:360,height:760}])){
 const seed=JSON.parse(JSON.stringify(base));seed.clients=[{id:'client-maria',name:'Maria Silva',uf:'MG',personType:'PF'}];seed.settings.appearance=theme;seed.settings.largeText=!!cfg.large;
 const context=await browser.newContext({viewport:{width:cfg.width,height:cfg.height},isMobile:true,hasTouch:true,reducedMotion:cfg.large?'reduce':'no-preference'});await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==origin)return route.abort();let f=path.resolve(dist,'.'+u.pathname);if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=dist+'/index.html';return route.fulfill({body:fs.readFileSync(f),contentType:({'.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png'}[path.extname(f)]||'application/octet-stream')});});await context.addInitScript(({seed,cfg})=>{window.__AGRO_DIAGNOSTIC_SESSION__=true;if(cfg.large){Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>2});Object.defineProperty(navigator,'deviceMemory',{get:()=>2});}if(!localStorage.getItem('territorio-gestao-prototipo-v1'))localStorage.setItem('territorio-gestao-prototipo-v1',JSON.stringify(seed));},{seed,cfg});const page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));await page.goto(origin);report.cases.push(await exercise(page,{...cfg,theme}));await context.close();}
 assert.equal(report.errors.length,0);report.passed=true;
 }catch(e){report.errors.push(String(e.stack||e));process.exitCode=1;}finally{await browser?.close();fs.writeFileSync(path.join(__dirname,'checkout053-review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}})();
