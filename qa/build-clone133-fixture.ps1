param(
 [switch]$Online,
 [switch]$SkipPrepare,
 [string]$FixtureRoot='C:\Users\alexd\.codex\visualizations\2026\10\28\01a1835c-018b-7352-95a2-037da69102a6\codex133-fixture',
 [string]$SdkPath='',
 [string]$SigningPath=''
)
$ErrorActionPreference='Stop'
$taskWorkspace=Split-Path -Parent $PSScriptRoot
$taskProject=Join-Path $taskWorkspace 'app'
$taskFixturePackage='br.com.territorio.gestao2.integration133'
$taskAllowedRoot=[System.IO.Path]::GetFullPath('C:\Users\alexd\.codex\visualizations\2026\10\28\01a1835c-018b-7352-95a2-037da69102a6')
$taskOut=[System.IO.Path]::GetFullPath($FixtureRoot)
if(-not $taskOut.StartsWith($taskAllowedRoot+[System.IO.Path]::DirectorySeparatorChar,[System.StringComparison]::OrdinalIgnoreCase)){throw 'Fixture output must remain inside this task visualization directory.'}
if(-not $SdkPath){$SdkPath=Join-Path (Split-Path -Parent $taskWorkspace) 'New project\android-sdk'}
if(-not $SigningPath){$SigningPath=Join-Path (Split-Path -Parent $taskWorkspace) 'DEFESA CIVIL\AGRO-Gestao-2\.signing'}
$taskSdk=[System.IO.Path]::GetFullPath($SdkPath)
$taskSigning=[System.IO.Path]::GetFullPath($SigningPath)
$taskNode='C:\Users\alexd\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$taskGradle='C:\Users\alexd\.gradle\wrapper\dists\gradle-8.14.3-all\10utluxaxniiv4wxiphsi49nj\gradle-8.14.3\bin\gradle.bat'
$env:JAVA_HOME='C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot'
$env:ANDROID_HOME=$taskSdk
$taskTools=Join-Path $taskSdk 'build-tools\36.0.0'
$taskJava=Join-Path $env:JAVA_HOME 'bin\java.exe'
$taskKey=Join-Path $taskSigning 'agro-gestao2.jks'
$taskPasswordFile=Join-Path $taskSigning 'password.txt'
foreach($taskRequired in @($taskNode,$taskGradle,$taskKey,$taskPasswordFile,(Join-Path $taskTools 'zipalign.exe'),(Join-Path $taskTools 'aapt.exe'),(Join-Path $taskTools 'lib\apksigner.jar'))){
 if(-not (Test-Path -LiteralPath $taskRequired -PathType Leaf)){throw "Missing fixture build prerequisite: $taskRequired"}
}
if(-not $SkipPrepare){
 & $taskNode (Join-Path $PSScriptRoot 'prepare-clone133-fixture.mjs') --out $taskOut
 if($LASTEXITCODE -ne 0){throw 'Isolated fixture preparation failed'}
}
& $taskNode (Join-Path $PSScriptRoot 'prepare-clone133-fixture.mjs') --out $taskOut --verify
if($LASTEXITCODE -ne 0){throw 'Prepared fixture asset verification failed'}
$taskPreparation=Get-Content -LiteralPath (Join-Path $taskOut 'preparation.json') -Raw | ConvertFrom-Json
if($taskPreparation.fixturePackage -ne $taskFixturePackage){throw 'Unexpected prepared fixture package'}
$taskOldLocation=Get-Location
try{
 Set-Location -LiteralPath (Join-Path $taskProject 'android')
 [string[]]$taskMode=@();if(-not $Online){$taskMode=@('--offline')}
 $ErrorActionPreference='Continue'
 & $taskGradle @taskMode --no-daemon --max-workers=2 --project-cache-dir (Join-Path $taskOut 'project-cache') -I (Join-Path $taskOut 'fixture.gradle') :app:assembleRelease --console=plain 2>&1 | Tee-Object -FilePath (Join-Path $taskOut 'gradle.log')
 $taskExit=$LASTEXITCODE;$ErrorActionPreference='Stop'
 if($taskExit -ne 0){throw "Native isolated fixture build failed ($taskExit)"}
 $taskUnsigned=Join-Path $taskOut 'build\outputs\apk\release\app-release-unsigned.apk'
 $taskAligned=Join-Path $taskOut 'aligned.apk'
 $taskOutput=Join-Path $taskOut 'fixture.apk'
 & (Join-Path $taskTools 'zipalign.exe') -f -P 16 4 $taskUnsigned $taskAligned
 if($LASTEXITCODE -ne 0){throw 'Fixture alignment failed'}
 $env:AGRO2_FIXTURE_SIGN_PASS=(Get-Content -LiteralPath $taskPasswordFile -Raw).Trim()
 try{
  & $taskJava -jar (Join-Path $taskTools 'lib\apksigner.jar') sign --ks $taskKey --ks-key-alias agro-gestao2 --ks-pass env:AGRO2_FIXTURE_SIGN_PASS --key-pass env:AGRO2_FIXTURE_SIGN_PASS --out $taskOutput $taskAligned
  if($LASTEXITCODE -ne 0){throw 'Fixture signing failed'}
 }finally{Remove-Item Env:AGRO2_FIXTURE_SIGN_PASS -ErrorAction SilentlyContinue}
 & $taskJava -jar (Join-Path $taskTools 'lib\apksigner.jar') verify --verbose --print-certs $taskOutput | Tee-Object -FilePath (Join-Path $taskOut 'signature.txt')
 if($LASTEXITCODE -ne 0){throw 'Fixture signature verification failed'}
 & (Join-Path $taskTools 'zipalign.exe') -c -P 16 -v 4 $taskOutput | Select-Object -Last 1
 if($LASTEXITCODE -ne 0){throw 'Fixture alignment verification failed'}
 $taskBadging=(& (Join-Path $taskTools 'aapt.exe') dump badging $taskOutput)-join "`n"
 if($LASTEXITCODE -ne 0){throw 'Fixture manifest inspection failed'}
 [System.IO.File]::WriteAllText((Join-Path $taskOut 'badging.txt'),$taskBadging,[System.Text.UTF8Encoding]::new($false))
 if($taskBadging -notmatch "package: name='br.com.territorio.gestao2.integration133'" -or $taskBadging -notmatch "versionName='0.12.133'" -or $taskBadging -notmatch 'application-debuggable'){throw 'Fixture package/version/debugging verification failed'}
 $taskPermissions=(& (Join-Path $taskTools 'aapt.exe') dump permissions $taskOutput)-join "`n"
 if($LASTEXITCODE -ne 0){throw 'Fixture permission inspection failed'}
 [System.IO.File]::WriteAllText((Join-Path $taskOut 'permissions.txt'),$taskPermissions,[System.Text.UTF8Encoding]::new($false))
 if($taskPermissions -match 'android.permission.INTERNET'){throw 'Fixture still has INTERNET permission'}
 & $taskNode (Join-Path $PSScriptRoot 'prepare-clone133-fixture.mjs') --out $taskOut --verify
 if($LASTEXITCODE -ne 0){throw 'Fixture source/assets changed during compilation'}
 $taskZip=[System.IO.Compression.ZipFile]::OpenRead($taskOutput)
 try{
  foreach($taskAsset in $taskPreparation.files){
   $taskEntry=$taskZip.GetEntry('assets/'+$taskAsset.path)
   if(-not $taskEntry){throw "Prepared fixture asset missing from APK: $($taskAsset.path)"}
   $taskStream=$taskEntry.Open()
   try{$taskPackagedHash=[System.Convert]::ToHexString([System.Security.Cryptography.SHA256]::HashData($taskStream)).ToLowerInvariant()}finally{$taskStream.Dispose()}
   if($taskPackagedHash -ne $taskAsset.fixtureSha256){throw "Packaged fixture asset differs from preparation: $($taskAsset.path)"}
  }
  $taskExpectedPublic=@($taskPreparation.files|Where-Object {$_.path.StartsWith('public/')}|ForEach-Object {'assets/'+$_.path})
  foreach($taskEntry in $taskZip.Entries){if($taskEntry.FullName.StartsWith('assets/public/') -and -not $taskEntry.FullName.EndsWith('/') -and $taskEntry.FullName -notin $taskExpectedPublic){throw "Unexpected public asset in fixture APK: $($taskEntry.FullName)"}}
 }finally{$taskZip.Dispose()}
 $taskHash=(Get-FileHash -LiteralPath $taskOutput -Algorithm SHA256).Hash.ToLowerInvariant()
 $taskReport=[ordered]@{createdAt=(Get-Date).ToUniversalTime().ToString('o');fixturePackage=$taskFixturePackage;version='0.12.133';apk=$taskOutput;sha256=$taskHash;bytes=(Get-Item -LiteralPath $taskOutput).Length;debuggable=$true;internetPermission=$false;sourceAssetsVerified=$true;packagedAssetsVerified=$true;productionDataAccessed=$false;installed=$false;preparation=(Join-Path $taskOut 'preparation.json');signature=(Join-Path $taskOut 'signature.txt')}
 [System.IO.File]::WriteAllText((Join-Path $taskOut 'build-report.json'),($taskReport|ConvertTo-Json -Depth 5),[System.Text.UTF8Encoding]::new($false))
 Write-Output "Isolated fixture ready: $taskOutput"
 Write-Output "SHA256: $taskHash"
}finally{Set-Location -LiteralPath $taskOldLocation}
