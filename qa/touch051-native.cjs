// The separate fixture package is the only inspected page. Never attaches to the producer ERP.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {probe,summarize}=require('./touch051.cjs');
const {sampleReturn,verify}=require('./return051.cjs');
(async()=>{
 const baseline=!!process.env.BASELINE051,report={variant:baseline?'baseline':'candidate',physicalAndroid:true,engine:'Android System WebView',synthetic:true,networkBlockedByFixture:true,productionDatabaseAccessed:false,cases:[],returns:[],errors:[]};let browser;
 try{
 browser=await chromium.connectOverCDP('http://127.0.0.1:9341',{timeout:12000});console.log('Connected to isolated Android fixture');const page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith('https://fixture.agro.test/'));assert(page,'No separate synthetic WebView');page.setDefaultTimeout(15000);
 const cdp=await page.context().newCDPSession(page);const wait=ms=>page.waitForTimeout(ms);
 for(const theme of ['light','dark'])for(const pressure of (baseline?[65]:[30,65,140])){
  console.log('Measuring '+report.variant+' '+theme);await page.goto('https://fixture.agro.test/?theme='+theme,{waitUntil:'domcontentloaded',timeout:15000});await page.waitForFunction(()=>window.TerritorioProductGestures);await wait(1100);
  assert.equal(await page.evaluate(()=>window.__AGRO_TOUCH_FIXTURE__),report.variant);assert.equal(await page.evaluate(()=>window.ERPPreview.model().data.dataContext.id),'touch051-synthetic');
  const products=await page.evaluate(()=>JSON.stringify(window.ERPPreview.model().data.products));
  await page.evaluate(probe);const r=await page.locator('#app [data-action=sell-product]').first().boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2;
  for(let n=0;n<2;n++){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await wait(pressure);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});if(!n)await wait(75);}
  await wait(750);assert.equal(await page.evaluate(()=>window.TerritorioWorkflowBridge.modal()?.kind),'stock-peek');
  const back=await page.locator('#dialog .sheet-back').boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:back.x+back.width/2,y:back.y+back.height/2}]});await wait(65);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(750);
  const data=await page.evaluate(()=>{window.__touch31.on=false;cancelAnimationFrame(window.__touch31raf);window.__touch31observer?.disconnect();return window.__touch31;});
  const stats=summarize(data);report.cases.push({theme,pressure,...stats,version:await page.evaluate(()=>window.TERRITORIO_VERSION),viewport:await page.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio}))});
  assert.equal(await page.evaluate(()=>JSON.stringify(window.ERPPreview.model().data.products)),products);
  if(!baseline){assert.equal(stats.maxHeightDelta,0);assert.equal(stats.maxTopDelta,0);assert(stats.maxLightsPerCard<=1);assert(!stats.badLight);assert(!stats.disconnected);assert(!stats.saleFrame);}
  if(!baseline){
   const card=page.locator('#app [data-action=sell-product]').first();await card.dispatchEvent('pointerdown',{button:0,pointerId:1,isPrimary:true});await card.dispatchEvent('pointerup',{button:0,pointerId:1,isPrimary:true});
   await page.evaluate(()=>window.ERPPreview.actions['stock-peek']({id:'Especial250'}));const closeAfterMs=pressure===30?40:pressure===65?120:650;await wait(closeAfterMs);
   report.returns.push({theme,closeAfterMs,...verify(await sampleReturn(page))});
  }
 }
 await cdp.detach();report.passed=true;
 }catch(e){report.errors.push(String(e.stack||e));process.exitCode=1;}finally{await Promise.race([browser?.close(),new Promise(r=>setTimeout(r,2000))]);fs.writeFileSync(path.join(__dirname,`touch051-native-${report.variant}.json`),JSON.stringify(report,null,2));console.log(JSON.stringify(report));process.exit(process.exitCode||0);}
})();
