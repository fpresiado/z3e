# enterprise_smoke_test.ps1
$ErrorActionPreference = "Stop"

$RepoRoot = (Get-Location).Path
$LogDir   = "C:\Log files\USB admin log files"
$LegacyLog = Join-Path $LogDir "usb log file.txt"
$RunLog    = Join-Path $LogDir ("usb log file_{0}.txt" -f (Get-Date -Format "yyyy-MM-dd_HH-mm-ss"))

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-Log($Level, $Message) {
  $line = "[{0}] [{1}] {2}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Level, $Message
  Add-Content -Path $LegacyLog -Value $line
  Add-Content -Path $RunLog -Value $line
  Write-Host $line
}

Write-Log "INFO" "Enterprise smoke test starting. RepoRoot=$RepoRoot"

$manifest = Join-Path $RepoRoot "curriculum_manifest.json"
if (!(Test-Path $manifest)) { Write-Log "ERROR" "Missing curriculum_manifest.json"; exit 1 }
Write-Log "SUCCESS" "Found curriculum_manifest.json"

$bootFile = Join-Path $RepoRoot "src\z3e_enterprise\bootEnterprise.js"
if (!(Test-Path $bootFile)) { Write-Log "ERROR" "Missing bootEnterprise.js"; exit 1 }
Write-Log "SUCCESS" "Found bootEnterprise.js"

$routeFile = Join-Path $RepoRoot "src\z3e_enterprise\routes.js"
if (!(Test-Path $routeFile)) { Write-Log "ERROR" "Missing routes.js"; exit 1 }
Write-Log "SUCCESS" "Found routes.js"

$fixEngine = Join-Path $RepoRoot "src\z3e_enterprise\zeusMobileFixEngine\runFixEngine.js"
if (!(Test-Path $fixEngine)) { Write-Log "ERROR" "Missing fix engine"; exit 1 }
Write-Log "SUCCESS" "Found Zeus Mobile Fix Engine"

$closeout = Join-Path $RepoRoot "docs\enterprise\ENTERPRISE_CLOSEOUT.md"
if (!(Test-Path $closeout)) { Write-Log "ERROR" "Missing ENTERPRISE_CLOSEOUT.md"; exit 1 }
Write-Log "SUCCESS" "Found ENTERPRISE_CLOSEOUT.md"

Write-Log "SUCCESS" "Smoke test passed (file presence + baseline structure). Next: run server and hit /curriculum/status."
