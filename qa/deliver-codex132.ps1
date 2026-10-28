param([Parameter(Mandatory=$true)][string[]]$DeviceSerial)
$ErrorActionPreference='Stop'
$taskRoot=Split-Path -Parent $PSScriptRoot
$taskViz='C:/Users/alexd/.codex/visualizations/2026/10/28/01a18240-19fb-7c13-946b-a3251dc40b1d'
$taskAdb=Join-Path (Split-Path -Parent $taskRoot) 'New project/android-sdk/platform-tools/adb.exe'
$taskApk=Join-Path $taskRoot 'AGRO-Gestao-Codex-0.12.132.apk'
$taskPackage='br.com.territorio.gestao2'
$taskHash=(Get-FileHash -LiteralPath $taskApk -Algorithm SHA256).Hash.ToLowerInvariant()
$taskStructure=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'codex132-package-review.json') -Raw|ConvertFrom-Json
if($taskStructure.sha256 -ne $taskHash -or -not $taskStructure.compiledAssetsMatch -or -not $taskStructure.zipCRC -or $taskStructure.package -ne $taskPackage){throw 'Exact APK structural verification required'}
$taskBrowser=Get-Content -LiteralPath (Join-Path $taskViz 'codex132-browser/review.json') -Raw|ConvertFrom-Json
if(-not $taskBrowser.passed -or @($taskBrowser.cases).Count -ne 8 -or @($taskBrowser.errors).Count){throw 'All eight current browser scenarios must pass'}
$taskUnit=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'codex132-unit.txt') -Raw
if($taskUnit -notmatch 'pass 812' -or $taskUnit -notmatch 'fail 0'){throw 'Final 812 unit tests must pass'}
$taskFixtureHash=(Get-FileHash -LiteralPath (Join-Path $taskViz 'codex132-fixture/fixture.apk') -Algorithm SHA256).Hash.ToLowerInvariant()
foreach($taskName in @('reno','pkj')){foreach($taskTheme in @('light','dark')){
 $taskReport=Get-Content -LiteralPath (Join-Path $taskViz "codex132-native/$taskName-$taskTheme.json") -Raw|ConvertFrom-Json
 if(-not $taskReport.passed -or $taskReport.fixtureSha256 -ne $taskFixtureHash -or @($taskReport.errors).Count){throw "Current native scenario missing: $taskName/$taskTheme"}
}}
$taskSafeCopy=Join-Path $taskViz 'codex132-native/final.apk'
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
foreach($taskSerial in $DeviceSerial){
 if(((& $taskAdb -s $taskSerial shell dumpsys window policy)-join "`n") -match 'showing=true'){throw 'Human unlock required before delivery'}
 $taskModel=((& $taskAdb -s $taskSerial shell getprop ro.product.model)-join '').Trim()
 $taskBefore=Get-PackageInfo $taskSerial
 if($taskBefore.versionCode -and [int]$taskBefore.versionCode -gt 172){throw 'A newer Codex is already installed; refusing downgrade'}
 & $taskAdb -s $taskSerial install --no-incremental -r $taskSafeCopy
 if($LASTEXITCODE -ne 0){throw "Codex update failed on $taskModel"}
 $taskAfter=Get-PackageInfo $taskSerial
 if($taskAfter.versionName -ne '0.12.132' -or $taskAfter.versionCode -ne '172'){throw 'Installed version mismatch'}
 if($taskBefore.firstInstallTime -and $taskBefore.firstInstallTime -ne $taskAfter.firstInstallTime){throw 'Existing first installation date changed'}
 $taskDevicePath=((& $taskAdb -s $taskSerial shell pm path $taskPackage)-join '').Trim() -replace '^package:',''
 if($taskDevicePath -notmatch '^/data/app/[^\r\n]+/base\.apk$'){throw 'Installed Codex APK path invalid'}
 $taskDeviceHash=(((& $taskAdb -s $taskSerial shell sha256sum $taskDevicePath)-join '').Trim().Split(' ')[0])
 if($taskDeviceHash -ne $taskHash){throw 'Installed Codex hash differs from validated candidate'}
 & $taskAdb -s $taskSerial shell am start -S -W -n "$taskPackage/br.com.territorio.gestao.MainActivity"
 if($LASTEXITCODE -ne 0){throw 'Updated Codex did not launch'}
 Start-Sleep -Seconds 5
 $taskPid=((& $taskAdb -s $taskSerial shell pidof $taskPackage)-join '').Trim()
 if($taskPid -notmatch '^\d+$'){throw 'Updated Codex process is not alive after launch'}
 $taskInstalled+=[ordered]@{model=$taskModel;previousVersion=$taskBefore.versionName;newInstallation=(-not [bool]$taskBefore.firstInstallTime);version=$taskAfter.versionName;versionCode=172;firstInstallTime=$taskAfter.firstInstallTime;previousFirstInstallTime=$taskBefore.firstInstallTime;lastUpdateTime=$taskAfter.lastUpdateTime;sha256=$taskDeviceHash;processAlive=$true;productionDatabaseRead=$false}
 # This exact synthetic package was created by this task; production packages are retained.
 & $taskAdb -s $taskSerial uninstall br.com.territorio.gestao2.integration132
 if($LASTEXITCODE -ne 0){throw 'Isolated fixture cleanup failed'}
 & $taskAdb -s $taskSerial shell rm -f /sdcard/codex132-qa.png
}
$taskCopies=@()
foreach($taskDestination in @((Join-Path (Split-Path -Parent $taskRoot) 'New project/AGRO-Gestao-Codex-0.12.132.apk'),'C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-Codex-0.12.132.apk')){
 Copy-Item -LiteralPath $taskApk -Destination $taskDestination -Force
 if((Get-FileHash -LiteralPath $taskDestination -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskHash){throw 'Delivered original-folder APK differs'}
 $taskCopies+=$taskDestination
}
$taskDelivery=[ordered]@{createdAt=(Get-Date).ToUniversalTime().ToString('o');version='0.12.132';versionCode=172;package=$taskPackage;sha256=$taskHash;unitTests=812;browserCases=8;nativeCases=4;installed=$taskInstalled;copies=$taskCopies;productionDatabaseRead=$false;status='installed-and-validated'}
$taskDelivery|ConvertTo-Json -Depth 7|Set-Content -LiteralPath (Join-Path $PSScriptRoot 'codex132-delivery.json') -Encoding utf8
$taskMetadataPath=Join-Path $taskRoot 'app/native-apk-validation-codex-0.12.132.json'
$taskMetadata=Get-Content -LiteralPath $taskMetadataPath -Raw|ConvertFrom-Json
$taskMetadata.status='installed-and-validated'
$taskMetadata.scope='package-and-functional-tests'
$taskMetadata.validatedForInstallation=$true
$taskMetadata.installed=$true
$taskMetadata|Add-Member -NotePropertyName delivery -NotePropertyValue $taskDelivery -Force
$taskMetadata|ConvertTo-Json -Depth 12|Set-Content -LiteralPath $taskMetadataPath -Encoding utf8
$taskDelivery|ConvertTo-Json -Depth 7
