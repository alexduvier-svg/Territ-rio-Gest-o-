import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
const workspace=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fixturePackage='br.com.territorio.gestao2.motion134';
const allowedRoot=path.resolve('C:/Users/alexd/.codex/visualizations/2026/10/28/01a1835c-018b-7352-95a2-037da69102a6');
const args=process.argv.slice(2),outIndex=args.indexOf('--out');
const out=path.resolve(outIndex<0?path.join(allowedRoot,'motion134-fixture'):args[outIndex+1]);
const buildLog=fs.readFileSync(path.join(workspace,'qa/motion134-build.log'),'utf8');
const evidence=[...buildLog.matchAll(/^Build evidence:\s*(.+?)\s*$/gm)].at(-1)?.[1];
if(!evidence||!buildLog.includes('BUILD SUCCESSFUL'))throw Error('Final133 build required');
const assets=path.join(out,'assets'),source=path.join(evidence,'assets');
const relativeOut=path.relative(allowedRoot,out);
if(!relativeOut||relativeOut.startsWith('..')||path.isAbsolute(relativeOut))throw Error('Fixture output must be a subdirectory of this task visualization folder.');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function files(root,prefix='') {
 return fs.readdirSync(path.join(root,prefix),{withFileTypes:true}).flatMap(entry=>{
  if(entry.isSymbolicLink())throw Error('Unexpected symlink in fixture assets: '+entry.name);
  const relative=path.join(prefix,entry.name);
  return entry.isDirectory()?files(root,relative):[relative];
 });
}
function inside(root,target) {
 const relative=path.relative(root,target);
 if(!relative||relative.startsWith('..')||path.isAbsolute(relative))throw Error('Unsafe fixture target: '+target);
 return target;
}
const reportPath=path.join(out,'preparation.json');
if(args.includes('--verify')) {
 const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
 if(report.fixturePackage!==fixturePackage)throw Error('Unexpected fixture package in preparation report.');
 const sourceFiles=files(source),preparedFiles=files(assets);
 if(JSON.stringify(sourceFiles.sort())!==JSON.stringify(preparedFiles.sort()))throw Error('Fixture asset inventory differs from source.');
 for(const entry of report.files) {
  if(hash(fs.readFileSync(path.join(source,entry.path)))!==entry.sourceSha256)throw Error('Source asset changed after preparation: '+entry.path);
  if(hash(fs.readFileSync(path.join(assets,entry.path)))!==entry.fixtureSha256)throw Error('Prepared fixture asset changed: '+entry.path);
 }
 console.log(JSON.stringify({fixturePackage,verified:true,assets:report.files.length,changedAssets:report.files.filter(x=>x.sourceSha256!==x.fixtureSha256).map(x=>x.path)}));
 process.exit(0);
}

const originalConfig=JSON.parse(fs.readFileSync(path.join(source,'capacitor.config.json'),'utf8'));
if(originalConfig.appId!=='br.com.territorio.gestao2')throw Error('Fixture must derive from the Codex package.');
const sourceFiles=files(source),sourceSet=new Set(sourceFiles);
fs.mkdirSync(assets,{recursive:true});
for(const relative of files(assets))if(!sourceSet.has(relative))fs.unlinkSync(inside(assets,path.join(assets,relative)));
for(const relative of sourceFiles) {
 const target=inside(assets,path.join(assets,relative));
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.copyFileSync(path.join(source,relative),target);
}
const {makeSeed}=require('./motion134-seed.cjs');
const seed=makeSeed();
if(seed.dataContext?.id!=='motion134-synthetic'||!seed.products?.every(p=>p.id.startsWith('qa-')))throw Error('Only the synthetic Codex132 seed may be embedded.');
const jsonLiteral=JSON.stringify(JSON.stringify(seed)).replaceAll('<','\\u003c').replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029');
const script=`
window.__AGRO_DIAGNOSTIC_SESSION__=true;
window.__AGRO_NATIVE_FIXTURE__='motion134';
window.__AGRO_SYNTHETIC_FIXTURE__=true;
localStorage.setItem('agro-notification-prompt-v1','answered');
if(!localStorage.getItem('territorio-gestao-prototipo-v1'))localStorage.setItem('territorio-gestao-prototipo-v1',${jsonLiteral});
(() => {
 const local=input=>{try{const u=new URL(typeof input==='string'?input:input.url,location.href);return u.origin===location.origin||u.protocol==='data:'||u.protocol==='blob:';}catch{return false;}};
 const originalFetch=window.fetch.bind(window);
 window.fetch=(input,options)=>local(input)?originalFetch(input,options):Promise.reject(Error('Isolated Codex132 QA: external network blocked'));
 const originalOpen=XMLHttpRequest.prototype.open;
 XMLHttpRequest.prototype.open=function(method,url,...rest){if(!local(String(url)))throw Error('Isolated Codex132 QA: external network blocked');return originalOpen.call(this,method,url,...rest);};
 window.WebSocket=function(){throw Error('Isolated Codex132 QA: WebSocket blocked');};
 window.EventSource=function(){throw Error('Isolated Codex132 QA: EventSource blocked');};
 if(navigator.sendBeacon)navigator.sendBeacon=()=>false;
})();`;
const indexPath=path.join(assets,'public/index.html'),index=fs.readFileSync(indexPath,'utf8');
if(!/<head(?:\s[^>]*)?>/i.test(index))throw Error('Built index has no head for the isolated seed.');
fs.writeFileSync(indexPath,index.replace(/<head(?:\s[^>]*)?>/i,head=>head+'<script>'+script+'</script>'),'utf8');
const config=structuredClone(originalConfig);
config.appId=fixturePackage;config.appName='AGRO QA 134';
config.android={...config.android,webContentsDebuggingEnabled:true};
fs.writeFileSync(path.join(assets,'capacitor.config.json'),JSON.stringify(config,null,2)+'\n','utf8');
const manifestPath=path.join(out,'fixture-manifest.xml');
fs.writeFileSync(manifestPath,`<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools">
 <uses-permission android:name="android.permission.INTERNET" tools:node="remove" />
</manifest>
`,'utf8');
const groovy=value=>value.replaceAll('\\','/').replaceAll("'","\\'");
const initPath=path.join(out,'fixture.gradle');
fs.writeFileSync(initPath,`gradle.beforeProject { project ->
 if (project.path == ':app') {
  project.layout.buildDirectory.set(new File('${groovy(out)}/build'))
  project.afterEvaluate {
   project.android.defaultConfig.applicationId='${fixturePackage}'
   project.android.defaultConfig.resValue('string','app_name','AGRO QA 134')
   project.android.defaultConfig.resValue('string','title_activity_main','AGRO QA 134')
   project.android.buildTypes.release.debuggable=true
   project.android.sourceSets.main.assets.setSrcDirs(['${groovy(assets)}'])
   project.android.sourceSets.release.manifest.srcFile('${groovy(manifestPath)}')
  }
 } else {
  project.layout.buildDirectory.set(new File('${groovy(out)}/components/' + (project.path == ':' ? 'root' : project.name)))
 }
}
`,'utf8');
const manifest=sourceFiles.map(relative=>({path:relative.replaceAll('\\','/'),sourceSha256:hash(fs.readFileSync(path.join(source,relative))),fixtureSha256:hash(fs.readFileSync(path.join(assets,relative)))}));
const changed=manifest.filter(x=>x.sourceSha256!==x.fixtureSha256).map(x=>x.path).sort();
if(JSON.stringify(changed)!==JSON.stringify(['capacitor.config.json','public/index.html']))throw Error('Unexpected source/fixture asset differences.');
fs.writeFileSync(reportPath,JSON.stringify({createdAt:new Date().toISOString(),fixturePackage,assets,source,initPath,manifestPath,seedSha256:hash(JSON.stringify(seed)),network:'INTERNET permission removed; JS fetch/XHR/WebSocket/EventSource blocked externally',productionDataAccessed:false,files:manifest},null,2)+'\n','utf8');
console.log(JSON.stringify({fixturePackage,assets,initPath,manifestPath,files:manifest.length,changedAssets:changed,productionDataAccessed:false}));
