package br.com.territorio.gestao;

import android.Manifest;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.speech.RecognitionListener;
import android.speech.SpeechRecognizer;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** On-device speech recognition for the business question field.
 *  0.12.148: the Qwen models were removed from the app. Gemini online interprets questions,
 *  Gemini Nano interprets offline where AICore supports it, and the local engines always answer.
 *  On first load, private copies left by previous test versions are deleted to free storage. */
@CapacitorPlugin(name="AgroLocalIntelligence",permissions={@Permission(alias="microphone",strings={Manifest.permission.RECORD_AUDIO})})
public class AgroLocalIntelligencePlugin extends Plugin {
    private static final String[] LEGACY_FILES={"qwen-agro-1.litertlm","qwen-install.part","qwen3-06-int4-7900eb4e.litertlm","qwen3-06-download.part"};
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private SpeechRecognizer voice;
    private PluginCall voiceCall;

    @Override public void load(){
        io.execute(()->{
            try{
                File dir=getContext().getNoBackupFilesDir();
                for(String name:LEGACY_FILES){File f=new File(dir,name);if(f.exists())f.delete();}
                getContext().getSharedPreferences("local-intelligence",0).edit().clear().apply();
            }catch(Throwable ignored){}
        });
    }
    @PluginMethod public void status(PluginCall call){
        JSObject r=new JSObject();
        r.put("supported",false);r.put("imported",false);r.put("packaged",false);r.put("enabled",false);r.put("busy",false);
        r.put("speech",Build.VERSION.SDK_INT>=31&&SpeechRecognizer.isOnDeviceRecognitionAvailable(getContext()));
        call.resolve(r);
    }
    @PluginMethod public void speech(PluginCall call){
        if(Build.VERSION.SDK_INT<31||!SpeechRecognizer.isOnDeviceRecognitionAvailable(getContext())){call.reject("Voz offline indisponível neste aparelho. Digite sua pergunta.");return;}
        if(getPermissionState("microphone")!=PermissionState.GRANTED){requestPermissionForAlias("microphone",call,"microphonePermission");return;}
        beginVoice(call);
    }
    @PermissionCallback private void microphonePermission(PluginCall call){if(getPermissionState("microphone")!=PermissionState.GRANTED){call.reject("Microfone não autorizado. Digite sua pergunta.");return;}beginVoice(call);}
    private void finishVoice(Bundle results,String error){
        PluginCall call=voiceCall;voiceCall=null;SpeechRecognizer recognizer=voice;voice=null;if(recognizer!=null)recognizer.destroy();if(call==null)return;
        java.util.ArrayList<String> alternatives=results==null?null:results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        String text=alternatives==null||alternatives.isEmpty()?"":alternatives.get(0).trim();
        if(error!=null||text.isEmpty()||text.length()>500){call.reject(error==null?"Não foi possível entender a pergunta. Digite ou tente novamente.":error);return;}
        JSObject r=new JSObject();r.put("text",text);call.resolve(r);
    }
    private void beginVoice(PluginCall call){getActivity().runOnUiThread(()->{
        if(voiceCall!=null){call.reject("Aguarde a escuta atual.");return;}
        voiceCall=call;
        try{voice=SpeechRecognizer.createOnDeviceSpeechRecognizer(getContext());voice.setRecognitionListener(new RecognitionListener(){
            public void onReadyForSpeech(Bundle p){}public void onBeginningOfSpeech(){}public void onRmsChanged(float v){}public void onBufferReceived(byte[] b){}public void onEndOfSpeech(){}public void onPartialResults(Bundle p){}public void onEvent(int t,Bundle p){}
            public void onError(int error){finishVoice(null,"Voz offline indisponível agora. Confira o idioma instalado no Android ou digite sua pergunta.");}
            public void onResults(Bundle results){finishVoice(results,null);}
        });Intent intent=new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE,"pt-BR");intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE,true);voice.startListening(intent);
        }catch(Exception e){finishVoice(null,"Não foi possível iniciar a voz offline. Digite sua pergunta.");}
    });}
    @PluginMethod public void cancel(PluginCall call){call.resolve();}
    @Override protected void handleOnPause(){getActivity().runOnUiThread(()->finishVoice(null,"Escuta cancelada ao sair do app."));}
    @Override protected void handleOnDestroy(){getActivity().runOnUiThread(()->finishVoice(null,"Escuta encerrada."));io.shutdownNow();}
}
