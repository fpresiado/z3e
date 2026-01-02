# z3e_mobile_fix_engine.ps1
param(
  [Parameter(Mandatory=$true)][string]$RepoPath
)

$ErrorActionPreference = "Stop"
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

Write-Log "INFO" "Zeus Mobile Fix Engine starting. RepoPath=$RepoPath"

$mobileRoot = Join-Path $RepoPath "V1"
if (!(Test-Path (Join-Path $mobileRoot "package.json"))) {
  if (Test-Path (Join-Path $RepoPath "package.json")) {
    $mobileRoot = $RepoPath
  } else {
    Write-Log "ERROR" "No package.json found at RepoPath or RepoPath\\V1"
    exit 1
  }
}

Write-Log "INFO" "Detected mobile root: $mobileRoot"

# Steps (document-first; you can switch to full execution once stable)
$plan = @(
  @{ step="install"; cmd="npm install" },
  @{ step="prebuild"; cmd="npx expo prebuild --platform android" },
  @{ step="run_android"; cmd="npx expo run:android" }
)

$docsDir = Join-Path $mobileRoot "docs\AGENT_LOG"
New-Item -ItemType Directory -Force -Path $docsDir | Out-Null

$report = Join-Path $mobileRoot "Z3E_ZEUS_MOBILE_REPAIR_REPORT.md"
"## Fix Engine Plan`n" | Out-File -FilePath $report -Encoding utf8
$plan | ForEach-Object {
  "- **$($_.step)**: `$($_.cmd)`" | Out-File -FilePath $report -Append -Encoding utf8
}

Write-Log "SUCCESS" "Plan written: $report"
Write-Log "INFO" "Next: run each command inside $mobileRoot, paste outputs into docs/AGENT_LOG/"
