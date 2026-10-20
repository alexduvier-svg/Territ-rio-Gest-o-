package br.com.territorio.gestao;

import android.content.Context;
import android.content.SharedPreferences;
import androidx.work.BackoffPolicy;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

/** Weather kept fresh while the app is closed: one periodic WorkManager job (about every 30 minutes,
 * only with a network and when the battery is not low; Android batches it with other apps). The app
 * reads the saved forecast when it opens. Only the town's coordinates are stored; no location. */
@CapacitorPlugin(name = "AgroWeather")
public class AgroWeatherPlugin extends Plugin {
    static final String PREFS = "agro-weather-v1";
    static final String FILE = "agro-weather-latest.json";
    static final String WORK = "agro-weather-30m";

    @PluginMethod public void schedule(PluginCall call) {
        Double lat = call.getDouble("lat"), lon = call.getDouble("lon");
        if (lat == null || lon == null) { call.reject("Coordenadas da cidade ausentes."); return; }
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String place = String.format(java.util.Locale.US, "%.4f,%.4f", lat, lon);
        SharedPreferences.Editor edit = prefs.edit().putLong("lat", Double.doubleToLongBits(lat)).putLong("lon", Double.doubleToLongBits(lon))
            .putString("agent", call.getString("agent", "AGROGestao github.com/alexduvier-svg/Territ-rio-Gest-o-"));
        // A new town starts fresh: its first check happens on the next run.
        if (!place.equals(prefs.getString("place", ""))) edit.putLong("expires", 0).putString("lastModified", "");
        edit.apply();
        PeriodicWorkRequest request = new PeriodicWorkRequest.Builder(AgroWeatherWorker.class, 30, TimeUnit.MINUTES)
            .setConstraints(new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).setRequiresBatteryNotLow(true).build())
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 15, TimeUnit.MINUTES).build();
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(WORK, ExistingPeriodicWorkPolicy.UPDATE, request);
        JSObject out = new JSObject(); out.put("scheduled", true); out.put("everyMinutes", 30); call.resolve(out);
    }

    @PluginMethod public void cancel(PluginCall call) {
        WorkManager.getInstance(getContext()).cancelUniqueWork(WORK);
        call.resolve();
    }

    /** The forecast saved by the background check, if any (raw MET JSON plus its timestamps). */
    @PluginMethod public void latest(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        JSObject out = new JSObject();
        out.put("fetchedAt", prefs.getLong("fetchedAt", 0));
        out.put("checkedAt", prefs.getLong("checkedAt", 0));
        out.put("expires", prefs.getLong("expires", 0));
        out.put("lastModified", prefs.getString("lastModified", ""));
        out.put("place", prefs.getString("place", ""));
        File file = new File(context.getFilesDir(), FILE);
        try { if (file.exists()) out.put("body", readText(file)); }
        catch (Exception ignored) { }
        call.resolve(out);
    }

    private static String readText(File file) throws java.io.IOException {
        try (FileInputStream in = new FileInputStream(file); ByteArrayOutputStream bytes = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192]; int n;
            while ((n = in.read(buffer)) > 0) bytes.write(buffer, 0, n);
            return new String(bytes.toByteArray(), StandardCharsets.UTF_8);
        }
    }
}
