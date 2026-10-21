// Decoration has its own out-of-flow element, never a content span. One light per
// control is reused on a second press; its lifetime cannot change a row's layout.
import {fluidMotionAllowed,fluidMotionLite} from './motion/index.js';
export function installGlassTouch(){
 const lights=new WeakMap(),live=new Set();
 let pressed=null;
 const remove=state=>{
  if(lights.get(state.host)!==state)return;
  if(pressed===state)pressed=null;
  lights.delete(state.host);live.delete(state);
  if(state.animation){state.animation.onfinish=null;state.animation.cancel();}
  state.light.remove();
  if(state.ownsPosition)state.host.style.position=state.position;
 };
 const stop=()=>{if(!pressed)return;const state=pressed;pressed=null;
  if(!state.host.isConnected||!fluidMotionAllowed()){remove(state);return;}
  state.animation=state.spot.animate([
   {opacity:.7,transform:'scale(.7)'},{opacity:0,transform:'scale(1.35)'},
  ],{duration:fluidMotionLite()?120:240,easing:'ease-out'});
  state.animation.onfinish=()=>remove(state);
 };
 const clear=()=>{pressed=null;for(const state of live)remove(state);};
 document.addEventListener('pointerdown',e=>{
  if(!fluidMotionAllowed()||fluidMotionLite()||e.button!==0||e.isPrimary===false)return;
  const host=e.target.closest?.('button,summary');
  if(!host||host.disabled||host.closest('[inert]'))return;
  if(pressed)stop();
  const rect=host.getBoundingClientRect();
  if(!rect.width||!rect.height||rect.width>650||rect.height>400)return;
  let state=lights.get(host);
  if(state?.animation){state.animation.onfinish=null;state.animation.cancel();state.animation=null;}
  if(!state){
   const position=host.style.position,ownsPosition=getComputedStyle(host).position==='static';
   if(ownsPosition)host.style.position='relative';
   const light=document.createElement('agro-touch-light');
   light.className='glass-touch-light';light.setAttribute('aria-hidden','true');
   const spot=document.createElement('i');spot.className='glass-touch-spot';light.append(spot);
   state={host,light,spot,position,ownsPosition,animation:null,pointer:e.pointerId};
   lights.set(host,state);live.add(state);host.append(light);
  }
  state.pointer=e.pointerId;
  state.spot.style.left=(e.clientX-rect.left)+'px';
  state.spot.style.top=(e.clientY-rect.top)+'px';
  state.spot.style.width=state.spot.style.height=Math.min(240,Math.max(rect.width,rect.height)*1.6)+'px';
  pressed=state;
 },{capture:true,passive:true});
 // Scrolling/cancelling must not leave a glow or a containing-block override.
 document.addEventListener('pointermove',e=>{
  if(!pressed||pressed.pointer!==e.pointerId)return;
  const r=pressed.host.getBoundingClientRect();
  if(e.clientX<r.left-8||e.clientX>r.right+8||e.clientY<r.top-8||e.clientY>r.bottom+8)stop();
 },{passive:true});
 for(const type of ['pointerup','pointercancel'])document.addEventListener(type,e=>{if(pressed?.pointer===e.pointerId)stop();},{capture:true,passive:true});
 document.addEventListener('scroll',clear,{capture:true,passive:true});
 document.addEventListener('visibilitychange',clear);
 window.addEventListener('blur',clear);
}
