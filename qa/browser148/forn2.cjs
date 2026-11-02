const {start}=require('./lib.cjs');
(async()=>{const {b,p}=await start();
 await p.A('nav',{page:'Gestão'});await p.evaluate(()=>document.querySelectorAll('#app details').forEach(d=>d.open=true));
 await p.locator('#app button:has-text("Fornecedores")').first().click();await p.waitForTimeout(700);
 await p.locator('#dialog button:has-text("Abrir Fornecedores")').click();await p.waitForTimeout(900);await p.locator("button:has-text(\"Histórico\")").first().click();await p.waitForTimeout(800);await p.shot("71-forn",false);
 console.log((await p.evaluate(()=>(document.getElementById('dialog').open?document.getElementById('dialog'):document.getElementById('app')).innerText)).replace(/\n+/g,' | ').slice(0,1500));
 await b.close();})();
