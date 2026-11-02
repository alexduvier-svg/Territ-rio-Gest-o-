const {start}=require('./lib.cjs');
const st=async(p,n)=>console.log(n,JSON.stringify(await p.evaluate(()=>({page:document.querySelector('#app .subheader .title,#app h1')?.textContent,dlg:document.getElementById('dialog').open?document.getElementById('dialog-title')?.textContent:'',cart:[...document.querySelectorAll('#app [data-action="open-cart"]')].map(x=>x.disabled?'off':'on'),fin:document.getElementById('dialog').open?[...document.querySelectorAll('#dialog [data-action="finalize-purchase"]')].map(x=>x.disabled?'off':'on'):[],items:ERPPreview.state().draft?.items?.map(i=>i.productId.slice(-6)+':'+i.rawQty),base:ERPPreview.state().draft?.additionBase?.items?.map(i=>i.rawQty),msg:document.querySelector('#app .sale-hint, #app [class*=footer] p, #app .total-note')?.textContent}))));
const digit=(p,d)=>p.locator('#app [data-action="digit"][data-digit="'+d+'"]').click();
const voltar=p=>p.locator('#app .subheader button:has-text("Voltar"), #app button:has-text("Voltar")').first().click();
(async()=>{const {b,p}=await start();
 await p.A('nav',{page:'Vender'});
 await p.locator('#app [data-action="sell-product"]').nth(0).click();await p.waitForTimeout(800);await digit(p,'1');await p.waitForTimeout(300);
 await p.locator('#app [data-action="open-cart"]').click();await p.waitForTimeout(700);
 await p.locator('#dialog [data-action="continue-shopping"]').click();await p.waitForTimeout(700);await st(p,'1 continuar comprando');
 await p.locator('#app [data-action="sell-product"]').nth(1).click();await p.waitForTimeout(800);await st(p,'2 toca outro');
 await voltar(p);await p.waitForTimeout(800);await st(p,'3 voltar sem comprar');
 const r=p.locator('#app [data-action="resume-sale"]');console.log('resume count',await r.count());if(await r.count()){await r.first().click();await p.waitForTimeout(800);}
 await st(p,'4 retomar');await p.shot('40-retomar',false);
 if(await p.locator('#app [data-action="digit"]').count()){await digit(p,'2');await p.waitForTimeout(600);}
 await st(p,'5 digitou 2');await p.shot('41-digitou',false);
 await b.close();})();
