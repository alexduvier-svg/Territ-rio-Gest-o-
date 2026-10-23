const HOUR=3600000;
const clock=t=>new Date(t).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'});
const stamp=t=>new Date(t).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
export function weatherPeriod(point){
 const start=Date.parse(point?.time);
 if(!Number.isFinite(start))return '';
 return 'Previsão · '+clock(start)+(point.hours>0?'–'+clock(start+point.hours*HOUR):'');
}
export function weatherFreshness(data,dueAt,now=Date.now(),online=true){
 if(!data)return null;
 const stale=data.stale||!online||now>data.expiresAt,issued=Date.parse(data.issuedAt);
 return {saved:(stale?'Última Previsão Salva':'Previsão Salva')+' · '+stamp(data.retrievedAt),
  issued:Number.isFinite(issued)?'Atualização do MET Norway · '+stamp(issued):'Horário de emissão não informado pela fonte.',
  checked:Number.isFinite(data.checkedAt)?'Consulta ao servidor · '+stamp(data.checkedAt):'',
  next:!online?'Sem internet. Atualizaremos quando houver conexão.':Number.isFinite(dueAt)&&dueAt>now?'Próxima verificação a partir de '+clock(dueAt)+'.':'Verificação pendente. A última previsão continua disponível.',
  stale};
}
