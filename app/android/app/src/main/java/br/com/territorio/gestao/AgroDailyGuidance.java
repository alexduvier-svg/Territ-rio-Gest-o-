package br.com.territorio.gestao;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.AtomicFile;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.TimeZone;

/** Only generic, bundled educational text. No ERP database, network or financial figures. */
final class AgroDailyGuidance {
 static final String CHANNEL="dicas-do-negocio",EXTRA="agro_daily_topic";
 static final int NOTICE=1910000077;
 static boolean active(Context c){
  NotificationManager manager=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);
  if(manager==null)return false;
  for(android.service.notification.StatusBarNotification n:manager.getActiveNotifications())if(n.getId()==NOTICE&&"agro-daily".equals(n.getTag()))return true;
  return false;
 }
 private static AtomicFile file(Context c){return new AtomicFile(new File(c.getNoBackupFilesDir(),"agro-daily-guidance-v1.json"));}
 static synchronized void configure(Context c,JSONObject input)throws Exception{
  JSONArray source=input.optJSONArray("topics"),topics=new JSONArray();
  if(source==null||source.length()>120)throw new IllegalArgumentException("Biblioteca de dicas inválida.");
  for(int i=0;i<source.length();i++){JSONObject v=source.getJSONObject(i);String id=v.optString("id"),title=v.optString("title"),body=v.optString("body");
   if(id.isEmpty()||id.length()>80||title.isEmpty()||title.length()>160||body.isEmpty()||body.length()>1200)throw new IllegalArgumentException("Dica inválida.");
   topics.put(new JSONObject().put("id",id).put("title",title).put("body",body));}
  String actor=input.optString("actorHash");if(!actor.matches("[a-f0-9]{1,8}"))throw new IllegalArgumentException("Contexto inválido.");
  JSONObject out=new JSONObject().put("enabled",input.optBoolean("enabled")).put("actorHash",actor).put("seed",Math.max(0,input.optInt("seed"))).put("topics",topics);
  AtomicFile f=file(c);FileOutputStream stream=null;try{stream=f.startWrite();stream.write(out.toString().getBytes(StandardCharsets.UTF_8));f.finishWrite(stream);}catch(Exception e){if(stream!=null)f.failWrite(stream);throw e;}
  if(!out.optBoolean("enabled")){NotificationManager manager=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);if(manager!=null)manager.cancel("agro-daily",NOTICE);}
 }
 static synchronized boolean show(Context c){
  try{
   JSONObject config=new JSONObject(new String(file(c).readFully(),StandardCharsets.UTF_8));JSONArray topics=config.optJSONArray("topics");
   if(!config.optBoolean("enabled")||topics==null||topics.length()==0)return false;
   if(Build.VERSION.SDK_INT>=33&&ContextCompat.checkSelfPermission(c,Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return false;
   NotificationManager manager=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);if(manager==null||!manager.areNotificationsEnabled())return false;
   long now=System.currentTimeMillis(),day=Math.floorDiv(now+TimeZone.getTimeZone("America/Sao_Paulo").getOffset(now),86400000L);
   String key="daily-guidance-day-"+config.optString("actorHash");android.content.SharedPreferences prefs=c.getSharedPreferences(AgroAgentSchedulerPlugin.PREFS,Context.MODE_PRIVATE);
   if(prefs.getLong(key,Long.MIN_VALUE)==day)return false;
   JSONObject topic=topics.getJSONObject((int)Math.floorMod(day+config.optInt("seed"),topics.length()));
   if(Build.VERSION.SDK_INT>=26){NotificationChannel channel=new NotificationChannel(CHANNEL,"Dicas do Negócio",NotificationManager.IMPORTANCE_LOW);channel.setDescription("Uma ideia educativa por dia, quando ativada.");channel.setSound(null,null);channel.enableVibration(false);manager.createNotificationChannel(channel);}
   Intent intent=c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());if(intent==null)return false;intent.putExtra(EXTRA,topic.getString("id"));intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
   PendingIntent tap=PendingIntent.getActivity(c,NOTICE,intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
   int icon=c.getResources().getIdentifier("ic_stat_territorio","drawable",c.getPackageName());if(icon==0)icon=c.getApplicationInfo().icon;
   manager.notify("agro-daily",NOTICE,new NotificationCompat.Builder(c,CHANNEL).setSmallIcon(icon).setContentTitle(topic.getString("title")).setContentText(topic.getString("body")).setStyle(new NotificationCompat.BigTextStyle().bigText(topic.getString("body"))).setContentIntent(tap).setVisibility(NotificationCompat.VISIBILITY_PRIVATE).setSilent(true).setOnlyAlertOnce(true).setAutoCancel(true).build());
   return prefs.edit().putLong(key,day).commit();
  }catch(Exception ignored){return false;}
 }
}
