import { Capacitor, registerPlugin } from '@capacitor/core';
import { LOCAL_AI_GUIDANCE, interpreterOrder } from './policy.js';
import { installModelDiagnostics } from './diagnostics.js';
import {installInterpreterComparison} from './comparison.js';
import {createBusinessInterpreter,BUSINESS_CONSENT_TEXT} from './business-online.js';
import {verifyBusinessConnection} from './business-diagnostic.js';
import './local-intelligence.css';
// 0.12.148: Qwen removed. Order of interpretation: Gemini online (authorized) → Gemini Nano
// (AICore, offline, where supported) → local engines (always available, no model).
const native = registerPlugin('AgroLocalIntelligence');
const languageNative=registerPlugin('AgroModelDiagnostics');
const onlineComparison=registerPlugin('AgroGeminiComparison');
export function installLocalIntelligence(b,{businessProvider=onlineComparison,isOnlineAvailable=null}={}) {
  if(!b)return;
  const esc = b.escape;
  let epoch = 0, modelTests=null, languageStatus=null, languageCheckedAt=0;
  const dialog = document.getElementById('dialog');
  const button = (action, label, style='choice') => '<button type="button" class="'+style+' local-ai-button" data-action="'+action+'">'+label+'</button>';
  const back = button('local-ai-back','Voltar','sheet-back');
  const speechAvailable = () => Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('AgroLocalIntelligence');
  const nanoPluginAvailable = () => Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('AgroModelDiagnostics');
  const business=createBusinessInterpreter(businessProvider,{contextKey:currentKey,foreground:()=>!document.hidden});
  const onlineAvailable=()=>isOnlineAvailable?isOnlineAvailable():Capacitor.isNativePlatform()&&Capacitor.isPluginAvailable('AgroGeminiComparison');
  let businessAfterEnable='settings';
  const previousIntelligence = b.actions['settings-intelligence'];
  let voiceBusy=false;
  function currentKey() { const ctx=window.TerritorioAgent?.context?.();return ctx?.actorId+'|'+ctx?.dataOrigin+'|'+window.TerritorioAgent?.revision?.(); }
  function cancel({online=true}={}) { epoch++; modelTests?.invalidate(); if(nanoPluginAvailable())void languageNative.cancel({}).catch(()=>{}); if(online)void business.cancel(); }
  async function nanoStatus(fast=true){ if(!nanoPluginAvailable())return null; try{return await languageNative.status({fast});}catch{return null;} }
  async function settings() {
    cancel(); const token=epoch;
    b.open('Inteligência do negócio','<p role="status">Conferindo disponibilidade…</p>',back,'agent-local-settings');
    const online=onlineAvailable()?await business.status().catch(()=>null):null;const nano=await nanoStatus(true);if(token!==epoch)return;
    const offlineOn=b.data?.().settings?.contextualInterpretation!==false;
    const nanoLabel={available:'Disponível neste aparelho. Interpreta perguntas sem internet quando o Gemini online não estiver acessível.',downloadable:'O Android pode preparar o Gemini Nano neste aparelho. Toque em Testar Gemini Nano para preparar.',downloading:'O Android está preparando o Gemini Nano.',unavailable:'Este aparelho não oferece o Gemini Nano. Sem internet, as consultas diretas continuam respondendo.'}[nano?.nanoStatus]||'Disponibilidade não confirmada neste aparelho.';
    const onlineLabel=!online?.configured?'Chave ainda não configurada.':online.businessEnabled?'Autorizado a interpretar as perguntas. Os cálculos continuam no aparelho.':'Chave guardada. Falta autorizar o uso nas perguntas do negócio.';
    const lastCall=online?.lastBusinessAt?'Última tentativa: '+new Date(online.lastBusinessAt).toLocaleString('pt-BR')+' · '+(online.lastBusinessHttpStatus?'HTTP '+online.lastBusinessHttpStatus:'sem resposta HTTP')+'.':'Ainda não houve chamada ao Gemini online.';
    b.open('Inteligência do negócio',
      '<section class="local-ai-card"><p class="local-ai-eyebrow">1 · Principal</p><h3>Gemini online</h3><p>'+esc(onlineLabel)+'</p><p class="agent-note">'+esc(lastCall)+'</p>'+(online?.configured?(online.businessEnabled?button('local-ai-business-disable','Desativar Gemini online'):button('local-ai-business-enable','Autorizar Gemini online'))+button('local-ai-business-probe','Verificar conexão'):button('local-ai-comparison','Configurar Gemini online'))+'</section>'+
      '<section class="local-ai-card"><p class="local-ai-eyebrow">2 · Sem internet</p><h3>Gemini Nano no aparelho</h3><p>'+esc(nanoLabel)+'</p>'+(nano?.nanoModel?'<p class="agent-note">Modelo informado pelo Android: '+esc(nano.nanoModel)+'</p>':'')+button('local-ai-language-toggle',offlineOn?'Desativar interpretação offline':'Ativar interpretação offline')+button('local-ai-model-tests','Testar Gemini Nano')+'</section>'+
      '<section class="local-ai-card"><p class="local-ai-eyebrow">3 · Sempre disponível</p><h3>Motores do aplicativo</h3><p>Vendas, estoque, compras, clientes, custos, lotes e agenda são calculados no aparelho, a partir dos seus registros. Funcionam sem internet e sem modelo de IA.</p><p class="agent-note">A IA apenas entende a pergunta e monta o plano de consulta. Os números sempre vêm dos registros.</p></section>'+
      '<section class="local-ai-card"><h3>Como usar</h3><p>Use o campo "Pergunte sobre seu negócio", abaixo de Receita por dia. Você pode digitar ou tocar em Falar pergunta.</p></section>'+
      button('local-ai-manager','Abrir Gerente','primary')+button('local-ai-comparison','Gemini online: chave e pesquisa')+button('local-ai-professional','Diretrizes profissionais')+button('local-ai-guidelines','Diretrizes e hierarquia'),back,'agent-local-settings');
  }
  function businessConsent(after='settings'){
    cancel();businessAfterEnable=after;
    b.open('Autorizar Gemini online',BUSINESS_CONSENT_TEXT.map(t=>'<p>'+esc(t)+'</p>').join(''),button('local-ai-business-confirm','Autorizar interpretação')+button('local-ai-settings','Voltar'),'agent-business-consent');
  }
  async function probeBusiness(){
    const s=await business.status();if(!s.configured){await settings();return;}if(!s.businessEnabled)return businessConsent('probe');
    cancel();const token=epoch;b.open('Verificar conexão','<p role="status">Enviando uma pergunta com dados fictícios pelo mesmo caminho usado pelo Gerente…</p><p>Nenhum registro do produtor é enviado neste diagnóstico.</p>',button('local-ai-settings','Cancelar'),'agent-business-probe');
    try{const r=await verifyBusinessConnection(business);if(token!==epoch||document.hidden)return;
      b.open('Conexão conferida','<p>'+esc(r.model)+'</p><p>O Gemini respondeu, o plano foi validado e os motores locais consultaram a base fictícia.</p><p class="agent-answer">'+esc(r.text)+'</p><p class="agent-note">Este teste comprova o fluxo desta pergunta neste momento; não garante a compreensão de todas as perguntas. O resultado acima é fictício.</p>',button('local-ai-settings','Voltar'),'agent-business-probe');
    }catch(e){if(token===epoch&&e.name!=='AbortError')b.open('Diagnóstico da conexão','<p role="alert">'+esc(e.message)+'</p><p>Nenhum resultado do negócio foi presumido.</p>',button('local-ai-settings','Voltar'),'agent-business-probe');}
  }
  const actions={
    'local-ai-settings':settings,'settings-intelligence':settings,
    'local-ai-business-enable':()=>businessConsent(),
    'local-ai-business-disable':async()=>{await business.disable();await settings();},
    'local-ai-business-probe':probeBusiness,
    'local-ai-business-confirm':async()=>{await business.enable();if(businessAfterEnable==='probe')await probeBusiness();else await settings();},
    'local-ai-language-toggle':async()=>{const d=b.data?.();if(!d)return;d.settings.contextualInterpretation=d.settings.contextualInterpretation===false;await b.persist?.();languageStatus=null;await settings();},
    'local-ai-professional':()=>{cancel();b.open('Diretrizes profissionais','<p class="agent-note">Regras locais · versão 2 · disponíveis sem internet</p>'+LOCAL_AI_GUIDANCE.map(text=>'<p>'+esc(text)+'</p>').join('')+'<p class="agent-note">Nenhum modelo é baixado automaticamente. O Gemini de educação geral, se configurado, é um serviço separado e não recebe os registros do negócio.</p>',button('local-ai-settings','Voltar'),'agent-local-guidelines');},
    'local-ai-guidelines':()=>{cancel();previousIntelligence?.();},
    'local-ai-manager':()=>{cancel();b.actions['agent-open']();},
    'local-ai-back':()=>{cancel();b.close();},
    'local-ai-speech':async()=>{
      if(voiceBusy)return;if(!speechAvailable())throw Error('Voz disponível somente no Android compatível.');
      const input=document.getElementById('agent-question');if(!input)return;
      const key=currentKey();voiceBusy=true;
      try{const r=await native.speech({});if(key!==currentKey()||!input.isConnected)return;input.value=r.text;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();b.toast('Confira o texto e toque em Consultar.');}finally{voiceBusy=false;}
    },
  };
  for(const [name,fn] of Object.entries(actions))b.actions[name]=(...args)=>Promise.resolve().then(()=>fn(...args)).catch(e=>b.toast(e.message));
  modelTests=installModelDiagnostics(b,languageNative,cancel);
  installInterpreterComparison(b,businessProvider,languageNative,cancel);
  window.TerritorioLocalIntelligence={enableBusiness:()=>business.enable(),businessStatus:()=>business.status(),cancelInterpretation:()=>Promise.allSettled([nanoPluginAvailable()?languageNative.cancel({}):null,business.cancel()]),async interpret(request){
    const offlineAllowed=b.data?.().settings?.contextualInterpretation!==false&&nanoPluginAvailable()&&!document.hidden&&window.TerritorioResourcePolicy?.snapshot()?.intelligenceProfile!=='essential';
    let onlineError=null;
    for(const provider of interpreterOrder({online:onlineAvailable(),offline:offlineAllowed})){
      if(provider==='gemini-online'){
        try{const response=await business.interpret(request);if(response)return response;}
        catch(e){ // Consent, cancellation and context changes are decisions for the user, never a reason to switch model.
          if(e?.name==='AbortError'||e?.code==='GEMINI_BUSINESS_CONSENT_REQUIRED'||e?.code==='GEMINI_BUSY'||/cancelad/i.test(e?.message||''))throw e; onlineError=e; }
        continue;
      }
      if(provider==='gemini-nano'){
        if(!languageStatus||Date.now()-languageCheckedAt>5000){languageStatus=await nanoStatus(true);languageCheckedAt=Date.now();}
        if(languageStatus?.nanoStatus!=='available')continue;
        const token=epoch,work=async signal=>{if(signal?.aborted||token!==epoch||document.hidden)throw Error('Interpretação cancelada.');const abort=()=>languageNative.cancel({});signal?.addEventListener('abort',abort,{once:true});try{return await languageNative.interpretQuestion({model:'nano',request});}finally{signal?.removeEventListener('abort',abort);}};
        return window.TerritorioResourcePolicy?.run?window.TerritorioResourcePolicy.run(work,{priority:2}):work();
      }
    }
    // No interpreter answered: the Gerente falls back to the local engines (direct queries).
    if(onlineError)throw onlineError;
    return null;
  },invalidate(){cancel();},attach(){return '';},start(){}};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
  document.addEventListener('territorio:resource-policy',event=>{if(event.detail?.intelligenceProfile==='essential')cancel({online:false});});
  dialog?.addEventListener('close',()=>cancel());
  function decorate(){const panel=document.getElementById('agent-panel');if(!panel||panel.querySelector('.local-ai-manager-access'))return;const query=panel.querySelector('.agent-query');if(!query)return;query.insertAdjacentHTML('afterbegin','<div class="local-ai-manager-access"><span>Inteligência do negócio</span>'+button('local-ai-settings','Configurar')+'</div>');const submit=query.querySelector('[data-action="agent-ask"]');submit?.insertAdjacentHTML('beforebegin',button('local-ai-speech','Falar pergunta')+'<p class="agent-note">Voz offline do Android, quando disponível. Confira o texto antes de consultar.</p>');}
  new MutationObserver(decorate).observe(document.getElementById('app'),{childList:true,subtree:true});
  if(dialog)new MutationObserver(decorate).observe(dialog,{childList:true,subtree:true});
  decorate();
}
