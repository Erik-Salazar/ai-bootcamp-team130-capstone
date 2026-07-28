# Stop the local MaintNotary Postgres cluster.
$ErrorActionPreference = "Stop"
$pgVersions = @("17", "18", "16")
$bin = $null
foreach ($ver in $pgVersions) {
  $candidate = "C:\Program Files\PostgreSQL\$ver\bin"
  if (Test-Path $candidate) {
    $bin = $candidate
    break
  }
}
if (-not $bin) {
  Write-Error "PostgreSQL bin not found. Install PostgreSQL 16+ or set `$bin in this script."
}
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

$candidates = @(
    (Join-Path $repoRoot ".local\postgres-data"),
    (Join-Path $repoRoot ".cursor\PostgresSetup\data"),
    (Join-Path $PSScriptRoot "data")
)
$data = $candidates | Where-Object { Test-Path (Join-Path $_ "PG_VERSION") } | Select-Object -First 1
if (-not $data) {
    Write-Error "Postgres data directory not found under .local/, .cursor/PostgresSetup/, or scripts/postgres/data."
}

$env:Path = "$bin;" + $env:Path
& "$bin\pg_ctl.exe" -D $data stop -m fast
Write-Host "Postgres stopped (data=$data)."
