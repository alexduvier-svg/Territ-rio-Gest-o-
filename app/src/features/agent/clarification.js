// Unknown intent is a question to the producer, never a generic business answer.
export function clarificationResult(question,{now=Date.now(),references=[],target=''}={}){
 const text=String(question||'').trim().slice(0,500),q=text.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
 let ask;
 if(target==='product')ask='Qual é o produto e a apresentação cadastrada a que você está se referindo?';
 else if(target==='supplier')ask='Qual fornecedor cadastrado você quer consultar?';
 else if(target==='client')ask='Qual cliente cadastrado você quer consultar?';
 else if(target==='event')ask='Qual feira ou evento cadastrado você quer consultar?';
 else if(target==='unsupported')ask='Não tenho uma consulta validada do aplicativo para concluir essa pergunta. A qual registro ou seção do negócio ela se refere?';
 else if(target==='period')ask='Qual período você quer consultar? Selecione-o na Gestão ou informe se é hoje, ontem ou um mês específico.';
 else if(target==='missing_cost')ask='Qual é o custo unitário conhecido do produto, e quais taxas ou despesas devem entrar nessa simulação?';
 else if(references.length>1)ask='Você está se referindo a qual destes itens: '+references.join('; ')+'?';
 else if(references.length===1&&/\be se\b|\bse eu\b|supon|hipotese|baixar|desconto/.test(q))ask='A referência disponível é '+references[0]+'. O intérprete não concluiu essa hipótese com segurança. Use Contas da banca para conferir o cenário; o cadastro permanece inalterado.';
 else if(references.length===1)ask='A referência disponível é '+references[0]+'. Qual informação desse item você quer consultar: estoque, vendas, custo ou resultado?';
 else if(/\b(ele|ela|eles|elas|isso|aquilo|esse|essa|este|esta)\b|^e\b/.test(q))ask='A qual produto, cliente, fornecedor ou evento você está se referindo?';
 else if(/chegar|entregar|receber|pendente/.test(q))ask='Você quer consultar mercadorias de fornecedores, entregas aos clientes ou valores a receber?';
 else if(/melhor|pior|mais|menos|compens|valeu|rendeu/.test(q))ask='Você quer comparar quantidade vendida, faturamento ou lucro? Quais itens e qual período?';
 else if(/quanto|valor|total|saldo/.test(q))ask='Qual valor você quer consultar: vendas, recebimentos, despesas ou estoque? De qual período?';
 else ask='Qual informação dos seus registros você quer consultar, ou qual operação do aplicativo deseja entender?';
 return {intent:'clarification',needsClarification:true,text:(text?'Não consegui identificar com segurança o que consultar em “'+text+'”.\n':'')+ask,generatedAt:now,specialists:[],confidence:'Consulta ainda não definida; nenhum resultado do negócio foi presumido.',insights:[],rebuys:[]};
}
