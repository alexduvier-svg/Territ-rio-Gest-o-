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
const fixtureDay='2026-10-20';
seed.events=[{id:'fair',name:'Feira do Inventário',place:'Praça de teste',city:'Carangola',uf:'MG',start:fixtureDay,end:fixtureDay,from:'09:00',until:'14:00',status:'active'}];
const sale=(id,time,total,scope='fair',status='completed')=>({id,date:fixtureDay+'T'+time+':00-03:00',scope,status,total,subtotal:total,cost:100,discount:0,returnedAt:status==='returned'?fixtureDay+'T15:00:00-03:00':undefined,items:[{productId:'Especial250',name:'Café Especial',description:'Moído · 250 g',unit:'Pacote',qty:1,price:total,total,netTotal:total,costTotal:100,costKnown:true}],payments:[{method:'Pix',amount:total}]});
seed.sales=[sale('early','08:30',500),sale('start','09:00',1000),sale('inside','13:59',2000),sale('late','14:00',1500),sale('store','15:00',700,'loja'),sale('refund','11:00',2000,'fair','returned')];seed.expenses=[{id:'cost',title:'Custo fictício',amount:300,date:fixtureDay+'T08:00:00-03:00',scope:'fair',kind:'feira'}];seed.clients=[];seed.movements=[];seed.eventLoads=[];
const report={isolated:true,checks:[],surfaces:[],errors:[]};let browser,page;
(async()=>{try{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 for(const theme of ['light','dark'])for(const width of [320,393]){
  const cfg={theme,width,height:820},context=await browser.newContext({viewport:{width,height:820},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==origin)return r.abort();let f=path.resolve(dist,'.'+u.pathname);if(f!==dist&&!f.startsWith(dist+path.sep))return r.abort();if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=dist+'/index.html';return r.fulfill({body:fs.readFileSync(f),contentType:{'.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png'}[path.extname(f)]||'application/octet-stream'});});
  await context.addInitScript(({seed,cfg})=>{seed.settings.appearance=cfg.theme;seed.settings.financialVisible=true;Date.now=()=>Date.parse('2026-10-20T12:00:00-03:00');localStorage.setItem('territorio-gestao-prototipo-v1',JSON.stringify(seed));Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>8});Object.defineProperty(navigator,'deviceMemory',{get:()=>8});},{seed,cfg});
  page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));await page.goto(origin);await page.waitForFunction(()=>!!window.TerritorioLocalCatalog);await page.waitForTimeout(850);
  const business=await page.evaluate(()=>JSON.stringify([window.ERPPreview.model().data.sales,window.ERPPreview.model().data.products,window.ERPPreview.model().data.expenses]));
  await page.locator('body>#app .glass-location').click();await page.waitForTimeout(650);
  assert.equal(await page.locator('#dialog').getAttribute('data-kind'),'scope');
  const scope=await page.locator('#dialog [data-action=set-scope]').evaluateAll(es=>es.map(e=>{const s=getComputedStyle(e);return {text:e.textContent.trim(),face:s.backgroundImage,color:s.color,opacity:s.opacity,width:e.clientWidth,scroll:e.scrollWidth};}));
  for(const row of scope){assert.equal(row.opacity,'1');assert(row.face.includes('gradient'));assert(row.scroll<=row.width+1);const rgb=row.color.match(/\d+/g).slice(0,3).map(Number);assert(theme==='light'?Math.max(...rgb)<80:Math.min(...rgb)>200);}
  await page.screenshot({path:path.join(__dirname,`fluid020-scope-${theme}-${width}.png`)});
  await page.locator('#dialog [data-action=close-modal]').click();await page.waitForTimeout(650);
  report.checks.push(`${theme}/${width}: Vendendo em readable and themed, bottom back`);
  await page.locator('body>#app [data-action=day-summary]').click();await page.waitForTimeout(650);
  const groups=await page.locator('#dialog .ds-event-section').evaluateAll(es=>es.map(e=>({key:e.dataset.summarySection,title:e.querySelector('header').textContent,total:e.querySelector('.ds-section-total>strong').textContent,text:e.textContent})));
  assert.deepEqual(groups.map(g=>g.key),['event|fair','outside|fair','store|loja']);
  assert.match(groups[0].title,/Feira do Inventário/);assert.match(groups[0].title,/09:00 às 14:00/);assert.match(groups[0].total,/50,00/);
  assert.match(groups[1].title,/Fora do horário do evento/);assert.match(groups[1].title,/antes de 09:00 e a partir de 14:00/);assert.match(groups[1].total,/0,00/);
  assert.match(groups[2].total,/7,00/);assert.match(await page.locator('#dialog .ds-hero .feira-hero-value').innerText(),/57,00/);
  for(const g of groups){assert.match(g.text,/Vendas por categoria/);assert.match(g.text,/Recebimentos/);assert.match(g.text,/O que vendeu/);}
  const geometry=await page.locator('#dialog').evaluate(d=>{const r=d.getBoundingClientRect(),f=d.querySelector('.checkout-footer').getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,bottom:r.bottom,footerBottom:f.bottom,scrollable:d.querySelector('.dialog-content').scrollHeight>d.querySelector('.dialog-content').clientHeight};});
  assert(geometry.x>=20&&geometry.right<=width-20);assert(geometry.scrollable);assert(geometry.footerBottom<=geometry.bottom+1);
  await page.screenshot({path:path.join(__dirname,`fluid020-summary-${theme}-${width}.png`)});
  await page.locator('#dialog .dialog-content').evaluate(e=>e.scrollTop=e.scrollHeight);await page.waitForTimeout(200);await page.screenshot({path:path.join(__dirname,`fluid020-summary-end-${theme}-${width}.png`)});
  await page.locator('#dialog [data-action=toggle-day-privacy]').click();await page.waitForTimeout(250);assert(!await page.locator('#dialog').innerText().then(t=>t.includes('R$')),'all sections must hide money');
  await page.locator('#dialog [data-action=close-modal]').click();await page.waitForTimeout(650);
  report.checks.push(`${theme}/${width}: event/window/outside/Loja totals, refunds, scroll and privacy`);
  await page.locator('#nav [data-page=Estoque]').click();await page.waitForTimeout(850);
  assert.deepEqual(await page.locator('body>#app .stock-top-tools button').evaluateAll(es=>es.map(e=>e.dataset.action)),['history','calculator','search-products']);
  const plane=await page.locator('body>#app .feira-stock-counts').evaluate(e=>{const s=getComputedStyle(e);return {border:s.borderTopWidth,edge:s.borderTopColor,face:s.backgroundImage,shadow:s.boxShadow};});assert.equal(plane.border,'1px');assert(plane.face.includes('gradient'));assert.notEqual(plane.shadow,'none');
  await page.screenshot({path:path.join(__dirname,`fluid020-plane-${theme}-${width}.png`)});
  assert.equal(await page.evaluate(()=>JSON.stringify([window.ERPPreview.model().data.sales,window.ERPPreview.model().data.products,window.ERPPreview.model().data.expenses])),business);
  report.checks.push(`${theme}/${width}: visible glass plane, search on right, business records unchanged`);report.surfaces.push({cfg,scope,groups,geometry,plane});await context.close();
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.errors.push(e.stack);process.exitCode=1;if(page&&!page.isClosed())await page.screenshot({path:path.join(__dirname,'fluid020-summary-scope-failure.png')}).catch(()=>{});}
finally{await browser?.close();fs.writeFileSync(path.join(__dirname,'fluid020-summary-scope-qa.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,surfaces:report.surfaces.length,errors:report.errors}));}})();
