#!/usr/bin/env python3
"""APK identity, signature, integrity, bundled weights and ZIP/ELF alignment."""
import argparse,hashlib,json,pathlib,re,struct,subprocess,zipfile
p=argparse.ArgumentParser();p.add_argument('--apk',required=True);p.add_argument('--build-tools',required=True);p.add_argument('--assets',required=True);p.add_argument('--bundled',action='store_true');p.add_argument('--output',required=True);a=p.parse_args();apk=pathlib.Path(a.apk);tools=pathlib.Path(a.build_tools)
def run(*args):return subprocess.check_output([str(x) for x in args],text=True,stderr=subprocess.STDOUT)
sign=run(tools/'apksigner','verify','--verbose','--print-certs',apk);cert=re.search(r'Signer #1 certificate SHA-256 digest: (\w+)',sign).group(1);assert cert=='b1b8f2c74ebbb75adb5de6abfca5f740bfbf9c3d2b02a0ce8479338e45670c86'
badging=run(tools/'aapt','dump','badging',apk);assert "package: name='br.com.territorio.gestao2.codextesteia' versionCode='187' versionName='0.12.145-teste.1'" in badging;assert "sdkVersion:'26'" in badging;assert "application-label:'Codex Teste 145'" in badging
run(tools/'zipalign','-c','-P','16','4',apk)
report={'filename':apk.name,'bytes':apk.stat().st_size,'sha256':hashlib.file_digest(apk.open('rb'),'sha256').hexdigest(),'package':'br.com.territorio.gestao2.codextesteia','versionName':'0.12.145-teste.1','versionCode':187,'minSdk':26,'certificateSha256':cert,'zip16Kb':True,'signatureVerification':sign,'bundledQwen':a.bundled}
with zipfile.ZipFile(apk) as z:
 assert z.testzip() is None;report['crcPassed']=True
 for name in ['assets/ai/qwen3-chat-template.jinja','assets/public/ai/interpreter-benchmark.json','assets/public/ai/business-query.schema.json']:assert name in z.namelist()
 assets=pathlib.Path(a.assets);matched=[]
 for f in assets.rglob('*'):
  if f.is_file():assert z.read('assets/public/'+f.relative_to(assets).as_posix())==f.read_bytes();matched.append(f.relative_to(assets).as_posix())
 report['publicAssetsMatched']=len(matched)
 model='assets/qwen06/model.litertlm';assert (model in z.namelist())==a.bundled
 if a.bundled:
  i=z.getinfo(model);assert i.file_size==497516544
  h=hashlib.sha256()
  with z.open(model) as f:
   while b:=f.read(1048576):h.update(b)
  assert h.hexdigest()=='7900eb4e7362d88c58782c6f9999bb7a129e03544aa98b8f338ea0cc5d8c22c1';report['modelSha256']=h.hexdigest();report['modelBytes']=i.file_size
 libraries=[]
 for name in z.namelist():
  if name.startswith('lib/') and name.endswith('.so'):
   assert name.split('/')[1] in ['arm64-v8a','armeabi-v7a'];b=z.read(name);assert b[:4]==b'\x7fELF' and b[4] in [1,2] and b[5]==1
   is64=b[4]==2;offset=struct.unpack_from('<Q' if is64 else '<I',b,32 if is64 else 28)[0];size,num=struct.unpack_from('<HH',b,54 if is64 else 42);align=[]
   for n in range(num):
    ph=offset+n*size
    if struct.unpack_from('<I',b,ph)[0]==1:
     value=struct.unpack_from('<Q' if is64 else '<I',b,ph+(48 if is64 else 28))[0];assert value>=(16384 if is64 else 4096);align.append(value)
   assert align;libraries.append({'file':name,'loadAlignments':align})
 report['nativeElfAlignment']=libraries;report['arm64Elf16Kb']=True;assert libraries
 dex=b''.join(z.read(n) for n in z.namelist() if re.fullmatch(r'classes\d*\.dex',n))
 for marker in [b'AgroGeminiComparison',b'benchmarkCase',b'authorizeWeb',b'qwenContextualQualified']:assert marker in dex
 report['newNativeClassesPresent']=True
pathlib.Path(a.output).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:report[k] for k in ['filename','bytes','sha256','bundledQwen','publicAssetsMatched']},ensure_ascii=False))
