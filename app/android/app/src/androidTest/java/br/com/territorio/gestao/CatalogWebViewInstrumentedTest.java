package br.com.territorio.gestao;
import android.webkit.WebView;
import android.webkit.JavascriptInterface;
import android.util.Base64;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;
import java.io.*;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
// Isolated WebView, test assets only: never opens the ERP or its model/database.
@RunWith(AndroidJUnit4.class)
public class CatalogWebViewInstrumentedTest {
 public static class Result {
  final CountDownLatch latch=new CountDownLatch(1);volatile String value="";
  @JavascriptInterface public void done(String text){value=text;latch.countDown();}
 }
 private static byte[] asset(String name)throws Exception {try(InputStream in=InstrumentationRegistry.getInstrumentation().getContext().getAssets().open(name);ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[16384];int n;while((n=in.read(b))!=-1)out.write(b,0,n);return out.toByteArray();}}
 @Test public void nativeWebViewPreservesFilledAcroFormAcrossSaveAndReopen() throws Exception {
  String library=new String(asset("pdf-lib.min.js"),"UTF-8"),pdf=Base64.encodeToString(asset("catalog-fixture.pdf"),Base64.NO_WRAP);Result result=new Result();AtomicReference<WebView> holder=new AtomicReference<>();
  String script="(async()=>{try{const b=Uint8Array.from(atob('"+pdf+"'),c=>c.charCodeAt(0));const d=await PDFLib.PDFDocument.load(b);const f=d.getForm();if(f.getTextField('item.P024.quantity').getText()!=='3')throw Error('initial value');f.getTextField('item.P024.quantity').setText('4');const r=await PDFLib.PDFDocument.load(await d.save());if(r.getForm().getTextField('item.P024.quantity').getText()!=='4'||!r.getForm().getCheckBox('item.P024.selected').isChecked()||r.getForm().getFields().length!==54)throw Error('reopen values');QA.done('PASS:54fields:save:reopen');}catch(e){QA.done('FAIL:'+e.message);}})();";
  InstrumentationRegistry.getInstrumentation().runOnMainSync(()->{WebView w=new WebView(InstrumentationRegistry.getInstrumentation().getTargetContext());holder.set(w);w.getSettings().setJavaScriptEnabled(true);w.getSettings().setBlockNetworkLoads(true);w.addJavascriptInterface(result,"QA");w.loadDataWithBaseURL("https://localhost/","<!doctype html><script>"+library+"</script><script>"+script+"</script>","text/html","UTF-8",null);});
  try{assertTrue("WebView test timeout",result.latch.await(60,TimeUnit.SECONDS));assertEquals("PASS:54fields:save:reopen",result.value);}finally{InstrumentationRegistry.getInstrumentation().runOnMainSync(()->holder.get().destroy());}
 }
}
