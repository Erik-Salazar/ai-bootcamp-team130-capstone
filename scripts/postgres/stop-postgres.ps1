# Stop the local MaintNotary Postgres cluster.
$ErrorActionPreference = "Stop"
$bin = "C:\Program Files\PostgreSQL\16\bin"
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
