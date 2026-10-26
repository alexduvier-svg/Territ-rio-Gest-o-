param([switch]$NativeOnly,[switch]$Online)
$ErrorActionPreference = 'Stop'
$taskWorkspace = 'C:\Users\alexd\OneDrive\Documentos\ChatGPT\New project'
$taskProject = Join-Path $taskWorkspace 'agro-gestao'
$taskNode = 'C:\Users\alexd\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$env:JAVA_HOME = 'C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot'
$env:ANDROID_HOME = Join-Path $taskWorkspace 'android-sdk'
$taskTools = Join-Path $env:ANDROID_HOME 'build-tools\36.0.0'
$taskGradle = 'C:\Users\alexd\.gradle\wrapper\dists\gradle-8.14.3-all\10utluxaxniiv4wxiphsi49nj\gradle-8.14.3\bin\gradle.bat'
Set-Location -LiteralPath $taskProject
if (-not $NativeOnly) {
  & $taskNode 'node_modules/vite/bin/vite.js' build
  if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed' }
  & $taskNode 'node_modules/@capacitor/cli/bin/capacitor' sync android
  if ($LASTEXITCODE -ne 0) { throw 'Capacitor sync failed' }
}
$taskAssetsSource = Join-Path $taskProject 'android/app/src/main/assets'
$taskAssetsTarget = 'C:/Users/alexd/.codex/visualizations/2026/10/15/01a13f9b-c55a-7a91-8bee-90c8d5f7f38d/agro2-assets018'
$taskResolvedAssets = [System.IO.Path]::GetFullPath($taskAssetsTarget)
if ($taskResolvedAssets -ne [System.IO.Path]::GetFullPath('C:/Users/alexd/.codex/visualizations/2026/10/15/01a13f9b-c55a-7a91-8bee-90c8d5f7f38d/agro2-assets018')) { throw 'Unexpected generated asset directory' }
if (Test-Path -LiteralPath $taskResolvedAssets) {
  Get-ChildItem -LiteralPath $taskResolvedAssets -Recurse -File | ForEach-Object {
    $taskRelativeExisting = $_.FullName.Substring($taskResolvedAssets.Length).TrimStart('\','/')
    if (-not (Test-Path -LiteralPath (Join-Path $taskAssetsSource $taskRelativeExisting) -PathType Leaf)) { Remove-Item -LiteralPath $_.FullName -Force }
  }
}
Get-ChildItem -LiteralPath $taskAssetsSource -Recurse -File | Where-Object { $_.FullName -notmatch '[\\/]voice[\\/]' } | ForEach-Object {
  $taskRelative = $_.FullName.Substring($taskAssetsSource.Length).TrimStart('\','/')
  $taskDest = Join-Path $taskAssetsTarget $taskRelative
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $taskDest) | Out-Null
  [System.IO.File]::WriteAllBytes($taskDest, [System.IO.File]::ReadAllBytes($_.FullName))
}
$taskTestTarget = 'C:/Users/alexd/.codex/visualizations/2026/10/15/01a13f9b-c55a-7a91-8bee-90c8d5f7f38d/agro2-test-assets018'
New-Item -ItemType Directory -Force -Path $taskTestTarget | Out-Null
Copy-Item -LiteralPath (Join-Path $taskProject 'android/app/src/androidTest/assets/pdf-lib.min.js') -Destination (Join-Path $taskTestTarget 'pdf-lib.min.js') -Force
Copy-Item -LiteralPath (Join-Path $taskProject 'android/app/src/androidTest/assets/catalog-fixture.pdf') -Destination (Join-Path $taskTestTarget 'catalog-fixture.pdf') -Force
Set-Location -LiteralPath (Join-Path $taskProject 'android')
 [string[]]$taskMode = @(); if (-not $Online) { $taskMode = @('--offline') }
$ErrorActionPreference='Continue'
& $taskGradle @taskMode --rerun-tasks --no-daemon --max-workers=2 -I (Join-Path $taskWorkspace 'qa\build-location.gradle') :app:assembleRelease --console=plain 2>&1 | Tee-Object -FilePath (Join-Path $taskProject 'native-build-codex091.log')
$taskBuildExit=$LASTEXITCODE
$ErrorActionPreference='Stop'
if ($taskBuildExit -ne 0) { throw 'Android release build failed' }
$taskUnsigned = 'C:\Users\alexd\.codex\visualizations\2026\10\15\01a13f9b-c55a-7a91-8bee-90c8d5f7f38d\agro2-native-build\outputs\apk\release\app-release-unsigned.apk'
$taskAligned = Join-Path $taskWorkspace 'qa\agro2-final-aligned.apk'
$taskOutput = Join-Path $taskWorkspace 'AGRO-Gestao-Codex-0.12.91.apk'
& (Join-Path $taskTools 'zipalign.exe') -f -P 16 4 $taskUnsigned $taskAligned
if ($LASTEXITCODE -ne 0) { throw 'Alignment failed' }
$taskSigning = 'C:\Users\alexd\OneDrive\Documentos\ChatGPT\DEFESA CIVIL\AGRO-Gestao-2\.signing'
$taskKey = Join-Path $taskSigning 'agro-gestao2.jks'
$env:AGRO2_SIGN_PASS = (Get-Content -LiteralPath (Join-Path $taskSigning 'password.txt') -Raw).Trim()
try {
  & (Join-Path $env:JAVA_HOME 'bin\java.exe') -jar (Join-Path $taskTools 'lib\apksigner.jar') sign --ks $taskKey --ks-key-alias agro-gestao2 --ks-pass env:AGRO2_SIGN_PASS --key-pass env:AGRO2_SIGN_PASS --out $taskOutput $taskAligned
  if ($LASTEXITCODE -ne 0) { throw 'Signing failed' }
} finally { Remove-Item Env:AGRO2_SIGN_PASS -ErrorAction SilentlyContinue }
& (Join-Path $env:JAVA_HOME 'bin\java.exe') -jar (Join-Path $taskTools 'lib\apksigner.jar') verify --verbose --print-certs $taskOutput | Tee-Object -FilePath (Join-Path $taskWorkspace 'qa\codex091-signature.txt')
if ($LASTEXITCODE -ne 0) { throw 'Signature verification failed' }
& (Join-Path $taskTools 'zipalign.exe') -c -P 16 -v 4 $taskOutput | Select-Object -Last 1
if ($LASTEXITCODE -ne 0) { throw 'Final alignment verification failed' }
& (Join-Path $taskTools 'aapt.exe') dump badging $taskOutput | Select-String '^package:|^application:|application-debuggable'
Get-FileHash -LiteralPath $taskOutput -Algorithm SHA256 | Select-Object Hash




Set-Location -LiteralPath $taskWorkspace
