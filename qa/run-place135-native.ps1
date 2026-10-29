param([Parameter(Mandatory=$true)][string]$DeviceSerial,[Parameter(Mandatory=$true)][ValidateSet('reno','pkj')][string]$DeviceName,[Parameter(Mandatory=$true)][int]$DebugPort,[switch]$ReuseFixture)
$ErrorActionPreference='Stop'
$taskRoot=Split-Path -Parent $PSScriptRoot
$taskAdb=Join-Path (Split-Path -Parent $taskRoot) 'New project/android-sdk/platform-tools/adb.exe'
$taskFixture='C:/Users/alexd/.codex/visualizations/2026/10/28/01a1835c-018b-7352-95a2-037da69102a6/place135-fixture/fixture.apk'
$taskPackage='br.com.territorio.gestao2.place135'
if(((& $taskAdb -s $DeviceSerial shell dumpsys window policy)-join "`n") -match 'showing=true'){throw 'Human unlock required before isolated test'}
if(-not $ReuseFixture){
 & $taskAdb -s $DeviceSerial install --no-streaming --no-incremental -r $taskFixture
 if($LASTEXITCODE -ne 0){throw 'Isolated fixture installation failed'}
}
$taskPath=((& $taskAdb -s $DeviceSerial shell pm path $taskPackage)-join '').Trim() -replace '^package:',''
if($taskPath -notmatch '^/data/app/[^\r\n]+/base\.apk$'){throw 'Isolated APK path invalid'}
$taskExpected=(Get-FileHash -LiteralPath $taskFixture -Algorithm SHA256).Hash.ToLowerInvariant()
$taskActual=(((& $taskAdb -s $DeviceSerial shell sha256sum $taskPath)-join '').Trim().Split(' ')[0])
if($taskActual -ne $taskExpected){throw 'Installed fixture differs from the exact candidate'}
try{
 if($ReuseFixture){& $taskAdb -s $DeviceSerial shell am start -W -n "$taskPackage/br.com.territorio.gestao.MainActivity"}
 else {& $taskAdb -s $DeviceSerial shell am start -S -W -n "$taskPackage/br.com.territorio.gestao.MainActivity"}
 if($LASTEXITCODE -ne 0){throw 'Isolated fixture launch failed'}
 $taskPid=((& $taskAdb -s $DeviceSerial shell pidof $taskPackage)-join '').Trim()
 if($taskPid -notmatch '^\d+$'){throw 'Isolated fixture process not found'}
 & $taskAdb -s $DeviceSerial forward "tcp:$DebugPort" "localabstract:webview_devtools_remote_$taskPid"
 if($LASTEXITCODE -ne 0){throw 'Isolated debugging forward failed'}
 foreach($taskTheme in @('light','dark')){
  & 'C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' (Join-Path $PSScriptRoot 'place135-native.cjs') $DeviceName $DebugPort $taskTheme $DeviceSerial
  if($LASTEXITCODE -ne 0){throw "Physical $DeviceName/$taskTheme validation failed"}
 }
}finally{& $taskAdb -s $DeviceSerial forward --remove "tcp:$DebugPort"}
