package br.com.territorio.gestao;
import android.content.Context;
import java.io.*;
import java.nio.charset.StandardCharsets;
import org.json.*;
final class InterpreterBenchmarkCases {
    static String asset(Context context,String path,int limit)throws Exception {
        try(InputStream in=context.getAssets().open(path);ByteArrayOutputStream out=new ByteArrayOutputStream()) {
            byte[] b=new byte[4096];int n;
            while((n=in.read(b))!=-1){out.write(b,0,n);if(out.size()>limit)throw new IOException("Referência local inválida.");}
            return new String(out.toByteArray(),StandardCharsets.UTF_8);
        }
    }
    static JSONObject get(Context context,String id)throws Exception {
        JSONArray rows=new JSONObject(asset(context,"public/ai/interpreter-benchmark.json",180000)).getJSONArray("cases");
        for(int i=0;i<rows.length();i++)if(id.equals(rows.getJSONObject(i).getString("id")))return rows.getJSONObject(i);
        throw new IllegalArgumentException("Pergunta de teste não cadastrada.");
    }
    private InterpreterBenchmarkCases(){}
}
