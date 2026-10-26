"""Native Capacitor test variant, separate package and private directory; never access production ERP."""
from pathlib import Path
import json,subprocess,shutil
r=Path(__file__).resolve().parent.parent
out=Path('C:/Users/alexd/.codex/visualizations/2026/10/15/01a13f9b-c55a-7a91-8bee-90c8d5f7f38d/validity087-native')
assets=out/'assets';assets.mkdir(parents=True,exist_ok=True)
source=r/'app/android/app/src/main/assets'
for old in assets.rglob('*'):
 if old.is_file() and not (source/old.relative_to(assets)).is_file():
  assert old.resolve().is_relative_to(out.resolve());old.unlink()
shutil.copytree(source,assets,dirs_exist_ok=True)
node='C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
seed=json.loads(subprocess.check_output([node,'-e',"process.stdout.write(JSON.stringify(require('./qa/catalog083-seed.cjs').seed))"],cwd=r))
script="<script>window.__AGRO_DIAGNOSTIC_SESSION__=true;window.__AGRO_NATIVE_FIXTURE__='validity087';localStorage.setItem('agro-notification-prompt-v1','answered');const oldFetch=window.fetch.bind(window);window.fetch=(url,options)=>{if(new URL(typeof url==='string'?url:url.url,location.href).origin!==location.origin&&!(window.__AGRO_API_TEST_READY__&&new URL(typeof url==='string'?url:url.url,location.href).pathname.startsWith('/api/')))return Promise.reject(Error('Isolated QA: external network blocked'));return oldFetch(url,options)};if(!localStorage.getItem('territorio-gestao-prototipo-v1'))localStorage.setItem('territorio-gestao-prototipo-v1',"+json.dumps(json.dumps(seed,ensure_ascii=False),ensure_ascii=False)+");</script>"
injection=subprocess.check_output([node,'-e',"process.stdout.write(require('./qa/catalog083-inject.cjs').script)"],cwd=r,text=True,encoding='utf8');script+='<script>'+injection+'</script>'
p=assets/'public/index.html';p.write_text(p.read_text(encoding='utf-8').replace('<head>','<head>'+script),encoding='utf-8')
p=assets/'capacitor.config.json';config=json.loads(p.read_text(encoding='utf-8'));config['appId']='br.com.territorio.gestao2.motionfixture';config.setdefault('android',{})['webContentsDebuggingEnabled']=True;p.write_text(json.dumps(config),encoding='utf-8')
gradle="""gradle.beforeProject { project ->
 if (project.path == ':app') {
  project.layout.buildDirectory.set(new File('OUT/build'))
  project.afterEvaluate {
   project.android.defaultConfig.applicationId='br.com.territorio.gestao2.motionfixture'
   project.android.defaultConfig.resValue('string','app_name','AGRO QA Lotes')
   project.android.defaultConfig.resValue('string','title_activity_main','AGRO QA Lotes')
   project.android.buildTypes.release.debuggable=true
   project.android.defaultConfig.resValue('string','agro_education_app_id','1:624166794293:android:4436cc3038d8f079f92d7c')
   project.android.sourceSets.main.assets.setSrcDirs(['OUT/assets'])
  }
 } else if(project.path != ':') project.layout.buildDirectory.set(new File('C:/Users/alexd/.codex/visualizations/2026/10/15/01a13f9b-c55a-7a91-8bee-90c8d5f7f38d/agro2-components-build/'+project.name))
}
""".replace('OUT',out.as_posix())
(r/'qa/validity087-fixture.gradle').write_text(gradle,encoding='utf-8')
print(json.dumps({'fixturePackage':'br.com.territorio.gestao2.motionfixture','assets':str(assets),'network':'only local asset origin allowed','productionDataAccessed':False}))
