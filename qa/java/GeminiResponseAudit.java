package br.com.territorio.gestao;
import org.json.*;
import java.nio.file.*;

/** Executes the actual Android-independent REST adapter against fixed server fixtures. */
public class GeminiResponseAudit {
    private static int passed=0;
    private static void check(boolean yes,String why){if(!yes)throw new AssertionError(why);passed++;}
    private static void rejects(JSONObject response,String expected)throws Exception{try{GeminiResponses.candidate(response);throw new AssertionError("Partial or blocked response was accepted");}catch(java.io.IOException e){check(e.getMessage().contains(expected),e.getMessage());}}
    public static void main(String[] args)throws Exception {
        String schema=Files.readString(Path.of(args[0]));
        JSONObject business=GeminiResponses.request("Pergunta fictícia com café",false,schema),config=business.getJSONObject("generationConfig");
        check(config.getString("responseMimeType").equals("application/json"),"Structured output missing");
        check(config.getJSONObject("responseJsonSchema").getJSONObject("properties").getJSONObject("tasks").getJSONObject("items").getJSONObject("properties").getJSONObject("kind").getJSONArray("enum").toString().contains("stock_empty"),"Unavailable stock missing from schema");
        check(!business.has("tools"),"Business interpreter must not search public web");
        check(!business.toString().contains("x-goog-api-key"),"Credential leaked into payload");
        check(business.getJSONArray("contents").getJSONObject(0).getJSONArray("parts").getJSONObject(0).getString("text").equals("Pergunta fictícia com café"),"Question did not reach REST content");
        JSONObject web=GeminiResponses.request("Pesquisa pública fictícia",true,null);
        check(web.getJSONArray("tools").getJSONObject(0).has("googleSearch"),"Search tool missing");
        check(!web.getJSONObject("generationConfig").has("responseJsonSchema"),"Business contract must not replace grounded search response");
        String privateToken="<private-credential-placeholder>";
        JSONObject error=new JSONObject().put("error",new JSONObject().put("status","INVALID_ARGUMENT").put("message","Secret "+privateToken).put("details",new JSONArray().put(new JSONObject().put("reason","API_KEY_INVALID"))));
        String failed=GeminiResponses.failure(400,error.toString());check(failed.contains("HTTP 400")&&failed.contains("INVALID_ARGUMENT")&&failed.contains("chave não foi aceita"),"Key rejection was hidden");check(!failed.contains(privateToken),"Raw server message exposed a credential");
        for(int http:new int[]{401,403,404,429,503}){String text=GeminiResponses.failure(http,error.toString());check(text.contains("HTTP "+http),"Status missing");check(!text.contains(privateToken),"Server body leaked");}
        rejects(new JSONObject("{\"promptFeedback\":{\"blockReason\":\"SAFETY\"}}"),"SAFETY");
        rejects(new JSONObject("{\"candidates\":[{\"finishReason\":\"MAX_TOKENS\"}]}"),"MAX_TOKENS");
        JSONObject good=new JSONObject("{\"candidates\":[{\"finishReason\":\"STOP\",\"content\":{\"parts\":[{\"thought\":true,\"text\":\"Not the plan\"},{\"text\":\"{\\\"type\\\":\\\"query\\\"}\"}]}}]}");
        check(GeminiResponses.text(GeminiResponses.candidate(good)).equals("{\"type\":\"query\"}"),"Thought text contaminated plan");
        System.out.println("{\"actualAdapterChecks\":"+passed+",\"passed\":true,\"liveGoogleCall\":false}");
    }
}
