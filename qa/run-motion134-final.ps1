param([Parameter(Mandatory=$true)][ValidateSet('reno','pkj')][string]$DeviceName,[string]$DeviceSerial,[switch]$ReuseWindows)
$ErrorActionPreference='Stop'
$taskAdb=Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) 'New project/android-sdk/platform-tools/adb.exe'
$taskSerial=if($DeviceName -eq 'reno'){'adb-NJJ7OJRKIF8XFYSO-ybQC0W._adb-tls-connect._tcp'}else{'adb-3a945035-mL9gnS._adb-tls-connect._tcp'}
if($DeviceSerial){$taskSerial=$DeviceSerial}
$env:AGRO_MOTION_SERIAL=$taskSerial
$taskPort=if($DeviceName -eq 'reno'){9394}else{9393}
$taskViz='C:/Users/alexd/.codex/visualizations/2026/10/28/01a1835c-018b-7352-95a2-037da69102a6'
function Assert-Unlocked {
 $taskPolicy=((& $taskAdb -s $taskSerial shell dumpsys window policy)-join "`n")
 if($LASTEXITCODE -ne 0 -or -not $taskPolicy){throw 'Device unavailable for guarded physical QA'}
 if($taskPolicy -match 'showing=true'){throw 'Human unlock required for guarded physical QA'}
}
function Open-Fixture([string]$Package,[switch]$Cold){
 Assert-Unlocked
 if($Cold){& $taskAdb -s $taskSerial shell am start -S -W -n "$Package/br.com.territorio.gestao.MainActivity"|Out-Null}
 else{& $taskAdb -s $taskSerial shell am start -W -n "$Package/br.com.territorio.gestao.MainActivity"|Out-Null}
 if($LASTEXITCODE -ne 0){throw 'Isolated launch failed'}
 $taskPid=((& $taskAdb -s $taskSerial shell pidof $Package)-join '').Trim()
 if($taskPid -notmatch '^\d+$'){throw 'Isolated process missing'}
 & $taskAdb -s $taskSerial forward "tcp:$taskPort" "localabstract:webview_devtools_remote_$taskPid"|Out-Null
 node (Join-Path $PSScriptRoot 'warm-motion134-fixture.cjs') $taskPort
 if($LASTEXITCODE -ne 0){throw 'Synthetic guard/KeepAwake failed'}
 Assert-Unlocked
}
# Prepare both windows before the phone's 30-second idle deadline. Each stays awake during its turn.
Open-Fixture 'br.com.territorio.gestao2.motion134' -Cold:(-not $ReuseWindows)
Open-Fixture 'br.com.territorio.gestao2.integration133' -Cold:(-not $ReuseWindows)
foreach($taskPhase in @('baseline','candidate')){
 $taskPackage=if($taskPhase -eq 'baseline'){'br.com.territorio.gestao2.integration133'}else{'br.com.territorio.gestao2.motion134'}
 Open-Fixture $taskPackage
 & $taskAdb -s $taskSerial shell dumpsys gfxinfo $taskPackage reset|Out-Null
 $env:AGRO_MOTION_PHASE=$taskPhase
 $env:AGRO_MOTION_OUTPUT=Join-Path $taskViz "motion134-physical-$taskPhase-$DeviceName"
 node (Join-Path $PSScriptRoot 'motion134-benchmark.cjs') --cdp $taskPort --device $DeviceName
 if($LASTEXITCODE -ne 0){throw "Guarded physical benchmark failed: $DeviceName/$taskPhase"}
 & $taskAdb -s $taskSerial shell dumpsys gfxinfo $taskPackage framestats > (Join-Path $taskViz "motion134-physical-$taskPhase-$DeviceName-gfxinfo.txt")
 Assert-Unlocked
}
& (Join-Path $PSScriptRoot 'run-motion134-native.ps1') -DeviceSerial $taskSerial -DeviceName $DeviceName -DebugPort $taskPort -ReuseFixture
if($LASTEXITCODE -ne 0){throw 'Physical functional journeys failed'}
Write-Output "Final guarded benchmark and both functional themes PASS: $DeviceName"
