package br.com.territorio.gestao;
import java.net.URL;
import java.util.Locale;
/** Redirects remain HTTPS inside the authorized model distribution domains. */
final class ModelDownloadPolicy {
    static boolean allowed(URL u){
        String host=u.getHost().toLowerCase(Locale.ROOT);
        return "https".equals(u.getProtocol())&&u.getUserInfo()==null&&(u.getPort()==-1||u.getPort()==443)
            &&(host.equals("huggingface.co")||host.endsWith(".huggingface.co")||host.equals("hf.co")||host.endsWith(".hf.co"));
    }
}
