package br.com.territorio.gestao;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.BatteryManager;
import android.app.ActivityManager;
import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/** Weather-only storage. Never reads or rewrites the ERP database. */
final class AgroWeatherCache {
    static final String PREFS="agro-weather-v1";
    static final long INTERVAL=30*60*1000L;
    static final String ENDPOINT="https://agro-gestao.agro-gestao.workers.dev/api/weather";
    static volatile boolean foreground=false;
    static SharedPreferences prefs(Context c){return c.getSharedPreferences(PREFS,Context.MODE_PRIVATE);}
    static String key(String city,String uf){return java.text.Normalizer.normalize(city.trim(),java.text.Normalizer.Form.NFD).replaceAll("\\p{M}","").toLowerCase(java.util.Locale.ROOT)+"|"+uf;}
    static boolean validLocation(String city,String uf){return city!=null&&city.trim().length()>0&&city.length()<=100&&uf!=null&&uf.matches("[A-Z]{2}");}
    static boolean batteryAllowed(int percent){return percent>=50&&percent<=100;}
    static int batteryPercent(Context c){
        try{Intent i=c.registerReceiver(null,new IntentFilter(Intent.ACTION_BATTERY_CHANGED));int level=i==null?-1:i.getIntExtra(BatteryManager.EXTRA_LEVEL,-1),scale=i==null?0:i.getIntExtra(BatteryManager.EXTRA_SCALE,0);return level>=0&&scale>0?(int)(100L*level/scale):-1;}catch(Exception e){return -1;}
    }
    static boolean inForeground(){ActivityManager.RunningAppProcessInfo info=new ActivityManager.RunningAppProcessInfo();ActivityManager.getMyMemoryState(info);return foreground||info.importance==ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND;}
    static long dueAt(JSONObject data,long checked,long failed){return Math.max(Math.max(data==null?0:data.optLong("expiresAt",0),checked>0?checked+INTERVAL:data==null?0:data.optLong("retrievedAt",0)+INTERVAL),failed);}
    static JSONObject raw(SharedPreferences p,String id){try{return new JSONObject(p.getString("cache:"+id,""));}catch(Exception e){return null;}}
    static JSONObject read(Context c,String city,String uf){
        if(!validLocation(city,uf))return null;SharedPreferences p=prefs(c);String id=key(city,uf);JSONObject data=raw(p,id);
        if(data!=null)try{long checked=p.getLong("checked:"+id,0);if(checked>0)data.put("checkedAt",checked);data.put("retryAt",p.getLong("failed:"+id,0));}catch(Exception ignored){}
        return data;
    }
    static synchronized JSONObject fetch(Context c,String city,String uf,boolean background) throws Exception {
        if(!validLocation(city,uf))throw new IllegalArgumentException("Município inválido");
        SharedPreferences p=prefs(c);String id=key(city,uf),prefix=background?"bg:":"";long now=System.currentTimeMillis();JSONObject old=raw(p,id);long generation=p.getLong("generation",0);
        if(!p.getBoolean("active",false))return null;
        if(background&&(!p.getBoolean("enabled",false)||inForeground()||!batteryAllowed(batteryPercent(c))))return read(c,city,uf);
        if(now<dueAt(old,p.getLong(prefix+"checked:"+id,0),p.getLong(prefix+"failed:"+id,0)))return read(c,city,uf);
        HttpURLConnection connection=null;
        try{
            URL url=new URL(ENDPOINT+"?city="+URLEncoder.encode(city,"UTF-8")+"&uf="+uf+(background?"&cacheOnly=1":""));
            connection=(HttpURLConnection)url.openConnection();connection.setConnectTimeout(8000);connection.setReadTimeout(8000);connection.setInstanceFollowRedirects(false);
            connection.setRequestProperty("Accept","application/json");connection.setRequestProperty("User-Agent","AGRO-Gestao-Android/0.12.27");
            String etag=p.getString("etag:"+id,"");if(old!=null&&!etag.isEmpty())connection.setRequestProperty("If-None-Match",etag);
            int status=connection.getResponseCode();
            if(status==204&&background){p.edit().putLong(prefix+"checked:"+id,now).remove(prefix+"failed:"+id).commit();return read(c,city,uf);}
            if(status==304&&old!=null){p.edit().putLong(prefix+"checked:"+id,now).remove(prefix+"failed:"+id).commit();return read(c,city,uf);}
            if(status!=200)throw new java.io.IOException("Previsão indisponível");
            ByteArrayOutputStream bytes=new ByteArrayOutputStream();
            try(InputStream input=connection.getInputStream()){byte[] chunk=new byte[4096];int n;while((n=input.read(chunk))!=-1){if(bytes.size()+n>384*1024)throw new java.io.IOException("Resposta excessiva");bytes.write(chunk,0,n);}}
            JSONObject data=new JSONObject(bytes.toString("UTF-8")),loc=data.optJSONObject("city");
            if(data.optInt("version")!=1||!"MET Norway".equals(data.optString("source"))||loc==null||!key(city,uf).equals(key(loc.optString("name"),loc.optString("uf")))||data.optJSONArray("points")==null||data.getJSONArray("points").length()==0||data.getJSONArray("points").length()>250||data.optLong("expiresAt",0)<=0||data.optLong("retrievedAt",0)<=0)throw new java.io.IOException("Previsão inválida");
            // A cancelled preference must not be revived by an in-flight background response.
            if(!p.getBoolean("active",false)||p.getLong("generation",0)!=generation||background&&!p.getBoolean("enabled",false))return null;
            SharedPreferences.Editor edit=p.edit().putString("cache:"+id,data.toString()).putLong(prefix+"checked:"+id,now).remove(prefix+"failed:"+id);
            String nextEtag=connection.getHeaderField("ETag");if(nextEtag!=null&&nextEtag.length()<200)edit.putString("etag:"+id,nextEtag);
            if(!edit.commit())throw new java.io.IOException("Cache pendente");prune(p,id);return read(c,city,uf);
        }catch(Exception e){p.edit().putLong(prefix+"failed:"+id,now+15*60*1000L).commit();if(old!=null)return read(c,city,uf);throw e;}
        finally{if(connection!=null)connection.disconnect();}
    }
    private static void prune(SharedPreferences p,String keep){
        List<String> ids=new ArrayList<>();for(String k:p.getAll().keySet())if(k.startsWith("cache:"))ids.add(k.substring(6));
        Collections.sort(ids,(a,b)->{if(a.equals(keep))return -1;if(b.equals(keep))return 1;JSONObject x=raw(p,a),y=raw(p,b);return Long.compare(y==null?0:y.optLong("retrievedAt"),x==null?0:x.optLong("retrievedAt"));});
        SharedPreferences.Editor edit=p.edit();for(int i=10;i<ids.size();i++){String id=ids.get(i);if(id.equals(keep))continue;for(String prefix:new String[]{"cache:","etag:","checked:","failed:","bg:checked:","bg:failed:"})edit.remove(prefix+id);}edit.apply();
    }
}
