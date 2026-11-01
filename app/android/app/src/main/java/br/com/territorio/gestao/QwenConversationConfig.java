package br.com.territorio.gestao;

import android.content.Context;
import com.google.ai.edge.litertlm.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

/** The pinned older exports expect string content, but runtime 0.18.1 sends parts.
 * Use the matching upstream runtime template; weights and private files stay intact. */
final class QwenConversationConfig {
    static ConversationConfig create(Context context) throws IOException {return create(context,false);}
    static ConversationConfig create(Context context,boolean structured) throws IOException {
        String template;
        try (InputStream in=context.getAssets().open("ai/qwen3-chat-template.jinja");ByteArrayOutputStream out=new ByteArrayOutputStream()) {
            byte[] block=new byte[2048];int n;
            while ((n=in.read(block))!=-1) {out.write(block,0,n);if(out.size()>16000)throw new IOException("Template local inválido.");}
            template=new String(out.toByteArray(),StandardCharsets.UTF_8);
        }
        return new ConversationConfig(null,Collections.emptyList(),Collections.emptyList(),
            new SamplerConfig(1,1.0,0.0,0),false,null,Collections.emptyMap(),null,false,
            null,new ThinkingConfig(false,0),structured,null,template);
    }
    private QwenConversationConfig() {}
}
