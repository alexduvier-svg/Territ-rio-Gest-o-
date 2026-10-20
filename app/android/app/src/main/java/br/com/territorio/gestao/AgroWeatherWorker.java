package br.com.territorio.gestao;

import android.content.Context;
import android.content.SharedPreferences;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;

/** One short weather check, scheduled by WorkManager about every 30 minutes, only with a network
 * and when the battery is not low. It asks MET Norway only after the previous forecast expired,
 * sends If-Modified-Since (an unchanged forecast costs a few bytes), saves the answer for the app
 * to read when it opens, and ends. No service keeps running and nothing wakes the screen. */
public class AgroWeatherWorker extends Worker {
    public AgroWeatherWorker(@NonNull Context context, @NonNull WorkerParameters params) { super(context, params); }

    @NonNull @Override public Result doWork() {
        Context context = getApplicationContext();
        SharedPreferences prefs = context.getSharedPreferences(AgroWeatherPlugin.PREFS, Context.MODE_PRIVATE);
        double lat = Double.longBitsToDouble(prefs.getLong("lat", Double.doubleToLongBits(Double.NaN)));
        double lon = Double.longBitsToDouble(prefs.getLong("lon", Double.doubleToLongBits(Double.NaN)));
        if (Double.isNaN(lat) || Double.isNaN(lon) || isStopped()) return Result.success();
        long now = System.currentTimeMillis();
        if (now < prefs.getLong("expires", 0)) return Result.success(); // still valid: no network at all
        // Battery steps (the radio is the costly part): charging or above 50% every 30 min; 20–50%
        // every 2 h; below 20% or with battery saver on, no check (the last forecast stays shown).
        long every = batteryInterval(context);
        if (every < 0 || now - prefs.getLong("fetchedAt", 0) < every) return Result.success();
        HttpURLConnection connection = null;
        try {
            URL url = new URL(String.format(Locale.US, "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=%.4f&lon=%.4f", lat, lon));
            connection = (HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(12000);
            connection.setReadTimeout(15000);
            connection.setRequestProperty("User-Agent", prefs.getString("agent", "AGROGestao github.com/alexduvier-svg/Territ-rio-Gest-o-"));
            connection.setRequestProperty("Accept", "application/json");
            String lastModified = prefs.getString("lastModified", "");
            if (!lastModified.isEmpty() && new File(context.getFilesDir(), AgroWeatherPlugin.FILE).exists()) connection.setRequestProperty("If-Modified-Since", lastModified);
            int status = connection.getResponseCode();
            long expires = connection.getHeaderFieldDate("Expires", now + 30 * 60000L);
            SharedPreferences.Editor edit = prefs.edit().putLong("checkedAt", now).putLong("expires", Math.max(expires, now + 10 * 60000L));
            if (status == 304) { edit.putLong("fetchedAt", now).apply(); return Result.success(); }
            if (status < 200 || status >= 300) { edit.apply(); return status == 429 || status >= 500 ? retryOnce() : Result.success(); }
            byte[] body = read(connection.getInputStream());
            if (isStopped()) return Result.success();
            File target = new File(context.getFilesDir(), AgroWeatherPlugin.FILE), temp = new File(context.getFilesDir(), AgroWeatherPlugin.FILE + ".tmp");
            try (FileOutputStream out = new FileOutputStream(temp)) { out.write(body); }
            if (!temp.renameTo(target)) { target.delete(); temp.renameTo(target); }
            String modified = connection.getHeaderField("Last-Modified");
            edit.putLong("fetchedAt", now).putString("lastModified", modified == null ? "" : modified)
                .putString("place", String.format(Locale.US, "%.4f,%.4f", lat, lon)).apply();
            return Result.success();
        } catch (Exception error) {
            return retryOnce();
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private Result retryOnce() { return getRunAttemptCount() < 1 ? Result.retry() : Result.success(); }

    /** Minimum time between checks for the current battery, or -1 when the app must not check. */
    static long batteryInterval(Context context) {
        android.os.PowerManager power = (android.os.PowerManager) context.getSystemService(Context.POWER_SERVICE);
        android.content.Intent battery = context.registerReceiver(null, new android.content.IntentFilter(android.content.Intent.ACTION_BATTERY_CHANGED));
        if (battery == null) return 30 * 60000L;
        int level = battery.getIntExtra(android.os.BatteryManager.EXTRA_LEVEL, -1), scale = battery.getIntExtra(android.os.BatteryManager.EXTRA_SCALE, 100);
        int status = battery.getIntExtra(android.os.BatteryManager.EXTRA_STATUS, -1);
        boolean charging = status == android.os.BatteryManager.BATTERY_STATUS_CHARGING || status == android.os.BatteryManager.BATTERY_STATUS_FULL;
        if (charging) return 30 * 60000L;
        if (power != null && power.isPowerSaveMode()) return -1;
        int percent = level >= 0 && scale > 0 ? level * 100 / scale : 100;
        if (percent < 20) return -1;
        return percent < 50 ? 2 * 60 * 60000L : 30 * 60000L;
    }

    private static byte[] read(InputStream in) throws java.io.IOException {
        try (InputStream input = in; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int n, total = 0;
            while ((n = input.read(buffer)) > 0) { total += n; if (total > 2_000_000) throw new java.io.IOException("too large"); out.write(buffer, 0, n); }
            return out.toByteArray();
        }
    }
}
