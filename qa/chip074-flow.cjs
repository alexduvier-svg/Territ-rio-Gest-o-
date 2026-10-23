const assert = require('node:assert/strict');
async function chipExperience(p, screenshotPath) {
  await p.evaluate(() => {
    if (!window.__AGRO_DIAGNOSTIC_SESSION__) throw Error('Synthetic fixture required');
    const m = ERPPreview.model();
    m.data.stockAlerts = {version:1,state:Object.fromEntries(m.data.products.map(p => [p.id,m.availableStock(p.id)<=0?'out':'ok'])),events:[],seenAt:''};
  });
  const act=(n,d={})=>p.evaluate(([n,d])=>ERPPreview.actions[n](d),[n,d]);
  await act('nav',{page:'Vender'});
  await act('set-scope',{id:'visual068-live'});
  await p.waitForTimeout(450);
  const chip=p.locator('.glass-sales-location > .stock-alert-chip');
  assert.equal(await chip.count(),1);
  assert.equal(await p.locator('.glass-location>.icon').count(),1,'Only the arrow remains beside Loja');
  assert.equal(await p.locator('.glass-location').evaluate(e=>e.firstElementChild.tagName),'SPAN');
  const states=[];
  for(const visible of [false,true,false]) {
    const showing=(await p.locator('.glass-sales-total').innerText()).includes('R$');
    if(showing!==visible)await act('toggle-financial');
    await p.waitForTimeout(100);
    const fit=await chip.evaluate(e=>{
      const box=e.closest('.glass-sales-location'),b=box.getBoundingClientRect(),red=e.getBoundingClientRect(),icon=e.querySelector('svg').getBoundingClientRect(),location=box.querySelector('.glass-location').getBoundingClientRect(),total=box.querySelector('.glass-sales-total').getBoundingClientRect(),eye=box.querySelector('.glass-eye').getBoundingClientRect(),style=getComputedStyle(e);
      return{width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,cut:box.scrollWidth>box.clientWidth+1,icon24:Math.abs(icon.width-24)<1&&Math.abs(icon.height-24)<1,replacesGreen:red.right<=location.left+1&&Math.abs(red.top-location.top)<3,totalBeforeEye:total.right<=eye.left+1,inset:icon.left>=b.left+8&&icon.right<=b.right-8,background:style.backgroundColor,shadow:style.boxShadow,bounds:{left:red.left,right:red.right,locationLeft:location.left,totalLeft:total.left,eyeLeft:eye.left,iconWidth:icon.width}};
    });
    assert(!fit.overflow&&!fit.cut&&fit.icon24&&fit.replacesGreen&&fit.totalBeforeEye&&fit.inset&&fit.background==='rgba(0, 0, 0, 0)'&&fit.shadow==='none',JSON.stringify(fit));
    assert.equal((await p.locator('.glass-sales-total').innerText()).includes('R$'),visible);
    states.push({visible,...fit});
  }
  if(typeof screenshotPath==='function')await screenshotPath();
  else if(screenshotPath)await p.screenshot({path:screenshotPath});
  const business=()=>p.evaluate(()=>JSON.stringify(Object.fromEntries(['products','sales','movements','clients','events','expenses','eventLoads'].map(k=>[k,ERPPreview.model().data[k]]))));
  const before=await business();
  await chip.click();
  await p.waitForSelector('#dialog[open][data-kind="workflow-stock-alerts"]');
  await act('close-modal');await p.waitForTimeout(450);
  assert.equal(await p.locator('#dialog[open]').count(),0);
  await p.locator('.glass-location').click();
  await p.waitForSelector('#dialog[open][data-kind="scope"]');
  await act('close-modal');await p.waitForTimeout(450);
  await p.locator('[data-action=restock-product-card][data-id=coffee250]').click();
  await p.waitForSelector('#dialog[open][data-kind="restock"]');
  assert.equal(await p.locator('#dialog .restock-row[data-id=coffee250]').count(),1);
  await act('close-modal');await p.waitForTimeout(450);
  assert.equal(await business(),before);
  // Separate fixture-only stock transition: the canonical render restores the normal store icon.
  await p.evaluate(()=>{
    const m=ERPPreview.model();
    for(const product of m.data.products.filter(p=>m.availableStock(p.id)<=0))m.move(product.id,'add',100,'Reposição fictícia de QA');
  });
  await act('nav',{page:'Vender'});
  await p.waitForTimeout(450);
  assert.equal(await chip.count(),0);
  assert.equal(await p.locator('.glass-location>.icon').count(),2);
  const normal=await p.locator('.glass-location>.icon').first().evaluate(e=>({width:e.getBoundingClientRect().width,color:getComputedStyle(e).color}));
  assert(Math.abs(normal.width-24)<1);
  assert.equal(await p.locator('.glass-location').evaluate(e=>e.firstElementChild.tagName.toLowerCase()),'svg');
  return{replacesGreen:true,oneStatusIcon:true,sameIconSize:true,noCircle:true,activationAndReturn:true,independentTargets:true,cardReplenishes:true,businessRecordsUnchanged:true,greenRestored:true,normal,states};
}
module.exports={chipExperience};
