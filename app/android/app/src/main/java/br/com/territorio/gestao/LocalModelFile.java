package br.com.territorio.gestao;
import java.io.*;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.function.BooleanSupplier;
/** Copies only an app asset supplied by the caller; no URLs or network clients. */
final class LocalModelFile {
 static void install(InputStream source,File temporary,File target,long size,String expected,BooleanSupplier cancelled)throws IOException {
  if(size<=0||!expected.matches("[a-f0-9]{64}"))throw new IOException("Configuração inválida.");
  try{
   MessageDigest digest=MessageDigest.getInstance("SHA-256");long count=0;
   try(FileOutputStream out=new FileOutputStream(temporary)){byte[] buffer=new byte[1024*1024];int n;
    while((n=source.read(buffer))!=-1){if(cancelled.getAsBoolean())throw new IOException("Preparação cancelada.");count+=n;if(count>size)throw new IOException("Modelo diferente do esperado.");digest.update(buffer,0,n);out.write(buffer,0,n);}out.getFD().sync();
   }
   StringBuilder hash=new StringBuilder();for(byte value:digest.digest())hash.append(String.format(Locale.ROOT,"%02x",value&255));
   if(count!=size||!expected.equals(hash.toString()))throw new IOException("Modelo incompleto ou inválido.");
   if(cancelled.getAsBoolean())throw new IOException("Preparação cancelada.");
   if(!temporary.renameTo(target))throw new IOException("Não foi possível guardar o modelo verificado.");
  }catch(java.security.NoSuchAlgorithmException e){throw new IOException("Verificação indisponível.",e);}finally{if(temporary.exists())temporary.delete();}
 }
}
