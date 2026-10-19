// Local integration only. Never create test customers/orders on the live service.
import assert from 'node:assert/strict';
const BASE=process.env.BASE||'http://127.0.0.1:8787';if(!/^http:\/\/(127\.0\.0\.1|localhost):/.test(BASE))throw Error('Use local server only.');
const api=async(path,{token,json,body,method}={})=>{const r=await fetch(BASE+path,{method:method||(json||body?'POST':'GET'),headers:{...(token?{authorization:'Bearer '+token}:{}),...(json?{'content-type':'application/json'}:{})},body:json?JSON.stringify(json):body});let value;try{value=await r.json();}catch{}return{status:r.status,value,headers:r.headers};};
const created=(await api('/api/portfolios',{json:{name:'Loja sintética QA'}})).value,{slug,token}=created;
const doc={business:{name:'Loja sintética',story:'Sem dados reais'},contact:{},groups:[{name:'Café Gourmet',category:'Cafés',variants:[{productId:'g250',unit:'Pacote',label:'250 g',price:1800}]}]};
try{
 const form=new FormData();form.set('portfolio',JSON.stringify(doc));assert.equal((await api('/api/portfolios/'+slug,{token,method:'PUT',body:form})).status,200);
 const path='/api/shops/'+slug;
 assert.equal((await api(path+'/inventory',{method:'GET'})).status,401);
 assert.equal((await api(path+'/inventory',{token,method:'PUT',json:{enabled:true,operationId:'test-sync-1',revision:0,products:[{productId:'g250',name:'Café Gourmet',label:'250 g',unit:'Pacote',category:'Cafés',stock:3,price:1800}]}})).status,200);
 const body={requestId:crypto.randomUUID().replace(/-/g,''),customer:{name:'Pessoa fictícia',phone:'32999990000',address:'Retirada fictícia'},items:[{productId:'g250',quantity:2,price:1800}],consent:true};
 const attempts=[body,{...body,requestId:crypto.randomUUID().replace(/-/g,'')}],orders=await Promise.all(attempts.map(json=>api(path+'/orders',{json})));assert.deepEqual(orders.map(r=>r.status).sort(),[200,409]);const winner=orders.findIndex(r=>r.status===200),receipt=orders[winner].value;
 assert.equal((await api(path+'/orders',{json:attempts[winner]})).value.order.id,receipt.order.id);
 const tracked=await api(path+'/track',{json:{token:receipt.trackingToken}});assert(!tracked.value.customer);assert.equal(tracked.value.status,'requested');
 const page=await fetch(BASE+'/s/'+slug);assert.equal(page.status,200);assert.match(page.headers.get('content-security-policy'),/script-src 'nonce-/);assert((await page.text()).includes('Enviar pedido ao produtor'));
 assert.equal((await api(path+'/inventory',{token,method:'PUT',json:{enabled:true,operationId:'test-sync-2',revision:1,products:[{productId:'g250',name:'Café Gourmet',label:'250 g',unit:'Pacote',category:'Cafés',stock:1,price:1800}],completed:[{orderId:receipt.order.id,saleId:'synthetic-sale',items:[{productId:'g250',quantity:2}]}]}})).status,200);
 for(const [n,status]of ['preparing','ready','out_for_delivery','delivered'].entries())assert.equal((await api(path+'/orders/'+receipt.order.id,{token,method:'PUT',json:{status,version:n+1}})).status,200);
 assert.equal((await api(path+'/track',{json:{token:receipt.trackingToken}})).value.status,'delivered');
 console.log('11 local SQLite shop integration checks passed');
}finally{await api('/api/portfolios/'+slug,{token,method:'DELETE'});}
