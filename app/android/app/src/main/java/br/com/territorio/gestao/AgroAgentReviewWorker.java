package br.com.territorio.gestao;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

/** Bounded, idempotent signal; no business data or long-running service. */
public class AgroAgentReviewWorker extends Worker {
    public AgroAgentReviewWorker(@NonNull Context context,@NonNull WorkerParameters params){super(context,params);}
    @NonNull @Override public Result doWork(){
        if(isStopped())return Result.failure();
        boolean saved=getApplicationContext().getSharedPreferences(AgroAgentSchedulerPlugin.PREFS,Context.MODE_PRIVATE)
            .edit().putBoolean("pending",true).putLong("requestedAt",System.currentTimeMillis()).commit();
        return saved?Result.success():getRunAttemptCount()<3?Result.retry():Result.failure();
    }
}
