package br.com.territorio.gestao;

import android.content.Context;
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
    @PluginMethod public void schedule(PluginCall call) {
        try {
            PeriodicWorkRequest request=new PeriodicWorkRequest.Builder(AgroAgentReviewWorker.class,24,TimeUnit.HOURS)
                .setConstraints(new Constraints.Builder().setRequiresBatteryNotLow(true).build())
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL,30,TimeUnit.MINUTES).build();
            WorkManager.getInstance(getContext()).enqueueUniquePeriodicWork("agro-agent-daily-v1",ExistingPeriodicWorkPolicy.KEEP,request);
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
        JSObject out=new JSObject();
        android.app.ActivityManager manager=(android.app.ActivityManager)getContext().getSystemService(Context.ACTIVITY_SERVICE);
        android.os.PowerManager power=(android.os.PowerManager)getContext().getSystemService(Context.POWER_SERVICE);
        if(manager!=null){out.put("lowRam",manager.isLowRamDevice());out.put("memoryClassMB",manager.getMemoryClass());}
        if(power!=null){out.put("powerSave",power.isPowerSaveMode());if(android.os.Build.VERSION.SDK_INT>=29)out.put("thermalStatus",power.getCurrentThermalStatus());}
        try { if(getActivity()!=null)out.put("refreshRateHz",getActivity().getWindowManager().getDefaultDisplay().getRefreshRate()); } catch(Exception ignored) {}
        call.resolve(out);
    }
}
