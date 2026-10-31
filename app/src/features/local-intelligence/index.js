import { Capacitor, registerPlugin } from '@capacitor/core';
import { createLocalIntelligence, LOCAL_MODEL } from './service.js';
import './local-intelligence.css';
const native = registerPlugin('AgroLocalIntelligence');
export function installLocalIntelligence(b) {
  if(!b)return;
  const esc = b.escape, service = createLocalIntelligence(native);
  let current = null, epoch = 0, busy = false;
  const dialog = document.getElementById('dialog');
  const button = (action, label, style='choice') => '<button type="button" class="'+style+' local-ai-button" data-action="'+action+'">'+label+'</button>';
  const back = button('local-ai-back','Voltar','sheet-back');
  const available = () => Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('AgroLocalIntelligence');
  function trace(item){return '<details class="manager-consultation"><summary>Rastreio e verificação</summary><p>'+esc(item.originLabel||'Registros da consulta atual')+'</p><p>'+esc(item.contextLabel||'Local e período da resposta acima')+'</p>'+item.sources.map(s=>'<p><strong>'+esc(s.name)+'</strong><br><small>'+esc(s.source)+'</small></p>').join('')+'<p>Consulta: '+esc(item.generatedAt?new Date(item.generatedAt).toLocaleString('pt-BR'):'horário não informado')+'.</p><p>Conferência: cada trecho exibido corresponde à resposta calculada pelo app. Valores, rótulos e avisos de dados incompletos são mantidos. Alterações nos registros cancelam o resumo.</p><p class="agent-note">Esta conferência não comprova a exatidão dos lançamentos nem a liquidação bancária.</p></details>';}
  async function status() { if (!available()) return { supported:false, imported:false, enabled:false }; return service.status(); }
  const previousIntelligence = b.actions['settings-intelligence'];
  let voiceBusy=false;
  function currentKey() { return window.TerritorioAgent?.context?.()?.actorId+'|'+window.TerritorioAgent?.revision?.(); }
  function cancel() { epoch++; busy=false; service.cancel(); }
  async function settings() {
    cancel(); const token=epoch;
    b.open('Inteligência no aparelho','<p role="status">Conferindo disponibilidade…</p>',back,'agent-local-settings');
    const s=await status(); if(token!==epoch)return;
    const condition=!s.supported?'Este aparelho não oferece suporte a esta experiência.':s.imported?(s.enabled?'Ativado. O app carrega o Qwen automaticamente nas consultas.':'Modelo instalado. Assistente desativado.'):s.packaged?'O modelo está incluído na instalação e será preparado no próprio aparelho.':'O modelo não está incluído neste APK de teste. A instalação completa deverá incluir o assistente pela Play Store.';
    b.open('Inteligência no aparelho','<section class="local-ai-card"><p class="local-ai-eyebrow">Codex Teste · experimental</p><h3>Assistente local</h3><p>'+esc(condition)+'</p><p class="agent-note">O Gerente usa os cálculos dos registros. O Qwen organiza trechos dessa resposta; valores e avisos são preservados.</p>'+(s.supported?(s.imported?button('local-ai-toggle',s.enabled?'Desativar assistente':'Ativar assistente','success')+button('local-ai-remove','Remover a cópia local do modelo'):s.packaged?button('local-ai-install','Preparar assistente local','success'):''):'')+'</section><section class="local-ai-card"><h3>Como usar</h3><p>Abra o Gerente e faça uma consulta. Com o assistente ativado, o app carrega o Qwen e prepara o resumo automaticamente. A resposta calculada fica visível.</p><p class="agent-note">O assistente usa os registros deste aparelho. Não consulta GitHub, sites nem serviços externos de IA. Modelo Qwen3 1.7B · Apache 2.0 · 977 MB; a preparação da cópia privada exige cerca de 1,3 GB livres.</p></section>'+button('local-ai-manager','Abrir Gerente','primary')+button('local-ai-guidelines','Diretrizes e hierarquia'),back,'agent-local-settings');
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
    try { const text=await service.explain(item.facts);if(token!==epoch||document.hidden||item.key!==currentKey()||!area.isConnected)return;
      area.innerHTML='<p class="local-ai-eyebrow">Resumo dos registros · Qwen local</p><p class="agent-answer">'+b.privateHTML(esc(text))+'</p><p class="agent-note">Trechos da resposta calculada pelo app. Valores, contexto e avisos foram preservados.</p>'+trace(item);
    } catch(e) { if(token===epoch&&area.isConnected)area.innerHTML='<p role="status">'+esc(e.message || 'A explicação não ficou disponível.')+'</p><p class="agent-note">A resposta original do Gerente permanece acima.</p>'; } finally { if(token===epoch)busy=false; }
  }
  const actions={
    'local-ai-settings':settings,'settings-intelligence':settings,
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
  window.TerritorioLocalIntelligence={attach(result) {
    cancel();current={facts:result.text,key:currentKey(),eligible:['stock','finance','management','overview','fair','rebuy'].includes(result.intent),started:false,sources:result.specialists||[],contextLabel:result.contextLabel,originLabel:result.originLabel,generatedAt:result.generatedAt};
    if(!current.eligible)return '';
    return '<section class="local-ai-card" id="local-ai-result"><p role="status">Conferindo o assistente local…</p></section>';
  },start() {
    if(!current||current.started||!current.eligible)return;
    const item=current;current.started=true;
    return explain(true).catch(e=>{const area=document.getElementById('local-ai-result');if(item===current&&area)area.innerHTML='<p role="status">'+esc(e.message||'Resumo indisponível.')+'</p><p class="agent-note">A resposta calculada pelo app permanece acima.</p>';});
  }};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
  dialog?.addEventListener('close',cancel);
  if(dialog)new MutationObserver(()=>{if(busy&&!['agent-answer','agent-local-install'].includes(dialog.dataset.kind))cancel();}).observe(dialog,{attributes:true,attributeFilter:['data-kind']});
  function decorate(){const panel=document.getElementById('agent-panel');if(!panel||panel.querySelector('.local-ai-manager-access'))return;const query=panel.querySelector('.agent-query');if(!query)return;query.insertAdjacentHTML('afterbegin','<div class="local-ai-manager-access"><span>Assistente do negócio</span>'+button('local-ai-settings','Configurar')+'</div>');const submit=query.querySelector('[data-action="agent-ask"]');submit?.insertAdjacentHTML('beforebegin',button('local-ai-speech','Falar pergunta')+'<p class="agent-note">Voz offline do Android, quando disponível. Confira o texto antes de consultar.</p>');}
  new MutationObserver(decorate).observe(document.getElementById('app'),{childList:true,subtree:true});
  if(dialog)new MutationObserver(decorate).observe(dialog,{childList:true,subtree:true});
  decorate();
}
