package br.com.territorio.gestao;

import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.JSObject;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;

@CapacitorPlugin(name="AgroDocuments")
public class AgroDocumentsPlugin extends Plugin {
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private static final int LIMIT = 8 * 1024 * 1024;
    static Intent previewIntent(android.content.Context context, File file) {
        Uri uri=FileProvider.getUriForFile(context,context.getPackageName()+".fileprovider",file);
        return new Intent(Intent.ACTION_VIEW).setDataAndType(uri,"application/pdf").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
    }
    @PluginMethod public void preview(PluginCall call) {
        final String data=call.getString("data", ""), name=call.getString("name", "catalogo.pdf").replaceAll("[^a-zA-Z0-9._-]", "-");
        if (data.length()>LIMIT*4/3+16) {call.reject("PDF acima do limite de 8 MB.");return;}
        io.execute(()->{try {
            byte[] bytes=Base64.decode(data,Base64.DEFAULT);if(bytes.length<20||bytes.length>LIMIT)throw new IOException("PDF inválido.");
            File dir=new File(getContext().getCacheDir(),"compartilhar");if(!dir.exists()&&!dir.mkdirs())throw new IOException("Não foi possível preparar o arquivo.");
            File file=new File(dir,name);try(FileOutputStream out=new FileOutputStream(file)){out.write(bytes);}
            Intent view=previewIntent(getContext(),file);
            getActivity().runOnUiThread(()->{try{getActivity().startActivity(Intent.createChooser(view,"Abrir PDF preenchível"));call.resolve();}catch(Exception e){call.reject("Nenhum leitor de PDF disponível. Use compartilhar por texto ou salve o documento.");}});
        }catch(Exception e){call.reject("Não foi possível abrir o PDF. Use a alternativa por texto.");}});
    }
    @PluginMethod public void takeIncoming(PluginCall call) {
        Intent intent=getActivity().getIntent();if(intent==null||!Intent.ACTION_SEND.equals(intent.getAction())){call.resolve(new JSObject());return;}
        // Sharing to this app is an explicit selection. Consume the intent once, not on every resume.
        String type=intent.getType();Uri uri=intent.getParcelableExtra(Intent.EXTRA_STREAM);CharSequence text=intent.getCharSequenceExtra(Intent.EXTRA_TEXT);getActivity().setIntent(new Intent());
        if("text/plain".equals(type)&&text!=null){if(text.length()>12000){call.reject("Resposta acima de 12 mil caracteres.");return;}JSObject result=new JSObject();result.put("text",text.toString());call.resolve(result);return;}
        if(!"application/pdf".equals(type)||uri==null||!"content".equals(uri.getScheme())){call.reject("Compartilhe um PDF ou texto escolhido por você.");return;}
        io.execute(()->{try(InputStream in=getContext().getContentResolver().openInputStream(uri);ByteArrayOutputStream out=new ByteArrayOutputStream()){
            if(in==null)throw new IOException();byte[] buffer=new byte[16384];int count,total=0;while((count=in.read(buffer))!=-1){total+=count;if(total>LIMIT)throw new IOException();out.write(buffer,0,count);}if(total<20)throw new IOException();JSObject result=new JSObject();result.put("data",Base64.encodeToString(out.toByteArray(),Base64.NO_WRAP));result.put("name","resposta.pdf");call.resolve(result);
        }catch(Exception e){call.reject("Não foi possível ler o arquivo escolhido. Use Importar resposta e escolha um PDF de até 8 MB.");}});
    }
    @Override protected void handleOnDestroy(){io.shutdownNow();super.handleOnDestroy();}
}
