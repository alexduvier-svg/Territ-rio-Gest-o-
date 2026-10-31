package br.com.territorio.gestao;
import java.io.*;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.*;
public class LocalModelFileChecks {
 static final byte[] DATA="local-model-synthetic-fixture".getBytes();
 interface Job{void run()throws Exception;}
 static void fails(Job action)throws Exception{try{action.run();throw new AssertionError("Expected refusal");}catch(IOException expected){}}
 static void require(boolean ok){if(!ok)throw new AssertionError();}
 public static void main(String[] args)throws Exception{
  Path dir=Files.createTempDirectory("agro-local-model-");File temp=dir.resolve("copy.part").toFile(),target=dir.resolve("model.bin").toFile();
  StringBuilder h=new StringBuilder();for(byte b:MessageDigest.getInstance("SHA-256").digest(DATA))h.append(String.format("%02x",b&255));String hash=h.toString();int passed=0;
  LocalModelFile.install(new ByteArrayInputStream(DATA),temp,target,DATA.length,hash,()->false);require(Arrays.equals(Files.readAllBytes(target.toPath()),DATA));require(!temp.exists());passed++;
  byte[] original=Files.readAllBytes(target.toPath());
  fails(()->LocalModelFile.install(new ByteArrayInputStream(DATA),temp,target,DATA.length,"0".repeat(64),()->false));require(Arrays.equals(Files.readAllBytes(target.toPath()),original));require(!temp.exists());passed++;
  fails(()->LocalModelFile.install(new ByteArrayInputStream(Arrays.copyOf(DATA,4)),temp,target,DATA.length,hash,()->false));require(!temp.exists());passed++;
  fails(()->LocalModelFile.install(new ByteArrayInputStream(DATA),temp,target,DATA.length-1,hash,()->false));require(!temp.exists());passed++;
  fails(()->LocalModelFile.install(new ByteArrayInputStream(DATA),temp,target,DATA.length,hash,()->true));require(!temp.exists());require(Arrays.equals(Files.readAllBytes(target.toPath()),original));passed++;
  fails(()->LocalModelFile.install(new ByteArrayInputStream(DATA),temp,target,DATA.length,"invalid",()->false));passed++;
  System.out.println("PASS: "+passed+" packaged model scenarios (valid install, hash, truncation, oversize, cancellation, invalid config)");
 }
}
