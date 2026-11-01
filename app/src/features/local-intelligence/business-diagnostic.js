import {interpretationRequest,validateInterpretation,executeInterpretation} from '../agent/semantic-query.js';
export async function verifyBusinessConnection(interpreter){
 const data={dataContext:{id:'connection-diagnostic',type:'demo'},products:[{id:'probe-empty',name:'Café Teste Esgotado',unit:'pacote',stock:0},{id:'probe-available',name:'Café Teste Disponível',unit:'pacote',stock:5}],sales:[],movements:[],clients:[],events:[],expenses:[]};
 const envelope=interpretationRequest(data,'Qual café acabou?'),response=await interpreter.interpret(envelope.request,{required:true});
 const plan=validateInterpretation(response.raw,envelope);
 if(plan.type!=='query'||plan.tasks.length!==1||plan.tasks[0].kind!=='stock_empty')throw Error('O Gemini respondeu, mas não interpretou corretamente a pergunta fictícia do diagnóstico. Nenhum resultado do negócio foi usado.');
 const result=await executeInterpretation(data,plan,envelope);
 if(!result.text.includes('Café Teste Esgotado')||result.text.includes('Café Teste Disponível'))throw Error('A consulta fictícia não produziu o resultado esperado nos motores locais.');
 return {model:response.modelName,text:result.text,elapsedMs:response.elapsedMs};
}
