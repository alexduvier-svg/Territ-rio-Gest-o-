// Benchmarks are explicitly fictional. They never query or reset the producer's ERP.
// 0.12.148: only Gemini Nano (Android AICore) is tested on the phone; Qwen was removed.
export function validateModelDiagnostic(result,model,scenario){
 if(!result||result.synthetic!==true||result.model!==model||result.scenario!==scenario||model!=='nano'||!['compound','empty'].includes(scenario)||typeof result.raw!=='string'||result.raw.length>4000||!Number.isFinite(result.elapsedMs)||result.elapsedMs<0)throw Error('O diagnóstico não corresponde ao teste solicitado.');
 let parsed;try{parsed=JSON.parse(result.raw);}catch{ return {...result,passed:false,reason:'O modelo não retornou JSON válido.'}; }
 const expected=scenario==='compound'?{estoque:true,vendas:true,cnpjs:true,periodo:'mes_atual'}:{situacao:'sem_registros',acao:'cadastrar_produtos',usaExemplos:false};
 const passed=!!parsed&&typeof parsed==='object'&&!Array.isArray(parsed)&&Object.keys(parsed).length===Object.keys(expected).length&&Object.entries(expected).every(([k,v])=>parsed[k]===v);
 return {...result,passed,reason:passed?'Saída compatível com o cenário fictício.':'A interpretação não corresponde ao cenário. Não usar este resultado nas consultas do negócio.'};
}
export function installModelDiagnostics(b,provider,onOpen=()=>{}){
 let epoch=0,active=false,progressListener=null;
 const esc=b.escape,button=(action,label,extra='')=>'<button type="button" class="choice local-ai-button" data-action="'+action+'" '+extra+'>'+label+'</button>';
 const back=button('local-ai-model-tests','Voltar aos testes');
 const invalidate=()=>{epoch++;return provider.cancel({}).catch(()=>{});};
 async function open(){
  onOpen();const token=++epoch;b.open('Teste do Gemini Nano','<p role="status">Conferindo modelos e recursos do aparelho…</p>',button('local-ai-comparison','Comparar Gemini online e Nano')+button('local-ai-settings','Voltar'),'agent-model-tests');
  try{
   const s=await provider.status({});if(token!==epoch)return;
   const nano={available:'Disponível no AICore',downloadable:'Disponível para preparação pelo Android',downloading:'Preparação em andamento no Android',unavailable:'Indisponível neste aparelho ou configuração'}[s.nanoStatus]||'Disponibilidade não confirmada';
   const cases=(model)=>button('local-ai-model-run','Testar pergunta composta','data-model="'+model+'" data-scenario="compound"')+button('local-ai-model-run','Testar base vazia','data-model="'+model+'" data-scenario="empty"');
   b.open('Teste do Gemini Nano','<p>Testes experimentais com cenários fictícios. Nenhuma venda, cadastro ou configuração do negócio é alterada.</p><section class="local-ai-card"><h3>Gemini Nano · Android</h3><p>'+esc(nano)+'</p>'+(s.nanoModel?'<p>'+esc(s.nanoModel)+'</p>':'')+(s.nanoStatus==='available'?cases('nano'):s.nanoStatus==='downloadable'?button('local-ai-model-nano-download','Preparar pelo AICore'):'')+'</section><p class="agent-note">Um teste por vez. A disponibilidade não comprova qualidade. Os resultados mostram tempo e memória do aplicativo; a memória do serviço AICore não está incluída nessa medição. Prefira o Wi-Fi para a preparação feita pelo Android.</p><p class="agent-note">Com a interpretação offline ativada, o Gemini Nano propõe a consulta quando o Gemini online não estiver acessível. Fatos e cálculos continuam nos motores do app.</p>',button('local-ai-settings','Voltar'),'agent-model-tests');
  }catch{if(token===epoch)b.open('Teste do Gemini Nano','<p>Diagnóstico do Gemini Nano indisponível nesta edição.</p>',button('local-ai-settings','Voltar'),'agent-model-tests');}
 }
 async function operation(title,work,render){
  if(active){b.toast('Aguarde o encerramento do teste atual.');return;}
  onOpen();active=true;const token=++epoch;
  b.open(title,'<p role="status" id="model-test-progress">Executando no aparelho. Mantenha o aplicativo aberto…</p><p class="agent-note">Os motores do negócio continuam sendo a fonte dos números.</p>',button('local-ai-model-cancel','Cancelar'),'agent-model-running');
  try{const r=await work();if(token!==epoch||document.hidden)return;render(r);}
  catch(e){if(token===epoch)b.open(title,'<p role="status">'+esc(e.message||'Teste não concluído.')+'</p><p>Este resultado não aprova o modelo. As consultas essenciais continuam disponíveis.</p>',back,'agent-model-tests');}
  finally{active=false;}
 }
 const actions={
  'local-ai-model-tests':open,
  'local-ai-model-nano-download':()=>operation('Preparar Gemini Nano',()=>provider.downloadNano({}),()=>open()),
  'local-ai-model-run':d=>{
   if(d.model!=='nano'||!['compound','empty'].includes(d.scenario))throw Error('Teste inválido.');
   return operation('Teste do Gemini Nano',()=>provider.testModel({model:d.model,scenario:d.scenario}),r=>{
    const result=validateModelDiagnostic(r,d.model,d.scenario),seconds=(result.elapsedMs/1000).toLocaleString('pt-BR',{maximumFractionDigits:2}),pss=n=>Number.isFinite(n)?(n/1024).toLocaleString('pt-BR',{maximumFractionDigits:1})+' MB':'não informado';
    b.open('Resultado do teste','<p class="local-ai-eyebrow">'+(result.passed?'Aprovado neste cenário':'Falhou neste cenário')+'</p><p>'+esc(result.modelName||d.model)+'</p><p>Cenário: '+(d.scenario==='empty'?'base vazia fictícia':'pergunta composta fictícia')+'. Tempo total: '+seconds+' s.</p><p>'+esc(result.reason)+'</p><p>Memória PSS do aplicativo: '+esc(pss(result.before?.appPssKb))+' antes; '+esc(pss(result.after?.appPssKb))+' depois. Isso não mede o pico nem a memória do AICore.</p><details><summary>Saída experimental do modelo</summary><p class="agent-answer">'+esc(result.raw)+'</p></details><p class="agent-note">Um cenário aprovado não comprova precisão geral, autonomia para cálculos ou estabilidade em outros aparelhos. Nenhum dado do produtor foi enviado ao teste.</p>',back,'agent-model-tests');
   });
  },
  'local-ai-model-cancel':async()=>{await invalidate();b.open('Teste cancelado','<p>Aguarde o encerramento antes de iniciar outro teste. O Android gerencia a preparação do Gemini Nano e pode mantê-la em andamento.</p>',back,'agent-model-tests');},
 };
 for(const[name,fn]of Object.entries(actions))b.actions[name]=(...args)=>Promise.resolve().then(()=>fn(...args)).catch(e=>b.toast(e.message));
 provider.addListener?.('progress',p=>{const el=document.getElementById('model-test-progress');if(el&&active&&!document.hidden&&['downloading','preparing'].includes(p.phase))el.textContent='Preparando: '+Math.min(100,Math.floor(p.bytes/p.total*100))+'%. Mantenha o app aberto.';}).then(listener=>{progressListener=listener;}).catch(()=>{});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){invalidate();const el=document.getElementById('model-test-progress');if(el)el.textContent='Operação interrompida ao sair do aplicativo. Volte aos testes e confira a disponibilidade.';}});
 document.addEventListener('territorio:resource-policy',event=>{if(active&&event.detail?.intelligenceProfile==='essential'){invalidate();b.open('Teste adiado','<p>O aparelho está no perfil Essencial. Os motores locais continuam disponíveis. Aguarde o encerramento antes de testar novamente.</p>',back,'agent-model-tests');}});
 document.getElementById('dialog')?.addEventListener('close',invalidate);
 return {open,invalidate};
}
