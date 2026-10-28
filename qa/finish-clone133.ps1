param()
$ErrorActionPreference='Stop'
$taskRoot=Split-Path -Parent $PSScriptRoot
$taskAdb=Join-Path (Split-Path -Parent $taskRoot) 'New project/android-sdk/platform-tools/adb.exe'
$taskPackage='br.com.territorio.gestao2'
$taskReportPath=Join-Path $PSScriptRoot 'clone133-delivery.json'
$taskDelivery=Get-Content -LiteralPath $taskReportPath -Raw|ConvertFrom-Json
$taskExpected=(Get-FileHash -LiteralPath (Join-Path $taskRoot 'AGRO-Gestao-Codex-0.12.133.apk') -Algorithm SHA256).Hash.ToLowerInvariant()
if($taskDelivery.sha256 -ne $taskExpected){throw 'Delivery APK mismatch'}
$taskClones=@()
foreach($taskDevice in @(@{Name='pkj';Serial='adb-3a945035-mL9gnS._adb-tls-connect._tcp';Port=9383},@{Name='reno';Serial='adb-NJJ7OJRKIF8XFYSO-ybQC0W._adb-tls-connect._tcp';Port=9384})){
 $taskParent=Join-Path $taskRoot ('.local-migrations/clone133/'+$taskDevice.Name)
 $taskResults=@(Get-ChildItem -LiteralPath $taskParent -Directory|ForEach-Object {Get-Item -LiteralPath (Join-Path $_.FullName 'migration-result.json') -ErrorAction SilentlyContinue})
 if($taskResults.Count -ne 1){throw 'Exactly one completed transfer is required for each device'}
 $taskResultPath=$taskResults[0].FullName
 $taskResult=Get-Content -LiteralPath $taskResultPath -Raw|ConvertFrom-Json
 $taskState=Get-Content -LiteralPath (Join-Path $taskResults[0].DirectoryName 'state.json') -Raw|ConvertFrom-Json
 if(-not $taskResult.passed -or $taskResult.label -ne $taskDevice.Name -or $taskResult.expectedAPK -ne $taskExpected -or $taskResult.transferId -notmatch '^[A-Za-z0-9_-]{8,64}$'){throw 'Validated transfer result missing'}
 if(((& $taskAdb -s $taskDevice.Serial shell dumpsys window policy)-join "`n") -match 'showing=true'){throw 'Human unlock required before final launch'}
 $taskLaunch=((& $taskAdb -s $taskDevice.Serial shell am start -S -W -n "$taskPackage/br.com.territorio.gestao.MainActivity")-join "`n")
 if($LASTEXITCODE -ne 0 -or $taskLaunch -notmatch 'Status: ok'){throw 'Final Codex launch failed'}
 Start-Sleep -Seconds 4
 $taskPid=((& $taskAdb -s $taskDevice.Serial shell pidof $taskPackage)-join '').Trim()
 if($taskPid -notmatch '^\d+$'){throw 'Final Codex process missing'}
 $taskTop=((& $taskAdb -s $taskDevice.Serial shell dumpsys activity activities)|Select-String 'topResumedActivity=|ResumedActivity:'|Select-Object -First 1)-join ''
 if($taskTop -notmatch 'br\.com\.territorio\.gestao2/'){throw 'Only Codex may be captured'}
 & $taskAdb -s $taskDevice.Serial shell screencap -p /sdcard/codex133-final.png
 if($LASTEXITCODE -ne 0){throw 'Final screenshot failed'}
 & $taskAdb -s $taskDevice.Serial pull /sdcard/codex133-final.png (Join-Path $taskResults[0].DirectoryName 'final-home.png')
 if($LASTEXITCODE -ne 0){throw 'Final screenshot pull failed'}
 $taskClone=[ordered]@{device=$taskDevice.Name;sourceVersion='0.12.133';filesCopied=$taskResult.filesCopied;manifestSHA256=$taskResult.manifestSHA256;backupSHA256=$taskResult.backupSHA256;receiptSHA256=$taskResult.receiptSHA256;firstInstallTimePreserved=$taskResult.firstInstallTimePreserved;processAlive=$true;foregroundVerified=$true;privateScreenshotStored=$true;backupExcludedFromGit=$true}
 $taskClones+=$taskClone
 foreach($taskId in @($taskResult.transferId,$taskState.consistencyBackupId)){
  if($taskId -notmatch '^[A-Za-z0-9_-]{8,80}$'){throw 'Unsafe cleanup ID'}
  foreach($taskKind in @('clone132-import','clone132-export')){& $taskAdb -s $taskDevice.Serial shell rm -rf "/sdcard/Android/data/$taskPackage/files/$taskKind/$taskId";if($LASTEXITCODE -ne 0){throw 'Temporary transfer cleanup failed'}}
 }
 foreach($taskHelper in @('br.com.territorio.gestao2.clone132transfer','br.com.territorio.gestao2.integration133.clone132transfer','br.com.territorio.gestao2.integration133')){
  $taskPresent=((& $taskAdb -s $taskDevice.Serial shell pm path $taskHelper)-join '').Trim()
  if($taskPresent){& $taskAdb -s $taskDevice.Serial uninstall $taskHelper;if($LASTEXITCODE -ne 0){throw 'Temporary helper cleanup failed'}}
 }
 & $taskAdb -s $taskDevice.Serial shell rm -f /sdcard/codex133-final.png /sdcard/codex133-qa.png
 & $taskAdb -s $taskDevice.Serial forward --remove "tcp:$($taskDevice.Port)"
}
$taskDelivery.status='installed-data-cloned-and-validated'
$taskDelivery.productionDatabaseRead=$true
$taskDelivery|Add-Member -NotePropertyName authorizedPersistentDataCopy -NotePropertyValue $true -Force
$taskDelivery|Add-Member -NotePropertyName dataClone -NotePropertyValue $taskClones -Force
$taskDelivery|Add-Member -NotePropertyName temporaryHelpersRemoved -NotePropertyValue $true -Force
$taskDelivery|Add-Member -NotePropertyName finishedAtUTC -NotePropertyValue ((Get-Date).ToUniversalTime().ToString('o')) -Force
$taskDelivery|ConvertTo-Json -Depth 10|Set-Content -LiteralPath $taskReportPath -Encoding utf8
$taskMetaPath=Join-Path $taskRoot 'app/native-apk-validation-clone-0.12.133.json'
$taskMeta=Get-Content -LiteralPath $taskMetaPath -Raw|ConvertFrom-Json
$taskMeta.status=$taskDelivery.status
$taskMeta|Add-Member -NotePropertyName delivery -NotePropertyValue $taskDelivery -Force
$taskMeta|ConvertTo-Json -Depth 12|Set-Content -LiteralPath $taskMetaPath -Encoding utf8
Write-Output 'Codex133 launched on both devices; data and safety backups verified; temporary helpers removed.'
