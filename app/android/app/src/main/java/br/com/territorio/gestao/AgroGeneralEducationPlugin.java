package br.com.territorio.gestao;

import android.util.AtomicFile;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.appcheck.FirebaseAppCheck;
import com.google.firebase.appcheck.playintegrity.PlayIntegrityAppCheckProviderFactory;
import com.google.firebase.ai.FirebaseAI;

import com.google.firebase.ai.java.GenerativeModelFutures;
import com.google.firebase.ai.type.*;
import com.google.common.util.concurrent.ListenableFuture;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.*;

/** Fixed general education only. This plugin has no model/ERP/SQLite/contacts access. */
@CapacitorPlugin(name="AgroGeneralEducation")
public class AgroGeneralEducationPlugin extends Plugin {
    static final String MODEL="gemini-3.1-flash-lite";
    static final Set<String> TOPICS=Collections.unmodifiableSet(new HashSet<>(Arrays.asList("ticket","margin","discount","stock","pdv","crm","cash","fair")));
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private volatile ListenableFuture<GenerateContentResponse> pending;
    private volatile long generation=0;
    private volatile boolean foreground=true;
    private FirebaseApp app;
    private GenerativeModelFutures model;
    private synchronized void cancelRequest(){generation++;if(pending!=null)pending.cancel(true);pending=null;}
    @Override protected void handleOnResume(){foreground=true;}
    @Override protected void handleOnPause(){foreground=false;cancelRequest();}
    @Override protected void handleOnDestroy(){cancelRequest();io.shutdownNow();if(app!=null)app.delete();}
    private boolean configured(){return !getContext().getString(R.string.agro_education_api_key).isEmpty()&&!getContext().getString(R.string.agro_education_app_id).isEmpty();}
    static void validateTopic(JSONObject data) {
        if(data.length()!=1||!(data.opt("topic") instanceof String)||!TOPICS.contains(data.optString("topic")))throw new IllegalArgumentException("Escolha um conceito geral disponível.");
    }
    private File stateFile(){return new File(getContext().getNoBackupFilesDir(),"general-education-v1.json");}
    static JSONObject read(File file,int limit) throws Exception {
        if(!file.isFile()&&!new File(file.getPath()+".bak").isFile())return new JSONObject();
        if(file.length()>limit)throw new IOException();
        try(InputStream in=new AtomicFile(file).openRead();ByteArrayOutputStream out=new ByteArrayOutputStream()){
            byte[] bytes=new byte[2048];int n;while((n=in.read(bytes))!=-1){out.write(bytes,0,n);if(out.size()>limit)throw new IOException();}
            return new JSONObject(out.toString("UTF-8"));
        }
    }
    static void write(File file,JSONObject value) throws Exception {
        AtomicFile atomic=new AtomicFile(file);FileOutputStream stream=null;
        try{stream=atomic.startWrite();stream.write(value.toString().getBytes(StandardCharsets.UTF_8));atomic.finishWrite(stream);}catch(Exception e){if(stream!=null)atomic.failWrite(stream);throw e;}
    }
    private JSONObject state() throws Exception{return read(stateFile(),8192);}
    private static String day(){SimpleDateFormat format=new SimpleDateFormat("yyyy-MM-dd",Locale.ROOT);format.setTimeZone(TimeZone.getTimeZone("America/Sao_Paulo"));return format.format(new Date());}
    private String prompt(String topic) throws Exception {
        try(InputStream in=getContext().getAssets().open("public/knowledge/general-education.json");ByteArrayOutputStream out=new ByteArrayOutputStream()){
            byte[] bytes=new byte[2048];int n;while((n=in.read(bytes))!=-1){out.write(bytes,0,n);if(out.size()>40000)throw new IOException();}
            JSONArray topics=new JSONObject(out.toString("UTF-8")).getJSONArray("topics");
            for(int i=0;i<topics.length();i++){JSONObject row=topics.getJSONObject(i);if(topic.equals(row.getString("id")))return row.getString("question")+" Responda em até 160 palavras, em texto simples, sem Markdown. Não faça perguntas nem solicite dados reais. Identifique claramente qualquer exemplo fictício. Não ofereça comandos ou operações. Neste app, receita é valor vendido após descontos e devoluções, mesmo quando ainda não recebido. Recebimento é entrada de caixa e pode acontecer em outra data. Custo do produto não pode ser descontado outra vez como despesa. Custo ausente não é zero. Uma explicação geral não audita registros, não comprova resultado, não recomenda tributação e não substitui o cálculo local.";}
        }
        throw new IllegalArgumentException();
    }
    private void initialize() {
        if(model!=null)return;
        FirebaseOptions options=new FirebaseOptions.Builder().setApiKey(getContext().getString(R.string.agro_education_api_key)).setApplicationId(getContext().getString(R.string.agro_education_app_id)).setProjectId(getContext().getString(R.string.agro_education_project_id)).setGcmSenderId(getContext().getString(R.string.agro_education_sender_id)).build();
        app=FirebaseApp.initializeApp(getContext(),options,"AGRO-General-Education");
        app.setDataCollectionDefaultEnabled(false);
        FirebaseAppCheck check=FirebaseAppCheck.getInstance(app);
        check.installAppCheckProviderFactory(PlayIntegrityAppCheckProviderFactory.getInstance());
        check.setTokenAutoRefreshEnabled(false);
        GenerationConfig.Builder config=new GenerationConfig.Builder();config.maxOutputTokens=768;config.temperature=0.2f;
        config.thinkingConfig=new ThinkingConfig.Builder().setThinkingLevel(ThinkingLevel.MINIMAL).setIncludeThoughts(false).build();
        model=GenerativeModelFutures.from(FirebaseAI.getInstance(app,GenerativeBackend.googleAI(),true).generativeModel(MODEL,config.build()));
    }
    @PluginMethod public void status(PluginCall call){io.execute(()->{try{JSONObject state=state();JSObject out=new JSObject();out.put("configured",configured());out.put("enabled",state.optBoolean("enabled",false)&&state.optInt("consentVersion")==1);out.put("dailyLimit",10);out.put("sdkInitialized",model!=null);out.put("backgroundRequests",false);call.resolve(out);}catch(Exception e){call.reject("Preferência local indisponível. O conteúdo offline continua disponível.");}});}
    @PluginMethod public void setEnabled(PluginCall call){cancelRequest();io.execute(()->{try{
        JSONObject data=call.getData();if(data.length()!=2||!(data.opt("enabled") instanceof Boolean)||data.optInt("consentVersion")!=1)throw new IllegalArgumentException();
        JSONObject state=state();state.put("enabled",data.getBoolean("enabled"));state.put("consentVersion",1);write(stateFile(),state);JSObject out=new JSObject();out.put("enabled",state.getBoolean("enabled"));call.resolve(out);
    }catch(Exception e){call.reject("Não foi possível guardar a autorização. Nenhuma consulta foi iniciada.");}});}
    @PluginMethod public void cancel(PluginCall call){cancelRequest();call.resolve();}
    @PluginMethod public void explain(PluginCall call){
        try{validateTopic(call.getData());}catch(Exception e){call.reject("Somente um conceito geral fixo pode ser consultado.");return;}
        final long token=generation;final String topic=call.getString("topic");
        io.execute(()->{try{
            if(!configured()||!foreground||token!=generation)throw new IllegalStateException();
            JSONObject state=state();if(!state.optBoolean("enabled",false)||state.optInt("consentVersion")!=1)throw new SecurityException();
            File cacheFile=new File(getContext().getCacheDir(),"general-education-v1-"+topic+".json");JSONObject cache;try{cache=read(cacheFile,24000);}catch(Exception corruptCache){cache=new JSONObject();}long now=System.currentTimeMillis();
            if(MODEL.equals(cache.optString("model"))&&cache.optInt("version")==2&&now-cache.optLong("at",0)<86400000L&&now>=cache.optLong("at",0)&&!cache.optString("text").isEmpty()){
                JSObject out=new JSObject();out.put("text",cache.getString("text"));out.put("cached",true);out.put("generatedAt",cache.getLong("at"));call.resolve(out);return;
            }
            int count=day().equals(state.optString("day"))?state.optInt("count",0):0;
            if(count>=10||now-state.optLong("lastAttempt",0)<30000L)throw new IllegalStateException();
            String question=prompt(topic);state.put("day",day());state.put("count",count+1);state.put("lastAttempt",now);write(stateFile(),state);
            if(!foreground||token!=generation)throw new CancellationException();
            initialize();Content content=new Content.Builder().addText(question).build();
            pending=model.generateContent(content);GenerateContentResponse response=pending.get(15,TimeUnit.SECONDS);pending=null;
            if(!foreground||token!=generation||!state().optBoolean("enabled",false))throw new CancellationException();
            String text=response.getText();if(text==null||text.trim().isEmpty()||text.length()>5000)throw new IOException();
            JSONObject entry=new JSONObject().put("version",2).put("model",MODEL).put("at",now).put("text",text.trim());write(cacheFile,entry);
            JSObject out=new JSObject();out.put("text",text.trim());out.put("cached",false);out.put("generatedAt",now);call.resolve(out);
        }catch(Exception e){if(pending!=null)pending.cancel(true);pending=null;call.reject("Explicação online indisponível ou limite temporário atingido. Use o conteúdo local; não há repetição automática.","GENERAL_EDUCATION_UNAVAILABLE");}});
    }
}
