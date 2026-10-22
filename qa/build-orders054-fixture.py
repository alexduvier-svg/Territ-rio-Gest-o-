"""Separate Android package with the real web assets and a synthetic, network-blocked ERP."""
from pathlib import Path
import subprocess,shutil,json
root=Path(__file__).resolve().parent.parent
out=Path('C:/Users/alexd/.codex/visualizations/2026/10/15/01a13f9b-c55a-7a91-8bee-90c8d5f7f38d/orders054-fixture')
out.mkdir(parents=True,exist_ok=True)
sdk=root/'android-sdk';bt=sdk/'build-tools/36.0.0';android=sdk/'platforms/android-36/android.jar';jdk=Path('C:/Program Files/Microsoft/jdk-21.0.12.101-hotspot/bin')
def run(*args):subprocess.run([str(a) for a in args],check=True)
variant=__import__('sys').argv[1] if len(__import__('sys').argv)>1 else 'candidate'
assert variant in ('baseline','candidate')
if variant!='baseline' or not (out/'assets/baseline/index.html').exists():
    shutil.copytree(root/'app/dist',out/'assets'/variant,dirs_exist_ok=True)
node='C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
seed=subprocess.check_output([node,'-e',"process.stdout.write(JSON.stringify(require('./qa/orders054.cjs').seed))"],cwd=root)
data=json.loads(seed)
data['onlineShop']['enabled']=False
data['clients']=[{'id':'client-maria','name':'Maria Silva','uf':'MG','personType':'PF'}]
(out/'assets/seed.json').write_text(json.dumps(data),encoding='utf-8')
run(node,root/'qa/prepare-orders054-fixture.mjs',out/'assets'/variant)
(out/'AndroidManifest.xml').write_text('''<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="br.com.territorio.gestao2.motionfixture" android:versionCode="1" android:versionName="1"><uses-sdk android:minSdkVersion="24" android:targetSdkVersion="36"/><uses-permission android:name="android.permission.INTERNET"/><application android:label="AGRO Teste Isolado" android:debuggable="true" android:hardwareAccelerated="true" android:theme="@android:style/Theme.Material.Light.NoActionBar"><activity android:name=".FixtureActivity" android:exported="true"><intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter></activity></application></manifest>''',encoding='utf-8')
(out/'FixtureActivity.java').write_text('''package br.com.territorio.gestao2.motionfixture;
import android.app.Activity;import android.os.Bundle;import android.webkit.*;import java.io.*;import org.json.JSONObject;
public class FixtureActivity extends Activity {
 public void onCreate(Bundle b){super.onCreate(b);getWindow().addFlags(128);WebView.setWebContentsDebuggingEnabled(true);WebView w=new WebView(this);w.getSettings().setJavaScriptEnabled(true);w.getSettings().setDomStorageEnabled(true);w.getSettings().setMediaPlaybackRequiresUserGesture(true);setContentView(w);
 final String variant="candidate".equals(getIntent().getStringExtra("variant"))?"candidate":"baseline";
 w.setWebViewClient(new WebViewClient(){public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){try{
  if(!"fixture.agro.test".equals(request.getUrl().getHost()))return new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(new byte[0]));
  String path=request.getUrl().getPath();if(path==null||path.equals("/"))path="/index.html";
  byte[] bytes=read(variant+path);String mime=path.endsWith(".js")?"text/javascript":path.endsWith(".css")?"text/css":path.endsWith(".woff2")?"font/woff2":path.endsWith(".webp")?"image/webp":path.endsWith(".png")?"image/png":"text/html";
  if(path.endsWith("index.html")){JSONObject seed=new JSONObject(new String(read("seed.json"),"UTF-8"));seed.getJSONObject("settings").put("appearance","dark".equals(request.getUrl().getQueryParameter("theme"))?"dark":"light");
   String init="<script>window.__AGRO_DIAGNOSTIC_SESSION__=true;window.__AGRO_TOUCH_FIXTURE__='"+variant+"';if(!localStorage.getItem('territorio-gestao-prototipo-v1'))localStorage.setItem('territorio-gestao-prototipo-v1',"+JSONObject.quote(seed.toString())+");</script>";
   bytes=new String(bytes,"UTF-8").replace("<head>","<head>"+init).getBytes("UTF-8");}
  return new WebResourceResponse(mime,"UTF-8",new ByteArrayInputStream(bytes));
 }catch(Exception e){return new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(new byte[0]));}}});w.loadUrl("https://fixture.agro.test/");}
 private byte[] read(String p)throws Exception{try(InputStream in=getAssets().open(p);ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] buf=new byte[16384];int n;while((n=in.read(buf))!=-1)out.write(buf,0,n);return out.toByteArray();}}
}''',encoding='utf-8')
(out/'classes').mkdir(exist_ok=True);(out/'dex').mkdir(exist_ok=True)
run(jdk/'javac.exe','--release','8','-classpath',android,'-d',out/'classes',out/'FixtureActivity.java')
classes=list((out/'classes').rglob('*.class'))
run(bt/'d8.bat','--lib',android,'--min-api','24','--output',out/'dex',*classes)
apk=out/'unsigned.apk'
run(bt/'aapt.exe','package','-f','-M',out/'AndroidManifest.xml','-I',android,'-A',out/'assets','-F',apk)
with __import__('zipfile').ZipFile(apk,'a') as z:z.write(out/'dex/classes.dex','classes.dex')
key=out/'fixture.jks'
if not key.exists():run(jdk/'keytool.exe','-genkeypair','-keystore',key,'-storepass','android','-keypass','android','-alias','fixture','-keyalg','RSA','-validity','3650','-dname','CN=Isolated AGRO QA')
run(bt/'zipalign.exe','-f','4',apk,out/'aligned.apk')
run(jdk/'java.exe','-jar',bt/'lib/apksigner.jar','sign','--ks',key,'--ks-key-alias','fixture','--ks-pass','pass:android','--out',out/'fixture.apk',out/'aligned.apk')
run(bt/'aapt.exe','dump','badging',out/'fixture.apk')
print(json.dumps({'variant':variant,'separatePackage':'br.com.territorio.gestao2.motionfixture','apk':str(out/'fixture.apk'),'noProductionDatabase':True}))
