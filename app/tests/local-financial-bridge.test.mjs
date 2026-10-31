import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as Finance from '../src/features/finance/finance.js';
const ui=fs.readFileSync(new URL('../src/legacy/erp-ui.js',import.meta.url),'utf8');
const arrow=(name,next)=>ui.slice(ui.indexOf(' '+name+':')+name.length+2,ui.indexOf('\n '+next+':')).trim().replace(/,$/,'');
function bridge({known=true,eligible=true,checks=true}={}){
 const sales=[{id:'s',status:'completed',total:100000,cost:40000,items:[],payments:[{method:'Pix',amount:100000}]}],returns=[],expenses=[{amount:7000,kind:'feira'}];
 const st=Finance.statement({sales,returns,expenses,losses:2000,settings:{salesTaxRate:5,fixedCosts:[{title:'Energia',amount:10000}],drawOn:true,drawMonthly:2000},shares:[{month:'2026-10',share:1}],general:true});
 st.checks=checks;let selection;
 const sandbox={Date,FIN:()=>({...Finance,productMargins:()=>[{costKnown:known}]}),E:{money:n=>'R$ '+(n/100).toFixed(2).replace('.',',')},window:{TerritorioAgent:{validSales:()=>sales,matchesRecord:()=>eligible}},finStatement:sel=>{selection=sel;return {sales,returns,expenses,st};},periodText:()=> 'Outubro de 2026',reportScopeName:()=> 'Todos os locais'};
 const fn=vm.runInNewContext('('+arrow('financialAnswer','evidence')+')',sandbox);
 return {run:()=>fn('Mostre os valores do app',{scopeId:'all',selection:{month:'2026-10',periodMode:'mes'}}),st,getSelection:()=>selection};
}
test('manager uses the exact Gestão statement including event costs, losses, fixed forecasts and recorded cash',()=>{
 const b=bridge(),text=b.run();
 for(const [label,value] of [['Vendas após devoluções',b.st.revenue],['Custos da feira',b.st.costs.feira],['Perdas de estoque',b.st.losses],['Custos fixos previstos/rateados',b.st.fixed],['Resultado do demonstrativo',b.st.result],['Saldo pelos registros',b.st.cash],['Fixos e retirada ainda previstos, separados do caixa',b.st.cashForecast]])assert.ok(text.includes(label+': R$ '+(value/100).toFixed(2).replace('.',',')),label);
 assert.equal(b.st.result,34000);assert.equal(b.st.cash,88000);assert.equal(b.getSelection().scope,'all');assert.equal(b.getSelection().month,'2026-10');
 assert.match(text,/não comprovam liquidação bancária/);assert.ok(text.length<4000);
});
test('unknown costs prevent a gross or final profit claim; invalid origin or accounting checks block the answer',()=>{
 const text=bridge({known:false}).run();assert.match(text,/custo histórico incompleto/);assert.ok(!text.includes('Resultado do demonstrativo:'));assert.ok(!text.includes('Lucro bruto dos produtos:'));
 assert.throws(()=>bridge({eligible:false}).run(),/conferência/);assert.throws(()=>bridge({checks:false}).run(),/conferência/);
});
test('today overrides an old annual selection with the canonical daily period for the expense allocation',()=>{
 const fn=vm.runInNewContext('('+arrow('queryContext','managementAnswer')+')',{Date,E:{normalize:s=>s.toLowerCase(),dayKey:()=> '2026-10-31'},periodSelection:(mode,anchor)=>({periodMode:mode,periodAnchor:anchor,year:'',month:anchor.slice(0,7),days:[anchor]}),reportScopeName:s=>s,periodText:()=> 'Hoje'});
 const out=fn('Quanto faturei hoje?',{scopeId:'loja',selection:{year:'2025',periodMode:'ano'}});
 assert.equal(out.selection.periodMode,'dia');assert.equal(out.selection.year,'');assert.equal(out.selection.periodAnchor,'2026-10-31');assert.equal(out.selection.scope,'loja');
});
