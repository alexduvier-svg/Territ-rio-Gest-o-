package br.com.territorio.gestao;

import android.content.Context;
import android.location.Location;
import android.location.LocationManager;
import android.os.CancellationSignal;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import androidx.core.content.ContextCompat;
import androidx.core.location.LocationManagerCompat;
import com.getcapacitor.JSObject;
import java.util.ArrayList;

/** One bounded foreground request; no listener survives completion or pause. */
final class AgroWeatherPosition {
    interface Result { void complete(JSObject result); }
    private final Context context;
    private final Handler main=new Handler(Looper.getMainLooper());
    private final ArrayList<CancellationSignal> signals=new ArrayList<>();
    private Result result;
    private Location best;
    private boolean fine;
    private final Runnable timeout=()->finish(best==null?"unavailable":"ready");
    AgroWeatherPosition(Context context){this.context=context;}
    static double rounded(double value){return Math.round(value*1000d)/1000d+0d;}
    static boolean valid(double latitude,double longitude){return Double.isFinite(latitude)&&Double.isFinite(longitude)&&Math.abs(latitude)<=90&&Math.abs(longitude)<=180;}
    void start(boolean precise,Result callback){
        cancel();fine=precise;result=callback;best=null;
        LocationManager manager;
        try{manager=(LocationManager)context.getSystemService(Context.LOCATION_SERVICE);
            if(manager==null||!LocationManagerCompat.isLocationEnabled(manager)){finish("disabled");return;}
        }catch(RuntimeException unavailable){finish("unavailable");return;}
        main.postDelayed(timeout,12000);
        // Network is useful indoors/imported phones; GPS can improve it without a Google SDK.
        String[] providers=precise?new String[]{LocationManager.NETWORK_PROVIDER,LocationManager.GPS_PROVIDER}:new String[]{LocationManager.NETWORK_PROVIDER};
        for(String provider:providers){
            if(result==null)break;
            try{if(!manager.isProviderEnabled(provider))continue;CancellationSignal signal=new CancellationSignal();signals.add(signal);
                LocationManagerCompat.getCurrentLocation(manager,provider,signal,ContextCompat.getMainExecutor(context),location->{
                    if(result==null||location==null||!valid(location.getLatitude(),location.getLongitude())||!location.hasAccuracy()||!Float.isFinite(location.getAccuracy())||location.getAccuracy()<0||location.getAccuracy()>10000)return;
                    long age=SystemClock.elapsedRealtimeNanos()-location.getElapsedRealtimeNanos();if(age<0||age>60000000000L)return;
                    if(best==null||location.getAccuracy()<best.getAccuracy())best=location;
                    if(!fine||best.getAccuracy()<=100)finish("ready");
                });
            }catch(SecurityException denied){finish("permission-denied");return;}catch(RuntimeException unavailable){}
        }
        if(signals.isEmpty()&&result!=null)finish("unavailable");
    }
    void cancel(){if(result!=null)finish("cancelled");}
    private void finish(String status){
        Result callback=result;if(callback==null)return;result=null;main.removeCallbacks(timeout);
        for(CancellationSignal signal:signals){try{signal.cancel();}catch(RuntimeException ignored){}}signals.clear();
        JSObject out=new JSObject();out.put("status",status);
        if("ready".equals(status)&&best!=null){
            out.put("latitude",rounded(best.getLatitude()));out.put("longitude",rounded(best.getLongitude()));
            out.put("accuracyMeters",Math.max(150,(int)Math.ceil(best.getAccuracy()+80)));out.put("approximate",!fine);
            out.put("capturedAt",System.currentTimeMillis());out.put("gridDecimals",3);
        }
        best=null;callback.complete(out);
    }
}
