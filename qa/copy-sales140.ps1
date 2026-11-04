$ErrorActionPreference='Stop'
$taskRoot=Split-Path -Parent $PSScriptRoot
$taskApk=Join-Path $taskRoot 'AGRO-Gestao-Codex-0.12.140.apk'
$taskPackage=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'sales140-package-review.json') -Raw|ConvertFrom-Json
$taskBrowser=Get-Content -LiteralPath 'C:/Users/alexd/.codex/visualizations/2026/10/28/01a1835c-018b-7352-95a2-037da69102a6/sales140-browser/review.json' -Raw|ConvertFrom-Json
$taskHash=(Get-FileHash -LiteralPath $taskApk -Algorithm SHA256).Hash.ToLowerInvariant()
if($taskHash -ne $taskPackage.sha256 -or -not $taskPackage.sameCertificateAsBaseline -or -not $taskPackage.compiledAssetsMatch){throw 'Final package verification required'}
if(-not $taskBrowser.passed -or $taskBrowser.cases.Count -ne 8 -or $taskBrowser.apk.sha256 -ne $taskHash -or -not $taskBrowser.assetsUnchanged){throw 'All eight exact-APK browser scenarios must pass'}
$taskCopies=@()
foreach($taskDestination in @((Join-Path (Split-Path -Parent $taskRoot) 'New project/AGRO-Gestao-Codex-0.12.140.apk'),'C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-Codex-0.12.140.apk')){
 if(-not(Test-Path -LiteralPath (Split-Path -Parent $taskDestination) -PathType Container)){throw 'The authorized delivery folder is missing'}
 Copy-Item -LiteralPath $taskApk -Destination $taskDestination -Force
 if((Get-FileHash -LiteralPath $taskDestination -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskHash){throw 'Delivered folder APK differs'}
 $taskCopies+=$taskDestination
}
$taskReport=[ordered]@{version='0.12.140';versionCode=181;sha256=$taskHash;size=(Get-Item -LiteralPath $taskApk).Length;copies=$taskCopies;checkedAt=(Get-Date).ToUniversalTime().ToString('o');status='copied-awaiting-device-validation';installed=$false;productionDatabaseRead=$false}
$taskReport|ConvertTo-Json -Depth 4|Set-Content -LiteralPath (Join-Path $PSScriptRoot 'sales140-copies.json') -Encoding utf8
$taskReport|ConvertTo-Json -Depth 4
