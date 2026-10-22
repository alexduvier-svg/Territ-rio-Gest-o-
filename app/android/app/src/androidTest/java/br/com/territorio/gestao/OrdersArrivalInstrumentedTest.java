package br.com.territorio.gestao;

import android.app.NotificationManager;
import android.content.Context;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.work.NetworkType;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

/** Synthetic native storage/notification tests. Only runs against the isolated fixture package. */
@RunWith(AndroidJUnit4.class)
public class OrdersArrivalInstrumentedTest {
    Context context;JSONObject config;boolean oldForeground;
    final String first="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",second="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    @Before public void prepare()throws Exception{context=InstrumentationRegistry.getInstrumentation().getTargetContext();assertEquals("br.com.territorio.gestao2.motionfixture",context.getPackageName());oldForeground=AgroOrdersWorker.foreground;AgroOrdersWorker.foreground=false;config=new JSONObject().put("enabled",true).put("actor","synthetic").put("generation","qa").put("seen",new JSONArray());AgroOrdersWorker.write(context,config);AgroOrdersWorker.dismiss(context);}
    @After public void clean()throws Exception{AgroOrdersWorker.dismiss(context);AgroOrdersWorker.write(context,new JSONObject());AgroOrdersWorker.foreground=oldForeground;}
    @Test public void requestUsesMinimumPeriodicCadenceAndNetworkBatteryConstraints(){var work=AgroOrdersPlugin.request().getWorkSpec();assertEquals(15*60*1000L,work.intervalDuration);assertTrue(work.constraints.requiresBatteryNotLow());assertEquals(NetworkType.CONNECTED,work.constraints.getRequiredNetworkType());assertFalse(work.expedited);}
    @Test public void arrivalsNotifyWithoutCustomerDataAndAreNotRepeated()throws Exception{assertTrue(AgroOrdersWorker.allowed(context));JSONObject response=new JSONObject().put("enabled",true).put("requested",new JSONArray().put(first));AgroOrdersWorker.applySummary(context,config,response,false);assertEquals(1,AgroOrdersWorker.read(context).getJSONArray("seen").length());NotificationManager manager=context.getSystemService(NotificationManager.class);var notice=java.util.Arrays.stream(manager.getActiveNotifications()).filter(n->n.getId()==AgroOrdersWorker.NOTICE).findFirst();assertTrue(notice.isPresent());assertEquals("Novo Pedido Recebido",notice.get().getNotification().extras.getString("android.title"));AgroOrdersWorker.dismiss(context);AgroOrdersWorker.applySummary(context,config,response,false);assertFalse(java.util.Arrays.stream(manager.getActiveNotifications()).anyMatch(n->n.getId()==AgroOrdersWorker.NOTICE));}
    @Test public void changedScopeAndStoppedWorkCannotResurrectOldOrders()throws Exception{JSONObject newer=new JSONObject().put("enabled",true).put("generation","new").put("seen",new JSONArray());AgroOrdersWorker.write(context,newer);JSONObject response=new JSONObject().put("enabled",true).put("requested",new JSONArray().put(first));AgroOrdersWorker.applySummary(context,config,response,false);assertEquals(0,AgroOrdersWorker.read(context).getJSONArray("seen").length());AgroOrdersWorker.applySummary(context,newer,response,true);assertEquals(0,AgroOrdersWorker.read(context).getJSONArray("seen").length());}
    @Test public void boundedSeenListStillDetectsNewIdsAndRejectsInvalidPayload()throws Exception{JSONArray known=new JSONArray();for(int i=0;i<600;i++)known.put(String.format("%032x",i));config.put("seen",known);AgroOrdersWorker.write(context,config);AgroOrdersWorker.applySummary(context,config,new JSONObject().put("enabled",true).put("requested",new JSONArray().put(first)),false);assertEquals(600,AgroOrdersWorker.read(context).getJSONArray("seen").length());assertTrue(AgroOrdersWorker.file(context).getBaseFile().getAbsolutePath().startsWith(context.getNoBackupFilesDir().getAbsolutePath()));try{AgroOrdersWorker.applySummary(context,config,new JSONObject().put("enabled",true).put("requested",new JSONArray().put("invalid")),false);fail("Invalid ids must be rejected");}catch(java.io.IOException expected){}}
}
