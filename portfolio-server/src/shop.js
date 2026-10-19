// One SQLite-backed Durable Object per producer portfolio. Serial transactions
// reserve requests atomically; requesting an order never records a paid sale.
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer'}});
const text=(v,max)=>typeof v==='string'?v.replace(/[\u0000-\u001f]/g,' ').trim().slice(0,max):'';
const token=()=>[...crypto.getRandomValues(new Uint8Array(32))].map(n=>n.toString(16).padStart(2,'0')).join('');
const fail=(message,status=400)=>{const e=Error(message);e.status=status;throw e;};
const active=o=>!['cancelled','delivered'].includes(o.status)&&!o.accountedSale;
const qty=n=>Math.round(n*1000)/1000;
const whole=unit=>!['kg','g','Litro','ml'].includes(unit);
export const SHOP_STAGES=['requested','preparing','ready','out_for_delivery','delivered'];
export const SHOP_LABELS={requested:'Pedido enviado · aguardando confirmação',preparing:'Pedido sendo preparado',ready:'Pedido pronto',out_for_delivery:'Em rota de entrega',delivered:'Entregue',cancelled:'Cancelado'};
const initial=()=>({version:1,enabled:false,revision:0,syncedAt:0,products:[],orders:[],rates:{}});
function available(s,p){return Math.max(0,qty(p.stock-s.orders.filter(active).reduce((n,o)=>n+o.items.filter(i=>i.productId===p.productId).reduce((v,i)=>v+i.quantity,0),0)));}
function snapshotProducts(rows){
 if(!Array.isArray(rows)||rows.length>5000)fail('Catálogo grande demais.');const seen=new Set();
 return rows.map(p=>{const id=text(p.productId,100),stock=Number(p.stock),price=Number(p.price),unit=text(p.unit,30);if(!id||seen.has(id)||!Number.isFinite(stock)||stock<0||stock>10000000||qty(stock)!==stock||!Number.isSafeInteger(price)||price<1||price>100000000||!unit)fail('Confira os produtos, preços e saldos.');seen.add(id);return{productId:id,name:text(p.name,100),label:text(p.label,160),category:text(p.category,50),unit,price,stock,image:/^[a-f0-9]{64}$/.test(p.image||'')?p.image:null};});
}
function publicOrder(o){return {id:o.id,status:o.status,total:o.total,items:o.items,createdAt:o.createdAt,updatedAt:o.updatedAt,history:o.history};}
function checkout(s,body,now){
 if(body.website)fail('Não foi possível enviar este pedido.');
 const key=text(body.requestId,80);if(!/^[a-zA-Z0-9_-]{20,80}$/.test(key))fail('Atualize a página antes de pedir.');
 const replay=s.orders.find(o=>o.requestId===key);if(replay)return {order:publicOrder(replay),trackingToken:replay.trackingToken,replayed:true};
 if(!s.enabled)fail('Esta loja não está recebendo pedidos.',409);
 if(now-s.syncedAt>30*60000)fail('O produtor precisa atualizar a disponibilidade. Fale com ele antes de pedir.',409);
 if(s.orders.filter(o=>!['delivered','cancelled'].includes(o.status)).length>=300)fail('O produtor precisa conferir os pedidos pendentes.',429);
 const customer={name:text(body.customer?.name,100),phone:text(body.customer?.phone,25).replace(/\D/g,''),address:text(body.customer?.address,350),note:text(body.customer?.note,500)};
 if(!customer.name||customer.phone.length<10||customer.phone.length>13||!customer.address||body.consent!==true)fail('Informe nome, WhatsApp, entrega/retirada e a autorização para o pedido.');
 if(!Array.isArray(body.items)||!body.items.length||body.items.length>100)fail('Escolha os produtos.');
 const seen=new Set(),items=body.items.map(i=>{const p=s.products.find(p=>p.productId===i.productId),q=Number(i.quantity);if(!p||seen.has(p.productId)||!Number.isFinite(q)||q<=0||q>100000||qty(q)!==q||whole(p.unit)&&!Number.isInteger(q))fail('Confira os produtos e as quantidades.');seen.add(p.productId);if(q>available(s,p))fail('Disponível de '+p.name+': '+available(s,p).toLocaleString('pt-BR')+' '+p.unit+'.',409);if(i.price!==p.price)fail('O preço mudou. Atualize a loja antes de pedir.',409);return{productId:p.productId,name:p.name,label:p.label,unit:p.unit,quantity:q,price:p.price,total:Math.round(q*p.price)};});
 const order={id:crypto.randomUUID(),requestId:key,trackingToken:token(),customer,items,total:items.reduce((n,i)=>n+i.total,0),status:'requested',version:1,createdAt:now,updatedAt:now,history:[{status:'requested',at:now}],accountedSale:null};s.orders.push(order);return {order:publicOrder(order),trackingToken:order.trackingToken};
}
export class ProducerShop{
 constructor(ctx){this.ctx=ctx;}
 async fetch(request){
  try{
   const path=new URL(request.url).pathname,owner=request.headers.get('x-shop-owner')==='verified';
   let body={};if(request.method!=='GET'){const raw=await request.text();if(raw.length>1500000)fail('Envio grande demais.',413);try{body=JSON.parse(raw||'{}');}catch{fail('Envio inválido.');}}
   const response=await this.ctx.storage.transaction(async tx=>{
    const s=await tx.get('state')||initial(),now=Date.now();let result;
    if(path==='/catalog'&&request.method==='GET'){
     const fresh=now-s.syncedAt<=30*60000;return json({enabled:s.enabled,fresh,updatedAt:s.syncedAt,revision:s.revision,products:s.products.map(p=>({...p,stock:undefined,available:s.enabled&&fresh?available(s,p):0})),notice:'Pedido sujeito à confirmação do produtor. Disponibilidade atualizada enquanto o app tem conexão.'});
    }
    if(path==='/orders'&&request.method==='POST'){
     const bucket=request.headers.get('x-shop-rate')||'unknown',rate=s.rates[bucket]||{at:now,count:0};if(now-rate.at>3600000){rate.at=now;rate.count=0;}if(rate.count>=30&&!s.orders.some(o=>o.requestId===body.requestId))fail('Muitos pedidos. Aguarde um pouco.',429);result=checkout(s,body,now);if(!result.replayed)rate.count++;s.rates[bucket]=rate;s.rates=Object.fromEntries(Object.entries(s.rates).filter(([,v])=>now-v.at<3600000));
    }else if(path==='/track'&&request.method==='POST'){
     const o=s.orders.find(o=>o.trackingToken===body.token);if(!o||['delivered','cancelled'].includes(o.status)&&now-o.updatedAt>90*86400000||!/^\w{64}$/.test(body.token||''))return json({error:'Pedido não encontrado.'},404);return json(publicOrder(o));
    }else{
     if(!owner)return json({error:'Sem permissão.'},401);
     if(path==='/erase'&&request.method==='PUT'){if(s.orders.some(o=>!['cancelled','delivered'].includes(o.status)))fail('Conclua ou recuse os pedidos antes de retirar a loja do ar.',409);await tx.delete('state');return json({deleted:true});}
     if(path==='/inventory'&&request.method==='GET')return json({revision:s.revision,enabled:s.enabled,syncedAt:s.syncedAt,lastSyncId:s.lastSyncId});
     if(path==='/inventory'&&request.method==='PUT'){
      const syncId=text(body.operationId,100);if(!syncId)fail('Identificador de sincronização ausente.');
      if(s.lastSyncId===syncId){s.syncedAt=now;await tx.put('state',s);return json({revision:s.revision,syncedAt:now,replayed:true});}
      if(body.revision!==s.revision)fail('O estoque online mudou em outro aparelho. Confira a loja antes de substituir a disponibilidade.',409);
      const products=snapshotProducts(body.products);if(body.enabled!==undefined&&typeof body.enabled!=='boolean')fail('Configuração inválida.');
      const completed=Array.isArray(body.completed)?body.completed:[];
      for(const info of completed){const o=s.orders.find(o=>o.id===info.orderId);if(!o)continue;if(typeof info.saleId!=='string'||!info.saleId||!Array.isArray(info.items)||o.items.some(i=>!info.items.some(x=>x.productId===i.productId&&x.quantity===i.quantity)))fail('Confira a venda vinculada ao pedido.');if(o.accountedSale&&o.accountedSale!==info.saleId)fail('Este pedido já possui uma venda.');if(o.status==='cancelled')fail('Este pedido foi cancelado.');o.accountedSale=info.saleId;}
      for(const info of Array.isArray(body.refunded)?body.refunded:[]){const o=s.orders.find(o=>o.id===info.orderId);if(!o)continue;if(typeof info.saleId!=='string'||!info.saleId||o.accountedSale&&o.accountedSale!==info.saleId)fail('Confira a devolução do pedido.');o.accountedSale=info.saleId;if(o.status!=='cancelled'){o.status='cancelled';o.version++;o.updatedAt=now;o.history.push({status:'cancelled',at:now});}}
      s.products=products;s.enabled=body.enabled??s.enabled;s.revision++;s.syncedAt=now;s.lastSyncId=syncId;result={revision:s.revision,syncedAt:now};
     }else if(path==='/orders'&&request.method==='GET')return json({orders:s.orders,revision:s.revision,enabled:s.enabled});
     else if(/^\/orders\/[\w-]+$/.test(path)&&request.method==='PUT'){
      const o=s.orders.find(o=>o.id===path.split('/')[2]);if(!o)return json({error:'Pedido não encontrado.'},404);
      if(body.status===o.status)return json({order:o,replayed:true});
      if(body.version!==o.version)fail('O pedido mudou. Atualize antes de continuar.',409);
      if(body.status==='cancelled'){if(o.accountedSale||o.status!=='requested')fail('Pedidos com venda registrada exigem conferir a devolução pelo fluxo de venda.');}
      else if(SHOP_STAGES.indexOf(body.status)!==SHOP_STAGES.indexOf(o.status)+1||!o.accountedSale)fail('Registre a venda e confirme cada etapa na sequência.');
      o.status=body.status;o.version++;o.updatedAt=now;o.history.push({status:o.status,at:now});result={order:o};
     }else return json({error:'Não encontrado.'},404);
    }
    // Customer details are retained for delivery and then removed after 90 days.
    s.orders=s.orders.filter(o=>!['cancelled','delivered'].includes(o.status)||now-o.updatedAt<90*86400000);
    await tx.put('state',s);return json(result);
   });
   if(path==='/erase'&&response.ok)await this.ctx.storage.deleteAlarm?.();else if(path.startsWith('/orders')&&request.method!=='GET'&&response.ok&&!await this.ctx.storage.getAlarm?.())await this.ctx.storage.setAlarm?.(Date.now()+86400000);return response;
  }catch(e){return json({error:e.status?e.message:'Não foi possível processar o pedido.'},e.status||500);}
 }
 async alarm(){let keep=false;await this.ctx.storage.transaction(async tx=>{const s=await tx.get('state');if(!s)return;const now=Date.now();s.orders=s.orders.filter(o=>!['cancelled','delivered'].includes(o.status)||now-o.updatedAt<90*86400000);s.rates={};keep=s.orders.length>0;await tx.put('state',s);});if(keep)await this.ctx.storage.setAlarm(Date.now()+86400000);else await this.ctx.storage.deleteAlarm();}
}

export async function routeShop(request,env,slug,rest,authorize){
 if(!env.SHOPS)return json({error:'A loja online ainda não foi ativada no servidor.'},503);
 const path='/'+(rest||''),publicRoute=path==='/catalog'&&request.method==='GET'||path==='/orders'&&request.method==='POST'||path==='/track'&&request.method==='POST';
 if(publicRoute&&request.method==='POST'){
  const origin=request.headers.get('origin'),allowed=[new URL(request.url).origin,...String(env.APP_ORIGINS||'').split(',')];
  if(!request.headers.get('content-type')?.startsWith('application/json')||origin&&!allowed.includes(origin))return json({error:'Envie o pedido pela página da loja.'},403);
 }
 if(!await env.PORTFOLIOS.get('doc:'+slug))return json({error:'Publique o portfólio deste produtor primeiro.'},404);
 const headers=new Headers({'content-type':'application/json'});if(!publicRoute){if(!await authorize(request,env,slug))return json({error:'Sem permissão para esta loja.'},401);headers.set('x-shop-owner','verified');}
 if(path==='/orders'&&request.method==='POST'){
  const input=(request.headers.get('cf-connecting-ip')||'unknown')+'|'+slug+'|'+new Date().toISOString().slice(0,10),hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input));headers.set('x-shop-rate',[...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,'0')).join(''));
 }
 const enabled=path==='/inventory'&&request.method==='PUT'?(await request.clone().json()).enabled:undefined;
 const obj=env.SHOPS.get(env.SHOPS.idFromName(slug)),response=await obj.fetch(new Request('https://shop.internal'+path,{method:request.method,headers,body:request.method==='GET'?undefined:request.body,duplex:'half'}));if(response.ok&&typeof enabled==='boolean'){const prior=await env.PORTFOLIOS.get('shop-config:'+slug,'json');if(prior?.enabled!==enabled)await env.PORTFOLIOS.put('shop-config:'+slug,JSON.stringify({enabled}));}return response;
}
