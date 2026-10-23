package br.com.territorio.gestao;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override protected void onNewIntent(android.content.Intent intent) { super.onNewIntent(intent); setIntent(intent); }
    @Override public void onCreate(Bundle savedInstanceState) {

        registerPlugin(AgroAgentSchedulerPlugin.class);
        registerPlugin(AgroWeatherPlugin.class);
        registerPlugin(AgroOrdersPlugin.class);
        registerPlugin(AgroDocumentsPlugin.class);
        registerPlugin(AgroCalendarPlugin.class);
        registerPlugin(AgroGeneralEducationPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
