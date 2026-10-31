package br.com.territorio.gestao;

import java.io.*;
import java.net.*;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.function.BooleanSupplier;
import java.util.regex.*;

/** A resumable, size-bounded, hash-pinned file download. Never accepts an ERP payload. */
final class ModelDownload {
    interface Connections { HttpURLConnection open(URL url) throws IOException; }
    interface Progress { void update(String phase,long bytes); }
    static boolean trusted(URL url) {
        String h=url.getHost().toLowerCase(Locale.ROOT);
        return "https".equals(url.getProtocol()) && (h.equals("huggingface.co") || h.endsWith(".huggingface.co") || h.equals("hf.co") || h.endsWith(".hf.co") || h.endsWith(".amazonaws.com"));
    }
    private static void check(BooleanSupplier cancelled) throws IOException {
        if(cancelled.getAsBoolean()||Thread.currentThread().isInterrupted())throw new IOException("Download pausado. Toque em retomar para continuar.");
    }
    static void fetch(File partial,URL start,long size,String sha,Connections connections,BooleanSupplier cancelled,Progress progress) throws IOException {
        if(size<=0||!sha.matches("[0-9a-f]{64}")||!trusted(start))throw new IOException("Configuração do modelo inválida.");
        if(partial.length()>size&&!partial.delete())throw new IOException("Não foi possível preparar o download.");
        long offset=partial.exists()?partial.length():0;
        check(cancelled);
        if(offset<size){
            URL target=start;HttpURLConnection connection=null;
            try{
                for(int redirects=0;;redirects++){
                    check(cancelled);if(!trusted(target)||redirects>8)throw new IOException("Destino do modelo não autorizado.");
                    connection=connections.open(target);connection.setInstanceFollowRedirects(false);connection.setConnectTimeout(20000);connection.setReadTimeout(30000);
                    connection.setRequestProperty("Accept-Encoding","identity");
                    if(offset>0)connection.setRequestProperty("Range","bytes="+offset+"-");
                    int code=connection.getResponseCode();
                    if(code==301||code==302||code==303||code==307||code==308){String location=connection.getHeaderField("Location");if(location==null)throw new IOException("Redirecionamento inválido.");URL next=new URL(target,location);connection.disconnect();connection=null;target=next;continue;}
                    if(code==206){
                        Matcher range=Pattern.compile("bytes (\\d+)-(\\d+)/(\\d+)").matcher(String.valueOf(connection.getHeaderField("Content-Range")));
                        if(!range.matches()||Long.parseLong(range.group(1))!=offset||Long.parseLong(range.group(3))!=size||Long.parseLong(range.group(2))>=size)throw new IOException("A retomada do download não conferiu.");
                    }else if(code==200){offset=0;}
                    else throw new IOException("Não foi possível baixar agora. Confira a conexão e tente novamente.");
                    long length=connection.getContentLengthLong();if(length>=0&&length!=size-offset)throw new IOException("O servidor retornou um arquivo diferente do esperado.");
                    long count=offset,lastUpdate=0;progress.update("downloading",count);
                    try(InputStream in=new BufferedInputStream(connection.getInputStream());FileOutputStream out=new FileOutputStream(partial,offset>0)){
                        byte[] buffer=new byte[64*1024];int n;
                        while((n=in.read(buffer))!=-1){check(cancelled);count+=n;if(count>size)throw new IOException("Arquivo acima do tamanho permitido.");out.write(buffer,0,n);long now=System.nanoTime();if(lastUpdate==0||now-lastUpdate>500000000L){progress.update("downloading",count);lastUpdate=now;}}
                        out.getFD().sync();
                    }
                    if(count!=size)throw new IOException("Download incompleto. Toque em retomar para continuar.");
                    break;
                }
            }finally{if(connection!=null)connection.disconnect();}
        }
        check(cancelled);progress.update("verifying",size);
        if(!matches(partial,size,sha,cancelled)){partial.delete();throw new IOException("O arquivo não passou na verificação. Tente baixar novamente.");}
    }
    static boolean matches(File file,long size,String expected,BooleanSupplier cancelled) throws IOException {
        if(!file.isFile()||file.length()!=size)return false;
        try{
            MessageDigest digest=MessageDigest.getInstance("SHA-256");
            try(InputStream in=new BufferedInputStream(new FileInputStream(file))){byte[] buffer=new byte[1024*1024];int n;while((n=in.read(buffer))!=-1){check(cancelled);digest.update(buffer,0,n);}}
            StringBuilder result=new StringBuilder();for(byte b:digest.digest())result.append(String.format(Locale.ROOT,"%02x",b&255));return expected.equals(result.toString());
        }catch(java.security.NoSuchAlgorithmException e){throw new IOException("Verificação indisponível.",e);}
    }
}
