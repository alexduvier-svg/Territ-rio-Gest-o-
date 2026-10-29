const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {chromium} = require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {seed} = require('./place135-seed.cjs');
const assets = path.resolve(__dirname, '../app/dist');
const output = process.env.AGRO_QA_OUTPUT || 'C:/Users/alexd/.codex/visualizations/2026/10/28/01a1835c-018b-7352-95a2-037da69102a6/manage136-browser';
const mime = {'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg'};
const report = {version:'0.12.136',compiled:true,synthetic:true,physical:false,networkBlocked:true,productionDatabaseRead:false,startedAt:new Date().toISOString(),cases:[],errors:[]};
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
function assetSnapshot() {
  const entries=[];
  const visit=directory=>{
    for(const item of fs.readdirSync(directory,{withFileTypes:true})) {
      const file=path.join(directory,item.name);
      if(item.isDirectory())visit(file);
      else if(item.isFile()) {const bytes=fs.readFileSync(file);entries.push({path:path.relative(assets,file).replaceAll(path.sep,'/'),bytes:bytes.length,sha256:sha256(bytes)});}
    }
  };
  visit(assets);entries.sort((a,b)=>a.path.localeCompare(b.path,'en'));
  return {fingerprint:sha256(JSON.stringify(entries)),files:entries};
}

async function exercise(page, capture) {
  const checks = {};
  const act = async (name,data={}) => {
    await page.evaluate(async ([name,data]) => {
      if (typeof ERPPreview.actions[name] !== 'function') throw Error('Missing action '+name);
      return ERPPreview.actions[name](data);
    }, [name,data]);
  };
  const settle = async () => {
    await page.waitForTimeout(350);
    await page.waitForFunction(() => !document.getAnimations().some(a=>a.playState==='running'&&a.effect?.getComputedTiming().iterations!==Infinity), null, {timeout:10000});
    await page.waitForTimeout(100);
  };
  const nav = async name => { await act('nav',{page:name}); await settle(); };
  const domain = () => page.evaluate(() => JSON.stringify({
    stocks:ERPPreview.model().data.products.map(p=>[p.id,p.stock,p.price,p.cost]),
    sales:ERPPreview.model().data.sales,
    expenses:ERPPreview.model().data.expenses,
  }));
  const fit = async label => {
    const result = await page.evaluate(() => {
      const d=document.documentElement, open=[...document.querySelectorAll('dialog[open]')];
      return {width:innerWidth,scrollWidth:d.scrollWidth,dialogs:open.map(el=>({kind:el.dataset.kind||el.className,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth}))};
    });
    assert(result.scrollWidth<=result.width+3, label+' page overflow: '+JSON.stringify(result));
    for(const dialog of result.dialogs) assert(dialog.left>=-3&&dialog.right<=result.width+3,label+' dialog outside viewport: '+JSON.stringify(dialog));
  };
  await page.waitForFunction(() => window.__AGRO_UI_BOOT_READY__ || window.__AGRO_UI_BOOT_FAULT__, null, {timeout:30000});
  const fault = await page.evaluate(() => window.__AGRO_UI_BOOT_FAULT__ || null);
  assert.equal(fault,null,'startup fault: '+JSON.stringify(fault));
  await page.waitForFunction(() => window.ERPPreview && window.TerritorioSellModes && window.TerritorioSuppliers);
  if (await page.locator('#dialog').evaluate(d=>d.open)) {await act('close-modal');await settle();}
  await nav('Vender');
  const original = await domain();
  assert.equal(await page.evaluate(()=>window.TERRITORIO_VERSION),'0.12.136');

  // Real navigation buttons exercise the five sections and their shared motion layer.
  assert.equal(await page.locator('#nav button[data-page]').count(),5);
  for (const name of ['Estoque','Clientes','Eventos','Gestão','Vender']) {
    await page.locator('#nav button[data-page="'+name+'"]').click();
    await settle();
    assert.equal(await page.evaluate(()=>ERPPreview.state().page),name);
    assert((await page.locator('#app').innerText()).trim().length>20);
    await fit(name);
  }
  checks.fiveTabs=true;

  await act('settings'); await settle();
  assert.match(await page.locator('.settings-about-name').innerText(),/^AGRO Gestão Codex$/);
  assert.match(await page.locator('.settings-about-version').innerText(),/0\.12\.136.*Codex/);
  await fit('Ajustes'); await capture('settings');
  await act('settings-back'); await settle();
  checks.identity=true;

  const section=page.locator('#app .fam[data-fam="Café Especial"]');
  assert.equal(await section.count(),1);
  assert.equal(await section.locator('.feira-card:visible').count(),6);
  assert.equal(await page.locator('#app .glass-area-label').count(),0);
  const arrow=section.locator('[data-fam-more]');
  assert.equal((await arrow.innerText()).trim(),'');
  assert.equal(await arrow.getAttribute('aria-expanded'),'false');
  await arrow.click();await settle();
  assert.equal(await section.locator('.feira-card:visible').count(),9);
  assert.equal(await arrow.getAttribute('aria-expanded'),'true');
  await fit('Expanded family');await capture('expanded-family');
  await arrow.click();await settle();
  await page.waitForFunction(()=>document.querySelector('.fam[data-fam="Café Especial"] [data-fam-more]')?.getAttribute('aria-expanded')==='false' && [...document.querySelectorAll('.fam[data-fam="Café Especial"] .feira-card')].filter(el=>el.getClientRects().length).length===6);
  assert.equal(await section.locator('.feira-card:visible').count(),6);
  assert.equal(await arrow.getAttribute('aria-expanded'),'false');
  assert(await page.locator('#app .fam[data-fam="Peixes Ornamentais"]').count());
  assert(await page.locator('#app .fam[data-fam="Piscicultura"]').count());
  checks.familySixCards=true;checks.familyExpansion=true;checks.ornamentalsSeparate=true;

  await page.locator('#app [data-action="fam-map"]').first().click();await settle();
  assert.match(await page.locator('#dialog').innerText(),/Seções/);
  assert((await page.locator('#dialog .fam-thumb').count())>=6);
  await fit('Section map');await capture('section-map');
  await act('close-modal');await settle();checks.sectionMap=true;

  // One tap opens a sale; cancelling leaves stock, prices and financial records untouched.
  await section.locator('.feira-card').first().click();
  await page.waitForSelector('#sale-quantity');await settle();
  assert.equal(await page.evaluate(()=>ERPPreview.state().page),'Venda');
  await fit('Sale');await capture('sale');
  await act('cancel-sale');await settle();
  assert.equal(await page.evaluate(()=>ERPPreview.state().page),'Vender');
  assert.equal(await domain(),original);checks.oneTapSaleAndCancel=true;

  await nav('Estoque');
  const areas=page.locator('#app [data-action="stock-area"]');
  assert((await areas.count())>=5);
  await page.locator('#app [data-action="stock-area"][data-area="Cafés"]').click();await settle();
  assert((await page.locator('#app [data-action="stock-sub"]').count())>=4);
  await page.locator('#app [data-action="stock-sub"]').first().click();await settle();
  assert((await page.locator('#app .stock-area-head').count())>0);
  assert.equal(await page.locator('#app [data-action="stock-sub"]').count(),0);
  await fit('Stock products');await capture('stock-products');
  assert.equal(await page.evaluate(()=>TerritorioShell.back()),true);await settle();
  assert((await page.locator('#app [data-action="stock-sub"]').count())>=4);
  assert.equal(await page.evaluate(()=>ERPPreview.state().page),'Estoque');
  assert.equal(await page.evaluate(()=>TerritorioShell.back()),true);await settle();
  assert((await page.locator('#app [data-action="stock-area"]').count())>=5);
  checks.stockAreasAndSubgroups=true;checks.backOneLevel=true;

  await page.locator('#app [data-action="sup-toggle"]').first().click();await settle();
  assert.equal(await page.evaluate(()=>TerritorioSuppliers.active()),true);
  assert.equal(await page.evaluate(()=>TerritorioShell.back()),true);await settle();
  assert.equal(await page.evaluate(()=>TerritorioSuppliers.active()),false);
  assert.equal(await page.evaluate(()=>ERPPreview.state().page),'Estoque');
  checks.supplierBackToStock=true;

  await act('calculator');await settle();
  await page.locator('#dialog [data-action="calculator-contas"]').click();await settle();
  assert.equal(await page.locator('#dialog [data-action="contas-open"]').count(),7);
  for(const topic of ['preco','vendas','descontos','fornecedores','estoque','rural','credito']) {
    await act('contas-open',{id:topic});await settle();
    assert((await page.locator('#dialog .cm-body .cm-card').count())>=1,'Empty topic '+topic);
    await fit('Calculator '+topic);
  }
  checks.sevenCalculatorTopics=true;

  await page.locator('#dialog [data-action="contas-product-sheet"]').click();await settle();
  const picker=page.locator('dialog.cm-psheet[open]');
  assert.equal(await picker.count(),1);
  assert((await picker.locator('.cm-ps-group').count())>=6);
  await picker.locator('#cm-ps-search').fill('Banana');
  assert.equal(await picker.locator('[data-contas-pick]').count(),2);
  await picker.locator('[data-contas-pick="qa-banana-prata"]').click();await settle();
  assert.match(await page.locator('#cm-product-now').innerText(),/Banana Prata/);
  assert.equal(await page.evaluate(()=>ERPPreview.calculatorState().contas.product),'qa-banana-prata');
  await act('contas-open',{id:'preco'});await settle();
  for(const [key,value] of Object.entries({cost:'10',margin:'30',card:'0',fair:'0',tax:'0'})) {
    await page.locator('#cm-markup-'+key).fill(value);
  }
  assert.match(await page.locator('#cm-out-markup').innerText(),/14,29/);
  await capture('calculator-contas');await fit('Calculator result');
  checks.searchProductPicker=true;checks.markupCalculation=true;

  await page.locator('#dialog [data-action="calculator-scientific"]').click();await settle();
  const angle=page.locator('#dialog [data-action="calculator-key"][data-token="angle"]');
  assert.equal(await angle.count(),1);
  assert.match(await angle.innerText(),/Graus\/Rad/);
  const firstAngle=await page.evaluate(()=>ERPPreview.calculatorState().angle);
  await angle.click();await settle();
  assert.notEqual(await page.evaluate(()=>ERPPreview.calculatorState().angle),firstAngle);
  await act('calculator-basic');await settle();
  for(const token of ['clear','7','*','8','equals']) await act('calculator-key',{token});
  assert.equal(await page.evaluate(()=>ERPPreview.calculatorState().result),56);
  await fit('Calculator basic');await capture('calculator-basic');
  checks.scientificAngle=true;checks.basicCalculator=true;
  await act('close-modal');await settle();
  await nav('Vender');await fit('Final');await capture('final');
  assert.equal(await domain(),original,'Display/simulation/cancel flows must not modify stock or business records');
  checks.domainUnchanged=true;checks.viewportFit=true;
  Object.assign(checks,await require('./motion134-regressions.cjs').exerciseMotion(page));
  Object.assign(checks, await require('./place135-flow.cjs').exercisePlace(page, capture));
  Object.assign(checks, await require("./manage136-flow.cjs").exerciseManagement(page,capture));
  return checks;
}

async function run() {
  fs.mkdirSync(output,{recursive:true});
  assert(fs.existsSync(path.join(assets,'index.html')),'Compiled app/dist/index.html is required');
  report.assetsBefore=assetSnapshot();
  const apk=path.resolve(__dirname,'../AGRO-Gestao-Codex-0.12.136.apk');
  report.apk=fs.existsSync(apk)?{name:path.basename(apk),sha256:sha256(fs.readFileSync(apk))}:null;
  report.contextConcurrency=2;
  let browser;
  try {
    browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
    const jobs=(process.env.AGRO_SINGLE?['light']:['light','dark']).flatMap(theme=>(process.env.AGRO_SINGLE?[Number(process.env.AGRO_WIDTH)||320]:[320,360,393,412]).map(width=>({theme,width})));
    async function runCase(theme,width) {
        const entry={theme,width,largeText:width===320,performanceMode:width===320?'lite':'auto',reducedMotion:width===320};
        const context=await browser.newContext({viewport:{width,height:width===320?640:820},hasTouch:true,isMobile:true,colorScheme:theme,reducedMotion:width===320?'reduce':'no-preference'});
        try {
          await context.route('**/*',route=>{
            const url=new URL(route.request().url());
            if(url.origin!=='https://localhost')return route.abort();
            const relative=decodeURIComponent(url.pathname).replace(/^\/+/,''), file=path.resolve(assets,relative||'index.html');
            if(file!==assets&&!file.startsWith(assets+path.sep))return route.abort();
            if(!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:'Not found'});
            return route.fulfill({body:fs.readFileSync(file),contentType:mime[path.extname(file)]||'application/octet-stream'});
          });
          const data=structuredClone(seed);
          Object.assign(data.settings,{appearance:theme,largeText:entry.largeText,performanceMode:entry.performanceMode});
          await context.addInitScript(data=>{
            window.__AGRO_DIAGNOSTIC_SESSION__=true;
            if(!localStorage.getItem('territorio-gestao-prototipo-v1'))localStorage.setItem('territorio-gestao-prototipo-v1',JSON.stringify(data));
            localStorage.setItem('agro-notification-prompt-v1','answered');
          },data);
          const page=await context.newPage();
          const errors=[];page.on('pageerror',error=>errors.push(String(error.stack||error)));
          await page.goto('https://localhost');
          const capture=label=>page.screenshot({path:path.join(output,`${theme}-${width}-${label}.png`)});
          entry.result=process.env.AGRO_MANAGE_ONLY ? await require('./manage136-flow.cjs').exerciseManagement(page,capture) : process.env.AGRO_PLACE_ONLY ? await require('./place135-flow.cjs').exercisePlace(page,capture) : await exercise(page,capture);
          assert.deepEqual(errors,[],'Uncaught browser errors');
          entry.passed=true;
        } catch(error) {
          entry.passed=false;entry.error=String(error.stack||error);report.errors.push({theme,width,error:entry.error});
          const page=context.pages()[0];if(page)await page.screenshot({path:path.join(output,`${theme}-${width}-failure.png`)}).catch(()=>{});
        } finally {
          report.cases.push(entry);
          await context.unrouteAll({behavior:'ignoreErrors'});await context.close();
          fs.writeFileSync(path.join(output,'review.json'),JSON.stringify(report,null,2));
          console.log(JSON.stringify({theme,width,passed:entry.passed,error:entry.error}));
        }
    }
    const worker=async()=>{while(jobs.length){const {theme,width}=jobs.shift();await runCase(theme,width);}};
    await Promise.all([worker(),worker()]);
  } finally {
    await browser?.close();
    report.finishedAt=new Date().toISOString();
    report.assetsAfter=assetSnapshot();
    report.assetsUnchanged=report.assetsBefore.fingerprint===report.assetsAfter.fingerprint;
    if(!report.assetsUnchanged)report.errors.push({error:'Compiled asset contents changed during the test matrix'});
    if(report.apk&&sha256(fs.readFileSync(apk))!==report.apk.sha256)report.errors.push({error:'APK contents changed during the test matrix'});
    report.cases.sort((a,b)=>a.theme.localeCompare(b.theme)||a.width-b.width);
    report.passed=report.cases.length===(process.env.AGRO_SINGLE?1:8)&&report.cases.every(c=>c.passed)&&report.errors.length===0&&report.assetsUnchanged;
    fs.writeFileSync(path.join(output,'review.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({passed:report.passed,cases:report.cases.length,errors:report.errors.length,report:path.join(output,'review.json')}));
    if(!report.passed)process.exitCode=1;
  }
}
module.exports={exercise,run};
if(require.main===module)run().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
