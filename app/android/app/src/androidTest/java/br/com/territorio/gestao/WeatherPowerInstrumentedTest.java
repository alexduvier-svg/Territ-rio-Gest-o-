package br.com.territorio.gestao;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.work.PeriodicWorkRequest;
import androidx.work.NetworkType;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.json.JSONObject;
import static org.junit.Assert.*;

/** Pure native policy tests: no network, scheduling, sales, or producer preference writes. */
@RunWith(AndroidJUnit4.class)
public class WeatherPowerInstrumentedTest {
    @Test public void batteryThresholdIsFiftyAndUnknownIsDenied(){
        assertFalse(AgroWeatherCache.batteryAllowed(-1));assertFalse(AgroWeatherCache.batteryAllowed(49));
        assertTrue(AgroWeatherCache.batteryAllowed(50));assertTrue(AgroWeatherCache.batteryAllowed(100));
    }
    @Test public void deadlinesRespectValidityAndRetries() throws Exception {
        JSONObject data=new JSONObject().put("retrievedAt",1000).put("expiresAt",9999999);
        assertEquals(9999999,AgroWeatherCache.dueAt(data,1000,0));
        assertEquals(1000+AgroWeatherCache.INTERVAL,AgroWeatherCache.dueAt(null,1000,0));
        assertEquals(20000000,AgroWeatherCache.dueAt(data,1000,20000000));
    }
    @Test public void accentsResolveToTheSameMunicipality(){
        assertEquals(AgroWeatherCache.key("São Paulo","SP"),AgroWeatherCache.key("sao paulo","SP"));
        assertFalse(AgroWeatherCache.validLocation("","MG"));assertFalse(AgroWeatherCache.validLocation("Carangola","XXY"));
    }
    @Test public void periodicWorkHasNetworkBatteryAndThirtyMinuteConstraints(){
        PeriodicWorkRequest request=AgroWeatherPlugin.request();
        assertEquals(AgroWeatherCache.INTERVAL,request.getWorkSpec().intervalDuration);
        assertTrue(request.getWorkSpec().constraints.requiresBatteryNotLow());
        assertEquals(NetworkType.CONNECTED,request.getWorkSpec().constraints.getRequiredNetworkType());
        assertFalse(request.getWorkSpec().expedited);
    }
    @Test public void coordinateCellsAreRoundedFiniteAndSeparateFromMunicipality(){
        assertTrue(AgroWeatherPosition.valid(0,0));assertFalse(AgroWeatherPosition.valid(Double.NaN,0));assertFalse(AgroWeatherPosition.valid(91,0));assertFalse(AgroWeatherPosition.valid(0,-181));
        assertEquals(-20.733,AgroWeatherPosition.rounded(-20.733456),0);
        assertEquals("point:-20.733,-42.029",AgroWeatherCache.pointKey(-20.733456,-42.029456));
        assertEquals(AgroWeatherCache.pointKey(-0d,0d),AgroWeatherCache.pointKey(0d,-0d));
        assertNotEquals(AgroWeatherCache.key("Carangola","MG"),AgroWeatherCache.pointKey(-20.733,-42.029));
    }
    @Test public void GPSDoesNotRequireAMunicipalityButBackgroundWorkDoes(){
        assertFalse(AgroWeatherPlugin.backgroundEnabled(true,true,"",""));
        assertTrue(AgroWeatherPlugin.backgroundEnabled(true,true,"Carangola","MG"));
        assertFalse(AgroWeatherPlugin.backgroundEnabled(false,true,"Carangola","MG"));
    }
}
