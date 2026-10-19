package br.com.territorio.gestao;

import android.Manifest;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONObject;
import org.vosk.Model;
import org.vosk.Recognizer;
import org.vosk.android.SpeechService;
import org.vosk.android.StorageService;

import java.io.IOException;
import java.util.ArrayList;

/**
 * Voz do AGRO Gestão: um controlador, dois motores (reconhecimento local do Android e Vosk offline).
 * Uma escuta por vez; o resultado final vai para o JavaScript, que só monta uma proposta de venda.
 * Nenhum áudio é gravado em arquivo. Eventos "voice": state, partial, final, level, error, engine.
 */
@CapacitorPlugin(name = "Voice", permissions = {
    @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "microphone")
})
public class VoicePlugin extends Plugin {
    private static final String MODEL_ASSET = "model-pt";
    private static final float SAMPLE_RATE = 16000.0f;

    private Model voskModel;
    private boolean voskPreparing;
    private SpeechService voskService;
    private SpeechRecognizer androidRecognizer;
    private String activeEngine;
    /** Palavras possíveis da venda (catálogo + números + medidas), em JSON, para orientar o Vosk. */
    private String grammar;
    /** Português local indisponível uma vez nesta sessão: não insistir no motor do Android. */
    private boolean androidLanguageMissing;

    // ------------------------------------------------------------------ capacidades

    @PluginMethod
    public void getCapabilities(PluginCall call) {
        JSObject result = new JSObject();
        boolean onDevice = Build.VERSION.SDK_INT >= 31 && SpeechRecognizer.isOnDeviceRecognitionAvailable(getContext());
        result.put("androidAvailable", SpeechRecognizer.isRecognitionAvailable(getContext()));
        result.put("androidOnDevice", onDevice && !androidLanguageMissing);
        result.put("voskIncluded", voskAssetPresent());
        result.put("voskReady", voskModel != null);
        result.put("permission", getPermissionState("microphone").toString().toLowerCase());
        result.put("listening", activeEngine != null);
        call.resolve(result);
    }

    private boolean voskAssetPresent() {
        try {
            String[] files = getContext().getAssets().list(MODEL_ASSET);
            return files != null && files.length > 0;
        } catch (IOException e) {
            return false;
        }
    }

    /** Copia o modelo dos assets para a pasta privada (só na primeira vez ou quando mudar) e carrega. */
    @PluginMethod
    public void prepareModel(PluginCall call) {
        if (voskModel != null) { call.resolve(new JSObject().put("ready", true)); return; }
        if (!voskAssetPresent()) { call.reject("Modelo de voz não incluído nesta instalação.", "model-missing"); return; }
        if (voskPreparing) { call.reject("O modelo de voz ainda está sendo preparado.", "model-busy"); return; }
        voskPreparing = true;
        emitState("preparing", "vosk");
        StorageService.unpack(getContext(), MODEL_ASSET, "model", model -> {
            voskPreparing = false;
            voskModel = model;
            emitState("ready", "vosk");
            call.resolve(new JSObject().put("ready", true));
        }, exception -> {
            voskPreparing = false;
            emitError("model", "Não foi possível preparar o modelo de voz: " + exception.getMessage());
            call.reject("Não foi possível preparar o modelo de voz.", "model-failed");
        });
    }

    // ------------------------------------------------------------------ escuta

    @PluginMethod
    public void startListening(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            requestPermissionForAlias("microphone", call, "afterMicrophonePermission");
            return;
        }
        begin(call);
    }

    @PermissionCallback
    private void afterMicrophonePermission(PluginCall call) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) begin(call);
        else call.reject("Permissão do microfone negada.", "permission-denied");
    }

    private void begin(PluginCall call) {
        String engine = call.getString("engine", "auto");
        JSArray words = call.getArray("grammar");
        grammar = words != null && words.length() > 0 ? words.toString() : null;
        getActivity().runOnUiThread(() -> {
            releaseAll();
            boolean onDevice = Build.VERSION.SDK_INT >= 31 && SpeechRecognizer.isOnDeviceRecognitionAvailable(getContext()) && !androidLanguageMissing;
            boolean useAndroid = "android".equals(engine) || ("auto".equals(engine) && onDevice);
            if (useAndroid && SpeechRecognizer.isRecognitionAvailable(getContext())) {
                startAndroid(onDevice);
                call.resolve(new JSObject().put("engine", activeEngine));
            } else {
                startVosk(call);
            }
        });
    }

    private void startAndroid(boolean onDevice) {
        androidRecognizer = onDevice && Build.VERSION.SDK_INT >= 31
            ? SpeechRecognizer.createOnDeviceSpeechRecognizer(getContext())
            : SpeechRecognizer.createSpeechRecognizer(getContext());
        activeEngine = onDevice ? "android-local" : "android";
        androidRecognizer.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle params) { emitState("listening", activeEngine); }
            @Override public void onBeginningOfSpeech() { emitState("speaking", activeEngine); }
            @Override public void onRmsChanged(float rmsdB) { emitLevel(rmsdB); }
            @Override public void onBufferReceived(byte[] buffer) {}
            @Override public void onEndOfSpeech() { emitState("processing", activeEngine); }
            @Override public void onError(int error) {
                String engine = activeEngine;
                releaseAndroid();
                boolean languageProblem = Build.VERSION.SDK_INT >= 31
                    && (error == SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED || error == SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE);
                if (languageProblem && voskAssetPresent()) {
                    // O português ainda não está baixado no aparelho: troca para o Vosk antes de qualquer fala.
                    androidLanguageMissing = true;
                    notifyListeners("voice", new JSObject().put("type", "engine").put("engine", "vosk").put("reason", "language"));
                    startVosk(null);
                    return;
                }
                emitError(androidErrorCode(error), androidErrorMessage(error));
                emitState("idle", engine);
            }
            @Override public void onResults(Bundle results) {
                JSArray list = alternatives(results);
                String engine = activeEngine;
                releaseAndroid();
                notifyListeners("voice", new JSObject().put("type", "final").put("engine", engine)
                    .put("text", list.length() > 0 ? list.optString(0, "") : "").put("alternatives", list));
                emitState("idle", engine);
            }
            @Override public void onPartialResults(Bundle partial) {
                JSArray list = alternatives(partial);
                if (list.length() > 0) notifyListeners("voice", new JSObject().put("type", "partial").put("text", list.optString(0, "")));
            }
            @Override public void onEvent(int eventType, Bundle params) {}
        });
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "pt-BR");
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
        intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);
        // Pausas curtas da fala de feira não encerram a escuta cedo demais (o provedor pode ignorar).
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 1600L);
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 1200L);
        emitState("starting", activeEngine);
        androidRecognizer.startListening(intent);
    }

    private JSArray alternatives(Bundle bundle) {
        JSArray list = new JSArray();
        ArrayList<String> texts = bundle == null ? null : bundle.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if (texts != null) for (String text : texts) list.put(text);
        return list;
    }

    private void startVosk(PluginCall call) {
        if (voskModel == null) {
            if (!voskAssetPresent()) {
                if (call != null) call.reject("Nenhum motor de voz disponível neste aparelho.", "no-engine");
                else emitError("no-engine", "Nenhum motor de voz disponível neste aparelho.");
                return;
            }
            emitState("preparing", "vosk");
            if (voskPreparing) { if (call != null) call.reject("O modelo de voz ainda está sendo preparado.", "model-busy"); return; }
            voskPreparing = true;
            StorageService.unpack(getContext(), MODEL_ASSET, "model", model -> {
                voskPreparing = false;
                voskModel = model;
                startVosk(call);
            }, exception -> {
                voskPreparing = false;
                if (call != null) call.reject("Não foi possível preparar o modelo de voz.", "model-failed");
                else emitError("model-failed", "Não foi possível preparar o modelo de voz.");
            });
            return;
        }
        try {
            Recognizer recognizer;
            try {
                recognizer = grammar != null ? new Recognizer(voskModel, SAMPLE_RATE, grammar) : new Recognizer(voskModel, SAMPLE_RATE);
            } catch (Exception badGrammar) {
                recognizer = new Recognizer(voskModel, SAMPLE_RATE);
            }
            // Três hipóteses: o app escolhe a que forma a melhor proposta de venda.
            recognizer.setMaxAlternatives(3);
            voskService = new SpeechService(recognizer, SAMPLE_RATE);
            activeEngine = "vosk";
            voskService.startListening(new org.vosk.android.RecognitionListener() {
                @Override public void onPartialResult(String hypothesis) {
                    String text = field(hypothesis, "partial");
                    if (!text.isEmpty()) {
                        notifyListeners("voice", new JSObject().put("type", "partial").put("text", text));
                        emitState("speaking", "vosk");
                    }
                }
                // O Vosk fecha uma frase ao detectar a pausa: o primeiro resultado com texto é o comando.
                // Uma pausa sem palavras não encerra: continua ouvindo até o tempo limite ou o toque de parar.
                @Override public void onResult(String hypothesis) {
                    JSArray options = voskAlternatives(hypothesis);
                    if (options.length() > 0 && !options.optString(0, "").isEmpty()) finishVosk(options);
                }
                @Override public void onFinalResult(String hypothesis) { finishVosk(voskAlternatives(hypothesis)); }
                @Override public void onError(Exception exception) {
                    releaseVosk();
                    emitError("audio", "Falha no microfone: " + exception.getMessage());
                    emitState("idle", "vosk");
                }
                @Override public void onTimeout() { finishVosk(new JSArray()); }
            }, 12000);
            emitState("listening", "vosk");
            if (call != null) call.resolve(new JSObject().put("engine", "vosk"));
        } catch (IOException exception) {
            releaseVosk();
            if (call != null) call.reject("Não foi possível abrir o microfone.", "audio");
            else emitError("audio", "Não foi possível abrir o microfone.");
        }
    }

    private void finishVosk(JSArray options) {
        if (voskService == null) return;
        releaseVosk();
        String text = options.length() > 0 ? options.optString(0, "") : "";
        notifyListeners("voice", new JSObject().put("type", "final").put("engine", "vosk").put("text", text).put("alternatives", options));
        emitState("idle", "vosk");
    }

    /** {"text":…} ou, com alternativas, {"alternatives":[{"text":…,"confidence":…}]}; "[unk]" fica de fora. */
    private static JSArray voskAlternatives(String json) {
        JSArray list = new JSArray();
        try {
            JSONObject result = new JSONObject(json);
            org.json.JSONArray alternatives = result.optJSONArray("alternatives");
            if (alternatives != null) {
                for (int i = 0; i < alternatives.length(); i++) {
                    String text = alternatives.getJSONObject(i).optString("text", "").replace("[unk]", "").trim().replaceAll("\\s+", " ");
                    if (!text.isEmpty()) list.put(text);
                }
            } else {
                String text = result.optString("text", "").replace("[unk]", "").trim().replaceAll("\\s+", " ");
                if (!text.isEmpty()) list.put(text);
            }
        } catch (Exception ignored) { }
        return list;
    }

    private static String field(String json, String key) {
        try { return new JSONObject(json).optString(key, "").trim(); } catch (Exception e) { return ""; }
    }

    /**
     * Diário de diagnóstico da voz (texto, nunca áudio): o que foi ouvido, as alternativas e o que o
     * app entendeu. Fica na pasta privada do app (files/voz-diagnostico.jsonl), só as últimas 300 linhas.
     */
    @PluginMethod
    public void appendDiagnostic(PluginCall call) {
        String line = call.getString("line", "");
        if (line == null || line.isEmpty()) { call.resolve(); return; }
        java.io.File file = new java.io.File(getContext().getFilesDir(), "voz-diagnostico.jsonl");
        try {
            java.util.List<String> lines = new java.util.ArrayList<>();
            if (file.exists()) lines.addAll(java.nio.file.Files.readAllLines(file.toPath(), java.nio.charset.StandardCharsets.UTF_8));
            lines.add(line.replace('\n', ' '));
            int from = Math.max(0, lines.size() - 300);
            java.nio.file.Files.write(file.toPath(), lines.subList(from, lines.size()), java.nio.charset.StandardCharsets.UTF_8);
            call.resolve();
        } catch (Exception e) {
            call.reject("Diário de voz indisponível.");
        }
    }

    /** Encerra a fala e entrega o que já foi dito. */
    @PluginMethod
    public void stopListening(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (androidRecognizer != null) { emitState("processing", activeEngine); androidRecognizer.stopListening(); }
            else if (voskService != null) voskService.stop();
            call.resolve();
        });
    }

    /** Cancela a tentativa sem resultado. */
    @PluginMethod
    public void cancel(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            String engine = activeEngine;
            releaseAll();
            if (engine != null) emitState("idle", engine);
            call.resolve();
        });
    }

    @Override
    protected void handleOnPause() {
        getActivity().runOnUiThread(() -> {
            String engine = activeEngine;
            releaseAll();
            if (engine != null) emitState("idle", engine);
        });
    }

    @Override
    protected void handleOnDestroy() {
        releaseAll();
        if (voskModel != null) { voskModel.close(); voskModel = null; }
    }

    // ------------------------------------------------------------------ apoio

    private void releaseAll() { releaseAndroid(); releaseVosk(); }

    private void releaseAndroid() {
        if (androidRecognizer != null) { androidRecognizer.destroy(); androidRecognizer = null; }
        if ("android".equals(activeEngine) || "android-local".equals(activeEngine)) activeEngine = null;
    }

    private void releaseVosk() {
        if (voskService != null) { voskService.stop(); voskService.shutdown(); voskService = null; }
        if ("vosk".equals(activeEngine)) activeEngine = null;
    }

    private void emitState(String state, String engine) {
        notifyListeners("voice", new JSObject().put("type", "state").put("state", state).put("engine", engine));
    }

    private long lastLevel;
    private void emitLevel(float rmsdB) {
        long now = System.currentTimeMillis();
        if (now - lastLevel < 60) return;
        lastLevel = now;
        notifyListeners("voice", new JSObject().put("type", "level").put("level", rmsdB));
    }

    private void emitError(String code, String message) {
        notifyListeners("voice", new JSObject().put("type", "error").put("code", code).put("message", message));
    }

    private static String androidErrorCode(int error) {
        switch (error) {
            case SpeechRecognizer.ERROR_NO_MATCH: return "no-match";
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: return "silence";
            case SpeechRecognizer.ERROR_AUDIO: return "audio";
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: return "permission-denied";
            case SpeechRecognizer.ERROR_NETWORK:
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: return "network";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY: return "busy";
            default: return "engine";
        }
    }

    private static String androidErrorMessage(int error) {
        switch (error) {
            case SpeechRecognizer.ERROR_NO_MATCH: return "Não entendi. Fale de novo, perto do celular.";
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: return "Não ouvi nada. Toque no microfone e fale.";
            case SpeechRecognizer.ERROR_AUDIO: return "O microfone falhou. Tente de novo.";
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: return "Permita o uso do microfone para vender por voz.";
            case SpeechRecognizer.ERROR_NETWORK:
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: return "A voz do Android pediu internet. Tente de novo; o app usa a voz offline.";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY: return "O reconhecimento de voz está ocupado. Tente de novo.";
            default: return "A voz falhou. Tente de novo ou digite.";
        }
    }
}
