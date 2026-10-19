package br.com.territorio.gestao;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugins locais do app precisam ser registrados antes da ponte iniciar.
        registerPlugin(VoicePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
