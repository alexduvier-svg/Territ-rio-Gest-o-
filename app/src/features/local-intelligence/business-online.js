export const BUSINESS_CONSENT_VERSION=1;
export const BUSINESS_CONSENT_TEXT=Object.freeze([
 'O Gemini online poderá interpretar as perguntas do Gerente. Serão enviados a pergunta, o contexto anterior ainda válido e rótulos mínimos dos cadastros necessários, como nomes de produtos e apresentações. O texto que você digitou também faz parte desse envio.',
 'Documentos, telefones, saldos, preços e o histórico bruto de vendas dos cadastros não integram esse contexto. A consulta aos registros e os cálculos acontecem no aplicativo, depois da validação do plano. O Gemini não registra vendas nem altera o estoque.',
 'Essa autorização é adicional à dos testes fictícios. O acesso exige internet e usa a quota e as condições da sua conta Google. Você pode desativá-lo nas configurações de inteligência. A chave já guardada será reaproveitada.',
]);
const error=(message,code)=>Object.assign(Error(message),{code});
const aborted=()=>Object.assign(Error('Consulta interrompida ou contexto alterado. Consulte novamente.'),{name:'AbortError'});
export function createBusinessInterpreter(provider,{contextKey=()=>'',foreground=()=>true}={}){
 let epoch=0,active=0;
 const current=(token,key)=>{if(key!==contextKey())throw Object.assign(aborted(),{code:'CONTEXT_CHANGED'});if(token!==epoch||!foreground())throw aborted();};
 return {
  status:()=>provider.status({}),
  async enable(){await provider.authorizeBusiness({consentVersion:BUSINESS_CONSENT_VERSION});},
  async disable(){epoch++;await provider.revokeBusiness({});},
  async cancel(){epoch++;if(active)await provider.cancel({});},
  async interpret(request,{required=false}={}){
   if(typeof request!=='string'||!request.trim()||request.length>10000)throw error('O contexto da pergunta está fora do limite de interpretação.','GEMINI_CONTEXT_LIMIT');
   const token=epoch,key=contextKey();current(token,key);const s=await provider.status({});current(token,key);
   if(!s.configured){if(required)throw error('A chave do Gemini online ainda não está configurada neste aplicativo. Abra Configurar Gemini online.','GEMINI_KEY_MISSING');return null;}
   if(!s.businessEnabled)throw error('Autorize o uso do Gemini no Gerente para interpretar esta pergunta.','GEMINI_BUSINESS_CONSENT_REQUIRED');
   if(active)throw error('Aguarde o encerramento da interpretação anterior.','GEMINI_BUSY');
   active++;
   try{
    current(token,key);const r=await provider.interpretQuestion({request});current(token,key);
    if(!r||r.synthetic!==false||r.scenario!=='business-interpretation'||r.model!=='gemini-online'||typeof r.raw!=='string'||r.raw.length>4000)throw error('O retorno do Gemini não corresponde a uma interpretação válida do Gerente.','GEMINI_RESPONSE_INVALID');
    return r;
   }finally{active--;}
  },
 };
}
