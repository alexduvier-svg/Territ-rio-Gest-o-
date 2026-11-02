package br.com.territorio.gestao;

import android.app.ActivityManager;
import android.content.Context;
import android.os.Build;
import android.os.Debug;
import android.os.PowerManager;
import android.os.SystemClock;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.genai.common.FeatureStatus;
import com.google.mlkit.genai.common.DownloadCallback;
import com.google.mlkit.genai.common.GenAiException;
import com.google.mlkit.genai.prompt.Generation;
import com.google.mlkit.genai.prompt.GenerateContentRequest;
import com.google.mlkit.genai.prompt.TextPart;
import com.google.mlkit.genai.prompt.java.GenerativeModelFutures;
import java.io.*;
import java.net.*;
import java.util.Collections;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

/** Gemini Nano (AICore) diagnostics and offline interpretation. Fixed fictional prompts for tests; no ERP bridge.
 *  Qwen was removed in 0.12.148: Gemini online interprets, Nano interprets offline where supported, local engines answer. */
@CapacitorPlugin(name="AgroModelDiagnostics")
public class AgroModelDiagnosticsPlugin extends Plugin {
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private final ScheduledExecutorService timer=Executors.newSingleThreadScheduledExecutor();
    private final AtomicLong generation=new AtomicLong();
    private volatile boolean foreground=true;
    private volatile Future<?> nanoRequest;
    private volatile boolean nanoDownloading=false;
    private volatile String lastNanoStatus="unchecked",lastNanoModel="";
    private volatile long nanoStatusAt=0;
    private boolean arm64(){for(String abi:Build.SUPPORTED_ABIS)if("arm64-v8a".equals(abi))return true;return false;}
    private GenerativeModelFutures nano(){return GenerativeModelFutures.from(Generation.INSTANCE.getClient());}
    private boolean acquire(PluginCall call){if(!LocalInferenceLease.BUSY.compareAndSet(false,true)){call.reject("Aguarde o encerramento da operação de IA atual.");return false;}return true;}
    private void conditions(boolean qwen){
        if(!foreground)throw new IllegalStateException("Volte ao aplicativo para testar.");
        ActivityManager.MemoryInfo m=new ActivityManager.MemoryInfo();((ActivityManager)getContext().getSystemService(Context.ACTIVITY_SERVICE)).getMemoryInfo(m);
        // Initial experimental reserve, not a certified minimum device specification.
        if(m.lowMemory||(qwen&&m.availMem<3L*1024*1024*1024))throw new IllegalStateException("Memória disponível insuficiente agora. Use os motores essenciais.");
        PowerManager p=(PowerManager)getContext().getSystemService(Context.POWER_SERVICE);
        if(p.isPowerSaveMode()||(Build.VERSION.SDK_INT>=29&&p.getCurrentThermalStatus()>=PowerManager.THERMAL_STATUS_MODERATE))throw new IllegalStateException("Economia de energia ou aquecimento: teste adiado.");
    }
    private JSObject resources(){
        ActivityManager.MemoryInfo m=new ActivityManager.MemoryInfo();((ActivityManager)getContext().getSystemService(Context.ACTIVITY_SERVICE)).getMemoryInfo(m);
        PowerManager p=(PowerManager)getContext().getSystemService(Context.POWER_SERVICE);JSObject r=new JSObject();
        r.put("availableBytes",m.availMem);r.put("totalBytes",m.totalMem);r.put("lowMemory",m.lowMemory);r.put("appPssKb",Debug.getPss());r.put("powerSave",p.isPowerSaveMode());r.put("thermalStatus",Build.VERSION.SDK_INT>=29?p.getCurrentThermalStatus():-1);return r;
    }
    @PluginMethod public void status(PluginCall call){io.execute(()->{
        JSObject r=new JSObject();r.put("busy",LocalInferenceLease.BUSY.get());r.put("resources",resources());
        if(call.getBoolean("fast",false)&&SystemClock.elapsedRealtime()-nanoStatusAt<120000&&nanoStatusAt>0){r.put("nanoStatus",lastNanoStatus);if(!lastNanoModel.isEmpty())r.put("nanoModel",lastNanoModel);call.resolve(r);return;}
        try{GenerativeModelFutures n=nano();int s=n.checkStatus().get(12,TimeUnit.SECONDS);String name=s==FeatureStatus.AVAILABLE?"available":s==FeatureStatus.DOWNLOADABLE?"downloadable":s==FeatureStatus.DOWNLOADING?"downloading":"unavailable";lastNanoStatus=name;nanoStatusAt=SystemClock.elapsedRealtime();r.put("nanoStatus",name);if(s==FeatureStatus.AVAILABLE){lastNanoModel=n.getBaseModelName().get(5,TimeUnit.SECONDS);r.put("nanoModel",lastNanoModel);}}
        catch(Throwable e){lastNanoStatus="unavailable";nanoStatusAt=SystemClock.elapsedRealtime();r.put("nanoStatus",nanoDownloading?"downloading":"unavailable");r.put("nanoNote","AICore não confirmou disponibilidade neste aparelho.");}
        call.resolve(r);
    });}
    @PluginMethod public void downloadNano(PluginCall call){
        if(!acquire(call))return;final long token=generation.incrementAndGet();nanoDownloading=true;
        io.execute(()->{try{
            if(!foreground)throw new IllegalStateException();
            GenerativeModelFutures n=nano();int s=n.checkStatus().get(12,TimeUnit.SECONDS);
            if(s==FeatureStatus.AVAILABLE){call.resolve();return;}
            if(s!=FeatureStatus.DOWNLOADABLE||token!=generation.get()||!foreground)throw new IllegalStateException();
            nanoRequest=n.download(new DownloadCallback(){public void onDownloadStarted(long size){}public void onDownloadProgress(long size){}public void onDownloadCompleted(){}public void onDownloadFailed(GenAiException e){}});
            nanoRequest.get(5,TimeUnit.MINUTES);
            if(token!=generation.get()||!foreground)throw new IllegalStateException();call.resolve();
        }catch(Throwable e){call.reject("O Android não concluiu a preparação do Gemini Nano. Verifique a disponibilidade novamente. O AICore gerencia o download.");}
        finally{nanoDownloading=false;nanoRequest=null;LocalInferenceLease.BUSY.set(false);}});
    }
    private static String prompt(String scenario){
        if("compound".equals(scenario))return "Você é um interpretador de consultas em português brasileiro. Classifique a pergunta abaixo. Não calcule nem explique. Retorne somente JSON, sem markdown, com exatamente as chaves estoque, vendas, cnpjs (booleanos) e periodo (mes_atual ou indefinido). Pergunta: Quantos peixes tenho hoje, quantos vendi neste mês e para quantos CNPJs diferentes vendi esses produtos?";
        if("empty".equals(scenario))return "Cenário fictício do AGRO Gestão: o produtor zerou os dados e escolheu começar do zero. Não há produtos, vendas ou estoque registrados. Pergunta: Quanto vendi e quantos produtos tenho? Não invente números e não recupere exemplos. Retorne somente JSON, sem markdown, com exatamente situacao, acao, usaExemplos. Use situacao=sem_registros, acao=cadastrar_produtos e usaExemplos=false quando não houver registros.";
        throw new IllegalArgumentException("Cenário inválido.");
    }
    @PluginMethod public void testModel(PluginCall call){
        String model=call.getString("model",""),scenario=call.getString("scenario","");
        if(call.getData().length()!=2||!"nano".equals(model)||!("compound".equals(scenario)||"empty".equals(scenario))){call.reject("Teste inválido.");return;}
        generate(call,model,scenario,prompt(scenario),true);
    }
    @PluginMethod public void interpretQuestion(PluginCall call){
        String model=call.getString("model",""),request=call.getString("request","");
        if(call.getData().length()!=2||!"nano".equals(model)||request.isEmpty()||request.length()>10000){call.reject("Interpretação inválida.");return;}
        generate(call,model,"business-interpretation",request,false);
    }
    @PluginMethod public void benchmarkCase(PluginCall call){
        try{
            if(call.getData().length()!=1)throw new IllegalArgumentException();
            String id=call.getString("id","");
            String request=InterpreterBenchmarkCases.get(getContext(),id).getString("request");
            generate(call,"nano","benchmark:"+id,request,true);
        }catch(Exception e){call.reject("Pergunta de teste não cadastrada.");}
    }
    private void generate(PluginCall call,String model,String scenario,String promptText,boolean synthetic){
        if(!acquire(call))return;final long token=generation.incrementAndGet();
        io.execute(()->{ScheduledFuture<?> deadline=null,watch=null;long started=SystemClock.elapsedRealtime();String stage="recursos do aparelho";
            try{conditions(false);
                JSObject before=resources();deadline=timer.schedule(()->{if(token==generation.get())stop();},60,TimeUnit.SECONDS);
                watch=timer.scheduleWithFixedDelay(()->{if(token==generation.get())try{conditions(false);}catch(Throwable e){stop();}},1,1,TimeUnit.SECONDS);
                String text,modelName;long initialized;
                {
                    stage="interpretação da pergunta";GenerativeModelFutures n=nano();if(n.checkStatus().get(12,TimeUnit.SECONDS)!=FeatureStatus.AVAILABLE)throw new IllegalStateException("Gemini Nano indisponível no AICore.");
                    modelName=n.getBaseModelName().get(5,TimeUnit.SECONDS);initialized=SystemClock.elapsedRealtime();if(token!=generation.get()||!foreground)throw new IllegalStateException();
                    GenerateContentRequest.Builder request=new GenerateContentRequest.Builder(new TextPart(promptText));request.setTemperature(0.0f);request.setCandidateCount(1);request.setMaxOutputTokens(synthetic&&!scenario.startsWith("benchmark:")?192:512);request.setEnableThinking(false);
                    com.google.common.util.concurrent.ListenableFuture<com.google.mlkit.genai.prompt.GenerateContentResponse> response=n.generateContent(request.build());nanoRequest=response;
                    text=response.get(Math.max(1,60000-(SystemClock.elapsedRealtime()-started)),TimeUnit.MILLISECONDS).getCandidates().get(0).getText();
                }
                if(token!=generation.get()||!foreground)throw new IllegalStateException("Teste cancelado.");conditions(false);
                stage="conferência da saída";if(text==null||text.length()>4000)throw new IllegalStateException("Saída inválida.");
                JSObject r=new JSObject();r.put("raw",text);r.put("model",model);r.put("modelName",modelName);r.put("scenario",scenario);r.put("elapsedMs",SystemClock.elapsedRealtime()-started);r.put("setupMs",initialized-started);r.put("before",before);r.put("after",resources());r.put("synthetic",synthetic);call.resolve(r);
            }catch(Throwable e){call.reject("Gemini Nano não concluiu a etapa de "+stage+". O modelo não foi aprovado por esta tentativa. Confira os testes dos modelos; os registros foram preservados.","MODEL_EXECUTION_FAILED");}
            finally{if(deadline!=null)deadline.cancel(false);if(watch!=null)watch.cancel(false);Future<?> pending=nanoRequest;if(pending!=null&&!pending.isDone())pending.cancel(true);nanoRequest=null;LocalInferenceLease.BUSY.set(false);}
        });
    }
    private void stop(){generation.incrementAndGet();Future<?> n=nanoRequest;if(n!=null)n.cancel(true);}
    @PluginMethod public void cancel(PluginCall call){stop();call.resolve();}
    @Override protected void handleOnPause(){foreground=false;stop();}
    @Override protected void handleOnResume(){foreground=true;}
    @Override protected void handleOnDestroy(){stop();io.shutdownNow();timer.shutdownNow();}
}
