const {start}=require('./lib.cjs');
(async()=>{const {b,p}=await start();
 await p.A('nav',{page:'Estoque'});await p.A('new-product');await p.A('stock-custom-product');
 for(const name of ['Doce de leite','Alface']){
 await p.evaluate(n=>{ERPPreview.updateProductName(n,true);},name);await p.A('stock-use-custom-name');await p.waitForTimeout(400);
 console.log(name,'→',JSON.stringify(await p.evaluate(()=>ERPPreview.dimensionOptions('unit',0))));}
 await p.A('presentation-more',{index:'0',field:'unit'});await p.waitForTimeout(600);await p.shot('80-emb',false);
 console.log(await p.evaluate(()=>document.getElementById('dialog').innerText.replace(/\n+/g,' | ').slice(0,600)));
 await b.close();})();
