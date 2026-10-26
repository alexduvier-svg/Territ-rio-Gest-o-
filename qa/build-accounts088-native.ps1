$ErrorActionPreference='Stop'
$taskRoot='C:/Users/alexd/OneDrive/Documentos/ChatGPT/New project'
$env:JAVA_HOME='C:/Program Files/Microsoft/jdk-21.0.12.101-hotspot'
$env:ANDROID_HOME=Join-Path $taskRoot 'android-sdk'
$taskOut='C:/Users/alexd/.codex/visualizations/2026/10/15/01a13f9b-c55a-7a91-8bee-90c8d5f7f38d/accounts088-native'
$taskGradle='C:/Users/alexd/.gradle/wrapper/dists/gradle-8.14.3-all/10utluxaxniiv4wxiphsi49nj/gradle-8.14.3/bin/gradle.bat'
Set-Location -LiteralPath (Join-Path $taskRoot 'agro-gestao/android')
$ErrorActionPreference='Continue'
& $taskGradle --offline --no-daemon --rerun-tasks --max-workers=2 -I (Join-Path $taskRoot 'qa/accounts088-fixture.gradle') :app:assembleRelease --console=plain *> (Join-Path $taskRoot 'qa/accounts088-native-build.log')
$taskExit=$LASTEXITCODE;$ErrorActionPreference='Stop';if($taskExit -ne 0){throw 'Native fixture build failed'}
$taskTools=Join-Path $env:ANDROID_HOME 'build-tools/36.0.0'
$taskAligned=Join-Path $taskRoot 'qa/agro-accounts088-fixture-aligned.apk'
$taskFixture=Join-Path $taskRoot 'qa/agro-accounts088-fixture.apk'
& (Join-Path $taskTools 'zipalign.exe') -f -P 16 4 (Join-Path $taskOut 'build/outputs/apk/release/app-release-unsigned.apk') $taskAligned
if($LASTEXITCODE -ne 0){throw 'Fixture alignment failed'}
$taskSigning='C:/Users/alexd/OneDrive/Documentos/ChatGPT/DEFESA CIVIL/AGRO-Gestao-2/.signing'
$env:AGRO2_SIGN_PASS=(Get-Content -LiteralPath (Join-Path $taskSigning 'password.txt') -Raw).Trim()
try{
 & (Join-Path $env:JAVA_HOME 'bin/java.exe') -jar (Join-Path $taskTools 'lib/apksigner.jar') sign --ks (Join-Path $taskSigning 'agro-gestao2.jks') --ks-key-alias agro-gestao2 --ks-pass env:AGRO2_SIGN_PASS --key-pass env:AGRO2_SIGN_PASS --out $taskFixture $taskAligned
}finally{Remove-Item Env:AGRO2_SIGN_PASS -ErrorAction SilentlyContinue}
if($LASTEXITCODE -ne 0){throw 'Fixture signing failed'}
[System.IO.File]::WriteAllBytes((Join-Path $taskOut 'fixture.apk'),[System.IO.File]::ReadAllBytes($taskFixture))
$taskBadging=(& (Join-Path $taskTools 'aapt.exe') dump badging $taskFixture)-join "`n"
if($taskBadging -notmatch "package: name='br.com.territorio.gestao2.motionfixture'"){throw 'Unsafe fixture package'}
Write-Output 'Isolated native fixture ready; production APK and data unchanged.'
