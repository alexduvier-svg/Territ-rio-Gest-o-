import { Capacitor, registerPlugin } from '@capacitor/core';
import { createVoiceController } from './controller.js';
import { cleanSpeech, interpretSpeech, voiceHints } from './interpret.js';

const native=registerPlugin('AgroVoice');
const mic='<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/></svg>';
export function installVoice() {
  const bridge=window.TerritorioVoiceBridge;if(!bridge)return;
  const esc=bridge.escape,realNative=Capacitor.isNativePlatform()&&Capacitor.getPlatform()==='android';
  const transport={listen:fn=>native.addListener('voice',fn),start:options=>native.startListening(options),stop:()=>native.stopListening(),cancel:()=>native.cancel()};
  let opened=false,openingId=0,capabilities={nativePortuguese:false},snapshot=null,proposal=null,selected=null,applied=false,choosing=false,queryFinal=null,multiRequest=null;
  const dialog=document.getElementById('dialog');
  function paintState(state) {
    const listening=state.phase==='listening';
    for(const b of document.querySelectorAll('.voice-mic[data-action]')){b.classList.toggle('is-listening',listening);b.setAttribute('aria-pressed',String(listening));b.setAttribute('aria-label',listening?'Concluir escuta':'Falar produto e quantidade');}
    if(!opened)return;
    const status=dialog.querySelector('#voice-status'),partial=dialog.querySelector('#voice-partial'),level=dialog.querySelector('#voice-level');
    if(status)status.textContent=state.phase==='preparing'?'Preparando português…':listening?'Ouvindo. Fale produto e quantidade.':state.phase==='processing'?'Concluindo a escuta…':state.phase==='error'?state.message:'Confira o que foi entendido.';
    if(partial)partial.textContent=['listening','processing'].includes(state.phase)?state.text||'Ex.: três cafés especiais de 250 gramas.':'';
    if(level){level.style.setProperty('--voice-level',state.level||0);level.hidden=!listening;}
    const stop=dialog.querySelector('[data-action="voice-stop"]');if(stop)stop.hidden=!['listening','preparing'].includes(state.phase);
    const repeat=dialog.querySelector('[data-action="voice-repeat"]');if(repeat)repeat.disabled=!realNative||['preparing','listening','processing'].includes(state.phase);
    if(['preparing','listening','processing'].includes(state.phase))invalidate();
    if(state.phase==='review'){
      dialog.querySelector('#voice-text').value=cleanSpeech(state.text);
      const alternatives=dialog.querySelector('#voice-alternatives');if(alternatives){alternatives.replaceChildren();for(const t of [...new Set(state.result?.alternatives||[])].filter(t=>t&&t!==state.text).slice(0,2)){const b=document.createElement('button');b.type='button';b.className='choice';b.textContent=t;b.dataset.action='voice-alternative';b.dataset.text=t;alternatives.append(b);}}
      interpret();const warning=dialog.querySelector('#voice-warning');
      if(warning)warning.textContent=state.result?.lowVolume?'O volume chegou baixo. Confira com cuidado.':state.result?.clipping?'O som saturou. Afaste um pouco o microfone e confira.':state.result?.confidence>=0&&state.result.confidence<0.65?'A fala ficou incerta. Corrija o texto ou escolha o produto antes de continuar.':'';
      if(state.result?.confidence>=0&&state.result.confidence<0.65){selected=null;paintProposal();}
      else if((queryFinal||multiRequest)&&!state.result?.lowVolume&&!state.result?.clipping)forwardFinal();else routeSpokenSale(state.result);
    }
    if(state.phase==='error')invalidate();
  }
  const controller=createVoiceController(transport,paintState);
  function routeSpokenSale(result){
    if(!proposal||result?.lowVolume||result?.clipping)return;
    const q=proposal.quantity;
    // Do not choose between contradictory acoustic alternatives. Let the producer review them.
    const alternatives=(result?.alternatives||[]).slice(1,3).map(t=>interpretSpeech(t,bridge.products()));
    if(alternatives.some(p=>p.status==='ready'&&(p.productId!==proposal.productId||p.quantity!==q)))return;
    if(proposal.status==='ready'){accept();return;}
    if(proposal.candidates.length>1&&Number.isFinite(q)&&q>0&&proposal.candidates.some(p=>valid(p,q))){
      choosing=true;dialog.querySelector('#dialog-title').textContent='Escolher apresentação';
      const status=dialog.querySelector('#voice-status');if(status)status.textContent='Quantidade: '+q+'. Escolha a apresentação para continuar a venda.';
      dialog.querySelector('[data-action="voice-accept"]').hidden=true;
      dialog.querySelector('.voice-tools').hidden=true;
      const text=dialog.querySelector('#voice-text');text.closest('dialog').querySelector('label[for="voice-text"]').hidden=true;text.hidden=true;
      proposal.message='Qual peso ou apresentação você quer vender?';selected=null;paintProposal();
    }
  }
  function forwardFinal(){if(applied)return;applied=true;const text=cleanSpeech(dialog.querySelector('#voice-text')?.value),session=controller.state().session||(crypto.randomUUID?.()||Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('')),callback=queryFinal;cancel();if(callback)callback(text,{session});else window.TerritorioAgent?.multiVoice(text,session);}
  function accept(){if(queryFinal||multiRequest)return forwardFinal();const p=chosen(),q=quantity();if(applied||!valid(p,q))return;applied=true;try{bridge.accept({productId:p.id,quantity:q,price:p.price,unit:p.unit,snapshot});cancel();bridge.close();}catch(error){applied=false;const note=dialog.querySelector('#voice-warning');if(note)note.textContent=error.message;paintTotal();}}
  function invalidate(){proposal=null;selected=null;const box=dialog.querySelector('#voice-proposal');if(box)box.replaceChildren();const b=dialog.querySelector('[data-action="voice-accept"]');if(b)b.disabled=true;}
  function interpret() {
    if(!opened)return;const text=dialog.querySelector('#voice-text')?.value,request=window.TerritorioAgent?.parseSales(text);multiRequest=request?.intent==='sale'&&request.items.length>1?request:null;
    if(queryFinal||multiRequest){proposal=null;selected=null;dialog.querySelector('#voice-proposal').innerHTML='<p class="voice-explanation">'+(queryFinal?'A consulta usa os registros locais; nenhuma venda será confirmada.':'Ouvi '+multiRequest.items.length+' itens. Vamos conferir todos, com produto, apresentação e quantidade.')+'</p>';const button=dialog.querySelector('[data-action="voice-accept"]');button.disabled=false;button.textContent=queryFinal?'Consultar registros':'Conferir itens';return;}
    proposal=window.TerritorioAgent?.resolveSingle(text)||interpretSpeech(text,bridge.products());
    selected=proposal.productId;paintProposal();
  }
  function chosen(){return selected&&bridge.products().find(p=>p.id===selected);}
  function quantity(){const value=dialog.querySelector('#voice-quantity')?.value;return value!==undefined&&value!==''?/^\d+(?:[.,]\d{1,3})?$/.test(value.trim())?Number(value.replace(',','.')):NaN:proposal?.quantity;}
  function valid(p,q){return !!p&&Number.isFinite(q)&&q>0&&q<=p.stock&&(['kg','g','Litro','ml'].includes(p.unit)||Number.isInteger(q));}
  function paintProposal() {
    const box=dialog.querySelector('#voice-proposal');if(!box)return;
    const p=chosen(),q=proposal?.quantity;
    box.innerHTML='<p class="voice-explanation">'+esc(proposal?.message||'Escolha o produto entendido e confira a quantidade.')+'</p>'+(proposal?.candidates?.length?'<div class="voice-candidates" aria-label="Produtos e apresentações">'+proposal.candidates.map(p=>'<button type="button" class="voice-candidate'+(p.id===selected?' selected':'')+'" data-action="voice-pick" data-id="'+esc(p.id)+'" aria-pressed="'+(p.id===selected)+'"'+(choosing&&!valid(p,q)?' disabled':'')+'><strong>'+esc(p.name)+'</strong><small>'+esc(bridge.description(p))+'</small><span>'+esc(bridge.money(p.price))+' por '+esc(p.unit)+'</span></button>').join('')+'</div>':'')+(p?'<label class="voice-quantity-label" for="voice-quantity">Quantidade em '+esc(p.unit)+'</label><input id="voice-quantity" class="voice-quantity" inputmode="decimal" autocomplete="off" value="'+(Number.isFinite(q)?esc(String(q).replace('.',',')):'')+'" placeholder="Digite a quantidade"><p id="voice-total" class="voice-total"></p>':'');
    paintTotal();
  }
  function paintTotal(){const p=chosen(),q=quantity(),ok=valid(p,q),button=dialog.querySelector('[data-action="voice-accept"]'),total=dialog.querySelector('#voice-total');if(button)button.disabled=!ok||applied;if(total)total.textContent=ok?'Total desse produto: '+bridge.money(Math.round(p.price*q)):'Confira a quantidade e o estoque disponível.';}
  async function listen() {
    if(!realNative)return;
    const engine=dialog.querySelector('#voice-engine')?.value||'auto',noiseSuppression=dialog.querySelector('#voice-noise')?.checked!==false;
    await controller.start({engine,noiseSuppression,hints:voiceHints(bridge.products())});
  }
  async function open(options={}) {
    if(opened){if(controller.state().phase==='listening')controller.stop();return;}
    queryFinal=options.mode==='agent'&&typeof options.onFinal==='function'?options.onFinal:null;multiRequest=null;opened=true;const openId=++openingId;applied=false;choosing=false;snapshot=bridge.snapshot();proposal=null;selected=null;
    const body='<section class="voice-listening-card"><button type="button" class="voice-mic voice-sheet-mic" data-action="voice-stop" aria-label="Concluir escuta" hidden>'+mic+'</button><p id="voice-status" role="status">'+(realNative?'Preparando português…':'Voz disponível no APK Android. Aqui você pode testar digitando a frase.')+'</p><div id="voice-level" class="voice-level" aria-hidden="true" hidden><span></span></div><p id="voice-partial" class="voice-partial"></p></section><p class="voice-help">'+(queryFinal?'Pergunte sobre estoque, feira ou recompra. Confira o texto entendido.':'Diga produtos e quantidades. A voz prepara o carrinho; a venda só termina na confirmação habitual.')+'</p><label for="voice-text">O que você disse</label><textarea id="voice-text" rows="2" maxlength="500" placeholder="Três cafés especiais de 250 gramas"></textarea><div id="voice-alternatives" class="voice-alternatives"></div><div class="voice-tools"><button type="button" class="choice" data-action="voice-interpret">Conferir frase</button><button type="button" class="choice" data-action="voice-repeat"'+(!realNative?' disabled':'')+'>Ouvir de novo</button></div><p id="voice-warning" class="voice-warning" role="status"></p><div id="voice-proposal"></div>'+(realNative?'<details class="voice-options"><summary>Ajustes da escuta</summary><label for="voice-engine">Reconhecimento</label><select id="voice-engine"><option value="auto">Automático · português no aparelho</option><option value="offline">Vosk offline · sem Google</option></select><label class="voice-noise"><input id="voice-noise" type="checkbox" checked> Reduzir ruído quando disponível</label><p>Se a redução piorar sua voz, desligue e repita. O modo offline não precisa de internet. Não guardamos o áudio.</p><p id="voice-engine-note"></p></details>':'');
    bridge.open(body,'<button type="button" class="success" data-action="voice-accept" disabled>Levar ao carrinho</button><button type="button" class="sheet-back" data-action="voice-cancel">Voltar</button>');
    if(realNative){try{capabilities=await native.getCapabilities();}catch{capabilities={nativePortuguese:false};}if(!opened||openId!==openingId)return;const note=dialog.querySelector('#voice-engine-note');if(note)note.textContent=capabilities.nativePortuguese?'Português instalado no reconhecedor local do Android.':'Este aparelho usará o português offline embarcado.';await listen();}
  }
  function cancel(){openingId++;controller.cancel();opened=false;proposal=null;selected=null;queryFinal=null;multiRequest=null;}
  function mount(){
    if(!bridge.isHome())return;
    const row=document.querySelector('.feira-chips,.category-pills');if(!row||row.querySelector('.voice-mic'))return;
    // Keep the mic beside Todos even when the producer only has one category.
    row.insertAdjacentHTML('afterbegin','<button type="button" class="voice-mic" data-action="voice-open" aria-label="Falar produto e quantidade" aria-pressed="false">'+mic+'</button>');
  }
  Object.assign(bridge.actions,{
    'voice-open':open,'voice-repeat':listen,'voice-stop':()=>{if(controller.state().phase==='preparing'){controller.cancel();const el=dialog.querySelector('#voice-status');if(el)el.textContent='Escuta interrompida. Você pode repetir ou digitar.';}else controller.stop();},
    'voice-cancel':()=>{cancel();bridge.close();},'voice-interpret':()=>{controller.cancel();interpret();},
    'voice-pick':d=>{const p=proposal?.candidates.find(p=>p.id===d.id);if(!p)return;selected=p.id;paintProposal();if(choosing)accept();},
    'voice-alternative':d=>{controller.cancel();dialog.querySelector('#voice-text').value=cleanSpeech(d.text);interpret();},
    'voice-accept':accept
  });
  document.addEventListener('input',e=>{if(e.target.id==='voice-text'){controller.cancel();invalidate();}else if(e.target.id==='voice-quantity')paintTotal();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){openingId++;controller.cancel();invalidate();if(dialog.dataset.kind==='voice'){const note=dialog.querySelector('#voice-status');if(note)note.textContent='Escuta interrompida. Toque em Ouvir de novo para repetir.';}}});
  dialog.addEventListener('cancel',cancel);dialog.addEventListener('close',cancel);
  // The existing sheet can be replaced by navigation; no orphan microphone survives it.
  new MutationObserver(()=>{if(opened&&(!dialog.open||dialog.dataset.kind!=='voice'))cancel();mount();}).observe(document.getElementById('app'),{childList:true,subtree:true});
  new MutationObserver(()=>{if(opened&&(!dialog.open||dialog.dataset.kind!=='voice'))cancel();}).observe(dialog,{attributes:true,attributeFilter:['open','data-kind']});
  window.TerritorioVoice={state:controller.state,capabilities:()=>({...capabilities}),cancel,open};
  mount();
}
