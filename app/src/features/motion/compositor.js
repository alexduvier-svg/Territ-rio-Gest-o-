import { stepSpring, springAtRest } from './spring.js';

// The curve is solved once. Chrome/WebView composes the surface independently of
// JavaScript; no layout, descendant style reads or per-frame DOM writes are needed.
export function springTrack(from, targets, config = {}, velocity = {}) {
  const initial=Object.fromEntries(Object.entries(from).map(([key,position])=>[key,{position,velocity:velocity[key]||0,target:targets[key]??position}]));
  const sample=seconds=>Object.fromEntries(Object.entries(initial).map(([key,s])=>[key,{...stepSpring(s,s.target,seconds,config),target:s.target}]));
  const frames=[];let seconds=0;
  for(let i=0;i<=90;i++){
    seconds=i/60;const values=sample(seconds);
    frames.push({time:seconds,values:Object.fromEntries(Object.entries(values).map(([key,s])=>[key,s.position]))});
    if(i>0&&Object.entries(values).every(([key,s])=>{const tolerance=['scale','opacity','reveal'].includes(key)?.0005:.04;return springAtRest(s,s.target,tolerance,tolerance*8);}))break;
  }
  const duration=Math.max(1,seconds*1000);
  frames.at(-1).values=Object.fromEntries(Object.entries(initial).map(([key,s])=>[key,s.target]));
  return {duration,frames,sample,targets:Object.fromEntries(Object.entries(initial).map(([key,s])=>[key,s.target]))};
}

export function compositorMotion(element, from, targets, frameStyle, rest, config = {}, registry) {
  let animation=null,track=null,complete=false,version=0;
  const time=()=>Math.max(0,Number(animation?.currentTime)||0)/1000;
  const sample=()=>track.sample(Math.min(time(),track.duration/1000));
  const end=cancelled=>{
    if(complete)return;complete=true;version++;animation?.cancel();registry?.delete(controller);rest?.(cancelled);
  };
  const play=(positions,next,velocity={})=>{
    const previous=animation;track=springTrack(positions,next,config,velocity);
    const keyframes=track.frames.map(f=>({...frameStyle(f.values),offset:f.time*1000/track.duration}));
    // One replacement on reversal, preserving instantaneous position and velocity.
    const current=++version;
    animation=element.animate(keyframes,{duration:track.duration,easing:'linear',fill:'both'});
    previous?.cancel();registry?.add(controller);
    if(animation.finished)animation.finished.then(()=>{if(current===version)end(false);},()=>{});else animation.onfinish=()=>{if(current===version)end(false);};
  };
  const controller={
    owner:element,config,get values(){return complete?Object.fromEntries(Object.entries(track.targets).map(([k,target])=>[k,{position:target,velocity:0,target}])):sample();},get duration(){return track.duration;},
    retarget(next,velocity){if(complete)return;const state=sample();play(Object.fromEntries(Object.entries(state).map(([k,s])=>[k,s.position])),{...track.targets,...next},velocity||Object.fromEntries(Object.entries(state).map(([k,s])=>[k,s.velocity])));},
    setVelocity(velocity){this.retarget({},velocity);},
    finish(){end(false);},cancel(){end(true);},
  };
  play(from,targets);
  return controller;
}
