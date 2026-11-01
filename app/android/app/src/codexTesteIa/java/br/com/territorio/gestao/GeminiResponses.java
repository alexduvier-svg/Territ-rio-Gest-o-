package br.com.territorio.gestao;
import org.json.*;
import java.io.IOException;

/** Google REST contract and sanitized failures; independent of Android storage/UI. */
final class GeminiResponses {
    static JSONObject request(String prompt,boolean research,String schema)throws Exception {
        JSONObject body=new JSONObject().put("contents",new JSONArray().put(new JSONObject().put("role","user").put("parts",new JSONArray().put(new JSONObject().put("text",prompt)))));
        JSONObject config=new JSONObject().put("temperature",0).put("maxOutputTokens",research?1600:1024).put("thinkingConfig",new JSONObject().put("thinkingLevel","MINIMAL"));
        if(research)body.put("tools",new JSONArray().put(new JSONObject().put("googleSearch",new JSONObject())));
        else config.put("responseMimeType","application/json").put("responseJsonSchema",new JSONObject(schema));
        return body.put("generationConfig",config);
    }
    static String token(String value){return value!=null&&value.matches("[A-Z_]{1,60}")?value:"não informado";}
    static String failure(int http,String raw){
        if(http==429)return "A quota do Gemini foi atingida (HTTP 429). Nenhuma repetição automática foi feita.";
        if(http==401||http==403)return "O Google não autorizou esta chave ou este projeto (HTTP "+http+"). Confira o acesso no AI Studio.";
        if(http==404)return "O modelo solicitado não está disponível para este acesso (HTTP 404). Nenhum resultado foi presumido.";
        String status="",reason="";
        try{JSONObject e=new JSONObject(raw).optJSONObject("error");if(e!=null){status=token(e.optString("status",""));JSONArray details=e.optJSONArray("details");if(details!=null)for(int i=0;i<details.length();i++){String r=details.getJSONObject(i).optString("reason","");if("API_KEY_INVALID".equals(r))reason=" A chave não foi aceita pelo Google; confira-a no AI Studio.";}}}catch(Exception ignored){}
        return "O Gemini recusou a consulta (HTTP "+http+(status.isEmpty()?"":" · "+status)+")."+reason+" Nenhum resultado foi presumido.";
    }
    static JSONObject candidate(JSONObject result)throws Exception {
        JSONArray rows=result.optJSONArray("candidates");
        if(rows==null||rows.length()==0){JSONObject feedback=result.optJSONObject("promptFeedback");String reason=feedback==null?"não informado":token(feedback.optString("blockReason",""));throw new IOException("O Gemini não forneceu uma resposta para esta consulta. Motivo do serviço: "+reason+".");}
        JSONObject first=rows.getJSONObject(0);String finish=first.optString("finishReason","");
        if("MAX_TOKENS".equals(finish))throw new IOException("A resposta do Gemini terminou antes de completar o plano (MAX_TOKENS). Nenhum resultado incompleto foi usado.");
        if(!finish.isEmpty()&&!"STOP".equals(finish))throw new IOException("O Gemini interrompeu a resposta. Motivo do serviço: "+token(finish)+".");
        return first;
    }
    static String text(JSONObject candidate)throws Exception {
        JSONObject content=candidate.optJSONObject("content");JSONArray parts=content==null?null:content.optJSONArray("parts");StringBuilder s=new StringBuilder();
        if(parts!=null)for(int i=0;i<parts.length();i++){JSONObject p=parts.getJSONObject(i);if(!p.optBoolean("thought",false))s.append(p.optString("text",""));}
        if(s.length()==0||s.length()>12000)throw new IOException("O Gemini não retornou um texto utilizável para esta consulta.");return s.toString();
    }
    private GeminiResponses(){}
}
