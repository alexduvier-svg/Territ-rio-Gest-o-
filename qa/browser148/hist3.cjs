const {start}=require('./lib.cjs');
(async()=>{const {b,p}=await start();
 await p.A('nav',{page:'Estoque'});await p.A('history');await p.waitForTimeout(500);
 await p.locator('#dialog button:has-text("Pesquisar entradas")').click();await p.waitForTimeout(600);
 for(const q of ['café especial 500 g','quando entrou o café especial de 1 kg','tilápia']){
  await p.fill('#stock-entry-question',q);await p.locator('#dialog button:has-text("Consultar entradas")').click();await p.waitForTimeout(600);
  console.log('Q:',q,'\n ',(await p.evaluate(()=>document.getElementById('dialog').innerText.split('Consultar entradas')[1]||'')).replace(/\s+/g,' ').slice(0,330));}
 await b.close();})();
