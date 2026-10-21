// Retarget the actual sheet during entry, retaining its contents and stable underlay.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {seed}=require('./touch051.cjs');const dist=path.resolve(__dirname,'../app/dist'),origin='https://return051.test';
async function sampleReturn(page){return page.evaluate(()=>{
 const d=document.getElementById('dialog'),cards=[...document.querySelectorAll('#app .feira-card')],children=[...d.children];
 const rect=()=>{const r=d.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};};
 const pose=rect(),startOpacity=+getComputedStyle(d).opacity,layout=children.map(el=>({el,top:el.offsetTop,h:el.offsetHeight})),grid=cards.map(el=>({el,top:el.offsetTop,h:el.offsetHeight})),frames=[];
 window.ERPPreview.actions['close-modal']({});const first=rect(),firstOpacity=+getComputedStyle(d).opacity;
 return new Promise(resolve=>{const start=performance.now();function tick(){
  const s=getComputedStyle(d),visible=s.display!=='none'&&+s.opacity>.1;
  if(visible)frames.push({opacity:+s.opacity,rect:rect(),content:layout.map(c=>({name:c.el.className,top:c.el.offsetTop,height:c.el.offsetHeight,baseTop:c.top,baseHeight:c.h})),contentMoved:layout.some(c=>c.el.offsetHeight!==c.h||c.el.offsetTop!==c.top),contentDisconnected:children.some(c=>!c.isConnected)});
  if(!d.open&&!d.classList.contains('fluid-native-exit')&&!document.querySelector('.fluid-exit-layer')){
   resolve({pose,first,startOpacity,firstOpacity,frames,elapsed:performance.now()-start,gridStable:grid.every(c=>c.el.isConnected&&c.el.offsetTop===c.top&&c.el.offsetHeight===c.h)});return;
  }
  if(performance.now()-start>1800){resolve({timeout:true,pose,first,frames});return;}requestAnimationFrame(tick);
 }tick();});
});}
function verify(data,{allowInstant=false}={}){
 assert(!data.timeout,'return failed to settle');assert(data.gridStable,'underlay shifted during return');
 const instant=data.first.w===0&&data.first.h===0;
 if(instant)assert(allowInstant,'unexpected instant disappearance');else{
  for(const p of ['x','y','w','h'])assert(Math.abs(data.pose[p]-data.first[p])<2,'discontinuous return pose '+p);
  assert(data.firstOpacity>=data.startOpacity-.01,'opacity dropped on close instead of returning');
 }
 assert(!data.frames.some(f=>f.contentMoved||f.contentDisconnected),'contents reflowed/disassembled during return');
 for(let i=1;i<data.frames.length;i++)assert(data.frames[i].opacity<=data.frames[i-1].opacity+.015,'return opacity flashed');
 return {frames:data.frames.length,elapsedMs:Math.round(data.elapsed),gridStable:data.gridStable,instant,initialJump:instant?null:Math.max(...['x','y','w','h'].map(p=>Math.abs(data.pose[p]-data.first[p]))),firstOpacity:data.firstOpacity,contentStable:!data.frames.some(f=>f.contentMoved||f.contentDisconnected)};
}
module.exports={sampleReturn,verify};
if(require.main===module)(async()=>{const report={version:'0.12.51',synthetic:true,cases:[],errors:[]};let browser;
 try{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 for(const theme of ['light','dark'])for(const [width,large,mode] of [[320,true,'normal'],[360,false,'lite'],[393,false,'normal'],[412,false,'reduced']]){
  const context=await browser.newContext({viewport:{width,height:852},isMobile:true,hasTouch:true,reducedMotion:mode==='reduced'?'reduce':'no-preference'});
  await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==origin)return route.abort();let f=path.resolve(dist,'.'+u.pathname);if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=dist+'/index.html';return route.fulfill({body:fs.readFileSync(f),contentType:({'.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png'}[path.extname(f)]||'application/octet-stream')});});
  await context.addInitScript(({seed,theme,mode,large})=>{seed.settings.appearance=theme;seed.settings.largeText=large;localStorage.setItem('territorio-gestao-prototipo-v1',JSON.stringify(seed));Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>mode==='lite'?2:8});Object.defineProperty(navigator,'deviceMemory',{get:()=>mode==='lite'?2:8});},{seed,theme,mode,large});
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));await page.addInitScript(()=>{window.__AGRO_DIAGNOSTIC_SESSION__=true;localStorage.setItem('agro-frame-budget-v1',JSON.stringify({lite:false,at:new Date().toISOString()}));});await page.goto(origin);await page.waitForFunction(()=>window.TerritorioProductGestures);await page.waitForTimeout(850);
  for(const delay of [0,40,120,650]){
   // Capture the true card origin without a pending single-sale gesture.
   await page.locator('#app [data-action=sell-product]').first().dispatchEvent('pointerdown',{button:0,pointerId:1,isPrimary:true});
   await page.locator('#app [data-action=sell-product]').first().dispatchEvent('pointerup',{button:0,pointerId:1,isPrimary:true});
   await page.evaluate(()=>window.ERPPreview.actions['stock-peek']({id:'Especial250'}));await page.waitForTimeout(delay);
   const data=await sampleReturn(page);report.pending={theme,width,large,mode,closeAfterMs:delay,data};const stats=verify(data,{allowInstant:mode==='reduced'});delete report.pending;report.cases.push({theme,width,large,mode,closeAfterMs:delay,...stats});await page.waitForTimeout(100);
  }
  await context.close();
 }
 report.passed=report.errors.length===0;
 }catch(e){report.errors.push(String(e.stack||e));process.exitCode=1;}finally{await browser?.close();fs.writeFileSync(path.join(__dirname,'return051-review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
})();
