// Isolated presentation/interaction checks; never reads a producer database.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../app'),dist=path.join(root,'dist'),origin='https://compact-fixture.test';
const core={Date,Math,Intl,JSON};core.window=core;vm.createContext(core);vm.runInContext(fs.readFileSync(root+'/src/legacy/erp-core.js','utf8'),core);
const seed=core.ERP.seed();seed.dataContext={id:'fluid020-fixture',type:'real'};
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
const report={isolated:true,checks:[],surfaces:[],errors:[]};let browser,page;
async function settled(){await page.waitForTimeout(850);}
async function action(n,d={}){await page.evaluate(([n,d])=>window.ERPPreview.actions[n](d),[n,d]);await settled();}
async function footerGeometry(){return page.locator('#dialog .checkout-footer button').evaluateAll(bs=>bs.filter(b=>b.getClientRects().length).map(b=>{const s=getComputedStyle(b),r=b.getBoundingClientRect();const range=document.createRange();range.selectNodeContents(b);const t=range.getBoundingClientRect();return {label:b.textContent.trim(),align:s.textAlign,justify:s.justifyContent,centerError:Math.abs((t.left+t.right-r.left-r.right)/2),width:b.clientWidth,scrollWidth:b.scrollWidth};}));}
(async()=>{try{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 for(const theme of ['light','dark'])for(const width of [320,360,393,412])for(const large of [false,true]){
  const cfg={theme,width,height:820,large},context=await browser.newContext({viewport:{width,height:cfg.height},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==origin)return r.abort();let file=path.resolve(dist,'.'+u.pathname);if(file!==dist&&!file.startsWith(dist+path.sep))return r.abort();if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=dist+'/index.html';return r.fulfill({body:fs.readFileSync(file),contentType:{'.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png'}[path.extname(file)]||'application/octet-stream'});});
  await context.addInitScript(({seed,cfg})=>{seed.settings.appearance=cfg.theme;seed.settings.largeText=cfg.large;localStorage.setItem('territorio-gestao-prototipo-v1',JSON.stringify(seed));Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>8});Object.defineProperty(navigator,'deviceMemory',{get:()=>8});},{seed,cfg});
  page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));await page.goto(origin);await page.waitForFunction(()=>!!window.TerritorioLocalCatalog);await settled();
  const grid=await page.locator('body>#app .glass-sale-block .feira-grid').first().evaluate(e=>({columns:getComputedStyle(e).gridTemplateColumns.split(' ').length,cards:[...e.children].map(c=>{const r=c.getBoundingClientRect();return {id:c.dataset.id,x:r.x,y:r.y,w:r.width,h:r.height,client:c.clientWidth,scroll:c.scrollWidth,text:c.textContent};})}));
  assert.equal(grid.columns,3);assert.equal(new Set(grid.cards.slice(0,3).map(c=>Math.round(c.y))).size,1,'three on same row');
  const rows=new Map();for(const card of grid.cards){const y=Math.round(card.y);rows.set(y,(rows.get(y)||0)+1);}assert.deepEqual([...rows.values()],[3,3,3,3],'continuous rows without holes between types/families');
  for(const c of grid.cards){assert(c.scroll<=c.client+1,'card clipped');assert(c.h<=(large?180:140),'card stretched');assert(c.w<130,'card too wide');}
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(grid.cards.slice(0,3).map(c=>c.id),['Especial250','Especial500','Especial1000']);
  if(!large)assert.equal(await page.locator('body>#app [data-id=Tradicional1000] strong').evaluate(e=>{const t=e.firstChild,r=document.createRange(),start=t.textContent.indexOf('Tradicional');r.setStart(t,start);r.setEnd(t,start+11);return r.getClientRects().length;}),1,'Tradicional must not split in the middle');
  const materials=await page.locator('body>#app .feira-card').evaluateAll(es=>es.map(e=>{const s=getComputedStyle(e);return {id:e.dataset.id,face:s.backgroundImage,shadow:s.boxShadow,border:s.borderTop};}));
  for(const material of materials)assert.deepEqual({...material,id:null},{...materials[0],id:null},'same material for coffee, fruit, cheese and salami, including zero stock');
  await page.screenshot({path:path.join(__dirname,`fluid020-home-${theme}-${width}-${large}.png`)});
  report.checks.push(`${theme}/${width}/${large}: compact three columns, full names/weights/prices`);
  const box=await page.locator('body>#app [data-id=Especial250]').boundingBox();await page.mouse.move(box.x+12,box.y+12);await page.mouse.down();await page.waitForTimeout(680);await page.mouse.up();await page.waitForTimeout(150);
  assert.equal(await page.locator('.multi-go').innerText(),'Continuar');
  for(const id of ['Gourmet250','Gourmet500']){await page.locator(`body>#app [data-id=${id}]`).click();assert.equal(await page.locator('.multi-go').innerText(),'Continuar');}
  await page.locator('.multi-go').click();await settled();assert.equal(await page.evaluate(()=>window.ERPPreview.state().draft.items.length),3);await action('cancel-sale');
  report.checks.push(`${theme}/${width}/${large}: Continuar only for one, two and three selections, sale unchanged`);
  await page.locator('#nav [data-page=Estoque]').click();await settled();
  assert.equal(await page.locator('body>#app .stock-top-tools [data-action=new-product]').count(),0);
  assert.equal(await page.locator('body>#app .glass-family-heading [data-action=new-product]').count(),await page.locator('body>#app .workflow-stock-family').count());
  assert.equal(await page.locator('body>#app .workflow-stock-family').first().locator(':scope > .feira-rows > button').count(),3);
  const details=page.locator('body>#app .workflow-stock-more');assert.equal(await details.count(),1);assert.equal(await details.getAttribute('open'),null);assert.match(await details.locator('summary').innerText(),/Mais 4 apresentações/);
  await details.locator('summary').click();await page.waitForTimeout(350);assert.equal(await details.locator('.feira-row:visible').count(),4);
  await page.screenshot({path:path.join(__dirname,`fluid020-stock-${theme}-${width}-${large}.png`)});
  report.checks.push(`${theme}/${width}/${large}: three coffees then expansion, one contextual + per family`);
  await page.locator('body>#app [data-action=stock-product]').first().click();await settled();
  const footer=await footerGeometry();for(const b of footer){assert.equal(b.align,'center',b.label);assert.equal(b.justify,'center',b.label);assert(b.scrollWidth<=b.width+1,b.label+' clipped');assert(b.centerError<2,b.label+' off center');}
  assert(footer.some(b=>b.label==='Editar produto'));assert(footer.some(b=>b.label==='Histórico'));
  assert.equal(await page.locator('#dialog').evaluate(d=>getComputedStyle(d,'::backdrop').backdropFilter),'none');
  await page.screenshot({path:path.join(__dirname,`fluid020-movement-${theme}-${width}-${large}.png`)});
  await page.locator('#dialog [data-action=product-history]').click();await settled();for(const b of await footerGeometry())assert.equal(b.align,'center',b.label);
  await action('close-modal');await settled();assert.equal(await page.locator('.fluid-exit-layer,.fluid-sheet-ghost-layer').count(),0);
  report.checks.push(`${theme}/${width}/${large}: centered actions, history, clean close`);
  await page.locator('body>#app .glass-family-heading [data-action=new-product]').first().click();await settled();
  await page.locator('body>#app [data-action=stock-own-pick]').first().click();await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>window.ERPPreview.state().page),'Produto','picker must remain behind its stock window');
  assert.equal(await page.locator('.fluid-page-morph-layer').count(),0,'no second page animation under opening stock window');
  await settled();const keypad=page.locator('#dialog .dialog-content .number-keypad');assert(await keypad.isVisible());
  const returned=await page.locator('#dialog').evaluate(async d=>{
   const before=d.querySelector('.dialog-content').offsetHeight,pad=d.querySelector('.dialog-content .number-keypad'),padHeight=pad.offsetHeight,frames=[];
   d.querySelector('.movement-back').click();
   await new Promise(resolve=>{const start=performance.now();const step=()=>{const r=d.getBoundingClientRect(),c=getComputedStyle(d);frames.push({t:performance.now()-start,clip:c.clipPath,scale:c.scale,opacity:c.opacity,display:c.display,content:d.querySelector('.dialog-content').offsetHeight,padHidden:pad.hidden,padHeight:pad.offsetHeight,height:r.height});if(performance.now()-start<600)requestAnimationFrame(step);else resolve();};requestAnimationFrame(step);});
   return {before,padHeight,frames};
  });
  const visible=returned.frames.filter(f=>f.display!=='none'&&Number(f.opacity)>.1);
  assert(visible.length>2,'missing return');assert.equal(new Set(visible.map(f=>f.clip)).size,1,'return must retain a complete stable mask');
  for(const f of visible){assert.equal(f.content,returned.before,'content reflowed during return');assert.equal(f.padHidden,false,'keypad vanished during return');assert.equal(f.padHeight,returned.padHeight,'keypad collapsed during return');}
  await settled();assert.equal(await page.locator('#dialog').evaluate(d=>d.open),false);
  assert.equal(await page.evaluate(()=>window.ERPPreview.state().page),'Produto');
  await action('cancel-product');
  report.checks.push(`${theme}/${width}/${large}: entry-stock card opens only one surface; whole return with keypad retained`);
  await page.evaluate(()=>{window.ERPPreview.model().data.products=[];window.ERPPreview.render();});await settled();
  assert.equal(await page.locator('body>#app [data-action=new-product]').count(),await page.locator('body>#app .workflow-stock-family').count()||1,'empty stock still has one add action when empty');
  await page.locator('body>#app [data-action=new-product]').click();await settled();
  assert.match(await page.locator('body>#app').innerText(),/Entrada de estoque/);
  report.checks.push(`${theme}/${width}/${large}: empty stock has one accessible add action`);
  console.log(`PASS ${theme} ${width} ${large?'large':'normal'}`);
  report.surfaces.push({cfg,grid,footer});await context.close();
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.errors.push(e.stack);process.exitCode=1;if(page&&!page.isClosed())await page.screenshot({path:path.join(__dirname,'fluid020-failure.png')}).catch(()=>{});}
finally{await browser?.close();fs.writeFileSync(path.join(__dirname,'fluid020-qa.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,surfaces:report.surfaces.length,errors:report.errors}));}})();
