import { Capacitor, registerPlugin } from '@capacitor/core';
import { createLocalIntelligence, LOCAL_MODEL } from './service.js';
import { LOCAL_AI_GUIDANCE } from './policy.js';
import { installModelDiagnostics } from './diagnostics.js';
import {installInterpreterComparison} from './comparison.js';
import {createBusinessInterpreter,BUSINESS_CONSENT_TEXT} from './business-online.js';
import {verifyBusinessConnection} from './business-diagnostic.js';
import './local-intelligence.css';
const native = registerPlugin('AgroLocalIntelligence');
const languageNative=registerPlugin('AgroModelDiagnostics');
const onlineComparison=registerPlugin('AgroGeminiComparison');
export function installLocalIntelligence(b,{businessProvider=onlineComparison,isOnlineAvailable=null}={}) {
  if(!b)return;
  const esc = b.escape, service = createLocalIntelligence(native);
  let current = null, epoch = 0, busy = false, modelTests=null, languageStatus=null, languageCheckedAt=0;
  const dialog = document.getElementById('dialog');
  const button = (action, label, style='choice') => '<button type="button" class="'+style+' local-ai-button" data-action="'+action+'">'+label+'</button>';
  const back = button('local-ai-back','Voltar','sheet-back');
  const available = () => Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('AgroLocalIntelligence');
  function trace(item){return '<details class="manager-consultation"><summary>Rastreio e verificação</summary><p>'+esc(item.originLabel||'Registros da consulta atual')+'</p><p>'+esc(item.contextLabel||'Local e período da resposta acima')+'</p>'+item.sources.map(s=>'<p><strong>'+esc(s.name)+'</strong><br><small>'+esc(s.source)+'</small></p>').join('')+'<p>Consulta: '+esc(item.generatedAt?new Date(item.generatedAt).toLocaleString('pt-BR'):'horário não informado')+'.</p><p>Conferência: cada trecho exibido corresponde à resposta calculada pelo app. Valores, rótulos e avisos de dados incompletos são mantidos. Alterações nos registros cancelam o resumo.</p><p class="agent-note">Esta conferência não comprova a exatidão dos lançamentos nem a liquidação bancária.</p></details>';}
  async function status() { if (!available()) return { supported:false, imported:false, enabled:false }; return service.status(); }
  const business=createBusinessInterpreter(businessProvider,{contextKey:currentKey,foreground:()=>!document.hidden});
  const onlineAvailable=()=>isOnlineAvailable?isOnlineAvailable():Capacitor.isNativePlatform()&&Capacitor.isPluginAvailable('AgroGeminiComparison');
  let businessAfterEnable='settings';
  const previousIntelligence = b.actions['settings-intelligence'];
  let voiceBusy=false;
  function currentKey() { const ctx=window.TerritorioAgent?.context?.();return ctx?.actorId+'|'+ctx?.dataOrigin+'|'+window.TerritorioAgent?.revision?.(); }
  function cancel({online=true}={}) { epoch++; busy=false; service.cancel();modelTests?.invalidate();if(online)void business.cancel(); }
  async function settings() {
    cancel(); const token=epoch;
    b.open('Inteligência no aparelho','<p role="status">Conferindo disponibilidade…</p>',back,'agent-local-settings');
    const s=await status();const online=onlineAvailable()?await business.status():null;let language=null;if(Capacitor.isNativePlatform()&&Capacitor.isPluginAvailable('AgroModelDiagnostics'))try{language=await languageNative.status({fast:true});}catch{} if(token!==epoch)return;
    const languageLabel=language?.qwenReady?'Arquivo do Qwen 0.6B presente e verificado. Nesta versão, ele fica restrito aos testes de comparação; o uso automático no Gerente aguarda aprovação.':language?.nanoStatus==='available'?'Gemini Nano disponível no AICore para interpretação experimental.':'Nenhum intérprete local pronto. Prepare um modelo em Testar Qwen e Gemini Nano. As consultas diretas continuam disponíveis.';
    const condition=!s.supported?'Este aparelho não oferece suporte a esta experiência.':s.imported?(s.enabled?'Ativado. O app carrega o Qwen automaticamente nas consultas.':'Modelo instalado. Assistente desativado.'):s.packaged?'O modelo está incluído na instalação e será preparado no próprio aparelho.':'O modelo não está incluído neste APK de teste. A instalação completa deverá incluir o assistente pela Play Store.';
    b.open('Inteligência do negócio','<section class="local-ai-card"><h3>Gemini online · Gerente</h3><p>'+esc(!online?.configured?'Chave ainda não configurada.':online.businessEnabled?'Autorizado para interpretar as perguntas do Gerente. Os cálculos continuam locais.':'Chave guardada. Falta autorizar seu uso nas perguntas do Gerente.')+'</p><p class="agent-note">'+esc(online?.lastBusinessAt?'Última tentativa do Gerente: '+new Date(online.lastBusinessAt).toLocaleString('pt-BR')+' · '+(online.lastBusinessHttpStatus?'HTTP '+online.lastBusinessHttpStatus:'sem resposta HTTP')+'. O diagnóstico abaixo verifica também a interpretação e a consulta.':'Ainda não há chamada registrada do Gerente ao Gemini online.')+'</p>'+(online?.configured?(online.businessEnabled?button('local-ai-business-disable','Desativar Gemini no Gerente'):button('local-ai-business-enable','Autorizar Gemini no Gerente'))+button('local-ai-business-probe','Verificar conexão do Gerente'):button('local-ai-comparison','Configurar Gemini online'))+'</section><section class="local-ai-card"><p class="local-ai-eyebrow">Codex Teste · experimental</p><h3>Interpretação contextual</h3><p>'+esc(languageLabel)+'</p><p class="agent-note">Usa a pergunta, referências anteriores válidas e rótulos mínimos dos cadastros. Não recebe documentos, telefones ou valores financeiros do cadastro. Hipóteses não executam operações.</p><details><summary>Qwen 1.7B · complemento anterior</summary><p>'+esc(condition)+'</p><p class="agent-note">O Gerente usa os cálculos dos registros. O Qwen confere a seleção de trechos; a apresentação preserva a resposta completa.</p>'+(s.supported?(s.imported?button('local-ai-toggle',s.enabled?'Desativar assistente':'Ativar assistente','success')+button('local-ai-remove','Remover a cópia local do modelo'):s.packaged?button('local-ai-install','Preparar assistente local','success'):''):'')+'</details></section><section class="local-ai-card"><h3>Como usar</h3><p>Use o campo de perguntas abaixo de Receita por dia. Consultas diretas usam os registros locais; perguntas que precisam de interpretação podem usar o Gemini online após sua autorização. Os cálculos são feitos no aparelho.</p><p class="agent-note">A interpretação usa Qwen 0.6B ou Gemini Nano local quando disponível e habilitada. O complemento anterior usa Qwen3 1.7B · Apache 2.0 · 977 MB; a preparação da cópia privada exige cerca de 1,3 GB livres.</p></section>'+button('local-ai-manager','Abrir Gerente','primary')+button('local-ai-model-tests','Testar Qwen e Gemini Nano')+button('local-ai-comparison','Comparar Qwen e Gemini online')+button('local-ai-language-toggle',b.data?.().settings?.contextualInterpretation===false?'Ativar interpretação local experimental':'Desativar interpretação local experimental')+button('local-ai-professional','Diretrizes profissionais')+button('local-ai-guidelines','Diretrizes e hierarquia'),back,'agent-local-settings');
  }
  function businessConsent(after='settings'){
    cancel();businessAfterEnable=after;
    b.open('Autorizar Gemini no Gerente',BUSINESS_CONSENT_TEXT.map(t=>'<p>'+esc(t)+'</p>').join(''),button('local-ai-business-confirm','Autorizar interpretação no Gerente')+button('local-ai-settings','Voltar'),'agent-business-consent');
  }
  async function probeBusiness(){
    const s=await business.status();if(!s.configured){await settings();return;}if(!s.businessEnabled)return businessConsent('probe');
    cancel();const token=epoch;b.open('Verificar conexão do Gerente','<p role="status">Enviando uma pergunta com dados fictícios pelo mesmo caminho usado pelo Gerente…</p><p>Nenhum registro do produtor é enviado neste diagnóstico.</p>',button('local-ai-settings','Cancelar'),'agent-business-probe');
    try{const r=await verifyBusinessConnection(business);if(token!==epoch||document.hidden)return;
      b.open('Conexão do Gerente conferida','<p>'+esc(r.model)+'</p><p>O Gemini respondeu, o plano foi validado e os motores locais consultaram a base fictícia.</p><p class="agent-answer">'+esc(r.text)+'</p><p class="agent-note">Este teste comprova o fluxo desta pergunta neste momento; não garante compreensão de toda pergunta. O resultado acima é fictício.</p>',button('local-ai-settings','Voltar'),'agent-business-probe');
    }catch(e){if(token===epoch&&e.name!=='AbortError')b.open('Diagnóstico do Gerente','<p role="alert">'+esc(e.message)+'</p><p>Nenhum resultado do negócio foi presumido.</p>',button('local-ai-settings','Voltar'),'agent-business-probe');}
  }
  async function installModel(){
    if(busy)return;busy=true;const token=++epoch;
    b.open('Preparar assistente','<p role="status">Conferindo e preparando o modelo incluído no app…</p><p class="agent-note">Mantenha o app aberto. Nenhuma consulta externa é feita.</p>',button('local-ai-cancel-install','Cancelar preparação'),'agent-local-install');
    try{await service.cancel();if(token!==epoch)return;await service.installModel();if(token!==epoch)return;await settings();b.toast('Assistente preparado e ativado.');}
    catch(e){if(token===epoch){await settings();b.toast(e.message||'Preparação interrompida.');}}
    finally{if(token===epoch)busy=false;}
  }
  async function explain(automatic=false) {
    if(busy||!current||!current.eligible)return;
    const item=current;
    if(current.key!==currentKey())throw Error('Os registros mudaram. Faça uma nova consulta.');
    const escaped=esc(current.facts);if(b.privateHTML(escaped)!==escaped)throw Error('Mostre os valores na Gestão antes de pedir esta explicação.');
    let s=await status();if(item!==current||item.key!==currentKey()||document.hidden)return;
    const area=document.getElementById('local-ai-result');if(!area)return;
    if(s.supported&&!s.imported&&s.packaged&&s.enabled){area.innerHTML='<p role="status">Preparando o Qwen incluído no app…</p>';await service.installModel();if(item!==current||item.key!==currentKey()||document.hidden)return;s=await status();}
    if(!s.supported||!s.imported||!s.enabled){if(!automatic)return settings();area.innerHTML='<p class="agent-note">'+(!s.supported?'A resposta calculada está disponível acima.':!s.imported?'O modelo não está incluído nesta instalação. O Gerente continua usando os cálculos do app.':'Assistente desativado. A resposta calculada está disponível acima.')+'</p>'+button('local-ai-settings','Configurar assistente');return;}
    if(b.privateHTML(escaped)!==escaped)throw Error('Mostre os valores na Gestão antes de pedir esta explicação.');
    const p=window.TerritorioResourcePolicy?.snapshot();if(p?.intelligenceProfile==='essential')throw Error('O aparelho está no perfil Essencial. A consulta original continua disponível; tente depois ou confira as condições do aparelho.');
    const token=++epoch;busy=true;
    area.innerHTML='<p role="status">Carregando o Qwen e conferindo o resumo…</p>'+button('local-ai-cancel','Cancelar explicação');
    try {
      const work=async signal=>{
        if(signal?.aborted||token!==epoch||item.key!==currentKey())throw Error('Consulta cancelada.');
        const abort=()=>service.cancel();signal?.addEventListener('abort',abort,{once:true});
        try{return await service.explain(item.facts,{foreground:!document.hidden,profile:window.TerritorioResourcePolicy?.snapshot()?.intelligenceProfile});}
        finally{signal?.removeEventListener('abort',abort);}
      };
      const text=await (window.TerritorioResourcePolicy?.run?window.TerritorioResourcePolicy.run(work,{priority:automatic?3:2}):work());if(token!==epoch||document.hidden||item.key!==currentKey()||!area.isConnected)return;
      area.innerHTML='<p class="local-ai-eyebrow">Leitura conferida · Qwen local</p><p class="agent-answer">'+b.privateHTML(esc(text))+'</p><p class="agent-note">Resposta completa dos motores locais. Nenhum trecho, valor ou limitação foi omitido.</p>'+trace(item);
    } catch(e) { if(token===epoch&&area.isConnected)area.innerHTML='<p role="status">'+esc(e.message || 'A explicação não ficou disponível.')+'</p><p class="agent-note">A resposta original do Gerente permanece acima.</p>'; } finally { if(token===epoch)busy=false; }
  }
  const actions={
    'local-ai-settings':settings,'settings-intelligence':settings,
    'local-ai-business-enable':()=>businessConsent(),
    'local-ai-business-disable':async()=>{await business.disable();await settings();},
    'local-ai-business-probe':probeBusiness,
    'local-ai-business-confirm':async()=>{await business.enable();if(businessAfterEnable==='probe')await probeBusiness();else await settings();},
    'local-ai-language-toggle':async()=>{const d=b.data?.();if(!d)return;d.settings.contextualInterpretation=d.settings.contextualInterpretation===false;await b.persist?.();languageStatus=null;await settings();},
    'local-ai-professional':()=>{cancel();b.open('Diretrizes profissionais','<p class="agent-note">Regras locais · versão 1 · disponíveis sem internet</p>'+LOCAL_AI_GUIDANCE.map(text=>'<p>'+esc(text)+'</p>').join('')+'<p class="agent-note">Nenhum modelo novo é baixado automaticamente. O Gemini de educação geral, se configurado, é um serviço separado e não recebe os registros do negócio.</p>',button('local-ai-settings','Voltar'),'agent-local-guidelines');},
    'local-ai-guidelines':()=>{cancel();previousIntelligence?.();},
    'local-ai-manager':()=>{cancel();b.actions['agent-open']();},
    'local-ai-back':()=>{cancel();b.close();},
    'local-ai-install':installModel,
    'local-ai-cancel-install':async()=>{cancel();await service.cancel();await settings();},
    'local-ai-speech':async()=>{
      if(voiceBusy)return;if(!available())throw Error('Voz disponível somente no Android compatível.');
      const input=document.getElementById('agent-question');if(!input)return;
      const key=currentKey();voiceBusy=true;
      try{const r=await native.speech({});if(key!==currentKey()||!input.isConnected)return;input.value=r.text;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();b.toast('Confira o texto e toque em Consultar.');}finally{voiceBusy=false;}
    },
    'local-ai-toggle':async()=>{const s=await status();await service.setEnabled(!s.enabled);await settings();},
    'local-ai-remove':async()=>{await service.removeModel();await settings();},
    'local-ai-explain':()=>explain(false),
    'local-ai-cancel':()=>{cancel();const area=document.getElementById('local-ai-result');if(area)area.innerHTML='<p role="status">Explicação cancelada. A consulta original continua disponível.</p>';},
  };
  for(const [name,fn] of Object.entries(actions))b.actions[name]=(...args)=>Promise.resolve().then(()=>fn(...args)).catch(e=>b.toast(e.message));
  modelTests=installModelDiagnostics(b,languageNative,cancel);
  installInterpreterComparison(b,businessProvider,languageNative,cancel);
  window.TerritorioLocalIntelligence={enableBusiness:()=>business.enable(),businessStatus:()=>business.status(),cancelInterpretation:()=>Promise.allSettled([languageNative.cancel({}),business.cancel()]),async interpret(request){
    if(onlineAvailable()){const response=await business.interpret(request);if(response)return response;}
    if(b.data?.().settings?.contextualInterpretation===false||!Capacitor.isNativePlatform()||!Capacitor.isPluginAvailable('AgroModelDiagnostics')||document.hidden||window.TerritorioResourcePolicy?.snapshot()?.intelligenceProfile==='essential')return null;
    if(!languageStatus||Date.now()-languageCheckedAt>5000){languageStatus=await languageNative.status({fast:true});languageCheckedAt=Date.now();}
    const model=languageStatus.qwenContextualQualified===true&&languageStatus.qwenReady&&languageStatus.resources?.availableBytes>=3*1024**3?'qwen06':languageStatus.nanoStatus==='available'?'nano':null;if(!model)throw Error('Nenhum intérprete contextual aprovado está disponível agora. O Qwen 0.6B está restrito aos testes; compare os modelos antes de habilitar seu uso no Gerente.');
    const token=epoch,work=async signal=>{if(signal?.aborted||token!==epoch||document.hidden)throw Error('Interpretação cancelada.');const abort=()=>languageNative.cancel({});signal?.addEventListener('abort',abort,{once:true});try{return await languageNative.interpretQuestion({model,request});}finally{signal?.removeEventListener('abort',abort);}};
    return window.TerritorioResourcePolicy?.run?window.TerritorioResourcePolicy.run(work,{priority:2}):work();
  },invalidate(){cancel();current=null;},attach(result) {
    cancel();current={facts:result.text,key:currentKey(),eligible:['stock','finance','management','overview','fair','rebuy','integrated-read'].includes(result.intent),started:false,sources:result.specialists||[],contextLabel:result.contextLabel,originLabel:result.originLabel,generatedAt:result.generatedAt};
    if(!current.eligible)return '';
    return '<section class="local-ai-card" id="local-ai-result"><p role="status">Conferindo o assistente local…</p></section>';
  },start() {
    if(!current||current.started||!current.eligible)return;
    const item=current;current.started=true;
    return explain(true).catch(e=>{const area=document.getElementById('local-ai-result');if(item===current&&area)area.innerHTML='<p role="status">'+esc(e.message||'Resumo indisponível.')+'</p><p class="agent-note">A resposta calculada pelo app permanece acima.</p>';});
  }};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
  document.addEventListener('territorio:resource-policy',event=>{if(event.detail?.intelligenceProfile==='essential'){cancel({online:false});const area=document.getElementById('local-ai-result');if(area)area.innerHTML='<p role="status">Perfil Essencial ativo. A resposta calculada permanece disponível.</p>';}});
  dialog?.addEventListener('close',cancel);
  if(dialog)new MutationObserver(()=>{if(busy&&!['agent-answer','agent-local-install'].includes(dialog.dataset.kind))cancel();}).observe(dialog,{attributes:true,attributeFilter:['data-kind']});
  function decorate(){const panel=document.getElementById('agent-panel');if(!panel||panel.querySelector('.local-ai-manager-access'))return;const query=panel.querySelector('.agent-query');if(!query)return;query.insertAdjacentHTML('afterbegin','<div class="local-ai-manager-access"><span>Assistente do negócio</span>'+button('local-ai-settings','Configurar')+'</div>');const submit=query.querySelector('[data-action="agent-ask"]');submit?.insertAdjacentHTML('beforebegin',button('local-ai-speech','Falar pergunta')+'<p class="agent-note">Voz offline do Android, quando disponível. Confira o texto antes de consultar.</p>');}
  new MutationObserver(decorate).observe(document.getElementById('app'),{childList:true,subtree:true});
  if(dialog)new MutationObserver(decorate).observe(dialog,{childList:true,subtree:true});
  decorate();
}
