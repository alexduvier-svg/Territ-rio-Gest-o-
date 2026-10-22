package br.com.territorio.gestao;

import android.content.Context;
import android.content.BroadcastReceiver;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.ComponentCallbacks2;
import android.content.res.Configuration;
import android.app.ActivityManager;
import android.os.Build;
import android.os.PowerManager;
import android.os.BatteryManager;
import android.os.StatFs;
import android.util.AtomicFile;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import androidx.work.BackoffPolicy;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import java.util.concurrent.TimeUnit;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Daily housekeeping only. The existing WebView tools analyze records on reopen.
 * Never opens the microphone, copies the ERP database, sends a message or posts a financial notification. */
@CapacitorPlugin(name="AgroAgentScheduler")
public class AgroAgentSchedulerPlugin extends Plugin {
    static final String PREFS="agro-agent-review-v1";
    private volatile long trimUntil=0;
    private volatile boolean capabilityReady=false;
    private BroadcastReceiver pressureReceiver;
    private PowerManager.OnThermalStatusChangedListener thermalListener;
    private ComponentCallbacks2 memoryCallbacks;
    @Override public void load() {
        memoryCallbacks=new ComponentCallbacks2() {
            public void onConfigurationChanged(Configuration configuration) {}
            public void onLowMemory() { trimUntil=android.os.SystemClock.elapsedRealtime()+120000; changed(); }
            public void onTrimMemory(int level) {
                // UI_HIDDEN/background levels describe lifecycle, not memory pressure.
                if(level==TRIM_MEMORY_RUNNING_LOW||level==TRIM_MEMORY_RUNNING_CRITICAL||level==TRIM_MEMORY_COMPLETE)onLowMemory();
            }
        };
        getContext().registerComponentCallbacks(memoryCallbacks);
        pressureReceiver=new BroadcastReceiver(){public void onReceive(Context c,Intent i){changed();}};
        IntentFilter filter=new IntentFilter();filter.addAction(PowerManager.ACTION_POWER_SAVE_MODE_CHANGED);
        filter.addAction(Intent.ACTION_BATTERY_LOW);filter.addAction(Intent.ACTION_BATTERY_OKAY);
        filter.addAction(Intent.ACTION_POWER_CONNECTED);filter.addAction(Intent.ACTION_POWER_DISCONNECTED);
        filter.addAction(Intent.ACTION_DEVICE_STORAGE_LOW);filter.addAction(Intent.ACTION_DEVICE_STORAGE_OK);
        if(Build.VERSION.SDK_INT>=33)getContext().registerReceiver(pressureReceiver,filter,Context.RECEIVER_NOT_EXPORTED);
        else getContext().registerReceiver(pressureReceiver,filter);
        if(Build.VERSION.SDK_INT>=29){PowerManager power=(PowerManager)getContext().getSystemService(Context.POWER_SERVICE);if(power!=null){thermalListener=status->changed();power.addThermalStatusListener(thermalListener);}}
    }
    private void changed(){if(!capabilityReady)return;execute(()->notifyListeners("capabilityChanged",readCapabilities()));}
    @Override protected void handleOnDestroy(){
        if(memoryCallbacks!=null)getContext().unregisterComponentCallbacks(memoryCallbacks);
        if(pressureReceiver!=null)try{getContext().unregisterReceiver(pressureReceiver);}catch(IllegalArgumentException ignored){}
        if(Build.VERSION.SDK_INT>=29&&thermalListener!=null){PowerManager power=(PowerManager)getContext().getSystemService(Context.POWER_SERVICE);if(power!=null)power.removeThermalStatusListener(thermalListener);}
    }
    @PluginMethod public void schedule(PluginCall call) {
        try {
            PeriodicWorkRequest request=new PeriodicWorkRequest.Builder(AgroAgentReviewWorker.class,24,TimeUnit.HOURS)
                .setConstraints(new Constraints.Builder().setRequiresBatteryNotLow(true).setRequiresStorageNotLow(true).build())
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL,30,TimeUnit.MINUTES).build();
            WorkManager.getInstance(getContext()).enqueueUniquePeriodicWork("agro-agent-daily-v1",ExistingPeriodicWorkPolicy.UPDATE,request);
            JSObject out=new JSObject();out.put("scheduled",true);out.put("approximate",true);call.resolve(out);
        } catch(Exception e) {call.reject("Não foi possível agendar a revisão; ela continua ao abrir o app.");}
    }
    @PluginMethod public void acknowledge(PluginCall call) {
        boolean ok=getContext().getSharedPreferences(PREFS,Context.MODE_PRIVATE).edit().putBoolean("pending",false).putLong("reviewedAt",System.currentTimeMillis()).commit();
        if(ok)call.resolve();else call.reject("Revisão pendente de confirmação.");
    }
    @PluginMethod public void status(PluginCall call) {
        android.content.SharedPreferences prefs=getContext().getSharedPreferences(PREFS,Context.MODE_PRIVATE);
        JSObject out=new JSObject();out.put("pending",prefs.getBoolean("pending",true));out.put("requestedAt",prefs.getLong("requestedAt",0));out.put("reviewedAt",prefs.getLong("reviewedAt",0));call.resolve(out);
    }

    @PluginMethod public void capabilities(PluginCall call) {
        // Capacitor's worker executor; no startup benchmark, file IO or memory scan on UI thread.
        execute(()->{capabilityReady=true;call.resolve(readCapabilities());});
    }
    private JSObject readCapabilities() {
        JSObject out=new JSObject();
        boolean known=false;
        try {
            ActivityManager manager=(ActivityManager)getContext().getSystemService(Context.ACTIVITY_SERVICE);
            PowerManager power=(PowerManager)getContext().getSystemService(Context.POWER_SERVICE);
            if(manager!=null){ActivityManager.MemoryInfo memory=new ActivityManager.MemoryInfo();manager.getMemoryInfo(memory);out.put("lowRam",manager.isLowRamDevice());out.put("memoryClassMB",manager.getMemoryClass());out.put("lowMemory",memory.lowMemory);out.put("availableMemoryBytes",memory.availMem);out.put("memoryThresholdBytes",memory.threshold);}
            if(power!=null){out.put("powerSave",power.isPowerSaveMode());if(Build.VERSION.SDK_INT>=29)out.put("thermalStatus",power.getCurrentThermalStatus());}
            out.put("storageFreeBytes",new StatFs(getContext().getFilesDir().getAbsolutePath()).getAvailableBytes());
            out.put("cores",Runtime.getRuntime().availableProcessors());out.put("apiLevel",Build.VERSION.SDK_INT);
            out.put("trimPressure",android.os.SystemClock.elapsedRealtime()<trimUntil);
            Intent battery=getContext().registerReceiver(null,new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
            if(battery!=null){int level=battery.getIntExtra(BatteryManager.EXTRA_LEVEL,-1),scale=battery.getIntExtra(BatteryManager.EXTRA_SCALE,-1);if(level>=0&&scale>0)out.put("batteryPercent",100.0*level/scale);out.put("charging",battery.getIntExtra(BatteryManager.EXTRA_PLUGGED,0)!=0);}
            known=manager!=null&&power!=null;
        } catch(Exception ignored) { /* Unknown evidence means Essential, never a blocked sale. */ }
        try { if(getActivity()!=null)out.put("refreshRateHz",getActivity().getWindowManager().getDefaultDisplay().getRefreshRate()); } catch(Exception ignored) {}
        out.put("capabilitiesKnown",known);out.put("detectorVersion",2);out.put("generativeAvailable",false);
        boolean pressure=out.optBoolean("lowRam")||out.optBoolean("lowMemory")||out.optBoolean("trimPressure")||out.optBoolean("powerSave")||out.optInt("thermalStatus",0)>=3||out.optLong("storageFreeBytes",0)<128L*1024*1024||(out.optDouble("batteryPercent",100)<=20&&!out.optBoolean("charging"));
        out.put("profile",known&&!pressure?"balanced":"essential");out.put("checkedAt",System.currentTimeMillis());
        // This small non-identifying snapshot never enters business data or Android Auto Backup.
        AtomicFile file=new AtomicFile(new File(getContext().getNoBackupFilesDir(),"agro-capability-v2.json"));
        FileOutputStream stream=null;try{stream=file.startWrite();stream.write(out.toString().getBytes(StandardCharsets.UTF_8));file.finishWrite(stream);}catch(Exception ignored){if(stream!=null)file.failWrite(stream);}
        return out;
    }
}
