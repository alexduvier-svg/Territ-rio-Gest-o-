package br.com.territorio.gestao;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.*;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import javax.crypto.*;
import javax.crypto.spec.GCMParameterSpec;
import javax.net.ssl.HttpsURLConnection;
import org.json.*;

/** Authorized interpretation and fixed tests. No ERP, SQLite or contact access.
 * Receives only the bounded, consented interpretation context from the bridge. */
@CapacitorPlugin(name="AgroGeminiComparison")
public class AgroGeminiComparisonPlugin extends Plugin {
    private static final String MODEL="gemini-3.1-flash-lite",ALIAS="agro-gemini-personal-test-v1";
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private final AtomicBoolean busy=new AtomicBoolean();
    private volatile HttpsURLConnection connection;
    private volatile long generation=0;
    private volatile boolean foreground=true;
    private android.content.SharedPreferences prefs(){return getContext().getSharedPreferences("gemini-personal-test",Context.MODE_PRIVATE);}
    private SecretKey key()throws Exception {
        KeyStore store=KeyStore.getInstance("AndroidKeyStore");store.load(null);
        if(store.containsAlias(ALIAS))return (SecretKey)store.getKey(ALIAS,null);
        KeyGenerator g=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");
        g.init(new KeyGenParameterSpec.Builder(ALIAS,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());return g.generateKey();
    }
    private String credential()throws Exception {
        String value=prefs().getString("credential","");if(value.isEmpty())throw new SecurityException();
        String[] parts=value.split(":");if(parts.length!=2)throw new SecurityException();
        Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.DECRYPT_MODE,key(),new GCMParameterSpec(128,Base64.decode(parts[0],Base64.NO_WRAP)));
        return new String(cipher.doFinal(Base64.decode(parts[1],Base64.NO_WRAP)),StandardCharsets.UTF_8);
    }
    private void stop(){generation++;HttpsURLConnection c=connection;if(c!=null)c.disconnect();}
    @PluginMethod public void status(PluginCall call){JSObject r=new JSObject();r.put("configured",!prefs().getString("credential","").isEmpty());r.put("enabled",prefs().getInt("consentVersion",0)==1);r.put("webEnabled",prefs().getBoolean("webEnabled",false));r.put("businessEnabled",prefs().getInt("businessConsentVersion",0)==1);r.put("lastBusinessAt",prefs().getLong("lastBusinessAt",0));r.put("lastBusinessHttpStatus",prefs().getInt("lastBusinessHttpStatus",0));r.put("lastBusinessStage",prefs().getString("lastBusinessStage","not_called"));r.put("model",MODEL);r.put("busy",busy.get());call.resolve(r);}
    @PluginMethod public void authorize(PluginCall call){
        final String secret=call.getString("key","").trim();
        if(call.getData().length()!=2||call.getInt("consentVersion",0)!=1||!secret.matches("[A-Za-z0-9_-]{25,200}")){call.reject("Informe a chave pessoal somente neste campo do aplicativo.");return;}
        stop();io.execute(()->{try{
            Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,key());
            String encrypted=Base64.encodeToString(cipher.getIV(),Base64.NO_WRAP)+":"+Base64.encodeToString(cipher.doFinal(secret.getBytes(StandardCharsets.UTF_8)),Base64.NO_WRAP);
            if(!prefs().edit().putString("credential",encrypted).putInt("consentVersion",1).putBoolean("webEnabled",false).putInt("businessConsentVersion",0).remove("lastBusinessAt").remove("lastBusinessHttpStatus").remove("lastBusinessStage").commit())throw new IOException();
            call.resolve();
        }catch(Exception e){call.reject("Não foi possível guardar a autorização com a proteção do Android. Nenhuma consulta foi enviada.");}});
    }
    @PluginMethod public void authorizeBusiness(PluginCall call){
        if(call.getData().length()!=1||call.getInt("consentVersion",0)!=1||prefs().getInt("consentVersion",0)!=1||prefs().getString("credential","").isEmpty()){call.reject("Configure a chave do Gemini online antes de autorizar o Gerente.","GEMINI_KEY_MISSING");return;}
        if(prefs().edit().putInt("businessConsentVersion",1).commit())call.resolve();else call.reject("Não foi possível guardar a autorização do Gerente. Nenhuma pergunta foi enviada.");
    }
    @PluginMethod public void revokeBusiness(PluginCall call){
        stop();if(prefs().edit().remove("businessConsentVersion").commit())call.resolve();else call.reject("Não foi possível desativar o Gemini no Gerente.");
    }
    @PluginMethod public void interpretQuestion(PluginCall call){
        final String prompt=call.getString("request","");
        if(call.getData().length()!=1||prompt.isEmpty()||prompt.length()>10000){call.reject("Contexto inválido para a interpretação.");return;}
        if(prefs().getInt("businessConsentVersion",0)!=1){call.reject("Autorize o Gemini no Gerente antes de enviar a pergunta.","GEMINI_BUSINESS_CONSENT_REQUIRED");return;}
        if(!busy.compareAndSet(false,true)){call.reject("Aguarde o encerramento da consulta anterior.","GEMINI_BUSY");return;}
        final long token=generation;
        io.execute(()->{long start=android.os.SystemClock.elapsedRealtime();try{
            JSONObject result=post(request(prompt,false),token,true),candidate=GeminiResponses.candidate(result);
            JSObject r=new JSObject();r.put("raw",text(candidate));r.put("model","gemini-online");r.put("modelName",MODEL+" · online");r.put("scenario","business-interpretation");r.put("synthetic",false);r.put("elapsedMs",android.os.SystemClock.elapsedRealtime()-start);call.resolve(r);
        }catch(Exception e){
            if(token==generation)prefs().edit().putString("lastBusinessStage","failed").apply();
            String message=e instanceof java.net.SocketTimeoutException?"O Gemini não respondeu dentro do tempo limite. Confira a conexão antes de tentar novamente.":e instanceof java.net.UnknownHostException||e instanceof java.net.ConnectException?"Não foi possível conectar ao Gemini. Confira o acesso à internet.":e instanceof IOException?e.getMessage():"O Gemini não retornou um plano de consulta utilizável. Confira o diagnóstico da conexão.";
            call.reject(message,"GEMINI_BUSINESS_FAILED");
        }finally{busy.set(false);}});
    }
    @PluginMethod public void authorizeWeb(PluginCall call){
        if(call.getData().length()!=1||call.getInt("consentVersion",0)!=1||prefs().getInt("consentVersion",0)!=1){call.reject("Autorize primeiro os testes online.");return;}
        if(prefs().edit().putBoolean("webEnabled",true).commit())call.resolve();else call.reject("Não foi possível guardar a preferência.");
    }
    @PluginMethod public void revoke(PluginCall call){stop();io.execute(()->{try{
        if(!prefs().edit().clear().commit())throw new IOException();
        KeyStore store=KeyStore.getInstance("AndroidKeyStore");store.load(null);if(store.containsAlias(ALIAS))store.deleteEntry(ALIAS);call.resolve();
    }catch(Exception e){call.reject("Não foi possível concluir a remoção da credencial. Confira as preferências antes de consultar.");}});}
    @PluginMethod public void cancel(PluginCall call){stop();call.resolve();}
    private JSONObject request(String prompt,boolean research)throws Exception {
        return GeminiResponses.request(prompt,research,research?null:InterpreterBenchmarkCases.asset(getContext(),"public/ai/business-query.schema.json",20000));
    }
    private JSONObject post(JSONObject body,long token)throws Exception {return post(body,token,false);}
    private JSONObject post(JSONObject body,long token,boolean business)throws Exception {
        if(business&&prefs().getInt("businessConsentVersion",0)!=1)throw new SecurityException();
        if(business)prefs().edit().putLong("lastBusinessAt",System.currentTimeMillis()).putInt("lastBusinessHttpStatus",0).putString("lastBusinessStage","sending").apply();
        if(!foreground||token!=generation||prefs().getInt("consentVersion",0)!=1)throw new SecurityException();
        HttpsURLConnection c=(HttpsURLConnection)new URL("https://generativelanguage.googleapis.com/v1beta/models/"+MODEL+":generateContent").openConnection();
        connection=c;c.setInstanceFollowRedirects(false);c.setRequestMethod("POST");c.setConnectTimeout(15000);c.setReadTimeout(45000);c.setDoOutput(true);
        c.setRequestProperty("Content-Type","application/json; charset=utf-8");c.setRequestProperty("x-goog-api-key",credential());
        byte[] bytes=body.toString().getBytes(StandardCharsets.UTF_8);c.setFixedLengthStreamingMode(bytes.length);
        try {
            if(!foreground||token!=generation)throw new InterruptedException();
            try(OutputStream out=c.getOutputStream()){out.write(bytes);}
            int status=c.getResponseCode();
            if(business)prefs().edit().putInt("lastBusinessHttpStatus",status).putString("lastBusinessStage",status==200?"response_received":"http_error").apply();
            if(status!=200){
                String raw="";try(InputStream in=c.getErrorStream()){if(in!=null){ByteArrayOutputStream limited=new ByteArrayOutputStream();byte[] part=new byte[2048];int count;while(limited.size()<16000&&(count=in.read(part,0,Math.min(part.length,16000-limited.size())))!=-1)limited.write(part,0,count);raw=new String(limited.toByteArray(),StandardCharsets.UTF_8);}}
                throw new IOException(GeminiResponses.failure(status,raw));
            }
            ByteArrayOutputStream out=new ByteArrayOutputStream();try(InputStream in=c.getInputStream()){byte[] b=new byte[4096];int n;while((n=in.read(b))!=-1){out.write(b,0,n);if(out.size()>128000)throw new IOException("Resposta acima do limite do teste.");}}
            if(!foreground||token!=generation)throw new InterruptedException();
            return new JSONObject(new String(out.toByteArray(),StandardCharsets.UTF_8));
        }finally{c.disconnect();if(connection==c)connection=null;}
    }
    private static String text(JSONObject candidate)throws Exception {return GeminiResponses.text(candidate);}
    @PluginMethod public void benchmarkCase(PluginCall call){
        final String id=call.getString("id","");if(call.getData().length()!=1){call.reject("Teste inválido.");return;}
        if(!busy.compareAndSet(false,true)){call.reject("Aguarde o encerramento da consulta atual.");return;}
        final long token=generation;
        io.execute(()->{long start=android.os.SystemClock.elapsedRealtime();try{
            String prompt=InterpreterBenchmarkCases.get(getContext(),id).getString("request");
            JSONObject result=post(request(prompt,false),token),candidate=GeminiResponses.candidate(result);
            JSObject r=new JSObject();r.put("raw",text(candidate));r.put("model","gemini-online");r.put("modelName",MODEL+" · online");r.put("scenario","benchmark:"+id);r.put("synthetic",true);r.put("elapsedMs",android.os.SystemClock.elapsedRealtime()-start);call.resolve(r);
        }catch(Exception e){call.reject(e instanceof IOException?e.getMessage():"Teste não concluído. Confira autorização, conexão e acesso ao Gemini. Nenhum resultado foi aprovado.","GEMINI_BENCHMARK_FAILED");}finally{busy.set(false);}});
    }
    @PluginMethod public void research(PluginCall call){
        final String q=call.getString("question","").trim();
        if(call.getData().length()!=1||q.length()<5||q.length()>500||!prefs().getBoolean("webEnabled",false)){call.reject("Confira e autorize a pergunta pública antes de pesquisar.");return;}
        if(!busy.compareAndSet(false,true)){call.reject("Aguarde o encerramento da consulta atual.");return;}
        final long token=generation;io.execute(()->{try{
            String prompt="Pesquisa pública para produtor rural. Não consulte nem presuma registros privados do aplicativo. Responda em português brasileiro, com clareza, ressalvas específicas e data quando relevante. Não invente fontes nem dados atuais ausentes. Se faltar local ou período indispensável, peça apenas essa informação. Pergunta pública: "+q;
            JSONObject result=post(request(prompt,true),token),candidate=GeminiResponses.candidate(result),grounding=candidate.optJSONObject("groundingMetadata");
            JSONArray chunks=grounding==null?new JSONArray():grounding.optJSONArray("groundingChunks"),sources=new JSONArray();
            if(chunks!=null)for(int i=0;i<chunks.length();i++){JSONObject web=chunks.getJSONObject(i).optJSONObject("web");if(web!=null&&web.optString("uri","").startsWith("https://"))sources.put(new JSONObject().put("title",web.optString("title","Fonte consultada")).put("url",web.getString("uri")));}
            if(sources.length()==0)throw new IOException("A pesquisa não retornou fontes verificáveis. Não há resposta externa aprovada para esta tentativa.");
            JSObject r=new JSObject();r.put("text",text(candidate));r.put("sources",sources);r.put("searchEntryPoint",grounding.optJSONObject("searchEntryPoint")!=null?grounding.getJSONObject("searchEntryPoint").optString("renderedContent",""):"");r.put("at",System.currentTimeMillis());r.put("model",MODEL);call.resolve(r);
        }catch(Exception e){call.reject(e instanceof IOException?e.getMessage():"Pesquisa não concluída. Confira conexão, autorização e acesso ao serviço.");}finally{busy.set(false);}});
    }
    @Override protected void handleOnPause(){foreground=false;stop();}
    @Override protected void handleOnResume(){foreground=true;}
    @Override protected void handleOnDestroy(){stop();io.shutdownNow();}
}
