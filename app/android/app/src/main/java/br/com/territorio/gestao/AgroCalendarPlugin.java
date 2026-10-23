package br.com.territorio.gestao;

import android.Manifest;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.content.ContentProviderOperation;
import android.content.ContentProviderResult;
import android.content.ContentUris;
import android.content.ContentValues;
import android.database.Cursor;
import android.provider.CalendarContract;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Explicit export only. Never scans personal events or stores account names. */
@CapacitorPlugin(name="AgroCalendar", permissions={@Permission(alias="calendar",strings={Manifest.permission.READ_CALENDAR,Manifest.permission.WRITE_CALENDAR})})
public class AgroCalendarPlugin extends Plugin {
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    @PluginMethod public void calendars(PluginCall call){
        if(getPermissionState("calendar")!=PermissionState.GRANTED){requestPermissionForAlias("calendar",call,"calendarPermission");return;}
        list(call);
    }
    @PermissionCallback private void calendarPermission(PluginCall call){
        if(getPermissionState("calendar")==PermissionState.GRANTED)list(call);
        else{JSObject out=new JSObject();out.put("granted",false);call.resolve(out);}
    }
    private void list(PluginCall call){io.execute(()->{try{
        JSArray rows=new JSArray();
        try(Cursor cursor=getContext().getContentResolver().query(CalendarContract.Calendars.CONTENT_URI,
            new String[]{"_id","calendar_displayName","account_type","allowedReminders","maxReminders"},
            "calendar_access_level >= ? AND visible = ?",new String[]{"500","1"},"isPrimary DESC, _id ASC")){
            while(cursor!=null&&cursor.moveToNext()&&rows.length()<30){
                String allowed=cursor.getString(3);if(cursor.getInt(4)<1||allowed==null||!(","+allowed+",").contains(",1,"))continue;
                JSObject row=new JSObject();row.put("id",cursor.getLong(0));row.put("name",cursor.getString(1));row.put("google","com.google".equals(cursor.getString(2)));rows.put(row);
            }
        }
        JSObject out=new JSObject();out.put("granted",true);out.put("calendars",rows);call.resolve(out);
    }catch(Exception e){call.reject("Não foi possível acessar as agendas. Use o arquivo de calendário.");}});}
    static String ownKey(String key)throws Exception{
        if(key==null||key.isEmpty()||key.length()>500)throw new IllegalArgumentException();
        byte[] hash=MessageDigest.getInstance("SHA-256").digest(key.getBytes(StandardCharsets.UTF_8));StringBuilder value=new StringBuilder("agrogestao://evento/");for(byte b:hash)value.append(String.format("%02x",b));return value.toString();
    }
    @PluginMethod public void save(PluginCall call){
        if(getPermissionState("calendar")!=PermissionState.GRANTED){call.reject("Autorize a agenda para salvar ou use o arquivo de calendário.");return;}
        io.execute(()->{try{
            // Capacitor getLong accepts only boxed Long; normal small calendar ids
            // arrive as Integer. JSONObject reads both without silently using -1.
            long calendar=call.getData().optLong("calendarId",-1L),start=call.getData().optLong("start",0L),end=call.getData().optLong("end",0L);
            String title=call.getString("title",""),key=ownKey(call.getString("key",""));
            if(calendar<0||start<=0||end<=start||end-start>366L*86400000L||title.isEmpty()||title.length()>300||call.getInt("reminderMinutes",0)!=1440)throw new IllegalArgumentException();
            boolean writable=false;
            try(Cursor c=getContext().getContentResolver().query(CalendarContract.Calendars.CONTENT_URI,new String[]{"_id","allowedReminders","maxReminders"},"_id = ? AND calendar_access_level >= ?",new String[]{Long.toString(calendar),"500"},null)){
                if(c!=null&&c.moveToFirst())writable=c.getInt(2)>0&&(","+c.getString(1)+",").contains(",1,");
            }
            if(!writable){call.reject("Esta agenda não permite lembretes. Escolha outra agenda.");return;}
            long existing=-1;
            try(Cursor c=getContext().getContentResolver().query(CalendarContract.Events.CONTENT_URI,new String[]{"_id","calendar_id"},"customAppPackage = ? AND customAppUri = ? AND deleted = 0",new String[]{getContext().getPackageName(),key},null)){
                if(c!=null&&c.moveToFirst()){existing=c.getLong(0);if(c.getLong(1)!=calendar){call.reject("Este evento já foi salvo em outra agenda. Escolha a mesma agenda para atualizar sem duplicar.");return;}}
            }
            ContentValues values=new ContentValues();values.put("calendar_id",calendar);values.put("title",title);values.put("dtstart",start);values.put("dtend",end);values.put("eventTimezone","America/Sao_Paulo");values.put("eventLocation",call.getString("location","").substring(0,Math.min(400,call.getString("location","").length())));values.put("description",call.getString("description",""));values.put("hasAlarm",1);values.put("customAppPackage",getContext().getPackageName());values.put("customAppUri",key);
            ArrayList<ContentProviderOperation> batch=new ArrayList<>();
            if(existing<0)batch.add(ContentProviderOperation.newInsert(CalendarContract.Events.CONTENT_URI).withValues(values).build());
            else{batch.add(ContentProviderOperation.newUpdate(ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI,existing)).withValues(values).build());batch.add(ContentProviderOperation.newDelete(CalendarContract.Reminders.CONTENT_URI).withSelection("event_id = ?",new String[]{Long.toString(existing)}).build());}
            ContentProviderOperation.Builder reminder=ContentProviderOperation.newInsert(CalendarContract.Reminders.CONTENT_URI).withValue("minutes",1440).withValue("method",CalendarContract.Reminders.METHOD_ALERT);
            if(existing<0)reminder.withValueBackReference("event_id",0);else reminder.withValue("event_id",existing);
            batch.add(reminder.build());ContentProviderResult[] results=getContext().getContentResolver().applyBatch(CalendarContract.AUTHORITY,batch);
            long savedId=existing>=0?existing:ContentUris.parseId(results[0].uri);
            JSObject out=new JSObject();out.put("saved",true);out.put("eventId",savedId);out.put("reminderMinutes",1440);out.put("updated",existing>=0);call.resolve(out);
        }catch(Exception e){call.reject("Não foi possível salvar o lembrete. Confira a agenda e tente novamente.");}});
    }
    static Intent eventViewIntent(long eventId,long start,long end){
        return new Intent(Intent.ACTION_VIEW,ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI,eventId))
            .putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME,start).putExtra(CalendarContract.EXTRA_EVENT_END_TIME,end);
    }
    @PluginMethod public void open(PluginCall call){
        if(getPermissionState("calendar")!=PermissionState.GRANTED){call.reject("O compromisso está salvo. Autorize a agenda ou abra seu aplicativo de agenda para consultá-lo.");return;}
        io.execute(()->{try{
            long id=call.getData().optLong("eventId",-1L);String key=ownKey(call.getString("key",""));
            if(id<0)throw new IllegalArgumentException();
            long start,end;
            // Restrict the read to this app's exact exported occurrence, never a personal event.
            try(Cursor c=getContext().getContentResolver().query(CalendarContract.Events.CONTENT_URI,new String[]{"dtstart","dtend"},"_id = ? AND customAppPackage = ? AND customAppUri = ? AND deleted = 0",new String[]{Long.toString(id),getContext().getPackageName(),key},null)){
                if(c==null||!c.moveToFirst()){call.reject("Este compromisso não foi encontrado na agenda. Salve o evento novamente.");return;}
                start=c.getLong(0);end=c.getLong(1);
            }
            getActivity().runOnUiThread(()->{
                Intent view=eventViewIntent(id,start,end);boolean opened=false;
                try{getActivity().startActivity(new Intent(view).setPackage("com.google.android.calendar"));opened=true;}
                catch(ActivityNotFoundException|SecurityException unavailable){try{getActivity().startActivity(view);opened=true;}catch(ActivityNotFoundException|SecurityException ignored){}}
                JSObject result=new JSObject();result.put("opened",opened);call.resolve(result);
            });
        }catch(Exception error){call.reject("O compromisso está salvo, mas não foi possível abrir a agenda. Tente consultá-lo no aplicativo de agenda.");}});
    }
    @Override protected void handleOnDestroy(){io.shutdownNow();super.handleOnDestroy();}
}
