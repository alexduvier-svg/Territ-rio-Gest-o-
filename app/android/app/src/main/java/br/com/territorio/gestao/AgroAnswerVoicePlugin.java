package br.com.territorio.gestao;
import android.media.AudioAttributes;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.*;
/** Only reads the verified UI response through an installed offline Portuguese voice. */
@CapacitorPlugin(name="AgroAnswerVoice")
public class AgroAnswerVoicePlugin extends Plugin {
 private TextToSpeech tts;private PluginCall pending;private long generation;private boolean ready;
 @PluginMethod public void speak(PluginCall call){
  String text=call.getString("text","");if(call.getData().length()!=1||text.trim().isEmpty()||text.length()>30000){call.reject("Resposta inválida para leitura.");return;}
  getActivity().runOnUiThread(()->{stopReading();pending=call;final long token=generation;
   if(tts!=null&&ready){read(text,token);return;}
   if(tts!=null){tts.shutdown();tts=null;}
   tts=new TextToSpeech(getContext(),status->getActivity().runOnUiThread(()->{if(token!=generation)return;if(status!=TextToSpeech.SUCCESS){fail("Leitura indisponível. A resposta escrita continua na tela.");return;}ready=true;read(text,token);}));
  });
 }
 private void read(String text,long token){try{
  List<Voice> voices=new ArrayList<>();if(tts.getVoices()!=null)for(Voice v:tts.getVoices())if("pt".equals(v.getLocale().getLanguage())&&!v.isNetworkConnectionRequired()&&(v.getFeatures()==null||!v.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)))voices.add(v);
  voices.sort(Comparator.comparingInt((Voice v)->"BR".equals(v.getLocale().getCountry())?0:1).thenComparing(Voice::getName));
  if(voices.isEmpty()||tts.setVoice(voices.get(0))!=TextToSpeech.SUCCESS){fail("Não há voz offline em português instalada no Android. A resposta escrita permanece disponível.");return;}
  tts.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ASSISTANCE_ACCESSIBILITY).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build());
  List<String> parts=new ArrayList<>();int start=0,limit=Math.min(3000,TextToSpeech.getMaxSpeechInputLength()-1);
  while(start<text.length()){int end=Math.min(start+limit,text.length());if(end<text.length()){int cut=text.lastIndexOf('\n',end);if(cut>start)end=cut;}parts.add(text.substring(start,end));start=end;}
  final String last=token+":"+(parts.size()-1);
  tts.setOnUtteranceProgressListener(new UtteranceProgressListener(){public void onStart(String id){}public void onDone(String id){if(last.equals(id))getActivity().runOnUiThread(()->{if(token==generation&&pending!=null){PluginCall c=pending;pending=null;c.resolve();}});}public void onError(String id){getActivity().runOnUiThread(()->{if(token==generation)fail("Leitura interrompida. A resposta escrita permanece disponível.");});}});
  for(int i=0;i<parts.size();i++)if(tts.speak(parts.get(i),i==0?TextToSpeech.QUEUE_FLUSH:TextToSpeech.QUEUE_ADD,new Bundle(),token+":"+i)!=TextToSpeech.SUCCESS){fail("Não foi possível iniciar a leitura.");break;}
 }catch(Exception e){fail("Leitura indisponível neste aparelho. Confira a resposta escrita.");}}
 private void fail(String message){PluginCall c=pending;pending=null;generation++;if(tts!=null)tts.stop();if(c!=null)c.reject(message);}
 private void stopReading(){generation++;if(tts!=null)tts.stop();if(pending!=null){PluginCall c=pending;pending=null;JSObject r=new JSObject();r.put("cancelled",true);c.resolve(r);}}
 @PluginMethod public void stop(PluginCall call){getActivity().runOnUiThread(()->{stopReading();call.resolve();});}
 @Override protected void handleOnPause(){getActivity().runOnUiThread(this::stopReading);}
 @Override protected void handleOnDestroy(){getActivity().runOnUiThread(()->{stopReading();if(tts!=null){tts.shutdown();tts=null;ready=false;}});}
}
