param(
  [switch]$NativeOnly,
  [switch]$Online,
  [string]$BuildRoot = 'C:\Users\alexd\.codex\visualizations\2026\10\28\01a18240-19fb-7c13-946b-a3251dc40b1d\codex132-native',
  [string]$SdkPath = '',
  [string]$SigningPath = ''
)
$ErrorActionPreference = 'Stop'
$taskWorkspace = Split-Path -Parent $PSScriptRoot
$taskProject = Join-Path $taskWorkspace 'app'
if (-not $SdkPath) { $SdkPath = Join-Path (Split-Path -Parent $taskWorkspace) 'New project\android-sdk' }
if (-not $SigningPath) { $SigningPath = Join-Path (Split-Path -Parent $taskWorkspace) 'DEFESA CIVIL\AGRO-Gestao-2\.signing' }
$taskSdk = [System.IO.Path]::GetFullPath($SdkPath)
$taskSigning = [System.IO.Path]::GetFullPath($SigningPath)
$taskBuildRoot = [System.IO.Path]::GetFullPath($BuildRoot)
$taskRun = Join-Path $taskBuildRoot ((Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [Guid]::NewGuid().ToString('N').Substring(0, 8))
$taskNode = 'C:\Users\alexd\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$taskGradle = 'C:\Users\alexd\.gradle\wrapper\dists\gradle-8.14.3-all\10utluxaxniiv4wxiphsi49nj\gradle-8.14.3\bin\gradle.bat'
$env:JAVA_HOME = 'C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot'
$env:ANDROID_HOME = $taskSdk
$taskTools = Join-Path $taskSdk 'build-tools\36.0.0'
$taskJava = Join-Path $env:JAVA_HOME 'bin\java.exe'
$taskKey = Join-Path $taskSigning 'agro-gestao2.jks'
$taskPasswordFile = Join-Path $taskSigning 'password.txt'
foreach ($taskRequired in @($taskNode, $taskGradle, $taskKey, $taskPasswordFile, (Join-Path $taskTools 'zipalign.exe'), (Join-Path $taskTools 'lib\apksigner.jar'))) {
  if (-not (Test-Path -LiteralPath $taskRequired -PathType Leaf)) { throw "Missing build prerequisite: $taskRequired" }
}
New-Item -ItemType Directory -Force -Path $taskRun | Out-Null
$taskOldLocation = Get-Location
try {
  Set-Location -LiteralPath $taskProject
  if (-not $NativeOnly) {
    & $taskNode 'node_modules/vite/bin/vite.js' build
    if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed' }
    & $taskNode 'node_modules/@capacitor/cli/bin/capacitor' sync android
    if ($LASTEXITCODE -ne 0) { throw 'Capacitor sync failed' }
  }
  $taskAssetsSource = Join-Path $taskProject 'android\app\src\main\assets'
  $taskAssetsTarget = Join-Path $taskRun 'assets'
  New-Item -ItemType Directory -Force -Path $taskAssetsTarget | Out-Null
  Get-ChildItem -LiteralPath $taskAssetsSource -Recurse -File | Where-Object { $_.FullName -notmatch '[\\/]voice[\\/]' } | ForEach-Object {
    $taskRelative = $_.FullName.Substring($taskAssetsSource.Length).TrimStart('\', '/')
    $taskTarget = Join-Path $taskAssetsTarget $taskRelative
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $taskTarget) | Out-Null
    [System.IO.File]::WriteAllBytes($taskTarget, [System.IO.File]::ReadAllBytes($_.FullName))
  }
  $taskBuildForward = $taskRun.Replace('\', '/').Replace("'", "\'")
  $taskAssetsForward = $taskAssetsTarget.Replace('\', '/').Replace("'", "\'")
  $taskInit = Join-Path $taskRun 'build-location.gradle'
  $taskInitSource = @"
gradle.beforeProject { project ->
    if (project.path == ':app') {
        project.layout.buildDirectory.set(new File('$taskBuildForward/app'))
        project.afterEvaluate { project.android.sourceSets.main.assets.setSrcDirs(['$taskAssetsForward']) }
    } else if (project.path != ':') {
        project.layout.buildDirectory.set(new File('$taskBuildForward/components/' + project.name))
    } else {
        project.layout.buildDirectory.set(new File('$taskBuildForward/root'))
    }
}
"@
  [System.IO.File]::WriteAllText($taskInit, $taskInitSource, [System.Text.UTF8Encoding]::new($false))
  [System.IO.File]::WriteAllText((Join-Path $taskProject 'android\local.properties'), 'sdk.dir=' + $taskSdk.Replace('\', '/') + "`n", [System.Text.UTF8Encoding]::new($false))
  Set-Location -LiteralPath (Join-Path $taskProject 'android')
  [string[]]$taskMode = @()
  if (-not $Online) { $taskMode = @('--offline') }
  $ErrorActionPreference = 'Continue'
  & $taskGradle @taskMode --no-daemon --max-workers=2 -I $taskInit :app:assembleRelease --console=plain 2>&1 | Tee-Object -FilePath (Join-Path $taskRun 'gradle.log')
  $taskBuildExit = $LASTEXITCODE
  $ErrorActionPreference = 'Stop'
  if ($taskBuildExit -ne 0) { throw "Android release build failed ($taskBuildExit)" }
  $taskUnsigned = Join-Path $taskRun 'app\outputs\apk\release\app-release-unsigned.apk'
  $taskAligned = Join-Path $taskRun 'aligned.apk'
  $taskOutput = Join-Path $taskWorkspace 'AGRO-Gestao-Codex-0.12.132.apk'
  & (Join-Path $taskTools 'zipalign.exe') -f -P 16 4 $taskUnsigned $taskAligned
  if ($LASTEXITCODE -ne 0) { throw 'Alignment failed' }
  $env:AGRO2_SIGN_PASS = (Get-Content -LiteralPath $taskPasswordFile -Raw).Trim()
  try {
    & $taskJava -jar (Join-Path $taskTools 'lib\apksigner.jar') sign --ks $taskKey --ks-key-alias agro-gestao2 --ks-pass env:AGRO2_SIGN_PASS --key-pass env:AGRO2_SIGN_PASS --out $taskOutput $taskAligned
    if ($LASTEXITCODE -ne 0) { throw 'Signing failed' }
  } finally { Remove-Item Env:AGRO2_SIGN_PASS -ErrorAction SilentlyContinue }
  & $taskJava -jar (Join-Path $taskTools 'lib\apksigner.jar') verify --verbose --print-certs $taskOutput | Tee-Object -FilePath (Join-Path $taskRun 'signature.txt')
  if ($LASTEXITCODE -ne 0) { throw 'Signature verification failed' }
  & (Join-Path $taskTools 'zipalign.exe') -c -P 16 -v 4 $taskOutput | Select-Object -Last 1
  if ($LASTEXITCODE -ne 0) { throw 'Final alignment verification failed' }
  # Older Android aapt cannot open the accented workspace path on Windows.
  $taskInspectionCopy = Join-Path $taskRun 'signed.apk'
  Copy-Item -LiteralPath $taskOutput -Destination $taskInspectionCopy -Force
  & (Join-Path $taskTools 'aapt.exe') dump badging $taskInspectionCopy | Select-String '^package:|^application:|application-debuggable'
  if ($LASTEXITCODE -ne 0) { throw 'Package inspection failed' }
  Get-FileHash -LiteralPath $taskOutput -Algorithm SHA256 | Select-Object Hash, Path
  Write-Output "Build evidence: $taskRun"
} finally {
  Set-Location -LiteralPath $taskOldLocation
}
