package br.com.territorio.gestao;

import android.content.Context;
import android.content.SharedPreferences;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

/** One bounded cache-only synchronization; no MET call or business data. */
public class AgroWeatherWorker extends Worker {
    public AgroWeatherWorker(@NonNull Context c,@NonNull WorkerParameters p){super(c,p);}
    @NonNull @Override public Result doWork(){
        Context c=getApplicationContext();SharedPreferences p=AgroWeatherCache.prefs(c);
        if(isStopped()||!p.getBoolean("enabled",false)||AgroWeatherCache.inForeground()||!AgroWeatherCache.batteryAllowed(AgroWeatherCache.batteryPercent(c)))return Result.success();
        try{AgroWeatherCache.fetch(c,p.getString("city",""),p.getString("uf",""),true);}catch(Exception ignored){}
        // No immediate retry loop. WorkManager may try again at the next eligible period.
        return Result.success();
    }
}
