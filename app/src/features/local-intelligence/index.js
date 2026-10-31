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
  async function status() { if (!available()) return { supported:false, imported:false, enabled:false }; return service.status(); }
  const previousIntelligence = b.actions['settings-intelligence'];
  let voiceBusy=false;
  function currentKey() { return window.TerritorioAgent?.context?.()?.actorId+'|'+window.TerritorioAgent?.revision?.(); }
  function cancel() { epoch++; busy=false; service.cancel(); }
  async function settings() {
    cancel(); const token=epoch;
    b.open('Inteligência no aparelho','<p role="status">Conferindo disponibilidade…</p>',back,'agent-local-settings');
    const s=await status(); if(token!==epoch)return;
    const condition=!s.supported?'Este aparelho não oferece suporte a esta experiência.':s.imported?(s.enabled?'Ativado para explicações sob demanda.':'Modelo instalado. Assistente desativado.'):'O app prepara o assistente para você, sem abrir o navegador.';
    b.open('Inteligência no aparelho','<section class="local-ai-card"><p class="local-ai-eyebrow">Codex Teste · experimental</p><h3>Assistente local</h3><p>'+esc(condition)+'</p><p class="agent-note">O Gerente calcula com os módulos existentes. A IA opcional explica o resultado, sem executar operações.</p>'+(s.supported?(!s.imported?button('local-ai-download',s.downloaded>0?'Retomar e ativar assistente':'Baixar e ativar assistente','success')+'<p class="agent-note">Download de 977 MB. Prefira Wi-Fi e mantenha o app aberto. Você pode pausar e retomar.</p>':button('local-ai-toggle',s.enabled?'Desativar assistente':'Ativar assistente','success')+button('local-ai-remove','Remover somente o modelo')):'')+'</section><section class="local-ai-card"><h3>Como usar</h3><p>Abra o Gerente, faça uma consulta e toque em “Explicar com IA local”. Os cálculos originais ficam visíveis.</p><p class="agent-note">O download acontece uma vez, exige internet e cerca de 1,3 GB livres para concluir. Depois, a explicação funciona sem API. O desempenho ainda precisa ser medido neste aparelho.</p><p class="agent-note">Modelo Qwen3 1.7B · Apache 2.0. O app confere o arquivo antes de ativar.</p></section>'+button('local-ai-manager','Abrir Gerente','primary')+button('local-ai-guidelines','Diretrizes e hierarquia'),back,'agent-local-settings');
  }
  function progress(data){
    const bar=document.getElementById('local-ai-progress'),label=document.getElementById('local-ai-progress-label');if(!bar||!label)return;
    const bytes=Math.max(0,Math.min(LOCAL_MODEL.bytes,Number(data.downloaded)||0));bar.value=bytes;
    label.textContent=data.phase==='ready'?'Assistente instalado e ativado.':data.phase==='verifying'?'Conferindo o arquivo antes de ativar…':data.phase==='paused'?'Download pausado. Você pode retomar depois.':Math.floor(bytes/LOCAL_MODEL.bytes*100)+'% · '+Math.floor(bytes/1000000)+' MB de 977 MB';
  }
  if(available())native.addListener('modelDownloadProgress',progress).catch(()=>{});
  async function downloadModel(){
    if(busy)return;busy=true;const token=++epoch;
    b.open('Ativar assistente','<section class="local-ai-card"><h3>Preparando seu assistente</h3><progress id="local-ai-progress" max="'+LOCAL_MODEL.bytes+'" value="0" aria-label="Download do assistente"></progress><p id="local-ai-progress-label" role="status">Iniciando download…</p><p class="agent-note">977 MB · mantenha o app aberto. O arquivo será conferido e ativado automaticamente.</p></section>',button('local-ai-pause-download','Pausar download'),'agent-local-download');
    try{await service.cancel();if(token!==epoch)return;await service.downloadModel();if(token!==epoch)return;await settings();b.toast('Assistente instalado e ativado.');}
    catch(e){if(token===epoch){await settings();b.toast(e.message||'Download interrompido. Você pode retomar depois.');}}
    finally{if(token===epoch)busy=false;}
  }
  async function importModel() {
    if(busy)return;busy=true;
    b.open('Importar modelo','<p>Selecione o arquivo .litertlm baixado. A cópia e a conferência podem levar alguns minutos.</p><p class="agent-note">Os registros do negócio não são modificados.</p>','','agent-local-import');
    try { await service.importModel(); await settings(); } catch(e) { await settings(); b.toast(e.message || 'Importação cancelada.'); } finally { busy=false; }
  }
  async function explain() {
    if(busy||!current)return;
    if(current.key!==currentKey())throw Error('Os registros mudaram. Faça uma nova consulta.');
    const escaped=esc(current.facts);if(b.privateHTML(escaped)!==escaped)throw Error('Mostre os valores na Gestão antes de pedir esta explicação.');
    const s=await status();if(!s.imported||!s.enabled)return settings();
    const p=window.TerritorioResourcePolicy?.snapshot();if(p?.intelligenceProfile==='essential')throw Error('O aparelho está no perfil Essencial. A consulta original continua disponível; tente depois ou confira as condições do aparelho.');
    const item=current, token=++epoch;busy=true;
    const area=document.getElementById('local-ai-result');if(!area)return;
    area.innerHTML='<p role="status">Preparando a explicação no aparelho…</p>'+button('local-ai-cancel','Cancelar explicação');
    try { const text=await service.explain(item.facts);if(token!==epoch||document.hidden||item.key!==currentKey()||!area.isConnected)return;
      area.innerHTML='<p class="local-ai-eyebrow">IA local · explicação experimental</p><p class="agent-answer">'+b.privateHTML(esc(text))+'</p><p class="agent-note">Pode errar. Confira os cálculos originais acima antes de decidir.</p>';
    } catch(e) { if(token===epoch&&area.isConnected)area.innerHTML='<p role="status">'+esc(e.message || 'A explicação não ficou disponível.')+'</p><p class="agent-note">A resposta original do Gerente permanece acima.</p>'; } finally { if(token===epoch)busy=false; }
  }
  const actions={
    'local-ai-settings':settings,'settings-intelligence':settings,
    'local-ai-guidelines':()=>{cancel();previousIntelligence?.();},
    'local-ai-manager':()=>{cancel();b.actions['agent-open']();},
    'local-ai-back':()=>{cancel();b.close();},
    'local-ai-download':downloadModel,
    'local-ai-pause-download':async()=>{cancel();await service.cancel();await settings();},
    'local-ai-import':importModel,
    'local-ai-speech':async()=>{
      if(voiceBusy)return;if(!available())throw Error('Voz disponível somente no Android compatível.');
      const input=document.getElementById('agent-question');if(!input)return;
      const key=currentKey();voiceBusy=true;
      try{const r=await native.speech({});if(key!==currentKey()||!input.isConnected)return;input.value=r.text;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();b.toast('Confira o texto e toque em Consultar.');}finally{voiceBusy=false;}
    },
    'local-ai-toggle':async()=>{const s=await status();await service.setEnabled(!s.enabled);await settings();},
    'local-ai-remove':async()=>{await service.removeModel();await settings();},
    'local-ai-explain':explain,
    'local-ai-cancel':()=>{cancel();const area=document.getElementById('local-ai-result');if(area)area.innerHTML='<p role="status">Explicação cancelada. A consulta original continua disponível.</p>';},
  };
  for(const [name,fn] of Object.entries(actions))b.actions[name]=(...args)=>Promise.resolve().then(()=>fn(...args)).catch(e=>b.toast(e.message));
  window.TerritorioLocalIntelligence={attach(result) {
    cancel();current={facts:result.text,key:currentKey()};
    return '<section class="local-ai-card" id="local-ai-result"><p class="agent-note">Quer uma explicação mais simples deste resultado?</p>'+button('local-ai-explain','Explicar com IA local')+button('local-ai-settings','Configurar assistente')+'</section>';
  }};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
  dialog?.addEventListener('close',cancel);
  if(dialog)new MutationObserver(()=>{if(busy&&!['agent-answer','agent-local-import','agent-local-download'].includes(dialog.dataset.kind))cancel();}).observe(dialog,{attributes:true,attributeFilter:['data-kind']});
  function decorate(){const panel=document.getElementById('agent-panel');if(!panel||panel.querySelector('.local-ai-manager-access'))return;const query=panel.querySelector('.agent-query');if(!query)return;query.insertAdjacentHTML('afterbegin','<div class="local-ai-manager-access"><span>Codex Teste · IA opcional</span>'+button('local-ai-settings','Configurar')+'</div>');const submit=query.querySelector('[data-action="agent-ask"]');submit?.insertAdjacentHTML('beforebegin',button('local-ai-speech','Falar pergunta')+'<p class="agent-note">Voz do Android: pode usar internet conforme o serviço instalado. Confira o texto antes de consultar.</p>');}
  new MutationObserver(decorate).observe(document.getElementById('app'),{childList:true,subtree:true});
  if(dialog)new MutationObserver(decorate).observe(dialog,{childList:true,subtree:true});
  decorate();
}
