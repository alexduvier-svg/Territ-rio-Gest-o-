package br.com.territorio.gestao;

import static org.junit.Assert.*;
import android.content.Context;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.vosk.Model;
import org.vosk.Recognizer;

/** JNI/model compatibility smoke only. No microphone, Activity or producer records. */
@RunWith(AndroidJUnit4.class)
public class VoiceOfflineInstrumentedTest {
 @Test public void bundledPortugueseLoadsAndSilenceCannotProduceSaleText() throws Exception {
  Context context=InstrumentationRegistry.getInstrumentation().getTargetContext();
  assertEquals("br.com.territorio.gestao2",context.getPackageName());
  File temp=new File(context.getCacheDir(),"voice-instrumented-model");temp.mkdirs();
  try{
   try(ZipInputStream in=new ZipInputStream(context.getAssets().open("voice/vosk-model-small-pt-0.3.zip"))){
    ZipEntry e;byte[] bytes=new byte[32768];while((e=in.getNextEntry())!=null){File out=new File(temp,e.getName());assertTrue(out.getCanonicalPath().startsWith(temp.getCanonicalPath()+File.separator));if(e.isDirectory()){out.mkdirs();continue;}out.getParentFile().mkdirs();try(OutputStream stream=new FileOutputStream(out)){int n;while((n=in.read(bytes))!=-1)stream.write(bytes,0,n);}}
   }
   try(Model model=new Model(new File(temp,"vosk-model-small-pt-0.3").getAbsolutePath());Recognizer recognizer=new Recognizer(model,16000,"[\"três cafés gourmet duzentos e cinquenta gramas\",\"[unk]\"]")){
    recognizer.setWords(true);recognizer.setMaxAlternatives(3);recognizer.setEndpointerMode(Recognizer.EndpointerMode.LONG);
    short[] silence=new short[1600];for(int i=0;i<30;i++)recognizer.acceptWaveForm(silence,silence.length);
    JSONObject result=new JSONObject(recognizer.getFinalResult());assertNotNull(result.optJSONArray("alternatives"));assertEquals("",result.getJSONArray("alternatives").getJSONObject(0).optString("text"));
   }
  }finally{remove(temp);}
 }
 private void remove(File f){if(f.isDirectory()){File[] children=f.listFiles();if(children!=null)for(File child:children)remove(child);}f.delete();}
}
