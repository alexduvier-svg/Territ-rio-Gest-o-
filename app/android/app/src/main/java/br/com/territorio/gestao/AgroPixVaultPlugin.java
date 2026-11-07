package br.com.territorio.gestao;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.SystemClock;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.text.InputType;
import android.util.AtomicFile;
import android.util.Base64;
import android.view.WindowManager;
import android.view.View;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import androidx.activity.result.ActivityResult;
import androidx.appcompat.app.AlertDialog;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.json.JSONObject;

/** Native-only secret entry; passwords never cross the JavaScript bridge or commercial backups. */
@CapacitorPlugin(name = "AgroPixVault")
public class AgroPixVaultPlugin extends Plugin {
    private PluginCall current;
    private String owner, scopeHash;
    private AlertDialog inputDialog;
    private BiometricPrompt prompt;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private AuthWork credentialWork;
    private boolean authenticating;
    private boolean secureHeld, wasSecure;
    private long blockedUntil;
    private int failures;
    private char[] pendingPassword;
    private interface AuthWork { void run(Cipher cipher) throws Exception; }
    private interface ReadWork { void run(JSONObject value) throws Exception; }
    private static final String PREFIX = "agro.pix.v1.";

    private byte[] aad() { return (getContext().getPackageName()+"|pix-v1|"+owner).getBytes(StandardCharsets.UTF_8); }
    private String encode(byte[] value) { return Base64.encodeToString(value, Base64.NO_WRAP); }
    private byte[] decode(String value) { return Base64.decode(value, Base64.NO_WRAP); }
    private String alias() { return PREFIX+scopeHash; }
    private AtomicFile file() { return new AtomicFile(new File(getContext().getNoBackupFilesDir(), "pix-"+scopeHash+".vault")); }
    private boolean exists() { return file().getBaseFile().exists(); }
    private boolean biometric() { return BiometricManager.from(getContext()).canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)==BiometricManager.BIOMETRIC_SUCCESS; }
    private boolean deviceSecure() { return ((KeyguardManager)getContext().getSystemService(Context.KEYGUARD_SERVICE)).isDeviceSecure(); }
    private void secure(boolean enabled) { if(enabled&&!secureHeld){wasSecure=(getActivity().getWindow().getAttributes().flags&WindowManager.LayoutParams.FLAG_SECURE)!=0;secureHeld=true;getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);}else if(!enabled&&secureHeld){if(!wasSecure)getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);secureHeld=false;} }
    private boolean begin(PluginCall call) {
        if(current!=null){call.reject("Conclua ou cancele a operação Pix em andamento.");return false;}
        String id=call.getString("owner","");
        if(id.isEmpty()||id.length()>200){call.reject("Contexto do produtor inválido.");return false;}
        try { owner=id;byte[] digest=MessageDigest.getInstance("SHA-256").digest(id.getBytes(StandardCharsets.UTF_8));StringBuilder out=new StringBuilder();for(byte v:digest)out.append(String.format("%02x",v));scopeHash=out.toString(); }
        catch(Exception error){call.reject("Não foi possível identificar o cofre.");return false;}
        current=call;return true;
    }
    private void cleanup() {
        if(pendingPassword!=null)Arrays.fill(pendingPassword,'\0');pendingPassword=null;
        credentialWork=null;authenticating=false;current=null;
        if(inputDialog!=null){inputDialog.setOnCancelListener(null);inputDialog.dismiss();inputDialog=null;}
        secure(false);
    }
    private void fail(String message) { getActivity().runOnUiThread(()->{PluginCall call=current;cleanup();if(call!=null)call.reject(message);}); }
    private void resolve(JSObject result) { getActivity().runOnUiThread(()->{PluginCall call=current;cleanup();if(call!=null)call.resolve(result);}); }
    private void failedPassword(){failures++;if(failures>=5)blockedUntil=SystemClock.elapsedRealtime()+60000L;fail("Senha incorreta ou cadastro inválido. Confira a senha e tente novamente.");}
    private JSONObject readEnvelope() throws Exception {byte[] bytes=file().readFully();if(bytes.length>32768)throw new IllegalArgumentException();JSONObject envelope=new JSONObject(new String(bytes,StandardCharsets.UTF_8));if(envelope.getInt("version")!=1||!envelope.getString("ownerHash").equals(scopeHash))throw new IllegalArgumentException();return envelope;}
    private SecretKey key() throws Exception {KeyStore store=KeyStore.getInstance("AndroidKeyStore");store.load(null);return (SecretKey)store.getKey(alias(),null);}
    private void createKey(String mode) throws Exception {
        KeyGenerator generator=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");
        KeyGenParameterSpec.Builder spec=new KeyGenParameterSpec.Builder(alias(),KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT).setKeySize(256).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).setUserAuthenticationRequired(true);
        if(mode.equals("biometric"))spec.setInvalidatedByBiometricEnrollment(true).setUserAuthenticationValidityDurationSeconds(-1);
        else spec.setUserAuthenticationValidityDurationSeconds(15);
        generator.init(spec.build());generator.generateKey();
    }
    private Cipher cipher(int operation, JSONObject envelope) throws Exception {
        Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");
        if(operation==Cipher.DECRYPT_MODE)cipher.init(operation,key(),new GCMParameterSpec(128,decode(envelope.getString("iv"))));
        else cipher.init(operation,key());
        cipher.updateAAD(aad());return cipher;
    }
    private void authenticate(String mode, int operation, JSONObject envelope, AuthWork done) {
        getActivity().runOnUiThread(()->{
            if(current==null)return;
            try {
                authenticating=true;
                if(mode.equals("biometric")){
                    if(!biometric())throw new IllegalStateException("A biometria do cadastro não está disponível. O cofre não pode ser liberado por um método mais fraco.");
                    Cipher crypto=cipher(operation,envelope);
                    prompt=new BiometricPrompt(getActivity(),ContextCompat.getMainExecutor(getContext()),new BiometricPrompt.AuthenticationCallback(){
                        @Override public void onAuthenticationError(int code,CharSequence text){fail("Autenticação não concluída. O cofre continua bloqueado.");}
                        @Override public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result){authenticating=false;worker.execute(()->{try{if(current!=null&&result.getCryptoObject()!=null)done.run(result.getCryptoObject().getCipher());}catch(Exception error){fail("Não foi possível liberar o cofre. Confira o cadastro e a proteção do aparelho.");}});}
                    });
                    BiometricPrompt.PromptInfo info=new BiometricPrompt.PromptInfo.Builder().setTitle("Confirmar acesso ao Pix").setSubtitle("Use a digital ou outra biometria forte cadastrada no Android").setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG).setNegativeButtonText("Cancelar").build();
                    prompt.authenticate(info,new BiometricPrompt.CryptoObject(crypto));
                }else{
                    if(!deviceSecure())throw new IllegalStateException("Ative um PIN ou senha de bloqueio do celular para proteger o Pix.");
                    credentialWork=ignored->done.run(cipher(operation,envelope));
                    Intent intent=((KeyguardManager)getContext().getSystemService(Context.KEYGUARD_SERVICE)).createConfirmDeviceCredentialIntent("Confirmar acesso ao Pix","Confirme o bloqueio do aparelho. A senha do app é uma proteção separada.");
                    if(intent==null)throw new IllegalStateException();startActivityForResult(current,intent,"credentialResult");
                }
            }catch(Exception error){fail(error instanceof IllegalStateException&&error.getMessage()!=null?error.getMessage():"Não foi possível iniciar a proteção do Pix. Confira o bloqueio do aparelho.");}
        });
    }
    @ActivityCallback private void credentialResult(PluginCall call,ActivityResult result){
        authenticating=false;AuthWork work=credentialWork;credentialWork=null;
        if(result.getResultCode()!=Activity.RESULT_OK||current==null||work==null){fail("A confirmação do aparelho foi cancelada. O cofre continua bloqueado.");return;}
        worker.execute(()->{try{work.run(null);}catch(Exception error){fail("O prazo de autenticação expirou ou o cofre não pôde ser liberado. Tente novamente.");}});
    }
    private EditText input(LinearLayout group,String label,int type,String value){
        TextView caption=new TextView(getContext());caption.setText(label);group.addView(caption);
        EditText edit=new EditText(getContext());edit.setSingleLine(true);edit.setInputType(type);edit.setText(value);edit.setSaveEnabled(false);if(Build.VERSION.SDK_INT>=26)edit.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS);
        edit.setLayoutParams(new LinearLayout.LayoutParams(-1,-2));group.addView(edit);return edit;
    }
    private LinearLayout form(){LinearLayout group=new LinearLayout(getContext());group.setOrientation(LinearLayout.VERTICAL);int pad=(int)(20*getContext().getResources().getDisplayMetrics().density);group.setPadding(pad,pad,pad,pad);return group;}
    private void askPassword(ReadWork done){
        if(SystemClock.elapsedRealtime()<blockedUntil){fail("Aguarde um minuto antes de tentar outra senha.");return;}
        getActivity().runOnUiThread(()->{
            secure(true);LinearLayout group=form();EditText password=input(group,"Senha do aplicativo",InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD,"");
            TextView hint=new TextView(getContext());hint.setText("Não use a senha do banco. Depois, confirme sua identidade no Android.");group.addView(hint);
            inputDialog=new AlertDialog.Builder(getActivity()).setTitle("Desbloquear chave Pix").setView(group).setPositiveButton("Continuar",null).setNegativeButton("Cancelar",(d,w)->fail("Operação cancelada.")).create();
            inputDialog.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);inputDialog.setOnCancelListener(d->fail("Operação cancelada."));inputDialog.setOnShowListener(d->inputDialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v->{
                if(password.length()<8){password.setError("Informe a senha do app com pelo menos 8 caracteres.");return;}
                pendingPassword=new char[password.length()];password.getText().getChars(0,password.length(),pendingPassword,0);password.setText("");inputDialog.dismiss();inputDialog=null;
                worker.execute(()->{try{JSONObject envelope=readEnvelope();authenticate(envelope.getString("mode"),Cipher.DECRYPT_MODE,envelope,outer->{
                    byte[] wrapped=outer.doFinal(decode(envelope.getString("sealed"))),plain=null;
                    try{JSONObject inner=new JSONObject(new String(wrapped,StandardCharsets.UTF_8));plain=PixPasswordCrypto.open(decode(inner.getString("sealed")),pendingPassword,decode(inner.getString("salt")),decode(inner.getString("iv")),aad(),inner.getString("kdf"));JSONObject value=new JSONObject(new String(plain,StandardCharsets.UTF_8));Arrays.fill(pendingPassword,'\0');pendingPassword=null;failures=0;done.run(value);}
                    catch(javax.crypto.AEADBadTagException wrong){failedPassword();}
                    finally{Arrays.fill(wrapped,(byte)0);if(plain!=null)Arrays.fill(plain,(byte)0);}
                });}catch(Exception error){fail("Cadastro Pix indisponível. O cofre não foi alterado.");}});
            }));inputDialog.show();
        });
    }
    private boolean validKey(String key){
        if(key.length()>77||key.matches(".*[\\s\\p{Cntrl}].*"))return false;
        return key.matches("[0-9]{11}|[0-9]{14}|\\+[1-9][0-9]{7,14}|[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}")||key.matches("[^@]+@[^@]+\\.[^@]+");
    }
    private void enrollmentForm(JSONObject previous){getActivity().runOnUiThread(()->{
        secure(true);LinearLayout group=form();
        EditText name=input(group,"Nome do recebedor",InputType.TYPE_CLASS_TEXT,previous.optString("name",""));
        EditText city=input(group,"Cidade do recebedor",InputType.TYPE_CLASS_TEXT,previous.optString("city",""));
        EditText pix=input(group,"Chave já cadastrada no banco",InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD,previous.optString("key",""));
        EditText password=input(group,"Senha do aplicativo · mínimo de 8 caracteres",InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD,"");
        EditText confirm=input(group,"Confirmar senha do aplicativo",InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD,"");
        TextView hint=new TextView(getContext());hint.setText("A chave não é validada no banco por este cadastro. Confira o recebedor no aplicativo bancário antes de usar. Não informe a senha do banco. Guarde a senha do app; ela não participa do backup.");group.addView(hint);
        ScrollView scroll=new ScrollView(getContext());scroll.addView(group);
        inputDialog=new AlertDialog.Builder(getActivity()).setTitle("Cadastro protegido do Pix").setView(scroll).setPositiveButton("Proteger e salvar",null).setNegativeButton("Cancelar",(d,w)->fail("Cadastro cancelado.")).create();
        inputDialog.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);inputDialog.setOnCancelListener(d->fail("Cadastro cancelado."));inputDialog.setOnShowListener(d->inputDialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v->{
            if(name.length()<2||name.length()>120){name.setError("Confira o nome do recebedor.");return;}if(city.length()<2||city.length()>80){city.setError("Confira a cidade.");return;}
            String keyText=pix.getText().toString().trim();if(!validKey(keyText)){pix.setError("Use CPF/CNPJ sem pontuação, telefone com +55, e-mail ou chave aleatória válida.");return;}
            if(password.length()<8||password.length()>128){password.setError("Use de 8 a 128 caracteres.");return;}if(!password.getText().toString().equals(confirm.getText().toString())){confirm.setError("As senhas precisam ser iguais.");return;}
            try{JSONObject value=new JSONObject().put("name",name.getText().toString().trim()).put("city",city.getText().toString().trim()).put("key",keyText);
                pendingPassword=new char[password.length()];password.getText().getChars(0,password.length(),pendingPassword,0);password.setText("");confirm.setText("");pix.setText("");inputDialog.dismiss();inputDialog=null;
                worker.execute(()->saveValue(value));
            }catch(Exception error){fail("Não foi possível preparar o cadastro.");}
        }));inputDialog.show();
    });}
    private void saveValue(JSONObject value){
        try{
            String mode=exists()?readEnvelope().getString("mode"):biometric()?"biometric":"device";
            if(!deviceSecure())throw new IllegalStateException("Ative um PIN ou senha de bloqueio do celular antes de cadastrar o Pix.");
            if(!exists())createKey(mode);
            byte[] salt=PixPasswordCrypto.random(32),iv=PixPasswordCrypto.random(12),plain=value.toString().getBytes(StandardCharsets.UTF_8);
            String kdf=Build.VERSION.SDK_INT>=26?"PBKDF2WithHmacSHA256":"PBKDF2WithHmacSHA1";
            byte[] encrypted;
            try{encrypted=PixPasswordCrypto.seal(plain,pendingPassword,salt,iv,aad(),kdf);}finally{Arrays.fill(plain,(byte)0);Arrays.fill(pendingPassword,'\0');pendingPassword=null;}
            byte[] inner=new JSONObject().put("salt",encode(salt)).put("iv",encode(iv)).put("kdf",kdf).put("sealed",encode(encrypted)).toString().getBytes(StandardCharsets.UTF_8);
            authenticate(mode,Cipher.ENCRYPT_MODE,null,outer->{
                FileOutputStream stream=null;
                try{JSONObject envelope=new JSONObject().put("version",1).put("ownerHash",scopeHash).put("mode",mode).put("iv",encode(outer.getIV())).put("sealed",encode(outer.doFinal(inner)));byte[] bytes=envelope.toString().getBytes(StandardCharsets.UTF_8);stream=file().startWrite();stream.write(bytes);file().finishWrite(stream);stream=null;readEnvelope();resolve(new JSObject().put("configured",true));}
                catch(Exception error){if(stream!=null)file().failWrite(stream);fail("Não foi possível gravar o cofre. O cadastro anterior foi preservado.");}
                finally{Arrays.fill(inner,(byte)0);Arrays.fill(encrypted,(byte)0);}
            });
        }catch(Exception error){fail(error instanceof IllegalStateException?error.getMessage():"Não foi possível proteger a chave. Confira o bloqueio do aparelho.");}
    }
    @PluginMethod public void status(PluginCall call){if(!begin(call))return;resolve(new JSObject().put("configured",exists()).put("masked",exists()?"Chave protegida · autentique para usar":"").put("biometricAvailable",biometric()).put("deviceSecure",deviceSecure()));}
    @PluginMethod public void enroll(PluginCall call){if(!begin(call))return;if(exists())askPassword(this::enrollmentForm);else enrollmentForm(new JSONObject());}
    @PluginMethod public void unlock(PluginCall call){if(!begin(call))return;if(!exists()){fail("Cadastre sua chave Pix primeiro.");return;}askPassword(value->resolve(new JSObject().put("key",value.getString("key")).put("name",value.getString("name")).put("city",value.getString("city"))));}
    @PluginMethod public void remove(PluginCall call){if(!begin(call))return;if(!exists()){resolve(new JSObject().put("removed",true));return;}askPassword(value->getActivity().runOnUiThread(()->{inputDialog=new AlertDialog.Builder(getActivity()).setTitle("Excluir cadastro Pix?").setMessage("O cadastro será removido deste aparelho. A chave continuará existindo no banco.").setPositiveButton("Excluir cadastro",(d,w)->worker.execute(()->{try{file().delete();KeyStore store=KeyStore.getInstance("AndroidKeyStore");store.load(null);store.deleteEntry(alias());resolve(new JSObject().put("removed",true));}catch(Exception error){fail("Não foi possível concluir a exclusão.");}})).setNegativeButton("Cancelar",(d,w)->fail("Exclusão cancelada.")).create();inputDialog.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);inputDialog.setOnCancelListener(d->fail("Exclusão cancelada."));inputDialog.show();}));}
    @Override protected void handleOnPause(){super.handleOnPause();if(current!=null&&!authenticating)fail("Operação Pix interrompida ao sair do aplicativo. Reabra para continuar.");}
    @Override protected void handleOnDestroy(){if(prompt!=null)prompt.cancelAuthentication();if(pendingPassword!=null)Arrays.fill(pendingPassword,'\0');worker.shutdownNow();super.handleOnDestroy();}
}
