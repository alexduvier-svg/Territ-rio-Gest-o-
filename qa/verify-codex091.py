from pathlib import Path
from zipfile import ZipFile
from io import BytesIO
import json,hashlib,subprocess,struct
r=Path(__file__).resolve().parent.parent;app=r/'app';apk=r/'AGRO-Gestao-Codex-0.12.91.apk';old=r/'AGRO-Gestao-2-0.12.88.apk';bt=r/'android-sdk/build-tools/36.0.0';java=Path('C:/Program Files/Microsoft/jdk-21.0.12.101-hotspot/bin/java.exe')
base='4bf346ee64ea79b23db6b2793930985ffe5d8827'
archive=subprocess.check_output(['git','archive','--format=zip',base,'app/src','app/android/app/src/main/java'],cwd=(r/'github-publish' if (r/'github-publish').is_dir() else r));count=0
with ZipFile(BytesIO(archive)) as z:
 for n in z.namelist():
  if n.endswith('/'):continue
  expected=z.read(n).replace(b'\r\n',b'\n');actual=(app/n.removeprefix('app/')).read_bytes().replace(b'\r\n',b'\n')
  if n=='app/src/legacy/erp-ui.js':
   expected=expected.replace('AGRO Gestão 2'.encode(),'AGRO Gestão Codex'.encode()).replace("Versão '+escape(window.TERRITORIO_VERSION||'')+'</span>".encode(),"Versão '+escape(window.TERRITORIO_VERSION||'')+' · Codex</span>".encode())
  assert actual==expected,n
  count+=1
badging=subprocess.check_output([str(bt/'aapt.exe'),'dump','badging',str(apk)],text=True,encoding='utf-8');assert "package: name='br.com.territorio.gestao2' versionCode='131' versionName='0.12.91'" in badging and "application: label='AGRO Gestão Codex'" in badging and 'application-debuggable' not in badging
cert='f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68';sig=subprocess.check_output([str(java),'-jar',str(bt/'lib/apksigner.jar'),'verify','--verbose','--print-certs',str(apk)],text=True,encoding='utf-8');assert cert in sig and 'v2): true' in sig and 'v3): true' in sig
subprocess.check_call([str(bt/'zipalign.exe'),'-c','-P','16','4',str(apk)],stdout=subprocess.DEVNULL)
files=[p for p in (app/'dist').rglob('*') if p.is_file()]
with ZipFile(apk) as z:
 assert z.testzip() is None
 for p in files:assert z.read('assets/public/'+p.relative_to(app/'dist').as_posix())==p.read_bytes()
 for n in z.namelist():
  if not n.startswith('lib/') or not n.endswith('.so'):continue
  b=z.read(n);wide=b[4]==2;off=struct.unpack_from('<Q' if wide else '<I',b,32 if wide else 28)[0];size,total=struct.unpack_from('<HH',b,54 if wide else 42)
  for i in range(total):
   at=off+i*size
   if struct.unpack_from('<I',b,at)[0]!=1:continue
   pos,addr=struct.unpack_from('<QQ' if wide else '<II',b,at+(8 if wide else 4));alignment=struct.unpack_from('<Q' if wide else '<I',b,at+(48 if wide else 28))[0];assert alignment>=16384 and (addr-pos)%16384==0
baseline=json.loads((app/'native-apk-validation-0.12.88.json').read_text(encoding='utf-8-sig'));assert baseline['installed'] and baseline['sha256']==hashlib.sha256(old.read_bytes()).hexdigest()
smoke=json.loads((r/'qa/codex091-identity-smoke.json').read_text(encoding='utf-8-sig'));assert smoke['passed'] and len(smoke['cases'])==8 and not smoke['errors'];assert (r/'qa/codex091-identity-smoke.json').stat().st_mtime>=apk.stat().st_mtime
for c in smoke['cases']:assert c['version']=='0.12.91' and c['label']=='AGRO Gestão Codex' and 'Codex' in c['versionLabel'] and c['fit'] and c['pageFits']
d={'version':'0.12.91','versionCode':131,'label':'AGRO Gestão Codex','package':'br.com.territorio.gestao2','scope':'version-and-label-only','baseVersion':'0.12.88','baseCommit':base,'runtimeSourceFilesCompared':count,'runtimeEquivalentExceptBranding':True,'inheritedQA':{'version':'0.12.88','unitTests':769,'compiledJourneys':8,'physicalJourneys':4,'freshlyRepeated':False},'currentIdentityChecks':8,'themes':['light','dark'],'compiledAssetsMatch':True,'assetCount':len(files),'certificateSHA256':cert,'signature':'original v2/v3','zip16KB':True,'ELF16KBStructural':True,'size':apk.stat().st_size,'sha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'validatedForInstallation':True,'installed':False,'backendChanged':False,'claudeChanged':False,'productionDatabaseRead':False,'realTransactionsCreated':False}
(app/'native-apk-validation-codex-0.12.91.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(d))
