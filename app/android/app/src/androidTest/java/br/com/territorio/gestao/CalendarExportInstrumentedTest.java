package br.com.territorio.gestao;

import android.content.*;
import android.database.Cursor;
import android.net.Uri;
import android.provider.CalendarContract;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.io.File;
import java.nio.file.Files;
import static org.junit.Assert.*;

/** Only a new LOCAL calendar; never lists existing calendars or personal events. */
@RunWith(AndroidJUnit4.class)
public class CalendarExportInstrumentedTest {
    Context context(){Context c=InstrumentationRegistry.getInstrumentation().getTargetContext();assertEquals("br.com.territorio.gestao2.motionfixture",c.getPackageName());return c;}
    File marker(Context c){return new File(c.getNoBackupFilesDir(),"calendar-qa-id");}
    @Test public void seedLocalCalendar()throws Exception{
        Context c=context();assertFalse("Previous QA calendar requires cleanup",marker(c).exists());
        Uri uri=CalendarContract.Calendars.CONTENT_URI.buildUpon().appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER,"true").appendQueryParameter("account_name","AGRO Isolated QA 071").appendQueryParameter("account_type",CalendarContract.ACCOUNT_TYPE_LOCAL).build();
        ContentValues v=new ContentValues();v.put("account_name","AGRO Isolated QA 071");v.put("account_type",CalendarContract.ACCOUNT_TYPE_LOCAL);v.put("name","AGRO Isolated QA 071");v.put("calendar_displayName","AGRO Isolated QA 071");v.put("calendar_color",0xff809d52);v.put("calendar_access_level",700);v.put("ownerAccount","AGRO Isolated QA 071");v.put("visible",1);v.put("sync_events",0);v.put("allowedReminders","1");v.put("maxReminders",5);
        Uri added=c.getContentResolver().insert(uri,v);assertNotNull(added);long id=ContentUris.parseId(added);Files.write(marker(c).toPath(),Long.toString(id).getBytes(java.nio.charset.StandardCharsets.UTF_8));System.out.println("AGRO_CALENDAR_QA_ID="+id);
    }
    @Test public void viewIntentTargetsOnlyOneEvent(){
        Intent intent=AgroCalendarPlugin.eventViewIntent(123,456,789);
        assertEquals(Intent.ACTION_VIEW,intent.getAction());
        assertEquals(ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI,123),intent.getData());
        assertEquals(456,intent.getLongExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME,0));
        assertEquals(789,intent.getLongExtra(CalendarContract.EXTRA_EVENT_END_TIME,0));
    }
    @Test public void localCalendarRoundTrip()throws Exception{
        Context c=context();seedLocalCalendar();
        android.app.Instrumentation instrumentation=InstrumentationRegistry.getInstrumentation();
        java.util.concurrent.atomic.AtomicInteger intercepted=new java.util.concurrent.atomic.AtomicInteger();
        final String[] viewedUri={""};
        android.app.Instrumentation.ActivityMonitor monitor=new android.app.Instrumentation.ActivityMonitor(){
            @Override public android.app.Instrumentation.ActivityResult onStartActivity(Intent intent){
                if(Intent.ACTION_VIEW.equals(intent.getAction())){viewedUri[0]=String.valueOf(intent.getData());intercepted.incrementAndGet();return new android.app.Instrumentation.ActivityResult(android.app.Activity.RESULT_CANCELED,null);}
                return null;
            }
        };
        instrumentation.addMonitor(monitor);
        try{
            long calendar=Long.parseLong(new String(Files.readAllBytes(marker(c).toPath()),java.nio.charset.StandardCharsets.UTF_8));
            Intent launch=c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());assertNotNull(launch);launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            android.app.Activity activity=instrumentation.startActivitySync(launch);
            assertTrue(activity instanceof com.getcapacitor.BridgeActivity);
            android.webkit.WebView web=((com.getcapacitor.BridgeActivity)activity).getBridge().getWebView();
            instrumentation.runOnMainSync(()->activity.getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON));
            for(int i=0;i<100;i++){String ready=evaluate(instrumentation,web,"!!window.Capacitor && !!window.TerritorioEvents");if("true".equals(ready))break;Thread.sleep(100);}
            String script="window.__calendarRoundQA=null;(async()=>{const p={key:'isolated-qa|calendar-071',calendarId:"+calendar+",title:'Evento Fictício QA',location:'Praça Fictícia',start:Date.now()+7*86400000,end:Date.now()+7*86400000+3600000,description:'Calendário LOCAL fictício, sem conta Google',reminderMinutes:1440};const first=await Capacitor.nativePromise('AgroCalendar','save',p);const second=await Capacitor.nativePromise('AgroCalendar','save',{...p,title:'Evento Fictício Atualizado QA'});let foreign=false;try{await Capacitor.nativePromise('AgroCalendar','open',{eventId:first.eventId,key:'different-actor|different-event'});}catch{foreign=true;}const view=await Capacitor.nativePromise('AgroCalendar','open',{eventId:first.eventId,key:p.key});window.__calendarRoundQA={first,second,foreign,view};})().catch(e=>window.__calendarRoundQA={error:e.message});";
            instrumentation.runOnMainSync(()->web.evaluateJavascript(script,null));
            String value="null";for(int i=0;i<100&&"null".equals(value);i++){Thread.sleep(100);value=evaluate(instrumentation,web,"window.__calendarRoundQA");}
            org.json.JSONObject result=new org.json.JSONObject(value);assertFalse(value,result.has("error"));
            org.json.JSONObject first=result.getJSONObject("first"),second=result.getJSONObject("second");
            assertTrue(first.getBoolean("saved"));assertFalse(first.getBoolean("updated"));assertTrue(second.getBoolean("updated"));assertEquals(first.getLong("eventId"),second.getLong("eventId"));assertEquals(1440,first.getInt("reminderMinutes"));assertTrue(result.getBoolean("foreign"));assertTrue(result.getJSONObject("view").getBoolean("opened"));
            assertEquals("Only the owned-event view can be launched",1,intercepted.get());assertEquals(ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI,first.getLong("eventId")).toString(),viewedUri[0]);
        }finally{instrumentation.removeMonitor(monitor);verifyExportAndCleanup();}
    }
    private String evaluate(android.app.Instrumentation instrumentation,android.webkit.WebView web,String code)throws Exception{
        java.util.concurrent.CountDownLatch latch=new java.util.concurrent.CountDownLatch(1);final String[] result={"null"};
        instrumentation.runOnMainSync(()->web.evaluateJavascript(code,value->{result[0]=value;latch.countDown();}));
        assertTrue(latch.await(3,java.util.concurrent.TimeUnit.SECONDS));return result[0];
    }
    @Test public void verifyExportAndCleanup()throws Exception{
        Context c=context();File file=marker(c);assertTrue(file.exists());long calendar=Long.parseLong(new String(Files.readAllBytes(file.toPath()),java.nio.charset.StandardCharsets.UTF_8));
        try{
            long event;
            try(Cursor rows=c.getContentResolver().query(CalendarContract.Events.CONTENT_URI,new String[]{"_id","title","hasAlarm","customAppPackage"},"calendar_id = ? AND deleted = 0",new String[]{Long.toString(calendar)},null)){assertNotNull(rows);assertEquals("Repeated export must update one event",1,rows.getCount());assertTrue(rows.moveToFirst());event=rows.getLong(0);assertEquals("Evento Fictício Atualizado QA",rows.getString(1));assertEquals(1,rows.getInt(2));assertEquals(c.getPackageName(),rows.getString(3));}
            try(Cursor reminders=c.getContentResolver().query(CalendarContract.Reminders.CONTENT_URI,new String[]{"minutes","method"},"event_id = ?",new String[]{Long.toString(event)},null)){assertNotNull(reminders);assertEquals(1,reminders.getCount());assertTrue(reminders.moveToFirst());assertEquals(1440,reminders.getInt(0));assertEquals(CalendarContract.Reminders.METHOD_ALERT,reminders.getInt(1));}
        }finally{Uri own=ContentUris.withAppendedId(CalendarContract.Calendars.CONTENT_URI,calendar).buildUpon().appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER,"true").appendQueryParameter("account_name","AGRO Isolated QA 071").appendQueryParameter("account_type",CalendarContract.ACCOUNT_TYPE_LOCAL).build();try(Cursor check=c.getContentResolver().query(own,new String[]{"account_name","account_type"},null,null,null)){assertNotNull(check);assertTrue(check.moveToFirst());assertEquals("AGRO Isolated QA 071",check.getString(0));assertEquals(CalendarContract.ACCOUNT_TYPE_LOCAL,check.getString(1));}c.getContentResolver().delete(own,null,null);Files.deleteIfExists(file.toPath());}
    }
}
