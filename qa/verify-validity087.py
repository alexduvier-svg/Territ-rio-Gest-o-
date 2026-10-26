from pathlib import Path
from zipfile import ZipFile
import json,hashlib,re,subprocess,struct
r=Path(__file__).resolve().parent.parent;qa=r/'qa';dist=r/'app/dist';apk=r/'AGRO-Gestao-2-0.12.87.apk';bt=r/'android-sdk/build-tools/36.0.0';java=Path('C:/Program Files/Microsoft/jdk-21.0.12.101-hotspot/bin/java.exe')
load=lambda n:json.loads((qa/n).read_text(encoding='utf-8-sig'))
ui=load('validity087-final-review.json');assert ui['passed'] and not ui['errors'] and len(ui['cases'])==8
assert (qa/'validity087-final-review.json').stat().st_mtime>=apk.stat().st_mtime
for c in ui['cases']:assert all(c['event'].values()) and c['event']['receivableDollarBeforeLabel'] and all(c['legacyRegression'].values())
unit=(qa/'validity087-unit-final.txt').read_text(encoding='utf-8-sig');assert 'pass 744' in unit and 'fail 0' in unit
server=(qa/'validity087-server-full.txt').read_text(encoding='utf-8-sig');assert 'pass 47' in server and 'fail 0' in server
badging=subprocess.check_output([str(bt/'aapt.exe'),'dump','badging',str(apk)],text=True,encoding='utf-8');assert "package: name='br.com.territorio.gestao2' versionCode='127' versionName='0.12.87'" in badging
assert "application: label='AGRO Gestão 2'" in badging and 'application-debuggable' not in badging
assert not any(p in badging for p in ['RECORD_AUDIO','ACCESS_BACKGROUND_LOCATION'])
cert='f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68'
sig=subprocess.check_output([str(java),'-jar',str(bt/'lib/apksigner.jar'),'verify','--verbose','--print-certs',str(apk)],text=True,encoding='utf-8');assert cert in sig and 'Verified using v2 scheme (APK Signature Scheme v2): true' in sig and 'Verified using v3 scheme (APK Signature Scheme v3): true' in sig
subprocess.check_call([str(bt/'zipalign.exe'),'-c','-P','16','4',str(apk)],stdout=subprocess.DEVNULL)
fixture=Path('C:/Users/alexd/.codex/visualizations/2026/10/15/01a13f9b-c55a-7a91-8bee-90c8d5f7f38d/validity087-native/assets/public');files=[p for p in dist.rglob('*') if p.is_file()]
with ZipFile(fixture.parent.parent/'fixture.apk') as z:
 for p in fixture.rglob('*'):
  if p.is_file():assert z.read('assets/public/'+p.relative_to(fixture).as_posix())==p.read_bytes()
with ZipFile(apk) as z:
 names={p.relative_to(dist).as_posix() for p in files};packaged={n.removeprefix('assets/public/') for n in z.namelist() if n.startswith('assets/public/') and not n.endswith('/')};assert packaged-names=={'cordova.js','cordova_plugins.js'} and not names-packaged
 for p in files:
  rel=p.relative_to(dist).as_posix();assert z.read('assets/public/'+rel)==p.read_bytes();actual=(fixture/rel).read_bytes()
  if rel=='index.html':
   assert len(re.findall(rb'<script>.*?</script>',actual,flags=re.S))==2
   actual=re.sub(rb'<script>.*?</script>',b'',actual,flags=re.S).replace(b'\r\n',b'\n')
  assert actual==p.read_bytes(),rel
 for bridge in ['cordova.js','cordova_plugins.js']:assert z.read('assets/public/'+bridge)==(fixture/bridge).read_bytes()
 assert not any(n.startswith('assets/voice/') for n in z.namelist())
 libraries=[n for n in z.namelist() if n.startswith('lib/') and n.endswith('.so')];assert len(libraries)==2
 for n in libraries:
  b=z.read(n);elf64=b[4]==2;offset=struct.unpack_from('<Q' if elf64 else '<I',b,32 if elf64 else 28)[0];size,count=struct.unpack_from('<HH',b,54 if elf64 else 42)
  for i in range(count):
   at=offset+i*size
   if struct.unpack_from('<I',b,at)[0]!=1:continue
   pos,addr=struct.unpack_from('<QQ' if elf64 else '<II',b,at+(8 if elf64 else 4));align=struct.unpack_from('<Q' if elf64 else '<I',b,at+(48 if elf64 else 28))[0];assert align>=16384 and (addr-pos)%16384==0
for device in ['reno','pkj']:
 for theme in ['light','dark']:
  f=qa/f'validity087-native-{device}-{theme}.json';d=load(f.name);assert f.stat().st_mtime>=apk.stat().st_mtime and d['version']=='0.12.87' and d['fullRegression'] and d['passed'] and not d['errors'] and all(d['legacyRegression'].values()) and all(d['cases'][0]['event'].values()) and d['cases'][0]['event']['receivableDollarBeforeLabel']
for device in ['reno','pkj']:
 d=load(f'validity087-notices-native-{device}.json');assert d['passed'] and d['delivered'] and d['cancelled'] and not d['errors']
live=load('validity087-server-live.json');assert live['capabilities']['available'] and live['capabilities']['lotAvailability']==1
d={'version':'0.12.87','versionCode':127,'package':'br.com.territorio.gestao2','label':'AGRO Gestão 2','size':apk.stat().st_size,'sha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'certificateSHA256':cert,'signature':'original v2/v3','productionAssetsMatch':True,'physicalFixtureAssetsMatch':True,'assets':len(files),'nativeBridgeAssets':2,'zipalign16KB':True,'ELFLoad16KB':True,'unitTests':744,'serverTests':47,'browserJourneys':8,'physicalJourneys':4,'fullNativeRegression':True,'physicalDevices':['Reno14 CPH2737','PKJ110'],'themes':['light','dark'],'lotJourneys':True,'calendarNoticeDeliveredAndCancelledBothDevices':True,'receivableDollarBeforeLabel':True,'serverChanged':True,'serverDeployment':live['deployment'],'realTransactionsCreated':False,'productionDatabaseAccessed':False,'realWhatsAppMessagesSent':False,'nativeFPSMeasured':False,'basicPhoneMeasured':False,'runtime16KBMeasured':False,'validatedForInstallation':True,'installed':False,'status':'validated-awaiting-installation'}
(r/'app/native-apk-validation-0.12.87.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(d))
