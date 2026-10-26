param([Parameter(Mandatory=$true)][string]$DeviceSerial,[Parameter(Mandatory=$true)][ValidateSet('reno','pkj')][string]$DeviceName,[int]$DebugPort=9341,[string[]]$Themes=@('light','dark'),[switch]$ReuseFixture,[switch]$UpdateFixture,[switch]$LaunchFixture)
$ErrorActionPreference='Stop'
$taskRoot='C:/Users/alexd/OneDrive/Documentos/ChatGPT/New project';$taskAdb=Join-Path $taskRoot 'android-sdk/platform-tools/adb.exe'
$taskFixture='C:/Users/alexd/.codex/visualizations/2026/10/15/01a13f9b-c55a-7a91-8bee-90c8d5f7f38d/validity087-native/fixture.apk'
$taskFirstRun=$true
foreach($taskTheme in $Themes){
 $taskLaunchRequired=$taskFirstRun
 # Exact isolated package only. Recreate the fixture; never clear/remove principal AGRO2.
 $taskExisting=(& $taskAdb -s $DeviceSerial shell pm path br.com.territorio.gestao2.motionfixture)-join ''
 if($taskFirstRun){
 if($ReuseFixture -and $taskExisting.Trim() -and ((& $taskAdb -s $DeviceSerial shell pidof br.com.territorio.gestao2.motionfixture)-join '').Trim()){$taskLaunchRequired=$false}
 if($taskExisting.Trim() -and -not $ReuseFixture -and -not $UpdateFixture){& $taskAdb -s $DeviceSerial uninstall br.com.territorio.gestao2.motionfixture;if($LASTEXITCODE -ne 0){throw 'Could not remove synthetic fixture'}}
 if(-not ($ReuseFixture -and $taskExisting.Trim())){
 & $taskAdb -s $DeviceSerial install --no-incremental -r $taskFixture
 if($LASTEXITCODE -ne 0){throw 'Isolated test installation failed'}
 }
 }
 $taskFirstRun=$false
 if($LaunchFixture){$taskLaunchRequired=$true}
 if($taskLaunchRequired){
 & $taskAdb -s $DeviceSerial shell input keyevent KEYCODE_WAKEUP
 & $taskAdb -s $DeviceSerial shell am start -S -W -n br.com.territorio.gestao2.motionfixture/br.com.territorio.gestao.MainActivity
 }
 # Wait for a human unlock; never dismiss or bypass the lock screen.
 $taskDeadline=(Get-Date).AddMinutes(3)
 while(((& $taskAdb -s $DeviceSerial shell dumpsys window policy)-join "`n") -match 'showing=true'){
  if((Get-Date) -gt $taskDeadline){throw 'Device still locked; user unlock required'}
  Start-Sleep -Seconds 2
 }
 # Refresh user activity only inside the unlocked isolated fixture; no screen-timeout setting changes.
 $taskForeground=((& $taskAdb -s $DeviceSerial shell dumpsys activity activities)|Select-String 'topResumedActivity=|ResumedActivity:'|Select-Object -First 1)-join ''
 if($taskForeground -notmatch 'br.com.territorio.gestao2.motionfixture/'){throw 'Isolated fixture must be foreground'}
 & $taskAdb -s $DeviceSerial shell input keyevent KEYCODE_SHIFT_LEFT
 $taskPid=(& $taskAdb -s $DeviceSerial shell pidof br.com.territorio.gestao2.motionfixture).Trim();if(-not $taskPid){throw 'No isolated fixture process'}
 & $taskAdb -s $DeviceSerial forward "tcp:$DebugPort" "localabstract:webview_devtools_remote_$taskPid"
 $env:AGRO_QA_SERIAL=$DeviceSerial
 & 'C:/Users/alexd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' (Join-Path $taskRoot 'qa/validity087-native.cjs') $DeviceName $DebugPort $taskTheme
 if($LASTEXITCODE -ne 0){throw 'Physical test failed; see per-theme report'}
}
