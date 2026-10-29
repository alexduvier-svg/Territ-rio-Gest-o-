package br.com.territorio.gestao;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.location.LocationManager;
import android.os.CancellationSignal;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.Settings;
import androidx.core.content.ContextCompat;
import androidx.core.location.LocationManagerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.ArrayList;

/**
 * Localização do produtor (Plus Code): uma leitura precisa do GPS, só quando o produtor toca em
 * "Marcar aqui", com o app aberto. Diferente do clima, a posição não é arredondada: o código precisa
 * apontar seu lugar. Nenhum acompanhamento continua depois da leitura ou ao sair do app.
 */
@CapacitorPlugin(name = "AgroPlace", permissions = {
    @Permission(strings = { Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION }, alias = "location")
})
public class AgroPlacePlugin extends Plugin {
    private static final long WAIT_MS = 25000;
    private static final float GOOD_METERS = 20f;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ArrayList<CancellationSignal> signals = new ArrayList<>();
    private PluginCall pending;
    private Location best;
    private final Runnable timeout = () -> finish(best == null ? "timeout" : best.getAccuracy() > 30f ? "low-accuracy" : "ready");

    @PluginMethod
    public void locate(PluginCall call) {
        if (!precise() && ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_COARSE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
            call.resolve(status("approximate-only")); return;
        }
        if (getPermissionState("location") != PermissionState.GRANTED) {
            requestPermissionForAlias("location", call, "afterPermission");
            return;
        }
        begin(call);
    }

    @PermissionCallback
    private void afterPermission(PluginCall call) {
        if (getPermissionState("location") == PermissionState.GRANTED) begin(call);
        else if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_COARSE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED) call.resolve(status("approximate-only"));
        else call.resolve(status("permission-denied"));
    }

    private boolean precise() {
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED;
    }

    private void begin(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            finish("cancelled");
            // Android 12+: a permissão aproximada não serve para confirmar seu lugar.
            if (!precise()) { call.resolve(status("approximate-only")); return; }
            LocationManager manager = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
            if (manager == null || !LocationManagerCompat.isLocationEnabled(manager)) { call.resolve(status("disabled")); return; }
            pending = call;
            best = null;
            main.postDelayed(timeout, WAIT_MS);
            boolean started = false;
            for (String provider : new String[] { LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER }) {
                try {
                    if (!manager.isProviderEnabled(provider)) continue;
                    started = true;
                    request(manager, provider);
                } catch (SecurityException denied) { finish("permission-denied"); return; }
                catch (RuntimeException ignored) { }
            }
            if (!started) finish("disabled");
        });
    }

    /** Pede leituras seguidas do mesmo provedor até chegar a uma boa ou acabar o tempo. */
    private void request(LocationManager manager, String provider) {
        if (pending == null) return;
        CancellationSignal signal = new CancellationSignal();
        signals.add(signal);
        LocationManagerCompat.getCurrentLocation(manager, provider, signal, ContextCompat.getMainExecutor(getContext()), location -> {
            if (pending == null) return;
            if (location != null && location.hasAccuracy() && Float.isFinite(location.getAccuracy())
                && Math.abs(location.getLatitude()) <= 90 && Math.abs(location.getLongitude()) <= 180) {
                long age = SystemClock.elapsedRealtimeNanos() - location.getElapsedRealtimeNanos();
                if (age >= 0 && age < 30_000_000_000L && (best == null || location.getAccuracy() < best.getAccuracy())) best = location;
            }
            if (best != null && best.getAccuracy() <= GOOD_METERS) { finish("ready"); return; }
            main.postDelayed(() -> request(manager, provider), 1500);
        });
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        getActivity().runOnUiThread(() -> { finish("cancelled"); call.resolve(); });
    }

    /** Abre as configurações de localização do Android (localização desligada). */
    @PluginMethod
    public void openSettings(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try { getActivity().startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS)); call.resolve(); }
            catch (Exception e) { call.reject("Configurações indisponíveis."); }
        });
    }

    @Override
    protected void handleOnPause() { getActivity().runOnUiThread(() -> finish("cancelled")); }

    private void stop() {
        main.removeCallbacksAndMessages(null);
        for (CancellationSignal signal : signals) { try { signal.cancel(); } catch (RuntimeException ignored) { } }
        signals.clear();
    }

    private void finish(String state) {
        PluginCall call = pending;
        pending = null;
        stop();
        if (call == null) return;
        JSObject out = status(state);
        if ("low-accuracy".equals(state) && best != null) out.put("accuracyMeters", Math.round(best.getAccuracy()));
        if ("ready".equals(state) && best != null) {
            out.put("latitude", best.getLatitude());
            out.put("longitude", best.getLongitude());
            out.put("accuracyMeters", Math.round(best.getAccuracy()));
            out.put("capturedAt", System.currentTimeMillis());
        }
        best = null;
        call.resolve(out);
    }

    private static JSObject status(String state) {
        JSObject out = new JSObject();
        out.put("status", state);
        return out;
    }
}
