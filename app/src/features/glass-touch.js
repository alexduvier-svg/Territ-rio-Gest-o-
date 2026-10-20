// One bounded highlight per pressed control; no idle loop or changing blur/shadow.
import {fluidMotionAllowed,fluidMotionLite} from './motion/index.js';
export function installGlassTouch(){
 let active=null,light=null,animation=null;
 const hosts=new WeakMap(),releases=new WeakMap();
 const attach=el=>{let state=hosts.get(el);if(!state){state={position:el.style.position,owned:getComputedStyle(el).position==='static',count:0};if(state.owned)el.style.position='relative';hosts.set(el,state);}state.count++;return()=>{if(--state.count)return;if(state.owned)el.style.position=state.position;hosts.delete(el);};};
 const end=()=>{if(!light)return;const el=light,release=releases.get(el);active=null;light=null;animation?.cancel();animation=el.animate([{opacity:.7,transform:'scale(.7)'},{opacity:0,transform:'scale(1.35)'}],{duration:fluidMotionLite()?120:300,easing:'ease-out'});animation.finished.catch(()=>{}).finally(()=>{el.remove();release?.();});};
 document.addEventListener('pointerdown',e=>{if(!fluidMotionAllowed()||e.button!==0)return;const el=e.target.closest?.('button,summary');if(!el||el.disabled||el.closest('[inert]'))return;end();const r=el.getBoundingClientRect();if(r.width>650||r.height>400)return;active=el;light=document.createElement('span');releases.set(light,attach(el));light.className='glass-touch-light';light.setAttribute('aria-hidden','true');light.style.left=(e.clientX-r.left)+'px';light.style.top=(e.clientY-r.top)+'px';light.style.width=light.style.height=Math.min(240,Math.max(r.width,r.height)*1.6)+'px';el.append(light);},{capture:true,passive:true});
 document.addEventListener('pointermove',e=>{if(!active||!light)return;const r=active.getBoundingClientRect();if(e.clientX<r.left-8||e.clientX>r.right+8||e.clientY<r.top-8||e.clientY>r.bottom+8){end();return;}light.style.left=(e.clientX-r.left)+'px';light.style.top=(e.clientY-r.top)+'px';},{passive:true});
 for(const type of ['pointerup','pointercancel'])document.addEventListener(type,end,{passive:true});document.addEventListener('visibilitychange',end);
}
