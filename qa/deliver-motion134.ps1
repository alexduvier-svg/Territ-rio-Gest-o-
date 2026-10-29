param([Parameter(Mandatory=$true)][string[]]$DeviceSerial)
$ErrorActionPreference='Stop'
if($DeviceSerial.Count -lt 1 -or $DeviceSerial.Count -gt 2 -or @($DeviceSerial|Select-Object -Unique).Count -ne $DeviceSerial.Count){throw 'Select one or both distinct authorized devices'}
$taskRoot=Split-Path -Parent $PSScriptRoot
$taskViz='C:/Users/alexd/.codex/visualizations/2026/10/28/01a1835c-018b-7352-95a2-037da69102a6'
$taskAdb=Join-Path (Split-Path -Parent $taskRoot) 'New project/android-sdk/platform-tools/adb.exe'
$taskApk=Join-Path $taskRoot 'AGRO-Gestao-Codex-0.12.134.apk'
$taskPackage='br.com.territorio.gestao2'
$taskHash=(Get-FileHash -LiteralPath $taskApk -Algorithm SHA256).Hash.ToLowerInvariant()
$taskStructure=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'motion134-package-review.json') -Raw|ConvertFrom-Json
if($taskStructure.sha256 -ne $taskHash -or -not $taskStructure.compiledAssetsMatch -or -not $taskStructure.zipCRC -or $taskStructure.package -ne $taskPackage){throw 'Exact APK structural verification required'}
$taskBrowser=Get-Content -LiteralPath (Join-Path $taskViz 'motion134-browser/review.json') -Raw|ConvertFrom-Json
if(-not $taskBrowser.passed -or @($taskBrowser.cases).Count -ne 8 -or @($taskBrowser.errors).Count){throw 'All eight current browser scenarios must pass'}
if($taskBrowser.apk.sha256 -ne $taskHash -or -not $taskBrowser.assetsUnchanged){throw 'Browser evidence is not tied to the exact delivery APK'}
$taskParity=Get-Content -LiteralPath (Join-Path $taskViz 'motion134-parity/review.json') -Raw|ConvertFrom-Json
if(-not $taskParity.passed){throw 'Visual parity must pass before delivery'}
$taskUnit=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'motion134-unit.txt') -Raw
if($taskUnit -notmatch 'pass 789' -or $taskUnit -notmatch 'fail 0'){throw 'Final 789 unit tests must pass'}
$taskFixtureHash=(Get-FileHash -LiteralPath (Join-Path $taskViz 'motion134-fixture/fixture.apk') -Algorithm SHA256).Hash.ToLowerInvariant()
$taskModels=@($DeviceSerial|ForEach-Object {
 $taskDetected=((& $taskAdb -s $_ shell getprop ro.product.model)-join '').Trim()
 if($LASTEXITCODE -ne 0 -or $taskDetected -notin @('CPH2737','PKJ110')){throw 'An authorized target model is not available'}
 $taskDetected
})
if(@($taskModels|Select-Object -Unique).Count -ne $taskModels.Count){throw 'The same physical phone was selected through multiple connections'}
$taskNames=@($taskModels|ForEach-Object {if($_ -eq 'CPH2737'){'reno'}else{'pkj'}})
foreach($taskName in $taskNames){foreach($taskTheme in @('light','dark')){
 $taskReport=Get-Content -LiteralPath (Join-Path $taskViz "motion134-native/$taskName-$taskTheme.json") -Raw|ConvertFrom-Json
 if(-not $taskReport.passed -or $taskReport.fixtureSha256 -ne $taskFixtureHash -or @($taskReport.errors).Count){throw "Current native scenario missing: $taskName/$taskTheme"}
}}
foreach($taskName in $taskNames){foreach($taskPhase in @('baseline','candidate')){
 $taskMotion=Get-Content -LiteralPath (Join-Path $taskViz "motion134-physical-$taskPhase-$taskName/review.json") -Raw|ConvertFrom-Json
 if(-not $taskMotion.passed -or @($taskMotion.cases).Count -ne 2 -or @($taskMotion.errors).Count){throw "Guarded physical comparison missing: $taskName/$taskPhase"}
 foreach($taskCase in $taskMotion.cases){
  if(-not $taskCase.foregroundGuarded){throw 'Physical comparison was not guarded in the foreground'}
  if($taskPhase -eq 'candidate' -and ((@($taskCase.cases|Where-Object {$_.timelineRewinds -gt 0})).Count -or $taskCase.injected100msStall.timelineRewinds -gt 0)){throw 'Candidate still rewinds animations'}
 }
}}
$taskSafeCopy=Join-Path $taskViz 'motion134-native/final.apk'
Copy-Item -LiteralPath $taskApk -Destination $taskSafeCopy -Force
if((Get-FileHash -LiteralPath $taskSafeCopy -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskHash){throw 'Delivery APK copy mismatch'}
function Get-PackageInfo([string]$Serial){
 $taskDump=((& $taskAdb -s $Serial shell dumpsys package $taskPackage)-join "`n")
 $taskFields=@{}
 foreach($taskField in @('versionName','versionCode','firstInstallTime','lastUpdateTime')){
  $taskPattern=if($taskField -eq 'versionCode'){'versionCode=(\d+)'}else{"(?m)^\s*$taskField=([^\r\n]+)"}
  $taskMatch=[regex]::Match($taskDump,$taskPattern)
  $taskFields[$taskField]=if($taskMatch.Success){$taskMatch.Groups[1].Value.Trim()}else{$null}
 }
 return $taskFields
}
$taskInstalled=@()
$taskProgressPath=Join-Path $PSScriptRoot 'motion134-install-progress.local'
$taskPriorProgress=if(Test-Path -LiteralPath $taskProgressPath){@(Get-Content -LiteralPath $taskProgressPath -Raw|ConvertFrom-Json)}else{@()}
foreach($taskSerial in $DeviceSerial){
 $taskPolicy=((& $taskAdb -s $taskSerial shell dumpsys window policy)-join "`n")
 if($LASTEXITCODE -ne 0 -or -not $taskPolicy){throw 'Device unavailable before delivery'}
 $taskModel=((& $taskAdb -s $taskSerial shell getprop ro.product.model)-join '').Trim()
 $taskBefore=Get-PackageInfo $taskSerial
 if($taskBefore.versionCode -and [int]$taskBefore.versionCode -gt 175){throw 'A newer Codex is already installed; refusing downgrade'}
 if($taskBefore.versionName -ne '0.12.134' -or $taskBefore.versionCode -ne '175'){
  if($taskPolicy -match 'showing=true'){throw 'Human unlock required before delivery'}
  & $taskAdb -s $taskSerial install --no-streaming --no-incremental -r $taskSafeCopy
  if($LASTEXITCODE -ne 0){throw "Codex update failed on $taskModel"}
 }
 $taskAfter=Get-PackageInfo $taskSerial
 if($taskAfter.versionName -ne '0.12.134' -or $taskAfter.versionCode -ne '175'){throw 'Installed version mismatch'}
 if($taskBefore.firstInstallTime -and $taskBefore.firstInstallTime -ne $taskAfter.firstInstallTime){throw 'Existing first installation date changed'}
 $taskDevicePath=((& $taskAdb -s $taskSerial shell pm path $taskPackage)-join '').Trim() -replace '^package:',''
 if($taskDevicePath -notmatch '^/data/app/[^\r\n]+/base\.apk$'){throw 'Installed Codex APK path invalid'}
 $taskDeviceHash=(((& $taskAdb -s $taskSerial shell sha256sum $taskDevicePath)-join '').Trim().Split(' ')[0])
 if($taskDeviceHash -ne $taskHash){throw 'Installed Codex hash differs from validated candidate'}
 $taskEarlier=@($taskPriorProgress|Where-Object {$_.model -eq $taskModel -and $_.sha256 -eq $taskHash -and $_.firstInstallTime -eq $taskAfter.firstInstallTime})|Select-Object -First 1
 $taskOriginalVersion=if($taskEarlier){$taskEarlier.previousVersion}else{$taskBefore.versionName}
 $taskOriginalFirst=if($taskEarlier){$taskEarlier.previousFirstInstallTime}else{$taskBefore.firstInstallTime}
 $taskInstalled+=[ordered]@{model=$taskModel;previousVersion=$taskOriginalVersion;newInstallation=(-not [bool]$taskOriginalFirst);version=$taskAfter.versionName;versionCode=175;firstInstallTime=$taskAfter.firstInstallTime;previousFirstInstallTime=$taskOriginalFirst;lastUpdateTime=$taskAfter.lastUpdateTime;sha256=$taskDeviceHash;launched=$false;productionDatabaseRead=$false}
 # Write a receipt immediately, so a later disconnected device cannot erase a completed update.
 $taskInstalled|ConvertTo-Json -Depth 7|Set-Content -LiteralPath $taskProgressPath -Encoding utf8
}
for($taskIndex=0;$taskIndex -lt $DeviceSerial.Count;$taskIndex++){
 $taskSerial=$DeviceSerial[$taskIndex]
 $taskProcess=((& $taskAdb -s $taskSerial shell pidof $taskPackage)-join '').Trim()
 if($taskProcess -notmatch '^\d+$'){
  & $taskAdb -s $taskSerial shell am start -S -W -n "$taskPackage/br.com.territorio.gestao.MainActivity"|Out-Null
  if($LASTEXITCODE -ne 0){throw 'Production launch failed'}
  Start-Sleep -Seconds 2
  $taskProcess=((& $taskAdb -s $taskSerial shell pidof $taskPackage)-join '').Trim()
 }
 if($taskProcess -notmatch '^\d+$'){throw 'Updated Codex process did not remain alive'}
 $taskTop=((& $taskAdb -s $taskSerial shell dumpsys activity activities)|Select-String 'topResumedActivity=|ResumedActivity:'|Select-Object -First 1).Line
 $taskInstalled[$taskIndex].launched=$true
 $taskInstalled[$taskIndex].processAlive=$true
 $taskInstalled[$taskIndex].foreground=($taskTop -like "*$taskPackage/*")
 $taskInstalled[$taskIndex].humanVisualConfirmation=$false
 $taskCleaned=@()
 foreach($taskFixturePackage in @('br.com.territorio.gestao2.integration133','br.com.territorio.gestao2.motion134')){
  $taskFixturePath=((& $taskAdb -s $taskSerial shell pm path $taskFixturePackage)-join '').Trim()
  if($LASTEXITCODE -notin @(0,1)){throw 'Device disconnected during fixture cleanup'}
  if($taskFixturePath){
   & $taskAdb -s $taskSerial uninstall $taskFixturePackage|Out-Null
   if($LASTEXITCODE -ne 0){throw "Synthetic fixture cleanup failed: $taskFixturePackage"}
  }
  $taskRemaining=((& $taskAdb -s $taskSerial shell pm path $taskFixturePackage)-join '').Trim()
  if($LASTEXITCODE -notin @(0,1) -or $taskRemaining){throw 'Synthetic package remains installed'}
  $taskCleaned+=$taskFixturePackage
 }
 & $taskAdb -s $taskSerial shell rm -f /sdcard/motion134-qa.png
 if($LASTEXITCODE -ne 0){throw 'Own QA screenshot cleanup failed'}
 # Remove only this task's debugging ports if they still exist.
 $taskForwards=((& $taskAdb -s $taskSerial forward --list)-join "`n")
 foreach($taskDebugPort in @(9393,9394)){
  if($taskForwards -match "(?m)^$([regex]::Escape($taskSerial)) tcp:$taskDebugPort "){
   & $taskAdb -s $taskSerial forward --remove "tcp:$taskDebugPort"|Out-Null
   if($LASTEXITCODE -ne 0){throw 'Own debugging forward cleanup failed'}
  }
 }
 $taskInstalled[$taskIndex].syntheticFixturesRemoved=$taskCleaned
 $taskInstalled[$taskIndex].keepAwakeReleased=$true
 $taskInstalled|ConvertTo-Json -Depth 7|Set-Content -LiteralPath $taskProgressPath -Encoding utf8
}
$taskCopies=@()
foreach($taskDestination in @((Join-Path (Split-Path -Parent $taskRoot) 'New project/AGRO-Gestao-Codex-0.12.134.apk'),'C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-Codex-0.12.134.apk')){
 if(-not (Test-Path -LiteralPath $taskDestination) -or (Get-FileHash -LiteralPath $taskDestination -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskHash){
  Copy-Item -LiteralPath $taskApk -Destination $taskDestination -Force
 }
 if((Get-FileHash -LiteralPath $taskDestination -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskHash){throw 'Delivered original-folder APK differs'}
 $taskCopies+=$taskDestination
}
$taskDeliveryPath=Join-Path $PSScriptRoot 'motion134-delivery.json'
if(Test-Path -LiteralPath $taskDeliveryPath){
 $taskPreviousDelivery=Get-Content -LiteralPath $taskDeliveryPath -Raw|ConvertFrom-Json
 if($taskPreviousDelivery.sha256 -ne $taskHash){throw 'Previous delivery receipt belongs to another APK'}
 $taskInstalled=@($taskPreviousDelivery.installed|Where-Object {$_.model -notin $taskModels})+@($taskInstalled)
}
$taskCompletedModels=@($taskInstalled|Where-Object {$_.model -in @('CPH2737','PKJ110') -and $_.sha256 -eq $taskHash -and $_.processAlive -and $_.keepAwakeReleased}|ForEach-Object {$_.model}|Select-Object -Unique)
$taskComplete=$taskCompletedModels.Count -eq 2
$taskStatus=if($taskComplete){'installed-and-validated'}else{'partially-installed-awaiting-other-device'}
$taskDelivery=[ordered]@{createdAt=(Get-Date).ToUniversalTime().ToString('o');version='0.12.134';versionCode=175;package=$taskPackage;sha256=$taskHash;unitTests=789;browserCases=8;nativeCases=(2*$taskInstalled.Count);installed=$taskInstalled;copies=$taskCopies;productionDatabaseRead=$false;status=$taskStatus}
$taskDelivery|ConvertTo-Json -Depth 7|Set-Content -LiteralPath (Join-Path $PSScriptRoot 'motion134-delivery.json') -Encoding utf8
$taskMetadataPath=Join-Path $taskRoot 'app/native-apk-validation-clone-0.12.134.json'
$taskMetadata=Get-Content -LiteralPath $taskMetadataPath -Raw|ConvertFrom-Json
$taskMetadata.status=$taskStatus
$taskMetadata.scope='package-and-functional-tests'
$taskMetadata.hardwareValidationIncluded=$true
$taskMetadata.validatedForInstallation=$true
$taskMetadata.installed=$true
$taskMetadata|Add-Member -NotePropertyName delivery -NotePropertyValue $taskDelivery -Force
$taskMetadata|ConvertTo-Json -Depth 12|Set-Content -LiteralPath $taskMetadataPath -Encoding utf8
$taskDelivery|ConvertTo-Json -Depth 7
