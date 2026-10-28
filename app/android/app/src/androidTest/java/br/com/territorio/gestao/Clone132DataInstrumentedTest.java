package br.com.territorio.gestao;

import android.content.Context;
import android.os.Bundle;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import java.util.zip.ZipOutputStream;
import static org.junit.Assert.*;

/** Owner-authorized, offline transfer helper. No business records are embedded in this APK. */
@RunWith(AndroidJUnit4.class)
public class Clone132DataInstrumentedTest {
    private static final String TARGET = "br.com.territorio.gestao2";
    private static final String SOURCE = "br.com.territorio.gestaoclaude";
    private static final long LIMIT = 128L * 1024 * 1024;
    private static final long MAX_SAFE = 9007199254740991L;
    private static final String[] ROOTS = {"territorio", "territorio-training"};

    static Context target() {
        Context c = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertEquals("This helper can only target the Codex package", TARGET, c.getPackageName());
        return c;
    }
    static String arg(String name, String fallback) {
        return InstrumentationRegistry.getArguments().getString(name, fallback);
    }
    static String transferId() {
        String id = arg("transferId", "");
        assertTrue("Explicit transferId required", id.matches("[A-Za-z0-9_-]{8,80}"));
        return id;
    }
    static File under(File root, String relative) throws Exception {
        File file = new File(root, relative).getCanonicalFile();
        String prefix = root.getCanonicalPath() + File.separator;
        assertTrue("Transfer path escapes its root", file.getCanonicalPath().startsWith(prefix));
        return file;
    }
    static void mkdir(File dir) throws Exception {
        assertTrue("Cannot prepare private transfer directory", dir.isDirectory() || dir.mkdirs());
    }
    static byte[] bytes(File file) throws Exception {
        assertTrue("Transfer input is missing or too large", file.isFile() && file.length() <= LIMIT);
        return Files.readAllBytes(file.toPath());
    }
    static String utf8(File file) throws Exception {
        return new String(bytes(file), StandardCharsets.UTF_8);
    }
    static String hash(byte[] value) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(value);
        StringBuilder out = new StringBuilder();
        for (byte b : digest) out.append(String.format(Locale.ROOT, "%02x", b & 255));
        return out.toString();
    }
    static String hash(File file) throws Exception { return hash(bytes(file)); }
    static void atomicWrite(File file, byte[] value) throws Exception {
        mkdir(file.getParentFile());
        File tmp = new File(file.getParentFile(), file.getName() + ".clone132.tmp");
        assertFalse("Unfinished transfer file requires review", tmp.exists());
        try (FileOutputStream out = new FileOutputStream(tmp)) {out.write(value);out.getFD().sync();}
        assertEquals("Temporary transfer write mismatch", hash(value), hash(tmp));
        assertTrue("Cannot commit transfer file", tmp.renameTo(file));
        assertEquals("Committed transfer write mismatch", hash(value), hash(file));
    }
    static List<File> tree(File root) throws Exception {
        List<File> out = new ArrayList<>();
        if (!root.exists()) return out;
        assertTrue("Transfer root must be a directory", root.isDirectory());
        File[] children = root.listFiles();assertNotNull("Cannot list private transfer tree", children);
        Arrays.sort(children, Comparator.comparing(File::getName));
        for (File child : children) {
            assertEquals("Symbolic transfer files are not supported", child.getAbsolutePath(), child.getCanonicalPath());
            if (child.isDirectory()) out.addAll(tree(child));else {assertTrue(child.isFile());out.add(child);}
        }
        return out;
    }
    static String relative(File root, File file) throws Exception {
        return file.getCanonicalPath().substring(root.getCanonicalPath().length() + 1).replace(File.separatorChar, '/');
    }
    static String checksum(String text) {
        int value = 0x811c9dc5;
        for (int i = 0; i < text.length(); i++) value = (value ^ text.charAt(i)) * 0x01000193;
        return String.format(Locale.ROOT, "%08x", value);
    }
    static class Slot {
        final long seq;final String json;final JSONObject data;
        Slot(long seq, String json, JSONObject data) {this.seq=seq;this.json=json;this.data=data;}
    }
    static Slot record(File file, boolean business, boolean training) throws Exception {
        String raw = utf8(file);int split = raw.indexOf('\n');
        assertTrue("Slot header missing", split > 0);
        JSONObject header = new JSONObject(raw.substring(0, split));String json = raw.substring(split + 1);
        long seq = header.getLong("seq");assertTrue("Invalid slot sequence", seq >= 0 && seq <= MAX_SAFE);
        assertEquals("Slot length mismatch", header.getInt("length"), json.length());
        if (header.has("checksum")) {
            String expected = header.getString("checksum");
            String actual = checksum(json);
            assertTrue("Slot checksum mismatch", expected.equals(actual) || training && expected.equals(actual.replaceFirst("^0+(?!$)", "")));
        }
        JSONObject data = new JSONObject(json);
        if (business) validateBusiness(data);
        else assertEquals("Unknown record format", 1, data.getInt("version"));
        if (training) {
            assertEquals(seq, data.getLong("seq"));
            assertEquals(1, data.getInt("version"));
            assertTrue(data.get("active") instanceof Boolean);
            if (data.getBoolean("active")) {
                JSONObject model = data.getJSONObject("data");validateBusiness(model);
                assertEquals("demo", model.getJSONObject("dataContext").getString("type"));
                assertEquals(model.getJSONObject("training").getString("actorId"), model.getJSONObject("dataContext").getString("id"));
            }
        }
        return new Slot(seq, json, data);
    }
    static void validateBusiness(JSONObject data) throws Exception {
        assertEquals("Unknown backup schema", 1, data.getInt("schema"));
        for (String key : new String[]{"products","sales","clients","events","movements","expenses"}) assertTrue("Business array missing", data.get(key) instanceof JSONArray);
        JSONArray products = data.getJSONArray("products");
        for(int i=0;i<products.length();i++) {
            JSONObject p=products.getJSONObject(i);assertTrue("Product identifier missing", p.getString("id").length()>0);
            for(String key:new String[]{"stock","price","cost"}) {double n=p.getDouble(key);assertTrue("Invalid product amount", Double.isFinite(n)&&n>=0);}
        }
        assertTrue("Settings missing", data.get("settings") instanceof JSONObject);
    }
    static Slot newestBusiness(File root) throws Exception {
        List<Slot> valid = new ArrayList<>();
        for(String name:new String[]{"territorio/data-a.json","territorio/data-b.json"}) {
            File file=under(root,name);if(!file.isFile())continue;
            try {valid.add(record(file,true,false));}catch(Throwable ignored) { /* One failed A/B slot is recoverable. */ }
        }
        assertFalse("No valid business slot was found",valid.isEmpty());
        Collections.sort(valid,(a,b)->Long.compare(b.seq,a.seq));return valid.get(0);
    }
    static JSONObject counts(JSONObject data) throws Exception {
        JSONObject out=new JSONObject();
        for(String key:new String[]{"products","sales","clients","events","movements","expenses"}) out.put(key,data.getJSONArray(key).length());
        out.put("businessSha256",hash(data.toString().getBytes(StandardCharsets.UTF_8)));
        return out;
    }
    static File exportRoot(Context c,String id) throws Exception {
        File external=c.getExternalFilesDir(null);assertNotNull("External transfer storage unavailable",external);
        File dir=under(external,"clone132-export/"+id);mkdir(dir);return dir;
    }
    static JSONObject exportBackup(Context c,String id) throws Exception {
        File root=exportRoot(c,id),zip=new File(root,"backup.zip"),report=new File(root,"backup-manifest.json");
        if(zip.exists()||report.exists()) {
            assertTrue("Incomplete prior backup requires review",zip.isFile()&&report.isFile());
            JSONObject prior=new JSONObject(utf8(report));assertEquals(hash(zip),prior.getString("backupSha256"));return prior;
        }
        File files=c.getFilesDir();JSONArray manifest=new JSONArray();
        File temp=new File(root,"backup.zip.tmp");assertFalse("Unfinished backup requires review",temp.exists());
        try(ZipOutputStream out=new ZipOutputStream(new FileOutputStream(temp))) {
            for(String name:ROOTS)for(File file:tree(under(files,name))) {
                String rel=relative(files,file);byte[] content=bytes(file);
                manifest.put(new JSONObject().put("path",rel).put("bytes",content.length).put("sha256",hash(content)));
                out.putNextEntry(new ZipEntry(rel));out.write(content);out.closeEntry();
            }
        }
        try(ZipFile verify=new ZipFile(temp)) {assertEquals(manifest.length(),verify.size());
            for(int i=0;i<manifest.length();i++) {JSONObject file=manifest.getJSONObject(i);try(InputStream in=verify.getInputStream(verify.getEntry(file.getString("path")))) {
                ByteArrayOutputStream memory=new ByteArrayOutputStream();byte[] buffer=new byte[16384];int n;
                while((n=in.read(buffer))!=-1){memory.write(buffer,0,n);assertTrue(memory.size()<=LIMIT);}
                assertEquals(file.getString("sha256"),hash(memory.toByteArray()));
            }}
        }
        assertTrue("Cannot finalize Codex safety backup",temp.renameTo(zip));
        JSONObject result=new JSONObject().put("version",1).put("targetPackage",TARGET).put("transferId",id).put("backupSha256",hash(zip)).put("files",manifest).put("createdAtEpochMs",System.currentTimeMillis());
        try{result.put("counts",counts(newestBusiness(files).data));}catch(Throwable absent){result.put("countsAvailable",false);}
        atomicWrite(report,result.toString(2).getBytes(StandardCharsets.UTF_8));
        return result;
    }
    static boolean allowed(String path) {
        return path.matches("territorio/(data-[ab]|recovery-[ab])\\.json") || path.matches("territorio/backups/\\d{4}-\\d{2}-\\d{2}\\.json") || path.matches("territorio-training/[ab]\\.json");
    }
    static void validateImportFile(String path,File file) throws Exception {
        if(path.matches("territorio/data-[ab]\\.json"))record(file,true,false);
        else if(path.matches("territorio/recovery-[ab]\\.json"))record(file,false,false);
        else if(path.startsWith("territorio-training/"))record(file,false,true);
        else validateBusiness(new JSONObject(utf8(file)));
    }
    static JSONObject apply(Context c,String id) throws Exception {
        JSONObject backup=exportBackup(c,id);
        String acknowledged=arg("backupSha256","");
        assertTrue("Host must confirm the pulled Codex backup hash",acknowledged.matches("[a-f0-9]{64}"));
        assertEquals("Safety backup acknowledgement mismatch",backup.getString("backupSha256"),acknowledged);
        assertEquals("Explicit clone application parameter required","CLAUDE132_TO_CODEX",arg("confirmClone",""));
        File external=c.getExternalFilesDir(null),incoming=under(external,"clone132-import/"+id),manifestFile=under(incoming,"manifest.json");
        String manifestHash=arg("manifestSha256","");assertTrue(manifestHash.matches("[a-f0-9]{64}"));assertEquals("Import manifest hash mismatch",manifestHash,hash(manifestFile));
        JSONObject manifest=new JSONObject(utf8(manifestFile));
        assertEquals(1,manifest.getInt("version"));assertEquals(SOURCE,manifest.getString("sourcePackage"));assertEquals("0.12.133",arg("sourceVersion",""));assertEquals(arg("sourceVersion",""),manifest.getString("sourceVersion"));
        JSONArray list=manifest.getJSONArray("files");assertTrue("No source files",list.length()>0&&list.length()<2000);
        List<String> seen=new ArrayList<>();long total=0;
        for(int i=0;i<list.length();i++) {
            JSONObject item=list.getJSONObject(i);String rel=item.getString("path");assertTrue("Unexpected imported path",allowed(rel));assertFalse("Repeated import path",seen.contains(rel));seen.add(rel);
            File file=under(incoming,rel);assertEquals("Source file hash mismatch",item.getString("sha256"),hash(file));validateImportFile(rel,file);total+=file.length();assertTrue("Transfer too large",total<=LIMIT*4);
        }
        Slot source=newestBusiness(incoming);
        File transaction=under(c.getNoBackupFilesDir(),"clone132-transfer/"+id);mkdir(transaction);
        File receipt=under(transaction,"applied.json");
        if(receipt.isFile()) {JSONObject prior=new JSONObject(utf8(receipt));assertEquals(manifestHash,prior.getString("manifestSha256"));assertEquals(source.json,newestBusiness(c.getFilesDir()).json);for(int i=0;i<list.length();i++){JSONObject item=list.getJSONObject(i);assertEquals(item.getString("sha256"),hash(under(c.getFilesDir(),item.getString("path"))));}return prior;}
        File prepared=under(transaction,"prepared"),original=under(transaction,"original");assertFalse("Previous partial transfer requires rollback/review",prepared.exists()||original.exists());mkdir(prepared);mkdir(original);
        for(int i=0;i<list.length();i++) {JSONObject item=list.getJSONObject(i);String rel=item.getString("path");atomicWrite(under(prepared,rel),bytes(under(incoming,rel)));}
        assertEquals(source.json,newestBusiness(prepared).json);
        List<String> moved=new ArrayList<>(),installed=new ArrayList<>();
        try {
            for(String name:ROOTS) {
                File live=under(c.getFilesDir(),name),old=under(original,name),replacement=under(prepared,name);
                if(live.exists()){assertTrue("Cannot preserve original private data",live.renameTo(old));moved.add(name);}
                if(replacement.exists()){assertTrue("Cannot activate cloned private data",replacement.renameTo(live));installed.add(name);}
            }
            assertEquals("Active cloned business data mismatch",source.json,newestBusiness(c.getFilesDir()).json);
            for(int i=0;i<list.length();i++) {JSONObject item=list.getJSONObject(i);assertEquals(item.getString("sha256"),hash(under(c.getFilesDir(),item.getString("path"))));}
        }catch(Throwable failure) {
            File rejected=under(transaction,"rejected");mkdir(rejected);
            for(String name:installed){File live=under(c.getFilesDir(),name);if(live.exists())assertTrue("Rollback quarantine failed",live.renameTo(under(rejected,name)));}
            for(String name:moved){assertTrue("Rollback restoration failed",under(original,name).renameTo(under(c.getFilesDir(),name)));}
            throw failure;
        }
        JSONObject result=new JSONObject().put("version",1).put("targetPackage",TARGET).put("sourcePackage",SOURCE).put("transferId",id).put("manifestSha256",manifestHash).put("backupSha256",acknowledged).put("counts",counts(source.data)).put("filesCopied",list.length()).put("status","applied-offline-before-launch").put("appliedAtEpochMs",System.currentTimeMillis());
        atomicWrite(receipt,result.toString(2).getBytes(StandardCharsets.UTF_8));
        atomicWrite(under(exportRoot(c,id),"applied.json"),result.toString(2).getBytes(StandardCharsets.UTF_8));return result;
    }
    @Test public void transfer() throws Exception {
        Context c=target();String id=transferId(),action=arg("action","");JSONObject result;
        if("export".equals(action))result=exportBackup(c,id);
        else if("apply".equals(action))result=apply(c,id);
        else throw new AssertionError("Only explicit export/apply actions are supported");
        Bundle status=new Bundle();status.putString("clone132_action",action);status.putString("clone132_transfer_id",id);status.putString("clone132_backup_sha256",result.getString("backupSha256"));status.putString("clone132_export_directory",exportRoot(c,id).getAbsolutePath());
        if(result.has("filesCopied"))status.putInt("clone132_files_copied",result.getInt("filesCopied"));
        InstrumentationRegistry.getInstrumentation().sendStatus(0,status);
    }
}
