import { Capacitor, registerPlugin } from '@capacitor/core';
import { createEducationService } from './service.js';
const native = registerPlugin('AgroGeneralEducation');
export function installGeneralEducation(b) {
  const esc=b.escape, service=createEducationService(native);let catalog=null, current=null, epoch=0, active=false,returnKey=null;
  const back='<button type="button" class="sheet-back" data-action="education-back">Voltar</button>';
  async function topics(){if(catalog)return catalog;const response=await fetch(new URL('knowledge/general-education.json',document.baseURI));if(!response.ok)throw Error('Conteúdo local indisponível.');catalog=await response.json();return catalog;}
  async function status(){if(window.TerritorioWorkspace?.active||!Capacitor.isNativePlatform()||!Capacitor.isPluginAvailable('AgroGeneralEducation'))return {configured:false,enabled:false};try{return await service.status();}catch{return {configured:false,enabled:false};}}
  async function open(id){const token=++epoch, data=await topics();if(token!==epoch)return;const topic=data.topics.find(t=>t.id===id);current={id:topic?.id||null,token};
    if(!topic)return b.open('Entender a Gestão','<p class="agent-note">Conceitos gerais, disponíveis sem internet. Suas orientações personalizadas continuam nos motores locais da Gestão.</p><div class="advisor-group">'+data.topics.map(t=>'<button type="button" class="advisor-action" data-action="education-topic" data-id="'+esc(t.id)+'"><span class="advisor-text"><strong>'+esc(t.title)+'</strong></span><span aria-hidden="true">›</span></button>').join('')+'</div>',back,'agent-education');
    const settings=await status();if(token!==epoch)return;
    b.open(topic.title,'<p class="agent-origin">Referência Local · Conceito Geral</p><p class="agent-answer">'+esc(topic.local)+'</p><div id="education-online"><p class="agent-note">'+(settings.configured?'Gemini pode ampliar somente este conceito fixo. Nenhuma pergunta livre ou registro do produtor é enviado.':'O conteúdo local está disponível. O acesso protegido ao Gemini ainda depende da configuração e validação do projeto.')+'</p>'+(settings.configured?'<button type="button" class="choice modal-action" data-action="education-online">'+(settings.enabled?'Ampliar Explicação':'Autorizar Explicação Geral Online')+'</button>':'')+'</div><p class="agent-note">Uma explicação não executa ações nem altera os resultados do app.</p>','<button type="button" class="choice" data-action="agent-education-open">Outros Conceitos</button>'+back,'agent-education');
  }
  async function online(){const topic=(await topics()).topics.find(t=>t.id===current?.id);if(!topic)return;const s=await status();if(!s.configured)return;
    if(!s.enabled)return b.open('Explicação Geral Online','<p>Ao autorizar, o app envia ao Google apenas a pergunta geral fixa deste conceito e os dados técnicos necessários ao serviço e ao App Check.</p><p>Não envia registros, indicadores, produtos cadastrados, nomes, clientes ou documentos. O serviço gratuito tem quotas e condições próprias de tratamento do conteúdo. A resposta pode errar; os cálculos e decisões continuam locais.</p><p class="agent-note">Opcional, sem cobrança vinculada neste projeto. Você pode desativar depois. O núcleo do app continua funcionando sem internet.</p>','<button type="button" class="primary" data-action="education-consent">Autorizar e Consultar</button>'+back,'agent-education-consent');
    const token=++epoch, id=topic.id;current={id,token};active=true;const area=document.getElementById('education-online');if(!area)return;area.innerHTML='<p role="status">Consultando o conceito geral…</p><button type="button" class="choice" data-action="education-cancel">Cancelar Consulta</button>';
    try{const r=await service.explain(id);if(token!==epoch||document.hidden||!document.getElementById('education-online'))return;area.innerHTML='<p class="agent-origin">'+esc(r.source)+(r.cached?' · Em Cache':'')+'</p><p class="agent-answer">'+esc(r.text)+'</p><p class="agent-note">Conteúdo geral; não analisou seu negócio. Confira as definições locais e os registros antes de decidir.</p><button type="button" class="choice" data-action="education-disable">Desativar Gemini</button>';}catch{if(token===epoch&&document.getElementById('education-online'))area.innerHTML='<p role="status">Não foi possível consultar agora. A explicação local acima continua disponível. Não há repetição automática da chamada.</p><button type="button" class="choice" data-action="education-disable">Desativar Gemini</button>';}finally{active=false;}
  }
  const actions={
    'agent-education-open':()=>{returnKey=null;return open();},'education-topic':d=>open(d.id),'education-online':online,
    'education-insight':d=>{returnKey=d.key;return open(d.id);},
    'education-consent':async()=>{await service.setEnabled(true);const id=current?.id;await open(id);await online();},
    'education-disable':async()=>{await service.setEnabled(false);await open(current?.id);},
    'education-cancel':async()=>{epoch++;await service.cancel();await open(current?.id);},
    'education-back':()=>{epoch++;service.cancel();if(returnKey){const key=returnKey;returnKey=null;b.actions['agent-release-detail']({key});}else if(current?.id)open();else b.close();}
  };
  for(const [name,fn] of Object.entries(actions))b.actions[name]=(...args)=>Promise.resolve().then(()=>fn(...args)).catch(e=>b.toast(e.message));
  document.addEventListener('visibilitychange',()=>{if(document.hidden){epoch++;service.cancel();}});
  // Closing or navigating away cancels an outstanding request; it never starts a request.
  const dialog=document.getElementById('dialog');
  dialog?.addEventListener('close',()=>{epoch++;active=false;service.cancel();});
  if(dialog)new MutationObserver(()=>{if(active&&!dialog.dataset.kind?.startsWith('agent-education')){epoch++;active=false;service.cancel();}}).observe(dialog,{attributes:true,attributeFilter:['data-kind']});
}
