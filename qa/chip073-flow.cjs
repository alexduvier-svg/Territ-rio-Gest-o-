const assert = require('node:assert/strict');
async function chipExperience(p) {
  await p.evaluate(() => {
    if (!window.__AGRO_DIAGNOSTIC_SESSION__) throw Error('Synthetic fixture required');
    const m = ERPPreview.model();
    m.data.stockAlerts = {version: 1, state: Object.fromEntries(m.data.products.map(p => [p.id, m.availableStock(p.id) <= 0 ? 'out' : 'ok'])), events: [], seenAt: ''};
  });
  const act = (n,d={}) => p.evaluate(([n,d]) => ERPPreview.actions[n](d),[n,d]);
  await act('nav',{page:'Vender'});
  await act('set-scope',{id:'visual068-live'});
  await p.waitForTimeout(450);
  const chip = p.locator('.glass-sales-location > .stock-alert-chip');
  assert.equal(await chip.count(),1);
  const states = [];
  for (const visible of [false,true,false]) {
    const showing = (await p.locator('.glass-sales-total').innerText()).includes('R$');
    if (showing !== visible) await act('toggle-financial');
    await p.waitForTimeout(100);
    const fit = await chip.evaluate(e => {
      const box=e.closest('.glass-sales-location'), b=box.getBoundingClientRect(), red=e.getBoundingClientRect(), icon=e.querySelector('svg').getBoundingClientRect(), green=box.querySelector('.glass-location svg').getBoundingClientRect(), total=box.querySelector('.glass-sales-total').getBoundingClientRect(), eye=box.querySelector('.glass-eye').getBoundingClientRect(), style=getComputedStyle(e);
      return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,cut:box.scrollWidth>box.clientWidth+1,sameSize:Math.abs(icon.width-green.width)<1&&Math.abs(icon.height-green.height)<1,leftOfTotal:red.right<=total.left+1,totalBeforeEye:total.right<=eye.left+1,inset:icon.left>=b.left+8&&icon.right<=b.right-8,background:style.backgroundColor,shadow:style.boxShadow,bounds:{left:red.left,right:red.right,totalLeft:total.left,eyeLeft:eye.left,iconWidth:icon.width}};
    });
    assert(!fit.overflow&&!fit.cut&&fit.sameSize&&fit.leftOfTotal&&fit.totalBeforeEye&&fit.inset&&fit.background==='rgba(0, 0, 0, 0)'&&fit.shadow==='none',JSON.stringify(fit));
    assert.equal((await p.locator('.glass-sales-total').innerText()).includes('R$'),visible);
    states.push({visible,...fit});
  }
  const before=await p.evaluate(()=>JSON.stringify(Object.fromEntries(['products','sales','movements','clients','events','expenses','eventLoads'].map(k=>[k,ERPPreview.model().data[k]]))));
  await chip.click();
  await p.waitForSelector('#dialog[open][data-kind="workflow-stock-alerts"]');
  await act('close-modal');
  await p.waitForTimeout(450);
  assert.equal(await p.locator('#dialog[open]').count(),0);
  const after=await p.evaluate(()=>JSON.stringify(Object.fromEntries(['products','sales','movements','clients','events','expenses','eventLoads'].map(k=>[k,ERPPreview.model().data[k]]))));
  assert.equal(after,before);
  return {leftOfDots:true,sameIconSize:true,noCircle:true,activationAndReturn:true,businessRecordsUnchanged:true,states};
}
module.exports={chipExperience};
