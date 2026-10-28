param([ValidateSet('br.com.territorio.gestao2','br.com.territorio.gestao2.integration133')][string]$TargetPackage='br.com.territorio.gestao2',[switch]$Online,[string]$BuildRoot='C:\Users\alexd\.codex\visualizations\2026\10\28\01a1835c-018b-7352-95a2-037da69102a6\clone132-transfer-build')
$ErrorActionPreference='Stop'
$taskRoot=Split-Path -Parent $PSScriptRoot
$taskProject=Join-Path $taskRoot 'app'
$taskViz=[System.IO.Path]::GetFullPath('C:\Users\alexd\.codex\visualizations\2026\10\28\01a1835c-018b-7352-95a2-037da69102a6')
$taskOut=[System.IO.Path]::GetFullPath($BuildRoot)
if(-not $taskOut.StartsWith($taskViz+[System.IO.Path]::DirectorySeparatorChar,[System.StringComparison]::OrdinalIgnoreCase)){throw 'Transfer helper output must stay in this task visualization directory'}
$env:JAVA_HOME='C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot'
$taskSdk=Join-Path (Split-Path -Parent $taskRoot) 'New project/android-sdk'
$env:ANDROID_HOME=$taskSdk
$taskGradle='C:\Users\alexd\.gradle\wrapper\dists\gradle-8.14.3-all\10utluxaxniiv4wxiphsi49nj\gradle-8.14.3\bin\gradle.bat'
$taskTools=Join-Path $taskSdk 'build-tools/36.0.0'
$taskSigning=Join-Path (Split-Path -Parent $taskRoot) 'DEFESA CIVIL/AGRO-Gestao-2/.signing'
New-Item -ItemType Directory -Force -Path $taskOut|Out-Null
if($TargetPackage -ne 'br.com.territorio.gestao2'){$taskOut=Join-Path $taskOut 'fixture-test'}
$taskSourceRoot=Join-Path $taskOut 'test-java'
$taskPackageRoot=Join-Path $taskSourceRoot 'br/com/territorio/gestao'
New-Item -ItemType Directory -Force -Path $taskPackageRoot|Out-Null
$taskJavaSource=[System.IO.File]::ReadAllText((Join-Path $taskProject 'android/app/src/androidTest/java/br/com/territorio/gestao/Clone132DataInstrumentedTest.java')).Replace('TARGET = "br.com.territorio.gestao2"','TARGET = "'+$TargetPackage+'"')
[System.IO.File]::WriteAllText((Join-Path $taskPackageRoot 'Clone132DataInstrumentedTest.java'),$taskJavaSource,[System.Text.UTF8Encoding]::new($false))
$taskForward=$taskOut.Replace('\','/').Replace("'","\'")
$taskInit=Join-Path $taskOut 'transfer-test.gradle'
$taskInitCode=@"
gradle.beforeProject { project ->
 if(project.path == ':app') {
  project.layout.buildDirectory.set(new File('$taskForward/app'))
  project.afterEvaluate {
   project.android.defaultConfig.applicationId='$TargetPackage'
   project.android.defaultConfig.testApplicationId='$TargetPackage.clone132transfer'
   project.android.sourceSets.androidTest.java.setSrcDirs(['$taskForward/test-java'])
   project.android.sourceSets.androidTest.assets.setSrcDirs([])
   project.android.sourceSets.androidTest.res.setSrcDirs([])
  }
 } else if(project.path != ':') project.layout.buildDirectory.set(new File('$taskForward/components/'+project.name))
 else project.layout.buildDirectory.set(new File('$taskForward/root'))
}
"@
[System.IO.File]::WriteAllText($taskInit,$taskInitCode,[System.Text.UTF8Encoding]::new($false))
$taskOldLocation=Get-Location
try{
 Set-Location -LiteralPath (Join-Path $taskProject 'android')
 [string[]]$taskMode=@();if(-not $Online){$taskMode=@('--offline')}
 $ErrorActionPreference='Continue'
 & $taskGradle @taskMode --no-daemon --max-workers=2 --project-cache-dir (Join-Path $taskOut 'project-cache') -I $taskInit :app:assembleReleaseAndroidTest --console=plain *> (Join-Path $taskOut 'gradle.log')
 $taskExit=$LASTEXITCODE;$ErrorActionPreference='Stop'
 if($taskExit -ne 0){Get-Content -LiteralPath (Join-Path $taskOut 'gradle.log') -Tail 35;throw 'Generic data transfer helper build failed'}
 $taskUnsigned=Join-Path $taskOut 'app/outputs/apk/androidTest/release/app-release-androidTest.apk'
 $taskAligned=Join-Path $taskOut 'aligned.apk'
 $taskOutput=Join-Path $taskOut 'clone132-transfer.apk'
 & (Join-Path $taskTools 'zipalign.exe') -f -P 16 4 $taskUnsigned $taskAligned
 if($LASTEXITCODE -ne 0){throw 'Transfer helper alignment failed'}
 $env:CLONE132_TEST_SIGN_PASS=(Get-Content -LiteralPath (Join-Path $taskSigning 'password.txt') -Raw).Trim()
 try{
  & (Join-Path $env:JAVA_HOME 'bin/java.exe') -jar (Join-Path $taskTools 'lib/apksigner.jar') sign --ks (Join-Path $taskSigning 'agro-gestao2.jks') --ks-key-alias agro-gestao2 --ks-pass env:CLONE132_TEST_SIGN_PASS --key-pass env:CLONE132_TEST_SIGN_PASS --out $taskOutput $taskAligned
  if($LASTEXITCODE -ne 0){throw 'Transfer helper signing failed'}
 }finally{Remove-Item Env:CLONE132_TEST_SIGN_PASS -ErrorAction SilentlyContinue}
 & (Join-Path $env:JAVA_HOME 'bin/java.exe') -jar (Join-Path $taskTools 'lib/apksigner.jar') verify --verbose --print-certs $taskOutput *> (Join-Path $taskOut 'signature.txt')
 if($LASTEXITCODE -ne 0){throw 'Transfer helper signature invalid'}
 $taskBadging=(& (Join-Path $taskTools 'aapt.exe') dump badging $taskOutput)-join "`n"
 if($LASTEXITCODE -ne 0 -or $taskBadging -notmatch "package: name='$TargetPackage.clone132transfer'"){throw 'Unexpected transfer helper package'}
 $taskInstrumentation=(& (Join-Path $taskTools 'aapt.exe') dump xmltree $taskOutput AndroidManifest.xml)-join "`n"
 if($LASTEXITCODE -ne 0 -or $taskInstrumentation -notmatch ('targetPackage.*'+[regex]::Escape($TargetPackage))){throw 'Unexpected instrumentation target'}
 [System.IO.File]::WriteAllText((Join-Path $taskOut 'manifest.txt'),$taskInstrumentation,[System.Text.UTF8Encoding]::new($false))
 $taskZip=[System.IO.Compression.ZipFile]::OpenRead($taskOutput)
 try{if(@($taskZip.Entries|Where-Object {$_.FullName -match '^assets/'}).Count){throw 'Transfer test APK must not contain embedded assets or private data'}}finally{$taskZip.Dispose()}
 [ordered]@{package=($TargetPackage+'.clone132transfer');target=$TargetPackage;apk=$taskOutput;sha256=(Get-FileHash -LiteralPath $taskOutput -Algorithm SHA256).Hash.ToLowerInvariant();businessDataEmbedded=$false;migrationExecuted=$false}|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $taskOut 'build-report.json') -Encoding utf8
 Write-Output "Generic transfer helper ready: $taskOutput"
}finally{Set-Location -LiteralPath $taskOldLocation}
