package br.com.territorio.gestao;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override protected void onNewIntent(android.content.Intent intent) { super.onNewIntent(intent); setIntent(intent); }
    @Override public void onCreate(Bundle savedInstanceState) {

        registerPlugin(AgroAgentSchedulerPlugin.class);
        registerPlugin(AgroDocumentsPlugin.class);
        registerPlugin(AgroWeatherPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
