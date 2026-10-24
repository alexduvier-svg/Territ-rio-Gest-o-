package br.com.territorio.gestao;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.provider.Settings;
import androidx.core.content.ContextCompat;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
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

@CapacitorPlugin(name="AgroWeather",permissions={@Permission(alias="location",strings={Manifest.permission.ACCESS_COARSE_LOCATION,Manifest.permission.ACCESS_FINE_LOCATION})})
public class AgroWeatherPlugin extends Plugin {
    static final String WORK="agro-weather-cache-v1";
    private final java.util.concurrent.ExecutorService io=java.util.concurrent.Executors.newSingleThreadExecutor();
    private AgroWeatherPosition position;
    private boolean locationGranted(){return ContextCompat.checkSelfPermission(getContext(),Manifest.permission.ACCESS_COARSE_LOCATION)==PackageManager.PERMISSION_GRANTED||ContextCompat.checkSelfPermission(getContext(),Manifest.permission.ACCESS_FINE_LOCATION)==PackageManager.PERMISSION_GRANTED;}
    private boolean preciseGranted(){return ContextCompat.checkSelfPermission(getContext(),Manifest.permission.ACCESS_FINE_LOCATION)==PackageManager.PERMISSION_GRANTED;}
    @Override protected void handleOnDestroy(){if(position!=null)position.cancel();io.shutdownNow();}
    static boolean backgroundEnabled(boolean active,boolean enabled,String city,String uf){return active&&enabled&&AgroWeatherCache.validLocation(city,uf);}
    static PeriodicWorkRequest request(){return new PeriodicWorkRequest.Builder(AgroWeatherWorker.class,30,TimeUnit.MINUTES)
        .setInitialDelay(30,TimeUnit.MINUTES)
        .setConstraints(new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).setRequiresBatteryNotLow(true).build()).build();}
    @Override protected void handleOnResume(){AgroWeatherCache.foreground=true;}
    @Override protected void handleOnPause(){AgroWeatherCache.foreground=false;if(position!=null)position.cancel();}
    @PluginMethod public void configure(PluginCall call){
        io.execute(()->{try{
            boolean enabled=Boolean.TRUE.equals(call.getBoolean("enabled",false)),active=Boolean.TRUE.equals(call.getBoolean("active",enabled));String city=call.getString("city",""),uf=call.getString("uf","");
            enabled=backgroundEnabled(active,enabled,city,uf);
            synchronized(AgroWeatherCache.class){android.content.SharedPreferences preferences=AgroWeatherCache.prefs(getContext());long generation=preferences.getLong("generation",0)+1;android.content.SharedPreferences.Editor edit=preferences.edit();if(!active)edit.clear();if(!edit.putLong("generation",generation).putBoolean("active",active).putBoolean("enabled",enabled&&active).putString("city",city).putString("uf",uf).commit())throw new IllegalStateException();}
            if(enabled){
                PeriodicWorkRequest work=request();
                WorkManager.getInstance(getContext()).enqueueUniquePeriodicWork(WORK,ExistingPeriodicWorkPolicy.KEEP,work).getResult().get();
            }else WorkManager.getInstance(getContext()).cancelUniqueWork(WORK).getResult().get();
            JSObject out=new JSObject();out.put("scheduled",enabled);out.put("minimumBatteryPercent",50);out.put("approximate",true);out.put("cacheOnly",true);call.resolve(out);
        }catch(Exception e){call.reject("Atualização em segundo plano indisponível; a consulta ao abrir continua funcionando.");}});
    }
    @PluginMethod public void locate(PluginCall call){
        if(!locationGranted()){if(Boolean.TRUE.equals(call.getBoolean("requestPermission",false))){requestPermissionForAlias("location",call,"locationPermission");return;}JSObject out=new JSObject();out.put("status","permission-required");call.resolve(out);return;}
        beginLocation(call);
    }
    @PermissionCallback private void locationPermission(PluginCall call){
        if(locationGranted())beginLocation(call);else{JSObject out=new JSObject();out.put("status","permission-denied");call.resolve(out);}
    }
    private void beginLocation(PluginCall call){getActivity().runOnUiThread(()->{
        if(!AgroWeatherCache.inForeground()){JSObject out=new JSObject();out.put("status","cancelled");call.resolve(out);return;}
        if(position==null)position=new AgroWeatherPosition(getContext());
        position.start(preciseGranted(),out->{if("ready".equals(out.optString("status"))&&AgroWeatherCache.inForeground()&&AgroWeatherCache.prefs(getContext()).getBoolean("active",false))AgroWeatherCache.prefs(getContext()).edit().putString("last-point",out.toString()).apply();call.resolve(out);});
    });}
    @PluginMethod public void cancelLocation(PluginCall call){getActivity().runOnUiThread(()->{if(position!=null)position.cancel();call.resolve();});}
    @PluginMethod public void readPosition(PluginCall call){JSObject out=new JSObject();try{if(locationGranted()){String raw=AgroWeatherCache.prefs(getContext()).getString("last-point","");if(!raw.isEmpty())out.put("position",new JSONObject(raw));}}catch(Exception ignored){}call.resolve(out);}
    @PluginMethod public void locationSettings(PluginCall call){getActivity().runOnUiThread(()->{try{getActivity().startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS));call.resolve();}catch(Exception unavailable){call.reject("Abra Localização nos ajustes do Android.");}});}
    @PluginMethod public void read(PluginCall call){io.execute(()->{JSObject out=new JSObject();Double lat=call.getDouble("latitude"),lon=call.getDouble("longitude");out.put("data",lat!=null&&lon!=null?AgroWeatherCache.readPoint(getContext(),lat,lon):AgroWeatherCache.read(getContext(),call.getString("city",""),call.getString("uf","")));call.resolve(out);});}
    @PluginMethod public void forecast(PluginCall call){io.execute(()->{try{Double lat=call.getDouble("latitude"),lon=call.getDouble("longitude");JSONObject data=lat!=null&&lon!=null?AgroWeatherCache.fetchPoint(getContext(),lat,lon):AgroWeatherCache.fetch(getContext(),call.getString("city",""),call.getString("uf",""),false);JSObject out=new JSObject();out.put("data",data);call.resolve(out);}catch(Exception e){call.reject("Previsão indisponível. A última cópia foi preservada.");}});}
}
