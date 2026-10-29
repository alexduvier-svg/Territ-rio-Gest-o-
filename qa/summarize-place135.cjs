const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),viz='C:/Users/alexd/.codex/visualizations/2026/10/28/01a1835c-018b-7352-95a2-037da69102a6';
const read=(dir,name)=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8').replace(/^\uFEFF/,''));
const optional=(dir,name)=>fs.existsSync(path.join(dir,name))?read(dir,name):null;
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const structure=read(__dirname,'place135-package-review.json');assert.equal(hash(path.join(root,'AGRO-Gestao-Codex-0.12.135.apk')),structure.sha256);
const fixture=read(viz,'place135-fixture/build-report.json');assert(fixture.sourceAssetsVerified&&fixture.packagedAssetsVerified&&!fixture.internetPermission);assert.equal(hash(fixture.apk),fixture.sha256);
const unit=fs.readFileSync(path.join(__dirname,'place135-unit.txt'),'utf8');assert(/pass 813/.test(unit)&&/fail 0/.test(unit));
const browser=optional(viz,'place135-browser/review.json'),native=[];
if(browser?.passed){assert.equal(browser.apk.sha256,structure.sha256);assert(browser.assetsUnchanged&&browser.cases.length===8);assert(browser.cases.every(c=>c.result.syntheticGpsOnly&&c.result.gpsConfirmationAndDurableSave&&c.result.communitySaved));}
for(const device of ['reno','pkj'])for(const theme of ['light','dark']){
 const r=optional(viz,`place135-native/${device}-${theme}.json`);
 if(r?.passed){assert.equal(r.fixtureSha256,fixture.sha256);assert(r.errors.length===0&&r.result.syntheticGpsOnly&&Object.values(r.result).every(Boolean));native.push({device,theme,passed:true,fixtureSha256:r.fixtureSha256,result:r.result,startedAt:r.startedAt,finishedAt:r.finishedAt});}
}
const delivery=optional(__dirname,'place135-delivery.json');if(delivery)assert.equal(delivery.sha256,structure.sha256);
const validated=!!browser?.passed&&native.length===4;
const motionDiff=cp.execFileSync('git',['diff','3d922f47f3421954e07a5e822d8878fd0fdcb439','--','app/src/features/motion','app/src/features/interface.js'],{cwd:root,encoding:'utf8',windowsHide:true});assert.equal(motionDiff,'');
const runtime=fs.readdirSync(path.join(root,'app/src/features/place')).filter(n=>n.endsWith('.js')).map(n=>fs.readFileSync(path.join(root,'app/src/features/place',n),'utf8')).join('\n');assert(!/porteira/i.test(runtime));
const report={version:'0.12.135',versionCode:176,generatedAt:new Date().toISOString(),status:delivery?.status||(validated?'validated-awaiting-installation':'awaiting-validation'),sha256:structure.sha256,size:structure.size,baselineCodex:'3d922f47f3421954e07a5e822d8878fd0fdcb439',claudeLocationSource:'725acde387c3141a997ceb0baffbad8bd8559f23',claudeLatestReviewed:'87039bf0c1d648e8f84c65e11fd9639fb3cc35c3',integration:'location-only; latest message blocks/community/coordinates with Codex validation fixes',existingMotionModulesUnchanged:true,seuLugarLanguage:true,synthetic:true,productionDatabaseRead:false,realDeviceGpsRead:false,unitTests:{passed:813,failed:0},browser:browser?.passed?{passed:true,cases:8,apk:browser.apk,assetsUnchanged:true,casesDetail:browser.cases.map(c=>({theme:c.theme,width:c.width,largeText:c.largeText,performanceMode:c.performanceMode,reducedMotion:c.reducedMotion,result:c.result,passed:c.passed}))}:{passed:false},fixture:{sha256:fixture.sha256,sourceAssetsVerified:true,packagedAssetsVerified:true,internetPermission:false},native,validated,installedModels:delivery?.installed.map(d=>d.model)||[],delivered:delivery?.status==='installed-and-validated',limitations:['Native GPS results and external navigation/share responses are mocked only by the isolated synthetic harness.','No real positioning accuracy or route to a producer was measured.','No backend, automatic ERD validation, Street View discovery, plates or offline map packages are part of this update.']};
if(report.delivered){assert(validated);assert.equal(report.installedModels.length,2);}
fs.writeFileSync(path.join(__dirname,'place135-final-review.json'),JSON.stringify(report,null,2)+'\n');
if(process.argv.includes('--require-complete'))assert(report.delivered);
console.log(JSON.stringify({status:report.status,unit:813,browser:report.browser.passed?8:0,native:native.length,sha256:report.sha256}));
