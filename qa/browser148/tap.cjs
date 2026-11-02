const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const ctx=await b.newContext({viewport:{width:360,height:780},deviceScaleFactor:2,hasTouch:true,isMobile:true});const p=await ctx.newPage();
 await p.goto('http://localhost:4173/',{waitUntil:'networkidle'});await p.fill('input >> nth=0','Alex');await p.fill('input >> nth=2','Carangola');
 await p.getByText('Ver com dados de exemplo').tap();await p.waitForTimeout(1200);
 await p.evaluate(()=>ERPPreview.actions.nav({page:'Vender'}));await p.waitForTimeout(600);
 const box=await p.locator('#app [data-action="sell-product"]').nth(2).boundingBox();const x=box.x+box.width/2,y=box.y+box.height/2;
 const state=()=>p.evaluate(()=>({dlg:document.getElementById('dialog').open?document.getElementById('dialog').dataset.kind+'|'+document.getElementById('dialog-title')?.textContent:'',page:document.querySelector('#app .subheader .title,#app h1')?.textContent}));
 for(const gap of [120,200,280,320]){
  await p.touchscreen.tap(x,y);await p.waitForTimeout(gap);await p.touchscreen.tap(x,y);await p.waitForTimeout(800);
  console.log('duplo toque, intervalo',gap,'ms →',JSON.stringify(await state()));
  await p.evaluate(()=>{document.getElementById('dialog').close?.();ERPPreview.actions.nav({page:'Vender'});});await p.waitForTimeout(500);
 }
 await p.touchscreen.tap(x,y);await p.waitForTimeout(900);console.log('toque simples →',JSON.stringify(await state()));
 await b.close();})();
