# Start the local MaintNotary Postgres cluster (port 5432).
# Does not touch SQL Server (port 1433).
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
    Write-Error @"
Postgres data directory not found. Expected one of:
  $($candidates -join "`n  ")

Initialize a cluster first, for example:
  & `"$bin\initdb.exe`" -D `"$($candidates[0])`" -U postgres --auth-local=trust --auth-host=scram-sha-256
"@
}

$env:Path = "$bin;" + $env:Path
$status = & "$bin\pg_ctl.exe" -D $data status 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Postgres already running."
    Write-Host $status
    exit 0
}

Write-Host "Starting Postgres (data=$data)..."
& "$bin\pg_ctl.exe" -D $data -l (Join-Path $data "server.log") start
Write-Host "Started. Connection: postgresql://postgres:postgres@localhost:5432/maintnotary"
