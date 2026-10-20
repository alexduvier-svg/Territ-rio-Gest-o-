package br.com.territorio.gestao;

import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.PeriodicWorkRequest;
import androidx.work.NetworkType;
import androidx.work.WorkManager;
import java.util.concurrent.TimeUnit;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;

@CapacitorPlugin(name="AgroWeather")
public class AgroWeatherPlugin extends Plugin {
    static final String WORK="agro-weather-cache-v1";
    private final java.util.concurrent.ExecutorService io=java.util.concurrent.Executors.newSingleThreadExecutor();
    @Override protected void handleOnDestroy(){io.shutdownNow();}
    static PeriodicWorkRequest request(){return new PeriodicWorkRequest.Builder(AgroWeatherWorker.class,30,TimeUnit.MINUTES)
        .setInitialDelay(30,TimeUnit.MINUTES)
        .setConstraints(new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).setRequiresBatteryNotLow(true).build()).build();}
    @Override protected void handleOnResume(){AgroWeatherCache.foreground=true;}
    @Override protected void handleOnPause(){AgroWeatherCache.foreground=false;}
    @PluginMethod public void configure(PluginCall call){
        io.execute(()->{try{
            boolean enabled=Boolean.TRUE.equals(call.getBoolean("enabled",false)),active=Boolean.TRUE.equals(call.getBoolean("active",enabled));String city=call.getString("city",""),uf=call.getString("uf","");
            if(active&&!AgroWeatherCache.validLocation(city,uf))throw new IllegalArgumentException();
            synchronized(AgroWeatherCache.class){android.content.SharedPreferences preferences=AgroWeatherCache.prefs(getContext());long generation=preferences.getLong("generation",0)+1;android.content.SharedPreferences.Editor edit=preferences.edit();if(!active)edit.clear();if(!edit.putLong("generation",generation).putBoolean("active",active).putBoolean("enabled",enabled&&active).putString("city",city).putString("uf",uf).commit())throw new IllegalStateException();}
            if(enabled){
                PeriodicWorkRequest work=request();
                WorkManager.getInstance(getContext()).enqueueUniquePeriodicWork(WORK,ExistingPeriodicWorkPolicy.KEEP,work).getResult().get();
            }else WorkManager.getInstance(getContext()).cancelUniqueWork(WORK).getResult().get();
            JSObject out=new JSObject();out.put("scheduled",enabled);out.put("minimumBatteryPercent",50);out.put("approximate",true);out.put("cacheOnly",true);call.resolve(out);
        }catch(Exception e){call.reject("Atualização em segundo plano indisponível; a consulta ao abrir continua funcionando.");}});
    }
    @PluginMethod public void read(PluginCall call){io.execute(()->{JSObject out=new JSObject();out.put("data",AgroWeatherCache.read(getContext(),call.getString("city",""),call.getString("uf","")));call.resolve(out);});}
    @PluginMethod public void forecast(PluginCall call){io.execute(()->{try{JSONObject data=AgroWeatherCache.fetch(getContext(),call.getString("city",""),call.getString("uf",""),false);JSObject out=new JSObject();out.put("data",data);call.resolve(out);}catch(Exception e){call.reject("Previsão indisponível. A última cópia foi preservada.");}});}
}
