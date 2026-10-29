// Compare the shipped SVG-attribute simulation to the new paused WAAPI tracks. No app/data boot.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),baseline='8ce566159ef4750dcf88e73dbd27dac031debf3e';
const out=process.env.AGRO_GEOMETRY_OUTPUT||'C:/Users/alexd/.codex/visualizations/2026/10/28/01a1835c-018b-7352-95a2-037da69102a6/nav134-geometry';
const git=file=>cp.execFileSync('git',['show',baseline+':'+file],{cwd:root,encoding:'utf8',windowsHide:true,maxBuffer:16*1024*1024});
const report={baseline,scope:'isolated-SVG-local-CTM-and-opacity',synthetic:true,applicationBooted:false,deviceDataRead:false,startedAt:new Date().toISOString(),cases:[],errors:[]};

(async()=>{
 let browser;
 try{
  const {getNavTrack,NAV_TRACK_KINDS}=await import(pathToFileURL(path.join(root,'app/src/features/motion/nav-tracks.js')));
  const physics=await import(pathToFileURL(path.join(root,'app/src/features/motion/spring.js')));
  const oldSource=git('app/src/features/motion/nav-icons.js').replace(/^import[^\n]+\n/gm,'').replace('export function installNavIconMotion','function installNavIconMotion');
  const erp=git('app/src/legacy/erp-ui.js'),markup={};
  for(const [kind,name]of Object.entries({stock:'navBox',people:'navUsers',chart:'navChart',calendar:'navCalendar'})){
   const match=erp.match(new RegExp('paths\\.'+name+'=(\'(?:[^\'\\\\]|\\\\.)*\');'));
   assert(match,'Baseline SVG not found: '+name);markup[kind]=Function('return '+match[1])();
  }
  browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const page=await browser.newPage({viewport:{width:800,height:700},deviceScaleFactor:1});
  await page.route('**/*',route=>route.abort());
  await page.setContent('<!doctype html><style>.nav-physical-part{transform-origin:0 0!important;transform-box:view-box!important;animation:none!important;transition:none!important}svg{overflow:visible}</style><main></main>');
  for(const kind of NAV_TRACK_KINDS)for(const lite of[false,true])for(const pixels of[28,32,36]){
   const track=getNavTrack(kind,lite);
   const entry=await page.evaluate(async input=>{
    const {kind,lite,pixels,track,markup,source,stepSource,restSource,defaultSpring}=input;
    const main=document.querySelector('main');main.replaceChildren();
    const svg=label=>{const node=document.createElementNS('http://www.w3.org/2000/svg','svg');node.setAttribute('viewBox','0 0 24 24');node.setAttribute('width',pixels);node.setAttribute('height',pixels);node.innerHTML=markup.replaceAll('nav-stock-apple-clip','nav-stock-apple-clip-'+label);main.append(node);return node;};
    const old=svg('old'),next=svg('next');
    const stepSpring=Function('SPRING','return '+stepSource)(defaultSpring),springAtRest=Function('return '+restSource)();
    const simulate=Function('stepSpring','springAtRest','createPhysicalFrameMotion','fluidMotionLite',source+';return {stock:stockSimulation,people:peopleSimulation,chart:chartSimulation,calendar:calendarSimulation};')(
     stepSpring,springAtRest,(_owner,options)=>options,()=>lite);
    const motion=simulate[kind](old,()=>{});motion.draw();
    const roles={stock:{apple:'.nav-box-apple',shell:'.nav-box-shell',left:'.nav-box-flap-left',right:'.nav-box-flap-right'},people:{back:'.nav-person-back',front:'.nav-person-front'},chart:Object.fromEntries([0,1,2,3].map(index=>['bar'+index,'.nav-chart-bar[data-index="'+index+'"]'])),calendar:{tick:'.nav-calendar-tick path'}}[kind];
    const animations=[];
    for(const[role,selector]of Object.entries(roles))for(const node of next.querySelectorAll(selector)){
     node.classList.add('nav-physical-part');node.style.transformOrigin='0px 0px';node.style.transformBox='view-box';
     if(kind==='calendar')node.style.strokeDasharray='1';
     const animation=node.animate(track.parts[role],{duration:track.duration,easing:'linear',fill:'both'});animation.pause();animations.push(animation);
    }
    await Promise.all(animations.map(animation=>animation.ready));
    const length=Object.values(track.parts)[0].length,last=length-1;
    const selected=new Set([0,1,5,15,Math.floor(last/2),last-1,last].filter(index=>index>=0&&index<=last));
    let atRest=false,maxMatrixDelta=0,maxOpacityDelta=0,maxStrokeDelta=0;const samples=[];
    for(let index=0;index<=last;index++){
     if(index&&!atRest){if(motion.advance(1/60)){atRest=true;motion.onRest();}else motion.draw();}
     if(!selected.has(index))continue;
     const time=track.duration*index/last;
     for(const animation of animations)animation.currentTime=time;
     const results=[];
     for(const[role,selector]of Object.entries(roles)){
      const left=[...old.querySelectorAll(selector)],right=[...next.querySelectorAll(selector)];
      for(let part=0;part<left.length;part++){
       const a=left[part].getCTM(),b=right[part].getCTM();
       const deltas=['a','b','c','d','e','f'].map(key=>Math.abs(a[key]-b[key]));
       const matrixDelta=Math.max(...deltas),sa=getComputedStyle(left[part]),sb=getComputedStyle(right[part]);
       const opacityDelta=Math.abs(Number(sa.opacity)-Number(sb.opacity));
       const strokeDelta=kind==='calendar'?Math.abs(parseFloat(sa.strokeDashoffset)-parseFloat(sb.strokeDashoffset)):0;
       maxMatrixDelta=Math.max(maxMatrixDelta,matrixDelta);maxOpacityDelta=Math.max(maxOpacityDelta,opacityDelta);maxStrokeDelta=Math.max(maxStrokeDelta,strokeDelta);
       results.push({role,part,matrixDelta,opacityDelta,strokeDelta});
      }
     }
     samples.push({frame:index,time,atRest,results});
    }
    animations.forEach(animation=>animation.cancel());
    return{kind,lite,pixels,samples,maxMatrixDelta,maxOpacityDelta,maxStrokeDelta};
   },{kind,lite,pixels,track,markup:markup[kind],source:oldSource,stepSource:physics.stepSpring.toString(),restSource:physics.springAtRest.toString(),defaultSpring:physics.SPRING});
   // Four-decimal CSS tracks introduce sub-millipixel quantisation; CTMs include SVG scaling.
   entry.passed=entry.maxMatrixDelta<0.001&&entry.maxOpacityDelta<0.00011&&entry.maxStrokeDelta<0.00011;
   report.cases.push(entry);
   console.log(JSON.stringify({kind,lite,pixels,passed:entry.passed,matrix:entry.maxMatrixDelta,opacity:entry.maxOpacityDelta,stroke:entry.maxStrokeDelta}));
  }
  report.passed=report.cases.length===24&&report.cases.every(entry=>entry.passed);
  assert(report.passed,'SVG/CSS local geometry comparison failed');
 }catch(error){report.passed=false;report.errors.push(String(error.stack||error));process.exitCode=1;}
 finally{await browser?.close();report.finishedAt=new Date().toISOString();fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'review.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,cases:report.cases.length,errors:report.errors,output:out}));}
})();
