package br.com.territorio.gestao;
import java.io.*;
import java.net.*;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
public class ModelDownloadChecks {
 static final byte[] DATA="abcdefghijklmnopqrstuvwx".getBytes(java.nio.charset.StandardCharsets.UTF_8);
 static final URL URL;
 static{try{URL=new URL("https://huggingface.co/fixed/model");}catch(Exception e){throw new RuntimeException(e);}}
 static String sha(byte[] data)throws Exception{StringBuilder s=new StringBuilder();for(byte b:MessageDigest.getInstance("SHA-256").digest(data))s.append(String.format("%02x",b&255));return s.toString();}
 static void require(boolean b,String message){if(!b)throw new AssertionError(message);}
 static class Connection extends HttpURLConnection {
  int code;byte[] body;String range,location;long length;boolean chunks;
  Connection(int code,byte[] body,String range){super(URL);this.code=code;this.body=body;this.range=range;this.length=body.length;}
  public int getResponseCode(){return code;}public long getContentLengthLong(){return length;}
  public String getHeaderField(String k){return k.equals("Content-Range")?range:k.equals("Location")?location:null;}
  public InputStream getInputStream(){return new ByteArrayInputStream(body){public synchronized int read(byte[] b,int o,int n){return super.read(b,o,chunks?Math.min(n,4):n);}public synchronized int available(){return chunks?0:super.available();}};}
  public void disconnect(){}public boolean usingProxy(){return false;}public void connect(){}
 }
 interface Job{void run()throws Exception;}
 static void fails(Job job)throws Exception{try{job.run();throw new AssertionError("Expected refusal");}catch(IOException expected){}}
 public static void main(String[] args)throws Exception{
  Path dir=Files.createTempDirectory("agro-download-check-");File file=dir.resolve("model.part").toFile();String hash=sha(DATA);int passed=0;
  ModelDownload.fetch(file,URL,DATA.length,hash,u->new Connection(200,DATA,null),()->false,(p,n)->{});require(Arrays.equals(Files.readAllBytes(file.toPath()),DATA),"full download");passed++;file.delete();
  Files.write(file.toPath(),Arrays.copyOf(DATA,7));Connection resumed=new Connection(206,Arrays.copyOfRange(DATA,7,DATA.length),"bytes 7-23/24");
  ModelDownload.fetch(file,URL,DATA.length,hash,u->resumed,()->false,(p,n)->{});require("bytes=7-".equals(resumed.getRequestProperty("Range")),"resume offset");require(Arrays.equals(Files.readAllBytes(file.toPath()),DATA),"resume bytes");passed++;file.delete();
  Files.write(file.toPath(),Arrays.copyOf(DATA,7));ModelDownload.fetch(file,URL,DATA.length,hash,u->new Connection(200,DATA,null),()->false,(p,n)->{});require(file.length()==DATA.length,"ignored range restarts without duplication");passed++;file.delete();
  Files.write(file.toPath(),Arrays.copyOf(DATA,7));fails(()->ModelDownload.fetch(file,URL,DATA.length,hash,u->new Connection(206,DATA,"bytes 0-23/24"),()->false,(p,n)->{}));require(file.length()==7,"wrong range preserves partial");passed++;file.delete();
  fails(()->ModelDownload.fetch(file,URL,DATA.length,"0".repeat(64),u->new Connection(200,DATA,null),()->false,(p,n)->{}));require(!file.exists(),"bad hash is deleted");passed++;
  AtomicBoolean cancelled=new AtomicBoolean();Connection chunked=new Connection(200,DATA,null);chunked.chunks=true;
  fails(()->ModelDownload.fetch(file,URL,DATA.length,hash,u->chunked,cancelled::get,(p,n)->{if(p.equals("downloading")&&n>0)cancelled.set(true);}));require(file.length()==4,"cancel preserves only received bytes");passed++;file.delete();
  Connection shortBody=new Connection(200,Arrays.copyOf(DATA,5),null);shortBody.length=DATA.length;
  fails(()->ModelDownload.fetch(file,URL,DATA.length,hash,u->shortBody,()->false,(p,n)->{}));require(file.length()==5,"truncated response remains resumable");passed++;file.delete();
  Connection redirect=new Connection(302,new byte[0],null);redirect.location="http://huggingface.co/insecure";
  fails(()->ModelDownload.fetch(file,URL,DATA.length,hash,u->redirect,()->false,(p,n)->{}));require(!ModelDownload.trusted(new URL("https://untrusted.example/model")),"untrusted host");passed++;
  require(ModelDownload.matches(file,DATA.length,hash,()->false)==false,"missing file not verified");passed++;
  System.out.println("PASS: "+passed+" download scenarios (full, resume, restart, range rejection, hash rejection, pause, truncation, redirect, absent file)");
 }
}
