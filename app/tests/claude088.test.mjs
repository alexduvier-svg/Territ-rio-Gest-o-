// AGRO Gestão Claude 0.12.88: lote vencido vira perda do lote certo e antecedência do aviso por produto.
import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
import * as Lots from '../src/features/stock-lots/domain.js';
import {lossValue} from '../src/features/finance/finance.js';
const source=fs.readFileSync(new URL('../src/legacy/erp-core.js',import.meta.url),'utf8'),today=Lots.civilDay();
const dated=expiresOn=>({state:'dated',expiresOn,confirmed:true});
function fixture(){const c={Date,Math,console,crypto:globalThis.crypto,TerritorioStockLots:Lots};c.window=c;vm.createContext(c);vm.runInContext(source,c);const m=new c.ERP.ERPModel({schema:1,inventoryRevision:20,dataContext:{id:'p',type:'real'},products:[],sales:[],movements:[],clients:[],events:[],expenses:[],profiles:{},settings:{onboarding:'clean'}}),p=m.saveProducts({name:'Café Especial',category:'Cafés'},[{unit:'Pacote',weight:250,priceInput:'25',costInput:'10',stockInput:'0',minInput:'0'}])[0];return{m,p};}

test('perda de lote vencido baixa só aquele lote e entra no valor das perdas pelo custo', () => {
  const {m,p}=fixture();
  m.move(p.id,'add',4,'Entrada antiga',{lotInput:dated(Lots.shiftCivil(today,-3))});
  m.move(p.id,'add',6,'Entrada nova',{lotInput:dated(Lots.addCivil(today,30))});
  const before=Lots.lotSnapshot(m.data,p.id),expired=before.lots.find(l=>l.status.blocking);
  assert.equal(expired.remaining,4);
  assert.equal(before.available,6); // vencido já não está disponível para venda
  m.move(p.id,'loss',expired.remaining,'Lote vencido',{lotSelections:[{lotId:expired.id,quantity:expired.remaining}]});
  const after=Lots.lotSnapshot(m.data,p.id);
  assert.equal(p.stock,6);
  assert.equal(after.lots.find(l=>l.id===expired.id).remaining,0);
  assert.equal(after.available,6); // o lote bom fica intacto
  assert.equal(lossValue(m.data.movements,()=>p.cost),4000); // 4 × R$ 10,00
});

test('antecedência do aviso por produto muda o "vence em breve" e o dia do lembrete', () => {
  assert.equal(Lots.validityState(dated(Lots.addCivil(today,8)),today).code,'valid');
  assert.equal(Lots.validityState(dated(Lots.addCivil(today,8)),today,10).code,'expiring');
  assert.equal(Lots.validityState(dated(Lots.addCivil(today,3)),today,2).code,'valid');
  assert.equal(Lots.leadDays(0),5);assert.equal(Lots.leadDays(120),5);assert.equal(Lots.leadDays('12'),12);
  const {m,p}=fixture();
  m.move(p.id,'add',5,'Entrada',{lotInput:dated(Lots.addCivil(today,20))});
  m.data.settings.validityLeadDays={[p.id]:10};
  const now=Date.parse(today+'T07:00:00-03:00'),plan=Lots.calendarNotices(m.data,now),dates=plan.map(n=>n.date).sort();
  assert.deepEqual(dates,[Lots.addCivil(today,10),Lots.addCivil(today,20)]);
  assert.equal(Lots.lotSnapshot(m.data,p.id).lots[0].lead,10);
});
