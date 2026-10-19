// Session fence: stale callbacks, double taps, permission delays and backgrounding cannot apply data.
export function createVoiceController(transport, changed, {timeout=45000}={}) {
  let revision=0,timer=null,state={phase:'idle',session:null},remove=null,listenerPromise=null;
  const update=patch=>{state={...state,...patch};changed({...state});};
  const clear=()=>{clearTimeout(timer);timer=null;};
  const active=()=>['preparing','listening','processing'].includes(state.phase);
  const cancel=()=>{revision++;clear();if(active())Promise.resolve(transport.cancel()).catch(()=>{});update({phase:'idle',session:null,level:0});};
  async function start(options={}) {
    if(active())return;
    const rev=++revision,session=`voice-${rev}-${Date.now()}`;
    update({phase:'preparing',session,text:'',message:'Preparando português…',level:0,result:null});
    timer=setTimeout(()=>{if(revision!==rev)return;cancel();update({phase:'error',message:'A escuta demorou demais. Tente novamente ou digite.'});},timeout);
    try {
      if(!listenerPromise)listenerPromise=transport.listen(event=>{
        if(event.session!==state.session||!active())return;
        if(event.type==='state')update({phase:event.state,engine:event.engine||state.engine,level:0});
        else if(event.type==='level'&&state.phase==='listening')update({level:Math.max(0,Math.min(1,Number(event.level)||0))});
        else if(event.type==='partial')update({text:event.text||''});
        else if(event.type==='final'){clear();update({phase:'review',text:event.text||'',result:event,level:0});}
        else if(event.type==='error'){clear();update({phase:'error',message:event.message||'Não foi possível entender a fala. Repita ou digite.',level:0});}
      });
      remove=await listenerPromise;
      if(revision!==rev)return;
      const result=await transport.start({...options,session});if(revision===rev&&active())update({engine:result?.engine||state.engine});
    }catch(error){if(!remove)listenerPromise=null;if(revision!==rev)return;clear();update({phase:'error',message:error.message||'Microfone indisponível. Digite o produto.',level:0});}
  }
  async function stop(){if(!active())return;update({phase:'processing',level:0});try{await transport.stop();}catch{cancel();update({phase:'error',message:'Não foi possível concluir a escuta. Repita ou digite.'});}}
  return {start,stop,cancel,state:()=>({...state}),destroy(){cancel();Promise.resolve(listenerPromise).then(listener=>listener?.remove?.()).catch(()=>{});remove=null;listenerPromise=null;}};
}
