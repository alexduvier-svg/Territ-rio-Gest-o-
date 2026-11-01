// Unknown intent is a question to the producer, never a generic business answer.
export function clarificationResult(question,{now=Date.now()}={}){
 const text=String(question||'').trim().slice(0,500),q=text.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
 let ask;
 if(/\b(ele|ela|eles|elas|isso|aquilo|esse|essa|este|esta)\b|^e\b/.test(q))ask='A qual produto, cliente, fornecedor ou evento você está se referindo?';
 else if(/chegar|entregar|receber|pendente/.test(q))ask='Você quer consultar mercadorias de fornecedores, entregas aos clientes ou valores a receber?';
 else if(/melhor|pior|mais|menos|compens|valeu|rendeu/.test(q))ask='Você quer comparar quantidade vendida, faturamento ou lucro? Quais itens e qual período?';
 else if(/quanto|valor|total|saldo/.test(q))ask='Qual valor você quer consultar: vendas, recebimentos, despesas ou estoque? De qual período?';
 else ask='Qual informação dos seus registros você quer consultar, ou qual operação do aplicativo deseja entender?';
 return {intent:'clarification',needsClarification:true,text:(text?'Não consegui identificar com segurança o que consultar em “'+text+'”.\n':'')+ask,generatedAt:now,specialists:[],confidence:'Consulta ainda não definida; nenhum resultado do negócio foi presumido.',insights:[],rebuys:[]};
}
