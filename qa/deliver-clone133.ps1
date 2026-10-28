param([Parameter(Mandatory=$true)][string[]]$DeviceSerial)
$ErrorActionPreference='Stop'
$taskRoot=Split-Path -Parent $PSScriptRoot
$taskViz='C:/Users/alexd/.codex/visualizations/2026/10/28/01a1835c-018b-7352-95a2-037da69102a6'
$taskAdb=Join-Path (Split-Path -Parent $taskRoot) 'New project/android-sdk/platform-tools/adb.exe'
$taskApk=Join-Path $taskRoot 'AGRO-Gestao-Codex-0.12.133.apk'
$taskPackage='br.com.territorio.gestao2'
$taskHash=(Get-FileHash -LiteralPath $taskApk -Algorithm SHA256).Hash.ToLowerInvariant()
$taskStructure=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'clone133-package-review.json') -Raw|ConvertFrom-Json
if($taskStructure.sha256 -ne $taskHash -or -not $taskStructure.compiledAssetsMatch -or -not $taskStructure.zipCRC -or $taskStructure.package -ne $taskPackage){throw 'Exact APK structural verification required'}
$taskBrowser=Get-Content -LiteralPath (Join-Path $taskViz 'clone133-browser/review.json') -Raw|ConvertFrom-Json
if(-not $taskBrowser.passed -or @($taskBrowser.cases).Count -ne 8 -or @($taskBrowser.errors).Count){throw 'All eight current browser scenarios must pass'}
$taskUnit=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'clone133-unit.txt') -Raw
if($taskUnit -notmatch 'pass 770' -or $taskUnit -notmatch 'fail 0'){throw 'Final 770 unit tests must pass'}
$taskFixtureHash=(Get-FileHash -LiteralPath (Join-Path $taskViz 'codex133-fixture/fixture.apk') -Algorithm SHA256).Hash.ToLowerInvariant()
foreach($taskName in @('reno','pkj')){foreach($taskTheme in @('light','dark')){
 $taskReport=Get-Content -LiteralPath (Join-Path $taskViz "codex133-native/$taskName-$taskTheme.json") -Raw|ConvertFrom-Json
 if(-not $taskReport.passed -or $taskReport.fixtureSha256 -ne $taskFixtureHash -or @($taskReport.errors).Count){throw "Current native scenario missing: $taskName/$taskTheme"}
}}
$taskSafeCopy=Join-Path $taskViz 'codex133-native/final.apk'
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
 if($taskBefore.versionCode -and [int]$taskBefore.versionCode -gt 174){throw 'A newer Codex is already installed; refusing downgrade'}
 & $taskAdb -s $taskSerial install --no-incremental -r $taskSafeCopy
 if($LASTEXITCODE -ne 0){throw "Codex update failed on $taskModel"}
 $taskAfter=Get-PackageInfo $taskSerial
 if($taskAfter.versionName -ne '0.12.133' -or $taskAfter.versionCode -ne '174'){throw 'Installed version mismatch'}
 if($taskBefore.firstInstallTime -and $taskBefore.firstInstallTime -ne $taskAfter.firstInstallTime){throw 'Existing first installation date changed'}
 $taskDevicePath=((& $taskAdb -s $taskSerial shell pm path $taskPackage)-join '').Trim() -replace '^package:',''
 if($taskDevicePath -notmatch '^/data/app/[^\r\n]+/base\.apk$'){throw 'Installed Codex APK path invalid'}
 $taskDeviceHash=(((& $taskAdb -s $taskSerial shell sha256sum $taskDevicePath)-join '').Trim().Split(' ')[0])
 if($taskDeviceHash -ne $taskHash){throw 'Installed Codex hash differs from validated candidate'}
 $taskInstalled+=[ordered]@{model=$taskModel;previousVersion=$taskBefore.versionName;newInstallation=(-not [bool]$taskBefore.firstInstallTime);version=$taskAfter.versionName;versionCode=174;firstInstallTime=$taskAfter.firstInstallTime;previousFirstInstallTime=$taskBefore.firstInstallTime;lastUpdateTime=$taskAfter.lastUpdateTime;sha256=$taskDeviceHash;launched=$false;productionDatabaseRead=$false}
}
$taskCopies=@()
foreach($taskDestination in @((Join-Path (Split-Path -Parent $taskRoot) 'New project/AGRO-Gestao-Codex-0.12.133.apk'),'C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-Codex-0.12.133.apk')){
 Copy-Item -LiteralPath $taskApk -Destination $taskDestination -Force
 if((Get-FileHash -LiteralPath $taskDestination -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskHash){throw 'Delivered original-folder APK differs'}
 $taskCopies+=$taskDestination
}
$taskDelivery=[ordered]@{createdAt=(Get-Date).ToUniversalTime().ToString('o');version='0.12.133';versionCode=174;package=$taskPackage;sha256=$taskHash;unitTests=770;browserCases=8;nativeCases=4;installed=$taskInstalled;copies=$taskCopies;productionDatabaseRead=$false;status='installed-awaiting-data-clone'}
$taskDelivery|ConvertTo-Json -Depth 7|Set-Content -LiteralPath (Join-Path $PSScriptRoot 'clone133-delivery.json') -Encoding utf8
$taskMetadataPath=Join-Path $taskRoot 'app/native-apk-validation-clone-0.12.133.json'
$taskMetadata=Get-Content -LiteralPath $taskMetadataPath -Raw|ConvertFrom-Json
$taskMetadata.status='installed-awaiting-data-clone'
$taskMetadata.scope='package-and-functional-tests'
$taskMetadata.validatedForInstallation=$true
$taskMetadata.installed=$true
$taskMetadata|Add-Member -NotePropertyName delivery -NotePropertyValue $taskDelivery -Force
$taskMetadata|ConvertTo-Json -Depth 12|Set-Content -LiteralPath $taskMetadataPath -Encoding utf8
$taskDelivery|ConvertTo-Json -Depth 7
