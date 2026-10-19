package br.com.territorio.gestao;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AgroVoicePlugin.class);
        registerPlugin(AgroAgentSchedulerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
