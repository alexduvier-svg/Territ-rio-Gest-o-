// Publish compact synthetic QA evidence; raw traces/screenshots remain local.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const viz='C:/Users/alexd/.codex/visualizations/2026/10/28/01a1835c-018b-7352-95a2-037da69102a6';
const read=(base,name)=>JSON.parse(fs.readFileSync(path.join(base,name),'utf8').replace(/^\uFEFF/,''));
const optional=(base,name)=>fs.existsSync(path.join(base,name))?read(base,name):null;
const digest=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const sum=(xs,key)=>xs.reduce((n,x)=>n+x[key],0),round=n=>Math.round(n*100)/100;
const structure=read(__dirname,'motion134-package-review.json');
const apk=path.join(root,'AGRO-Gestao-Codex-0.12.134.apk');
assert.equal(digest(apk),structure.sha256);
const browser=read(viz,'motion134-browser/review.json'),parity=read(viz,'motion134-parity/review.json'),geometry=read(viz,'nav134-geometry/review.json');
assert(browser.passed&&browser.assetsUnchanged&&browser.apk.sha256===structure.sha256&&browser.cases.length===8);
assert(parity.passed&&parity.stylesIdentical&&parity.candidateAssetsUnchanged&&parity.referenceAssetsUnchanged);
assert(geometry.passed&&geometry.cases.length===24);
const unit=fs.readFileSync(path.join(__dirname,'motion134-unit.txt'),'utf8');
assert(/pass 789/.test(unit)&&/fail 0/.test(unit));
function compactRun(run){
 assert(run.passed&&run.errors.length===0);
 return run.cases.map(c=>({theme:c.theme,cpuRate:c.cpuRate,physical:c.physical,foregroundGuarded:!!c.foregroundGuarded,naturalNavigations:c.cases.length,taskMs:round(sum(c.cases,'taskMs')),layoutMs:round(sum(c.cases,'layoutMs')),styleMs:round(sum(c.cases,'styleMs')),timelineRewinds:sum(c.cases,'timelineRewinds'),longTasks:c.cases.flatMap(x=>x.longTasks).length,maxLongTaskMs:Math.max(0,...c.cases.flatMap(x=>x.longTasks)),injected100msStallRewinds:c.injected100msStall.timelineRewinds,rapidFinalPage:c.rapid.page,rapidGhosts:c.rapid.ghosts}));
}
const baseline=compactRun(read(viz,'motion134-baseline-browser/review.json'));
const candidate=compactRun(read(viz,'motion134-candidate-browser/review.json'));
for(const c of candidate)assert.equal(c.timelineRewinds+c.injected100msStallRewinds,0);
const performance={version:'0.12.134',generatedAt:new Date().toISOString(),synthetic:true,productionDatabaseRead:false,measure:'main-thread task duration and timeline writes; not GPU FPS',browser:{baseline,candidate,comparisons:candidate.map(c=>{const b=baseline.find(x=>x.cpuRate===c.cpuRate&&x.theme===c.theme);return{cpuRate:c.cpuRate,theme:c.theme,taskReductionPercent:round((b.taskMs-c.taskMs)*100/b.taskMs)};})},physical:[],limitations:['Desktop CPU throttling is not a physical low-cost phone.','Long tasks remain under CPU pressure; smoothness on every low-cost device is not established.','The artificial 100ms stall is excluded from natural-navigation task totals.','Preliminary unguarded device runs are excluded from final physical evidence.']};
const native=[];
const fixtureHash=digest(path.join(viz,'motion134-fixture/fixture.apk'));
for(const device of ['reno','pkj']){
 for(const phase of ['baseline','candidate']){
  const r=optional(viz,`motion134-physical-${phase}-${device}/review.json`);
  if(r?.passed){const cases=compactRun(r);assert.equal(cases.length,2);assert(cases.every(c=>c.foregroundGuarded));if(phase==='candidate')assert(cases.every(c=>c.timelineRewinds+c.injected100msStallRewinds===0));performance.physical.push({device,phase,startedAt:r.startedAt,finishedAt:r.finishedAt,cases});}
 }
 for(const theme of ['light','dark']){
  const r=optional(viz,`motion134-native/${device}-${theme}.json`);
  if(r?.passed){assert.equal(r.fixtureSha256,fixtureHash);assert.equal(r.errors.length,0);assert(Object.values(r.result).every(Boolean));native.push({device,theme,passed:true,fixtureSha256:r.fixtureSha256,result:r.result,startedAt:r.startedAt,finishedAt:r.finishedAt});}
 }
}
const delivery=optional(__dirname,'motion134-delivery.json');
if(delivery){assert.equal(delivery.sha256,structure.sha256);assert(['installed-and-validated','partially-installed-awaiting-other-device'].includes(delivery.status));}
const physicalComplete=native.length===4&&performance.physical.length===4;
const report={version:'0.12.134',versionCode:175,generatedAt:performance.generatedAt,status:delivery?delivery.status:physicalComplete?'validated-awaiting-delivery':'awaiting-final-physical-validation',sha256:structure.sha256,size:structure.size,synthetic:true,productionDatabaseRead:false,unitTests:{passed:789,failed:0},browser:{passed:true,cases:8,assetsUnchanged:browser.assetsUnchanged,apk:browser.apk,casesDetail:browser.cases.map(c=>({theme:c.theme,width:c.width,largeText:c.largeText,performanceMode:c.performanceMode,reducedMotion:c.reducedMotion,result:c.result,passed:c.passed}))},visual:{passed:true,cases:parity.cases.length,scenes:parity.cases.flatMap(c=>c.scenes).length,differingPixels:parity.cases.flatMap(c=>c.scenes).reduce((n,s)=>n+s.differingPixels,0),stylesIdentical:true,staticAssetsIdentical:parity.staticAssetsIdentical},navGeometry:{passed:true,cases:24,maxMatrixDelta:Math.max(...geometry.cases.map(c=>c.maxMatrixDelta)),maxOpacityDelta:Math.max(...geometry.cases.map(c=>c.maxOpacityDelta)),maxStrokeDelta:Math.max(...geometry.cases.map(c=>c.maxStrokeDelta))},native,physicalComplete,installedModels:delivery?.installed.map(d=>d.model)||[],delivered:delivery?.status==='installed-and-validated'};
if(report.delivered){assert(physicalComplete);assert.equal(delivery.installed.length,2);}
fs.writeFileSync(path.join(__dirname,'motion134-performance.json'),JSON.stringify(performance,null,2)+'\n');
fs.writeFileSync(path.join(__dirname,'motion134-final-review.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,unit:789,browser:8,visualScenes:report.visual.scenes,native:native.length,physicalComparisons:performance.physical.length,sha256:structure.sha256}));
