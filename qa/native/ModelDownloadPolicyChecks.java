package br.com.territorio.gestao;
import java.net.URL;
public class ModelDownloadPolicyChecks {
 public static void main(String[] args)throws Exception{
  String[] allowed={"https://huggingface.co/model","https://cdn-lfs.huggingface.co/model","https://cas-bridge.xethub.hf.co/model","https://hf.co:443/model"};
  String[] denied={"http://huggingface.co/model","https://huggingface.co.evil.example/model","https://evil-hf.co/model","https://user:secret@huggingface.co/model","https://huggingface.co:444/model","https://127.0.0.1/model","https://example.com/model"};
  for(String u:allowed)if(!ModelDownloadPolicy.allowed(new URL(u)))throw new AssertionError(u);
  for(String u:denied)if(ModelDownloadPolicy.allowed(new URL(u)))throw new AssertionError(u);
  System.out.println("PASS: 11 download destination scenarios; no network requests made.");
 }
}
