package br.com.territorio.gestao;

import android.Manifest;
import android.app.ActivityManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.AtomicFile;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashSet;
import org.json.JSONArray;
import org.json.JSONObject;

/** One bounded owner-authenticated request, ids only; no retry loop, foreground service or wake lock. */
public class AgroOrdersWorker extends Worker {
    static volatile boolean foreground=false;
    static final int NOTICE=1900000059;
    static final String CHANNEL="agro-order-arrivals";
    public AgroOrdersWorker(@NonNull Context context,@NonNull WorkerParameters parameters){super(context,parameters);}
    static AtomicFile file(Context c){return new AtomicFile(new File(c.getNoBackupFilesDir(),"agro-order-arrivals-v1.json"));}
    static JSONObject read(Context c){try{return new JSONObject(new String(file(c).readFully(),StandardCharsets.UTF_8));}catch(Exception e){return new JSONObject();}}
    static void write(Context c,JSONObject data)throws Exception{AtomicFile target=file(c);FileOutputStream stream=null;try{stream=target.startWrite();stream.write(data.toString().getBytes(StandardCharsets.UTF_8));target.finishWrite(stream);}catch(Exception e){if(stream!=null)target.failWrite(stream);throw e;}}
    static JSONArray merge(JSONArray first,JSONArray second){LinkedHashSet<String> ids=new LinkedHashSet<>();for(JSONArray rows:new JSONArray[]{first,second})if(rows!=null)for(int i=0;i<rows.length();i++){String id=rows.optString(i);if(id.matches("[a-f0-9-]{16,100}"))ids.add(id);}while(ids.size()>600)ids.remove(ids.iterator().next());return new JSONArray(ids);}
    static boolean allowed(Context c){return Build.VERSION.SDK_INT<33||ContextCompat.checkSelfPermission(c,Manifest.permission.POST_NOTIFICATIONS)==PackageManager.PERMISSION_GRANTED;}
    static void dismiss(Context c){NotificationManager n=c.getSystemService(NotificationManager.class);if(n!=null)n.cancel(NOTICE);}
    protected JSONObject fetch(JSONObject config)throws Exception{
        URL url=new URL("https://agro-gestao.agro-gestao.workers.dev/api/shops/"+config.getString("slug")+"/alerts");
        HttpURLConnection connection=(HttpURLConnection)url.openConnection();connection.setConnectTimeout(10000);connection.setReadTimeout(10000);connection.setInstanceFollowRedirects(false);connection.setRequestProperty("Authorization","Bearer "+config.getString("token"));connection.setRequestProperty("Accept","application/json");connection.setUseCaches(false);
        try{int status=connection.getResponseCode();if(status==401||status==404)throw new SecurityException();if(status!=200)throw new java.io.IOException();try(InputStream input=connection.getInputStream();ByteArrayOutputStream output=new ByteArrayOutputStream()){byte[] buffer=new byte[4096];int length;while((length=input.read(buffer))!=-1){if(isStopped()||output.size()+length>65536)throw new java.io.IOException();output.write(buffer,0,length);}return new JSONObject(output.toString("UTF-8"));}}finally{connection.disconnect();}
    }
    @NonNull @Override public Result doWork(){
        Context context=getApplicationContext();ActivityManager.RunningAppProcessInfo process=new ActivityManager.RunningAppProcessInfo();ActivityManager.getMyMemoryState(process);
        if(isStopped()||foreground||process.importance<=ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND||!allowed(context))return Result.success();
        try{checkOnce(context);}catch(Exception ignored){}
        return Result.success();
    }
    void checkOnce(Context context)throws Exception{
        JSONObject config; synchronized(AgroOrdersWorker.class){config=read(context);}if(!config.optBoolean("enabled"))return;
        JSONObject response;try{response=fetch(config);}catch(SecurityException error){synchronized(AgroOrdersWorker.class){if(read(context).optString("generation").equals(config.optString("generation"))){write(context,new JSONObject());dismiss(context);}}return;}applySummary(context,config,response,isStopped());
    }
    static void applySummary(Context context,JSONObject config,JSONObject response,boolean stopped)throws Exception{
        JSONArray ids=response.optJSONArray("requested");if(ids==null||ids.length()>300)throw new java.io.IOException();
        synchronized(AgroOrdersWorker.class){
            JSONObject current=read(context);if(stopped||!current.optBoolean("enabled")||!current.optString("generation").equals(config.optString("generation")))return;
            JSONArray known=merge(current.optJSONArray("seen"),null),merged=merge(known,ids);java.util.HashSet<String> seen=new java.util.HashSet<>();for(int i=0;i<known.length();i++)seen.add(known.optString(i));boolean added=false;for(int i=0;i<ids.length();i++){String id=ids.optString(i);if(!id.matches("[a-f0-9-]{16,100}"))throw new java.io.IOException();if(!seen.contains(id))added=true;}
            if(response.optBoolean("enabled")&&added&&allowed(context)&&!foreground){notifyNew(context);}
            // If app resumed while fetching, its own refresh will announce/acknowledge arrivals.
            if(ids.length()==0)dismiss(context);current.put("seen",merged);write(context,current);
        }
    }
    static void notifyNew(Context context){
        NotificationManager manager=context.getSystemService(NotificationManager.class);if(manager==null)return;
        if(Build.VERSION.SDK_INT>=26){NotificationChannel channel=new NotificationChannel(CHANNEL,"Novos Pedidos",NotificationManager.IMPORTANCE_DEFAULT);channel.setDescription("Avisa sobre novos pedidos quando o Android verifica a lista.");channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PRIVATE);manager.createNotificationChannel(channel);}
        Intent launch=new Intent(context,MainActivity.class).setAction("agro.orders").addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent click=PendingIntent.getActivity(context,NOTICE,launch,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        int icon=context.getResources().getIdentifier("ic_stat_territorio","drawable",context.getPackageName());
        manager.notify(NOTICE,new NotificationCompat.Builder(context,CHANNEL).setSmallIcon(icon).setContentTitle("Novo Pedido Recebido")
            .setContentText("Abra Pedidos e Entregas para conferir e iniciar o preparo.").setContentIntent(click).setVisibility(NotificationCompat.VISIBILITY_PRIVATE).setAutoCancel(true).setOnlyAlertOnce(true).build());
    }
}
