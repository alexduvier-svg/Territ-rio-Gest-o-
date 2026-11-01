#!/usr/bin/env python3
"""Real inference against fixed fictional cases. No ERP access or test doubles.
Install litert-lm-api==0.18.1 for Qwen. Gemini requires AGRO_GEMINI_API_KEY,
provided outside Git, and uses the caller's own quota. Stops on provider errors.
"""
import argparse,hashlib,importlib.metadata,json,os,pathlib,platform,time,urllib.request,urllib.error
ROOT=pathlib.Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser();parser.add_argument('--provider',choices=['qwen','gemini'],required=True);parser.add_argument('--model-path');parser.add_argument('--output',required=True);args=parser.parse_args()
fixture_path=ROOT/'app/public/ai/interpreter-benchmark.json';fixture_bytes=fixture_path.read_bytes();cases=json.loads(fixture_bytes)['cases'];schema=json.loads((ROOT/'app/public/ai/business-query.schema.json').read_text());template=(ROOT/'app/android/app/src/main/assets/ai/qwen3-chat-template.jinja').read_text()
report={'synthetic':True,'provider':args.provider,'platform':platform.system()+' '+platform.machine(),'physicalAndroid':False,'fixtureSha256':hashlib.sha256(fixture_bytes).hexdigest(),'cases':[]}
engine=None
if args.provider=='qwen':
 import litert_lm
 if importlib.metadata.version('litert-lm-api')!='0.18.1':raise SystemExit('Use o runtime fixado 0.18.1 para comparar esta variante.')
 if not args.model_path:raise SystemExit('--model-path é obrigatório para Qwen.')
 p=pathlib.Path(args.model_path);digest=hashlib.sha256()
 with p.open('rb') as source:
  while b:=source.read(1048576):digest.update(b)
 if digest.hexdigest()!='7900eb4e7362d88c58782c6f9999bb7a129e03544aa98b8f338ea0cc5d8c22c1':raise SystemExit('Modelo diferente do APK; teste interrompido.')
 report.update(model='Qwen3-0.6B INT4',runtime='LiteRT-LM 0.18.1',modelSha256=digest.hexdigest(),threads=2,maxContextTokens=2048,maxOutputTokens=512)
 cache=pathlib.Path(args.output).resolve().parent/'runtime-cache';cache.mkdir(parents=True,exist_ok=True)
 engine=litert_lm.Engine(str(p),backend=litert_lm.Backend.CPU(thread_count=2),max_num_tokens=2048,cache_dir=str(cache))
else:
 secret=os.environ.get('AGRO_GEMINI_API_KEY')
 if not secret:raise SystemExit('Gemini não executado: configure o acesso fora do Git. Nenhuma simulação substitui a inferência.')
 report.update(model='gemini-3.1-flash-lite',runtime='Gemini API v1beta',maxOutputTokens=1024)
try:
 for case in cases:
  started=time.monotonic();entry={'id':case['id'],'question':case['q'],'model':'qwen06' if args.provider=='qwen' else 'gemini-online','scenario':'benchmark:'+case['id'],'synthetic':True}
  try:
   if engine:
    with engine.create_conversation(chat_template=template,sampler_config=litert_lm.SamplerConfig(top_k=1,top_p=1,temperature=0,seed=0),constrained_decoding_config=litert_lm.ConstrainedDecodingConfig(enable=True,provider=litert_lm.LiteRtLmConstraintProviderType.LL_GUIDANCE)) as conversation:
     entry['raw']=str(conversation.send_message(case['request'],max_output_tokens=512,thinking_config=litert_lm.ThinkingConfig(enable_thinking=False,thinking_token_budget=0),response_format=litert_lm.ResponseFormat.json(schema)))
   else:
    body={'contents':[{'role':'user','parts':[{'text':case['request']}]}],'generationConfig':{'temperature':0,'maxOutputTokens':1024,'thinkingConfig':{'thinkingLevel':'MINIMAL'},'responseMimeType':'application/json','responseJsonSchema':schema}}
    request=urllib.request.Request('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent',data=json.dumps(body).encode(),headers={'Content-Type':'application/json','x-goog-api-key':secret})
    with urllib.request.urlopen(request,timeout=60) as response:result=json.loads(response.read(128000))
    parts=result['candidates'][0]['content']['parts'];entry['raw']=''.join(p.get('text','') for p in parts if not p.get('thought',False))
  except urllib.error.HTTPError as e:entry['error']='HTTP '+str(e.code)
  except Exception as e:entry['error']=type(e).__name__
  entry['elapsedMs']=round((time.monotonic()-started)*1000);report['cases'].append(entry)
  pathlib.Path(args.output).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
  print(case['id'],entry['elapsedMs'],'ms',entry.get('error','executed'),flush=True)
  if entry.get('error'):break
finally:
 if engine:engine.close()
