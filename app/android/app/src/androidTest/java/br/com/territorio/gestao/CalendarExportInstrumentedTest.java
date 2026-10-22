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
        Uri uri=CalendarContract.Calendars.CONTENT_URI.buildUpon().appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER,"true").appendQueryParameter("account_name","AGRO Isolated QA 062").appendQueryParameter("account_type",CalendarContract.ACCOUNT_TYPE_LOCAL).build();
        ContentValues v=new ContentValues();v.put("account_name","AGRO Isolated QA 062");v.put("account_type",CalendarContract.ACCOUNT_TYPE_LOCAL);v.put("name","AGRO Isolated QA 062");v.put("calendar_displayName","AGRO Isolated QA 062");v.put("calendar_color",0xff809d52);v.put("calendar_access_level",700);v.put("ownerAccount","AGRO Isolated QA 062");v.put("visible",1);v.put("sync_events",0);v.put("allowedReminders","1");v.put("maxReminders",5);
        Uri added=c.getContentResolver().insert(uri,v);assertNotNull(added);long id=ContentUris.parseId(added);Files.write(marker(c).toPath(),Long.toString(id).getBytes(java.nio.charset.StandardCharsets.UTF_8));System.out.println("AGRO_CALENDAR_QA_ID="+id);
    }
    @Test public void verifyExportAndCleanup()throws Exception{
        Context c=context();File file=marker(c);assertTrue(file.exists());long calendar=Long.parseLong(new String(Files.readAllBytes(file.toPath()),java.nio.charset.StandardCharsets.UTF_8));
        try{
            long event;
            try(Cursor rows=c.getContentResolver().query(CalendarContract.Events.CONTENT_URI,new String[]{"_id","title","hasAlarm","customAppPackage"},"calendar_id = ? AND deleted = 0",new String[]{Long.toString(calendar)},null)){assertNotNull(rows);assertEquals("Repeated export must update one event",1,rows.getCount());assertTrue(rows.moveToFirst());event=rows.getLong(0);assertEquals("Evento Fictício Atualizado QA",rows.getString(1));assertEquals(1,rows.getInt(2));assertEquals(c.getPackageName(),rows.getString(3));}
            try(Cursor reminders=c.getContentResolver().query(CalendarContract.Reminders.CONTENT_URI,new String[]{"minutes","method"},"event_id = ?",new String[]{Long.toString(event)},null)){assertNotNull(reminders);assertEquals(1,reminders.getCount());assertTrue(reminders.moveToFirst());assertEquals(1440,reminders.getInt(0));assertEquals(CalendarContract.Reminders.METHOD_ALERT,reminders.getInt(1));}
        }finally{Uri own=ContentUris.withAppendedId(CalendarContract.Calendars.CONTENT_URI,calendar).buildUpon().appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER,"true").appendQueryParameter("account_name","AGRO Isolated QA 062").appendQueryParameter("account_type",CalendarContract.ACCOUNT_TYPE_LOCAL).build();try(Cursor check=c.getContentResolver().query(own,new String[]{"account_name","account_type"},null,null,null)){assertNotNull(check);assertTrue(check.moveToFirst());assertEquals("AGRO Isolated QA 062",check.getString(0));assertEquals(CalendarContract.ACCOUNT_TYPE_LOCAL,check.getString(1));}c.getContentResolver().delete(own,null,null);Files.deleteIfExists(file.toPath());}
    }
}
