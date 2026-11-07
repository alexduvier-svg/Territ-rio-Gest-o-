const assert=require('node:assert/strict');
const topics={ranking:/Produtos|Ainda não há vendas/i,vendas:/Receita por dia|Nenhuma venda/i,resultado:/Resultado gerencial/i,caixa:/Caixa pelos registros/i,custos:/Custos extras do período/i,produtos:/Curva ABC|Sem produtos/i,estoque:/estoque|saldo|cobertura/i,clientes:/Compras identificadas/i,fornecedores:/Compras|Fornecedores/i,indicadores:/Margem bruta/i,comparacao:/período|comparad|evento anterior/i,orientacoes:/Visão geral|Leitura não liberada|Conferência/i,simulacoes:/Calculadora de simulações/i,arquivos:/CSV|backup/i};
async function openWithFrames(page,key){
 await page.evaluate(key=>{
  const dialog=document.getElementById('dialog');
  const snapshot=()=>{const body=dialog.querySelector('.dialog-content');return {open:dialog.open,title:dialog.querySelector('#dialog-title')?.textContent||'',text:body?.textContent||'',children:body?.children.length||0,busy:!!body?.querySelector('.mgh-advisor-slot,[data-mgh-advisor][aria-busy="true"]'),height:dialog.clientHeight};};
  const probe={key,start:performance.now(),atOpening:null,immediate:null,frames:[]};
  const pointer=()=>{probe.start=performance.now();};
  const onSheet=event=>{if(event.detail.kind!=='mg-detail')return;dialog.removeEventListener('territorio:sheet',onSheet);probe.atOpening=snapshot();probe.prepareMs=performance.now()-probe.start;queueMicrotask(()=>{probe.immediate=snapshot();});const next=()=>requestAnimationFrame(()=>{probe.frames.push(snapshot());if(probe.frames.length<3)next();});next();};
  document.addEventListener('pointerdown',pointer,{capture:true,once:true});dialog.addEventListener('territorio:sheet',onSheet);
  window.__opening142Probe=probe;
 },key);
 await page.locator('.mgh-hub [data-action="mg-detail"][data-key="'+key+'"]').click();
 await page.waitForFunction(()=>window.__opening142Probe?.frames.length===3,null,{timeout:15000});
 const out=await page.evaluate(()=>{const r=window.__opening142Probe;delete window.__opening142Probe;return r;});
 assert(out.atOpening,key+' must open the real sheet');
 for(const [stage,s] of [['sheet event',out.atOpening],['action return',out.immediate],...out.frames.map((s,i)=>['frame '+(i+1),s])]){
  assert(s.open&&s.children>0&&s.text.trim().length>30,key+' empty '+stage);
  assert.equal(s.busy,false,key+' intermediate loading panel '+stage);
  assert.doesNotMatch(s.text,/Preparando a consulta dos registros/i,key+' preparation panel '+stage);
  assert.match(s.text,topics[key],key+' missing its actual content at '+stage);
 }
 return {key,prepareMs:Number(out.prepareMs.toFixed(2)),openingHeight:out.atOpening.height,frameHeights:out.frames.map(s=>s.height),contentReadyAtOpening:true,threeFramesReady:true};
}
module.exports={openWithFrames};
