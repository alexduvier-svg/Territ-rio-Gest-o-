package br.com.territorio.gestao;

import android.Manifest;
import android.content.Intent;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.media.audiofx.NoiseSuppressor;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.speech.RecognitionListener;
import android.speech.RecognitionSupport;
import android.speech.RecognitionSupportCallback;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import org.json.JSONArray;
import org.json.JSONObject;
import org.vosk.Model;
import org.vosk.Recognizer;
import java.io.*;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/** Foreground, one-shot local speech. Never writes audio or modifies business records. */
@CapacitorPlugin(name="AgroVoice", permissions={@Permission(alias="microphone",strings={Manifest.permission.RECORD_AUDIO})})
public class AgroVoicePlugin extends Plugin {
    private static final String MODEL="vosk-model-small-pt-0.3";
    private static final String SHA="6e1ce909032e1afa7a88e68a3d628ecafff302bdf195befab308826c395e93b7";
    private final Handler main=new Handler(Looper.getMainLooper());
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private volatile int generation=0;
    private volatile boolean busy=false, stop=false, cancelled=false, offlineRunning=false;
    private volatile AudioRecord recorder;
    private SpeechRecognizer nativeRecognizer;
    private volatile boolean nativePortuguese=false;
    private String session="", engine="";

    private Intent speechIntent() {
        Intent i=new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE,"pt-BR");
        i.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE,true);
        i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS,true);
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS,3);
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS,1500L);
        return i;
    }
    @PluginMethod public void getCapabilities(PluginCall call) {
        main.post(()->{
            JSObject result=new JSObject();result.put("offline",true);result.put("language","pt-BR");
            result.put("noiseSuppression",NoiseSuppressor.isAvailable());
            nativePortuguese=false;
            if(Build.VERSION.SDK_INT<33||!SpeechRecognizer.isOnDeviceRecognitionAvailable(getContext())){result.put("nativePortuguese",false);call.resolve(result);return;}
            final SpeechRecognizer probe;
            try{probe=SpeechRecognizer.createOnDeviceSpeechRecognizer(getContext());}catch(Exception e){result.put("nativePortuguese",false);call.resolve(result);return;}
            AtomicBoolean finished=new AtomicBoolean(false);
            Runnable finish=()->{if(finished.compareAndSet(false,true)){probe.destroy();result.put("nativePortuguese",nativePortuguese);call.resolve(result);}};
            main.postDelayed(finish,2200);
            try{probe.checkRecognitionSupport(speechIntent(),getContext().getMainExecutor(),new RecognitionSupportCallback(){
                @Override public void onSupportResult(RecognitionSupport support){
                    if(finished.get())return;
                    nativePortuguese=support.getInstalledOnDeviceLanguages().stream().anyMatch(s->s.equalsIgnoreCase("pt-BR")||s.equalsIgnoreCase("pt_BR"));finish.run();
                }
                @Override public void onError(int error){finish.run();}
            });}catch(Exception e){finish.run();}
        });
    }
    @PluginMethod public void startListening(PluginCall call) {
        main.post(()->{
            if(busy){call.reject("A escuta anterior ainda está terminando.","BUSY");return;}
            generation++;busy=true;stop=false;cancelled=false;session=call.getString("session","");
            if(session.isEmpty()){busy=false;call.reject("Sessão ausente.");return;}
            call.getData().put("generation",generation);
            if(getPermissionState("microphone")!=PermissionState.GRANTED)requestPermissionForAlias("microphone",call,"microphoneResult");
            else begin(call);
        });
    }
    @PermissionCallback private void microphoneResult(PluginCall call) {
        if(call.getInt("generation",-1)!=generation||cancelled){call.reject("Escuta cancelada.","CANCELLED");return;}
        if(getPermissionState("microphone")!=PermissionState.GRANTED){busy=false;call.reject("Permita o microfone nas permissões do app para usar a voz.","PERMISSION");return;}
        begin(call);
    }
    private void begin(PluginCall call) {
        final int token=generation;final String id=session;
        engine=nativePortuguese&&!"offline".equals(call.getString("engine"))?"android":"vosk";
        call.resolve(new JSObject().put("session",id).put("engine",engine));
        if(engine.equals("android"))main.post(()->startNative(token,id));
        else {
            JSArray hints=call.getArray("hints",new JSArray());boolean noise=call.getBoolean("noiseSuppression",true);
            event(token,id,"state",new JSObject().put("state","preparing").put("engine",engine));
            offlineRunning=true;worker.execute(()->listenOffline(token,id,hints,noise));
        }
    }
    private void event(int token,String id,String type,JSObject data) {
        main.post(()->{if(token!=generation||cancelled)return;data.put("session",id);data.put("type",type);notifyListeners("voice",data);});
    }
    private void finish(int token,String id,String type,JSObject data) {
        main.post(()->{if(token!=generation||cancelled||!busy)return;busy=false;destroyNative();data.put("session",id);data.put("type",type);notifyListeners("voice",data);});
    }
    private void destroyNative(){if(nativeRecognizer!=null){nativeRecognizer.cancel();nativeRecognizer.destroy();nativeRecognizer=null;}}
    private void startNative(int token,String id) {
        if(token!=generation||cancelled)return;
        try {
            nativeRecognizer=SpeechRecognizer.createOnDeviceSpeechRecognizer(getContext());
            nativeRecognizer.setRecognitionListener(new RecognitionListener(){
                public void onReadyForSpeech(Bundle b){event(token,id,"state",new JSObject().put("state","listening").put("engine","android"));}
                public void onBeginningOfSpeech(){}
                public void onRmsChanged(float rms){event(token,id,"level",new JSObject().put("level",Math.max(0,Math.min(1,rms/12))));}
                public void onBufferReceived(byte[] bytes){}
                public void onEndOfSpeech(){event(token,id,"state",new JSObject().put("state","processing"));}
                public void onError(int error){finish(token,id,"error",new JSObject().put("code","ANDROID_"+error).put("message",error==SpeechRecognizer.ERROR_NO_MATCH||error==SpeechRecognizer.ERROR_SPEECH_TIMEOUT?"Não entendi a fala. Repita ou digite.":"O reconhecedor do aparelho falhou. Tente o modo offline ou digite."));}
                public void onResults(Bundle b){ArrayList<String> texts=b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);float[] scores=b.getFloatArray(SpeechRecognizer.CONFIDENCE_SCORES);JSArray alternatives=new JSArray();if(texts!=null)for(String t:texts)alternatives.put(t);finish(token,id,"final",new JSObject().put("text",texts==null||texts.isEmpty()?"":texts.get(0)).put("alternatives",alternatives).put("confidence",scores==null||scores.length==0?-1:scores[0]).put("engine","android"));}
                public void onPartialResults(Bundle b){ArrayList<String> t=b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);if(t!=null&&!t.isEmpty())event(token,id,"partial",new JSObject().put("text",t.get(0)));}
                public void onEvent(int eventType,Bundle params){}
            });
            nativeRecognizer.startListening(speechIntent());
            main.postDelayed(()->{if(token==generation&&busy)finish(token,id,"error",new JSObject().put("code","TIMEOUT").put("message","A escuta demorou demais. Tente novamente ou use o modo offline."));},22000);
        }catch(Exception e){finish(token,id,"error",new JSObject().put("code","UNAVAILABLE").put("message","Português do aparelho indisponível. Tente o modo offline."));}
    }

    private boolean verifiedMark(File file) {
        try(FileInputStream in=new FileInputStream(file)){byte[] bytes=new byte[65];int n=in.read(bytes);return n==64&&new String(bytes,0,n,java.nio.charset.StandardCharsets.UTF_8).equals(SHA);}catch(IOException e){return false;}
    }
    private File prepareModel() throws Exception {
        File root=new File(getContext().getNoBackupFilesDir(),"voice"),dir=new File(root,MODEL),mark=new File(dir,".verified");
        if(mark.isFile()&&verifiedMark(mark)&&new File(dir,"final.mdl").length()==13549849&&new File(dir,"Gr.fst").length()==16007119&&new File(dir,"HCLr.fst").length()==15510922)return dir;
        if(getContext().getFilesDir().getUsableSpace()<100L*1024*1024)throw new IOException("SPACE");
        root.mkdirs();File temp=new File(root,"preparing");deleteTree(temp);temp.mkdirs();
        // Verify the complete original asset before extracting. ZIP stays in APK, audio never does.
        MessageDigest digest=MessageDigest.getInstance("SHA-256");byte[] bytes=new byte[32768];
        try(InputStream in=getContext().getAssets().open("voice/"+MODEL+".zip")){int n;while((n=in.read(bytes))!=-1)digest.update(bytes,0,n);}
        StringBuilder hex=new StringBuilder();for(byte b:digest.digest())hex.append(String.format(java.util.Locale.ROOT,"%02x",b));
        if(!SHA.equals(hex.toString()))throw new IOException("INTEGRITY");
        long total=0;
        try(ZipInputStream in=new ZipInputStream(getContext().getAssets().open("voice/"+MODEL+".zip"))){ZipEntry entry;while((entry=in.getNextEntry())!=null){
            File dest=new File(temp,entry.getName());if(!dest.getCanonicalPath().startsWith(temp.getCanonicalPath()+File.separator))throw new IOException("PATH");
            if(entry.isDirectory()){dest.mkdirs();continue;}dest.getParentFile().mkdirs();
            try(OutputStream out=new FileOutputStream(dest)){int n;while((n=in.read(bytes))!=-1){total+=n;if(total>80L*1024*1024)throw new IOException("SIZE");out.write(bytes,0,n);}}
        }}catch(Exception e){deleteTree(temp);throw e;}
        deleteTree(dir);if(!new File(temp,MODEL).renameTo(dir))throw new IOException("INSTALL");deleteTree(temp);
        try(FileOutputStream out=new FileOutputStream(mark)){out.write(SHA.getBytes(java.nio.charset.StandardCharsets.UTF_8));out.getFD().sync();}return dir;
    }
    private void deleteTree(File f){if(f.isDirectory()){File[] children=f.listFiles();if(children!=null)for(File child:children)deleteTree(child);}f.delete();}
    private String grammar(JSArray hints) {
        JSONArray phrases=new JSONArray();phrases.put("[unk]");phrases.put("vendi vender adicionar quero de do e pacote pacotes unidade unidades maço maços molho dúzia dúzias quilo quilos grama gramas litro litros moído em grão");
        phrases.put("zero um uma dois duas três quatro cinco seis sete oito nove dez onze doze treze catorze quinze dezesseis dezessete dezoito dezenove vinte trinta quarenta cinquenta sessenta setenta oitenta noventa cem cento duzentos quinhentos mil meio meia vírgula");
        for(int i=0;i<Math.min(hints.length(),60);i++){String s=hints.optString(i,"");if(!s.isEmpty())phrases.put(s.substring(0,Math.min(s.length(),160)).toLowerCase(new java.util.Locale("pt","BR")));}return phrases.toString();
    }
    private void listenOffline(int token,String id,JSArray hints,boolean suppressNoise) {
        Model model=null;Recognizer recognizer=null;AudioRecord audio=null;NoiseSuppressor noise=null;
        String text="",error=null,stage="MODEL";double confidence=-1;JSArray alternatives=new JSArray();float maxRms=0;int clipped=0,samples=0;
        try {
            File dir=prepareModel();if(token!=generation||cancelled)return;
            model=new Model(dir.getAbsolutePath());if(token!=generation||cancelled)return;
            recognizer=new Recognizer(model,16000,grammar(hints));recognizer.setWords(true);recognizer.setMaxAlternatives(3);recognizer.setEndpointerMode(Recognizer.EndpointerMode.LONG);
            stage="MICROPHONE";
            int minimum=AudioRecord.getMinBufferSize(16000,AudioFormat.CHANNEL_IN_MONO,AudioFormat.ENCODING_PCM_16BIT);
            if(minimum<=0)throw new IOException("AUDIO_FORMAT");
            audio=new AudioRecord(MediaRecorder.AudioSource.VOICE_RECOGNITION,16000,AudioFormat.CHANNEL_IN_MONO,AudioFormat.ENCODING_PCM_16BIT,Math.max(minimum*2,8192));recorder=audio;
            if(audio.getState()!=AudioRecord.STATE_INITIALIZED||audio.getSampleRate()!=16000)throw new IOException("AUDIO_FORMAT");
            if(suppressNoise&&NoiseSuppressor.isAvailable()){try{noise=NoiseSuppressor.create(audio.getAudioSessionId());if(noise!=null)noise.setEnabled(true);}catch(Exception ignored){}}
            if(token!=generation||cancelled)return;
            audio.startRecording();if(audio.getRecordingState()!=AudioRecord.RECORDSTATE_RECORDING)throw new IOException("MIC");
            event(token,id,"state",new JSObject().put("state","listening").put("engine","vosk").put("noiseSuppression",noise!=null&&noise.getEnabled()));
            short[] buffer=new short[1600];long began=SystemClock.elapsedRealtime(),lastLevel=0;String partial="";
            while(token==generation&&!cancelled&&!stop&&SystemClock.elapsedRealtime()-began<18000){
                int n=audio.read(buffer,0,buffer.length);if(n<0)throw new IOException("MIC_READ");if(n==0)continue;
                double energy=0;for(int j=0;j<n;j++){double sample=buffer[j]/32768.0;energy+=sample*sample;if(Math.abs(buffer[j])>=32500)clipped++;}samples+=n;
                float rms=(float)Math.sqrt(energy/n);maxRms=Math.max(maxRms,rms);
                if(SystemClock.elapsedRealtime()-lastLevel>=180){lastLevel=SystemClock.elapsedRealtime();event(token,id,"level",new JSObject().put("level",Math.min(1,rms*8)));}
                if(recognizer.acceptWaveForm(buffer,n)){JSONObject r=new JSONObject(recognizer.getResult());JSONArray a=r.optJSONArray("alternatives");if(a!=null&&a.length()>0&&!a.getJSONObject(0).optString("text").isEmpty()){text=a.getJSONObject(0).optString("text");for(int j=0;j<a.length();j++)alternatives.put(a.getJSONObject(j).optString("text"));confidence=wordConfidence(a.getJSONObject(0));break;}}
                else {String p=new JSONObject(recognizer.getPartialResult()).optString("partial");if(!p.equals(partial)){partial=p;event(token,id,"partial",new JSObject().put("text",p));}}
                if(SystemClock.elapsedRealtime()-began>8000&&partial.isEmpty()&&maxRms<0.008){error="LOW_VOLUME";break;}
            }
            if(text.isEmpty()&&error==null){JSONObject r=new JSONObject(recognizer.getFinalResult());JSONArray a=r.optJSONArray("alternatives");if(a!=null&&a.length()>0){text=a.getJSONObject(0).optString("text");for(int j=0;j<a.length();j++)alternatives.put(a.getJSONObject(j).optString("text"));confidence=wordConfidence(a.getJSONObject(0));}}
            if(text.contains("[unk]"))error="UNCLEAR";
            if(text.isEmpty()&&error==null)error=maxRms<0.008?"LOW_VOLUME":"NO_MATCH";
        }catch(Throwable e){error=e instanceof OutOfMemoryError?"MEMORY":e instanceof SecurityException?"PERMISSION":"SPACE".equals(e.getMessage())?"SPACE":stage;}
        finally {
            recorder=null;if(audio!=null){try{audio.stop();}catch(Exception ignored){}if(noise!=null)noise.release();audio.release();}
            if(recognizer!=null)recognizer.close();if(model!=null)model.close();
            offlineRunning=false;
            if(token!=generation)main.post(()->{busy=false;});
        }
        if(token!=generation||cancelled)return;
        if(error!=null){String message="Não entendi com segurança. Repita mais perto do microfone ou digite.";
            if("LOW_VOLUME".equals(error))message="O som chegou muito baixo. Aproxime-se do microfone e confira se ele não está coberto.";
            if("SPACE".equals(error))message="Libere pelo menos 100 MB para preparar o português offline.";
            if("MEMORY".equals(error))message="Faltou memória para a voz. Feche outros apps ou digite o produto.";
            if("MODEL".equals(error))message="Não foi possível preparar o português offline. Feche a voz e tente novamente; seus produtos não foram alterados.";
            if("MICROPHONE".equals(error))message="Não consegui captar o microfone. Feche outros apps que usam áudio e tente novamente.";
            if("PERMISSION".equals(error))message="O Android bloqueou o microfone. Confira a permissão de Microfone do AGRO Gestão 3.";
            finish(token,id,"error",new JSObject().put("code",error).put("message",message));
        }else finish(token,id,"final",new JSObject().put("text",text).put("alternatives",alternatives).put("confidence",confidence).put("engine","vosk").put("lowVolume",maxRms<0.015).put("clipping",samples>0&&clipped/(double)samples>0.02));
    }
    private double wordConfidence(JSONObject result){JSONArray words=result.optJSONArray("result");if(words==null||words.length()==0)return -1;double sum=0;for(int i=0;i<words.length();i++)sum+=words.optJSONObject(i).optDouble("conf",0);return sum/words.length();}
    @PluginMethod public void stopListening(PluginCall call){stop=true;main.post(()->{if(nativeRecognizer!=null)nativeRecognizer.stopListening();});call.resolve();}
    @PluginMethod public void cancel(PluginCall call){cancelCapture();call.resolve();}
    private void cancelCapture(){cancelled=true;stop=true;generation++;main.post(()->{destroyNative();if(!offlineRunning)busy=false;});AudioRecord a=recorder;if(a!=null)try{a.stop();}catch(Exception ignored){}}
    @Override protected void handleOnPause(){cancelCapture();}
    @Override protected void handleOnDestroy(){cancelCapture();worker.shutdown();}
}
