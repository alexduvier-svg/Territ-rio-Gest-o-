const {start}=require('./lib.cjs');
(async()=>{const {b,p}=await start();
 await p.A('nav',{page:'Estoque'});await p.A('new-product');await p.waitForTimeout(400);
 await p.A('stock-custom-product');await p.waitForTimeout(300);
 await p.evaluate(()=>{ERPPreview.updateProductName('Café verde',true);});await p.A('stock-use-custom-name');await p.waitForTimeout(500);
 const btns=await p.evaluate(()=>[...document.querySelectorAll('[data-action]')].map(b=>b.dataset.action+':'+b.textContent.trim().slice(0,30)).filter(x=>/salv|cadastr|confirm|unit/i.test(x)));console.log(btns);
 console.log(await p.evaluate(()=>document.querySelector('.stock-unit-confirm')?.innerText));
 const save=btns.find(x=>/^save|salvar/i.test(x));if(save){await p.A(save.split(':')[0]);await p.waitForTimeout(600);}
 const inv=await p.evaluate(()=>[...document.querySelectorAll('[aria-invalid="true"],.field-error,.is-invalid,.invalid')].map(e=>(e.id||e.className)+'|'+(e.getAttribute('aria-label')||e.textContent||'').trim().slice(0,50)));console.log('invalid',inv);
 await p.shot('21-save',true);console.log('ERR',p.errs);await b.close();})();
