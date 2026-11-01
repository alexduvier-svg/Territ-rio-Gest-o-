package br.com.territorio.gestao;

import android.app.ActivityManager;
import android.content.Context;
import android.os.Build;
import android.os.Debug;
import android.os.PowerManager;
import android.os.SystemClock;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.ai.edge.litertlm.*;
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

/** Explicit on-phone benchmarks. Fixed fictional prompts only; no ERP bridge. */
@CapacitorPlugin(name="AgroModelDiagnostics")
public class AgroModelDiagnosticsPlugin extends Plugin {
    private static final long BYTES=497516544L;
    private static final String SHA="7900eb4e7362d88c58782c6f9999bb7a129e03544aa98b8f338ea0cc5d8c22c1";
    private static final String URL_MODEL="https://huggingface.co/litert-community/Qwen3-0.6B/resolve/2670e142a0d16a1b685be6604e5b4f2b31a826d7/qwen3_0_6b_mixed_int4.litertlm";
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private final ScheduledExecutorService timer=Executors.newSingleThreadScheduledExecutor();
    private final AtomicLong generation=new AtomicLong();
    private volatile boolean foreground=true;
    private volatile Conversation activeConversation;
    private volatile Future<?> nanoRequest;
    private volatile boolean nanoDownloading=false;
    private volatile String lastNanoStatus="unchecked",lastNanoModel="";
    private volatile long nanoStatusAt=0;
    private File file(){return new File(getContext().getNoBackupFilesDir(),"qwen3-06-int4-7900eb4e.litertlm");}
    private android.content.SharedPreferences prefs(){return getContext().getSharedPreferences("model-diagnostics",0);}
    private boolean ready(){return file().isFile()&&file().length()==BYTES&&SHA.equals(prefs().getString("sha",""));}
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
        JSObject r=new JSObject();r.put("qwenReady",ready());r.put("qwenBytes",BYTES);r.put("qwenSupported",arm64());r.put("busy",LocalInferenceLease.BUSY.get());r.put("resources",resources());
        if(call.getBoolean("fast",false)&&(ready()||SystemClock.elapsedRealtime()-nanoStatusAt<120000&&nanoStatusAt>0)){r.put("nanoStatus",lastNanoStatus);if(!lastNanoModel.isEmpty())r.put("nanoModel",lastNanoModel);call.resolve(r);return;}
        try{GenerativeModelFutures n=nano();int s=n.checkStatus().get(12,TimeUnit.SECONDS);String name=s==FeatureStatus.AVAILABLE?"available":s==FeatureStatus.DOWNLOADABLE?"downloadable":s==FeatureStatus.DOWNLOADING?"downloading":"unavailable";lastNanoStatus=name;nanoStatusAt=SystemClock.elapsedRealtime();r.put("nanoStatus",name);if(s==FeatureStatus.AVAILABLE){lastNanoModel=n.getBaseModelName().get(5,TimeUnit.SECONDS);r.put("nanoModel",lastNanoModel);}}
        catch(Throwable e){lastNanoStatus="unavailable";nanoStatusAt=SystemClock.elapsedRealtime();r.put("nanoStatus",nanoDownloading?"downloading":"unavailable");r.put("nanoNote","AICore não confirmou disponibilidade neste aparelho.");}
        call.resolve(r);
    });}
    private HttpURLConnection connect()throws IOException{
        URL u=new URL(URL_MODEL);
        for(int redirects=0;redirects<=5;redirects++){
            if(!ModelDownloadPolicy.allowed(u))throw new IOException("Destino do modelo não autorizado.");
            HttpURLConnection c=(HttpURLConnection)u.openConnection();c.setInstanceFollowRedirects(false);c.setConnectTimeout(15000);c.setReadTimeout(15000);c.setRequestProperty("Accept-Encoding","identity");
            int status=c.getResponseCode();
            if(status==200){long size=c.getContentLengthLong();if(size>0&&size!=BYTES){c.disconnect();throw new IOException("Tamanho do modelo diferente do autorizado.");}return c;}
            String location=c.getHeaderField("Location");c.disconnect();
            if(!java.util.Arrays.asList(301,302,303,307,308).contains(status)||location==null)throw new IOException("Não foi possível baixar o modelo. Tente novamente em uma rede estável.");
            u=new URL(u,location);
        }throw new IOException("Redirecionamentos excessivos.");
    }
    private void progress(String phase,long bytes){JSObject r=new JSObject();r.put("phase",phase);r.put("bytes",bytes);r.put("total",BYTES);notifyListeners("progress",r);}
    @PluginMethod public void downloadQwen(PluginCall call){
        if(call.getData().length()!=0||!arm64()){call.reject("Teste Qwen requer Android de 64 bits.");return;}if(!acquire(call))return;
        final long token=generation.incrementAndGet();io.execute(()->{HttpURLConnection c=null;
            try{if(!foreground)throw new IOException("Volte ao aplicativo para baixar.");
                if(!ready()){
                    if(file().getParentFile().getUsableSpace()<BYTES+256L*1024*1024)throw new IOException("Libere pelo menos 755 MB para preparar o modelo de teste.");
                    c=connect();progress("downloading",0);
                    try(InputStream raw=c.getInputStream();InputStream source=new FilterInputStream(raw){long count=0,last=0;@Override public int read(byte[] b,int off,int len)throws IOException{int n=super.read(b,off,len);if(n>0){count+=n;long t=SystemClock.elapsedRealtime();if(t-last>250){last=t;progress("downloading",count);}}return n;}}){
                        LocalModelFile.install(source,new File(getContext().getNoBackupFilesDir(),"qwen3-06-download.part"),file(),BYTES,SHA,()->token!=generation.get()||!foreground);
                    }
                    if(token!=generation.get()||!foreground)throw new IOException("Preparação cancelada.");
                    if(!prefs().edit().putString("sha",SHA).commit())throw new IOException("Não foi possível confirmar a instalação.");
                }progress("ready",BYTES);call.resolve();
            }catch(Throwable e){call.reject("Download não concluído. Confira rede, espaço e primeiro plano; tente novamente. A cópia incompleta não é ativada.");}
            finally{if(c!=null)c.disconnect();LocalInferenceLease.BUSY.set(false);}
        });
    }
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
        if(call.getData().length()!=2||!("qwen06".equals(model)||"nano".equals(model))||!("compound".equals(scenario)||"empty".equals(scenario))){call.reject("Teste inválido.");return;}
        generate(call,model,scenario,prompt(scenario),true);
    }
    @PluginMethod public void interpretQuestion(PluginCall call){
        String model=call.getString("model",""),request=call.getString("request","");
        if(call.getData().length()!=2||!("qwen06".equals(model)||"nano".equals(model))||request.isEmpty()||request.length()>10000){call.reject("Interpretação inválida.");return;}
        generate(call,model,"business-interpretation",request,false);
    }
    private void generate(PluginCall call,String model,String scenario,String promptText,boolean synthetic){
        if(!acquire(call))return;final long token=generation.incrementAndGet();final boolean qwen="qwen06".equals(model);
        io.execute(()->{Engine engine=null;Conversation conversation=null;ScheduledFuture<?> deadline=null,watch=null;long started=SystemClock.elapsedRealtime();
            try{conditions(qwen);if(qwen&&(!arm64()||!ready()))throw new IllegalStateException("Prepare o Qwen 0.6B primeiro.");
                JSObject before=resources();deadline=timer.schedule(()->{if(token==generation.get())stop();},60,TimeUnit.SECONDS);
                watch=timer.scheduleWithFixedDelay(()->{if(token==generation.get())try{conditions(qwen);}catch(Throwable e){stop();}},1,1,TimeUnit.SECONDS);
                String text,modelName;long initialized;
                if(qwen){
                    engine=new Engine(new EngineConfig(file().getAbsolutePath(),new Backend.CPU(2,null),null,null,2048,null,getContext().getCacheDir().getAbsolutePath()));engine.initialize();
                    if(token!=generation.get())throw new IllegalStateException();conditions(true);initialized=SystemClock.elapsedRealtime();
                    conversation=engine.createConversation(new ConversationConfig());activeConversation=conversation;
                    if(token!=generation.get())throw new IllegalStateException();
                    text=conversation.sendMessage(promptText,Collections.emptyMap(),null,null,null,synthetic?192:512,new ThinkingConfig(false,0)).toString();modelName="Qwen3-0.6B INT4 · CPU";
                }else{
                    GenerativeModelFutures n=nano();if(n.checkStatus().get(12,TimeUnit.SECONDS)!=FeatureStatus.AVAILABLE)throw new IllegalStateException("Gemini Nano indisponível no AICore.");
                    modelName=n.getBaseModelName().get(5,TimeUnit.SECONDS);initialized=SystemClock.elapsedRealtime();if(token!=generation.get()||!foreground)throw new IllegalStateException();
                    GenerateContentRequest.Builder request=new GenerateContentRequest.Builder(new TextPart(promptText));request.setTemperature(0.0f);request.setCandidateCount(1);request.setMaxOutputTokens(synthetic?192:512);request.setEnableThinking(false);
                    com.google.common.util.concurrent.ListenableFuture<com.google.mlkit.genai.prompt.GenerateContentResponse> response=n.generateContent(request.build());nanoRequest=response;
                    text=response.get(Math.max(1,60000-(SystemClock.elapsedRealtime()-started)),TimeUnit.MILLISECONDS).getCandidates().get(0).getText();
                }
                if(token!=generation.get()||!foreground)throw new IllegalStateException("Teste cancelado.");conditions(qwen);
                if(text==null||text.length()>4000)throw new IllegalStateException("Saída inválida.");
                JSObject r=new JSObject();r.put("raw",text);r.put("model",model);r.put("modelName",modelName);r.put("scenario",scenario);r.put("elapsedMs",SystemClock.elapsedRealtime()-started);r.put("setupMs",initialized-started);r.put("before",before);r.put("after",resources());r.put("synthetic",synthetic);call.resolve(r);
            }catch(Throwable e){call.reject("Teste não concluído: modelo indisponível, cancelamento, limite de tempo ou recursos. Os motores do aplicativo continuam disponíveis.");}
            finally{if(deadline!=null)deadline.cancel(false);if(watch!=null)watch.cancel(false);activeConversation=null;Future<?> pending=nanoRequest;if(pending!=null&&!pending.isDone())pending.cancel(true);nanoRequest=null;try{if(conversation!=null)conversation.close();}catch(Throwable ignored){}try{if(engine!=null)engine.close();}catch(Throwable ignored){}LocalInferenceLease.BUSY.set(false);}
        });
    }
    private void stop(){generation.incrementAndGet();Conversation c=activeConversation;if(c!=null)try{c.cancelProcess();}catch(Throwable ignored){}Future<?> n=nanoRequest;if(n!=null)n.cancel(true);}
    @PluginMethod public void cancel(PluginCall call){stop();call.resolve();}
    @Override protected void handleOnPause(){foreground=false;stop();}
    @Override protected void handleOnResume(){foreground=true;}
    @Override protected void handleOnDestroy(){stop();io.shutdownNow();timer.shutdownNow();}
}
