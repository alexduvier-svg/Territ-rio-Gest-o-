package br.com.territorio.gestao;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override protected void onNewIntent(android.content.Intent intent) { super.onNewIntent(intent); setIntent(intent); }
    @Override public void onCreate(Bundle savedInstanceState) {

        registerPlugin(AgroAgentSchedulerPlugin.class);
        registerPlugin(AgroWeatherPlugin.class);
        registerPlugin(AgroPlacePlugin.class);
        registerPlugin(AgroOrdersPlugin.class);
        registerPlugin(AgroDocumentsPlugin.class);
        registerPlugin(AgroCalendarPlugin.class);
        registerPlugin(AgroGeneralEducationPlugin.class);
        registerPlugin(AgroLocalIntelligencePlugin.class);
        // Optional test flavor only: keep Nano dependencies out of the original edition.
        try {
            Class<?> diagnostics=Class.forName("br.com.territorio.gestao.AgroModelDiagnosticsPlugin");
            registerPlugin(diagnostics.asSubclass(com.getcapacitor.Plugin.class));
            Class<?> comparison=Class.forName("br.com.territorio.gestao.AgroGeminiComparisonPlugin");
            registerPlugin(comparison.asSubclass(com.getcapacitor.Plugin.class));
        } catch (ClassNotFoundException ignored) { /* Essential editions have no model lab. */ }
        super.onCreate(savedInstanceState);
    }
}
