import test from 'node:test';
import assert from 'node:assert/strict';
import { analysisRows } from '../src/features/analysis-export.js';
import { csvText } from '../src/features/data-export.js';
import { statement } from '../src/features/finance/finance.js';
import { financeLines } from '../src/features/advisor/finance-rules.js';

test('analysis CSV preserves unknown versus confirmed zero, units and provenance without changing entries',()=>{
 const entries=[{section:'Estoque',field:'Custo',value:null,unit:'BRL',source:'Desconhecido'},{field:'Custo',value:0,unit:'BRL',source:'Confirmado'},{field:'Conversão',value:NaN},{field:'Quantidade',value:2.5,unit:'kg'}],before=structuredClone(entries);
 const rows=analysisRows(entries,{kind:'Gestão',at:'2026-10-29T18:00:00Z',origin:'simulation'});
 assert.equal(rows[1][9],'');assert.equal(rows[2][9],0);assert.equal(rows[3][9],'');assert.equal(rows[4][10],'kg');assert.equal(rows[1][11],'Desconhecido');assert.deepEqual(entries,before);assert(rows.every(row=>row.length===rows[0].length));
});
test('analysis CSV keeps delimiter, Unicode, multiline notes and formula neutralization',()=>{
 const text=csvText(analysisRows([{field:'=1+1',value:'Café; queijo',note:'Linha 1\nLinha "2"'}],{kind:'Simulação'}));
 assert(text.startsWith('\ufeff'));assert(text.includes('"\'=1+1"'));assert(text.includes('"Café; queijo"'));assert(text.includes('Linha ""2""'));assert(!text.includes('NaN'));
});
test('cash excludes unrecorded fixed costs and draw, keeping a separate planning reserve',()=>{
 const f=statement({sales:[{total:100000,cost:40000,payments:[{method:'Pix',amount:100000}]}],expenses:[],settings:{fixedCosts:[{title:'Energia',amount:20000}],drawOn:true,drawMonthly:30000},shares:[{month:'2026-10',share:1}]});
 assert.equal(f.result,10000);assert.equal(f.cash,100000);assert.equal(f.cashOut,0);assert.equal(f.cashForecast,50000);assert.equal(f.cashAfterForecast,50000);assert(f.checks);
});
test('cash includes logged draw and investment once while forecast remains outside recorded cash',()=>{
 const f=statement({sales:[],expenses:[{kind:'retirada',amount:15000,date:'2026-10-02'},{kind:'investimento',amount:40000},{kind:'feira',amount:1000}],settings:{fixedCosts:[{title:'Aluguel',amount:20000}],drawOn:true,drawMonthly:30000},shares:[{month:'2026-10',share:1}]});
 assert.equal(f.cashOut,56000);assert.equal(f.cash,-56000);assert.equal(f.cashForecast,20000);assert.equal(f.cashAfterForecast,-76000);assert.equal(f.result,-36000);assert(f.checks);
});
test('the existing guidance engine explains canonical cash and its separate reserve',()=>{
 const f={...statement({sales:[],expenses:[],settings:{fixedCosts:[{title:'Energia',amount:2000}]},shares:[{month:'2026-10',share:1}]}),places:[],general:true},before=structuredClone(f);
 const text=financeLines(f).join('\n');assert.match(text,/Caixa pelos registros/);assert.match(text,/Previsões separadas/);assert.match(text,/Reserva não comprova pagamento/);assert.deepEqual(f,before);
});
