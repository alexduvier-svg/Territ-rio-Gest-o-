const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const viz='C:/Users/alexd/.codex/visualizations/2026/10/28/01a18240-19fb-7c13-946b-a3251dc40b1d';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const apk=path.join(root,'AGRO-Gestao-Codex-0.12.132.apk'),sha256=hash(apk);
const structure=read(path.join(__dirname,'codex132-package-review.json'));
assert.equal(structure.sha256,sha256);assert(structure.compiledAssetsMatch&&structure.zipCRC);
const browser=read(path.join(viz,'codex132-browser/review.json'));
assert(browser.passed&&browser.assetsUnchanged);assert.equal(browser.cases.length,8);assert.equal(browser.errors.length,0);
assert.equal(browser.assetsBefore.fingerprint,browser.assetsAfter.fingerprint);
assert.equal(browser.apk.sha256,sha256);
const fixtureSha256=hash(path.join(viz,'codex132-fixture/fixture.apk'));
const native=[];
for(const device of ['reno','pkj'])for(const theme of ['light','dark']){
 const report=read(path.join(viz,'codex132-native',device+'-'+theme+'.json'));
 assert(report.passed);assert.equal(report.fixtureSha256,fixtureSha256);assert.equal(report.errors.length,0);native.push(report);
}
assert.match(fs.readFileSync(path.join(__dirname,'codex132-unit.txt'),'utf8'),/pass 812/);
const delivery=read(path.join(__dirname,'codex132-delivery.json'));
assert.equal(delivery.sha256,sha256);assert.equal(delivery.installed.length,2);
for(const installed of delivery.installed){assert.equal(installed.sha256,sha256);assert(installed.processAlive);if(!installed.newInstallation)assert.equal(installed.firstInstallTime,installed.previousFirstInstallTime);}
const sources=read(path.join(__dirname,'codex132-source-manifest.json'));
for(const file of sources.changedSourceFiles){assert(fs.existsSync(path.join(root,file.path)));file.mergedSHA256=hash(path.join(root,file.path));}
fs.writeFileSync(path.join(__dirname,'codex132-source-manifest.json'),JSON.stringify(sources,null,2));
const result={version:'0.12.132',checkedAt:new Date().toISOString(),sha256,sourceCommits:sources.commits,sourceFiles:sources.changedSourceFiles.length,unitTests:812,browser,native,delivery,passed:true};
fs.writeFileSync(path.join(__dirname,'codex132-final-review.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({passed:true,sha256,sourceCommits:sources.commits,sourceFiles:sources.changedSourceFiles.length,unitTests:812,browser:8,native:4,installed:2}));
