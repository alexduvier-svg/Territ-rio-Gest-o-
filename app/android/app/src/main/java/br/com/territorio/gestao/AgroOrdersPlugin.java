package br.com.territorio.gestao;

import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import java.util.concurrent.TimeUnit;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONObject;

/** Optional, periodic arrival notices. Does not load or write the ERP database. */
@CapacitorPlugin(name="AgroOrders")
public class AgroOrdersPlugin extends Plugin {
    static final String WORK="agro-order-arrivals-v1";
    private final java.util.concurrent.ExecutorService io=java.util.concurrent.Executors.newSingleThreadExecutor();
    @Override protected void handleOnDestroy(){io.shutdownNow();}
    @Override protected void handleOnResume(){AgroOrdersWorker.foreground=true;}
    @Override protected void handleOnPause(){AgroOrdersWorker.foreground=false;}
    static PeriodicWorkRequest request(){return new PeriodicWorkRequest.Builder(AgroOrdersWorker.class,15,TimeUnit.MINUTES).setInitialDelay(15,TimeUnit.MINUTES).setConstraints(new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).setRequiresBatteryNotLow(true).build()).build();}
    @PluginMethod public void configure(PluginCall call){io.execute(()->{
        try {
            boolean enabled=Boolean.TRUE.equals(call.getBoolean("enabled",false));
            String actor=call.getString("actor",""),slug=call.getString("slug",""),token=call.getString("token","");
            if(enabled&&(actor.isEmpty()||actor.length()>200||!slug.matches("[a-z0-9-]{3,100}")||!token.matches("[A-Za-z0-9_-]{40,128}")))throw new IllegalArgumentException();
            synchronized(AgroOrdersWorker.class){
                JSONObject old=AgroOrdersWorker.read(getContext()),next=new JSONObject();
                if(enabled){
                    boolean same=actor.equals(old.optString("actor"))&&slug.equals(old.optString("slug"))&&token.equals(old.optString("token"));
                    next=same?old:new JSONObject();next.put("actor",actor);next.put("slug",slug);next.put("token",token);next.put("enabled",true);
                    JSONArray supplied=call.getArray("seen",new com.getcapacitor.JSArray());
                    next.put("seen",AgroOrdersWorker.merge(next.optJSONArray("seen"),supplied));
                    if(!same)next.put("generation",java.util.UUID.randomUUID().toString());
                }
                AgroOrdersWorker.write(getContext(),next);
                AgroOrdersWorker.dismiss(getContext());
            }
            if(enabled){
                PeriodicWorkRequest work=request();
                WorkManager.getInstance(getContext()).enqueueUniquePeriodicWork(WORK,ExistingPeriodicWorkPolicy.KEEP,work).getResult().get();
            }else WorkManager.getInstance(getContext()).cancelUniqueWork(WORK).getResult().get();
            JSObject result=new JSObject();result.put("scheduled",enabled);result.put("approximate",true);result.put("intervalMinutes",15);call.resolve(result);
        }catch(Exception error){call.reject("O aviso em segundo plano não pôde ser ativado. Os pedidos continuam disponíveis ao abrir o app.");}
    });}
    @PluginMethod public void consumeOpen(PluginCall call){
        android.content.Intent intent=getActivity().getIntent();boolean open=intent!=null&&"agro.orders".equals(intent.getAction());
        if(open)intent.setAction(android.content.Intent.ACTION_MAIN);JSObject out=new JSObject();out.put("open",open);call.resolve(out);
    }
}
