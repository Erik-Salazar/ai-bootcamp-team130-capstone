<#
.SYNOPSIS
    Run SQL against the local MaintNotary PostgreSQL database.

.DESCRIPTION
    Uses psql from PostgreSQL 16. Defaults match api/.env
    (postgres / postgres @ localhost:5432 / maintnotary).

.PARAMETER Query
    SQL to execute (e.g. "SELECT * FROM records").

.PARAMETER File
    Path to a .sql file to execute instead of -Query.

.PARAMETER Database
    Database name (default: maintnotary).

.PARAMETER ListTables
    List tables (\dt) and exit.

.EXAMPLE
    .\scripts\Query-Postgres.ps1 -ListTables

.EXAMPLE
    .\scripts\Query-Postgres.ps1 -Query "SELECT record_id, status, odometer_miles FROM records;"

.EXAMPLE
    .\scripts\Query-Postgres.ps1 -File .\scripts\sample-queries.sql
#>
[CmdletBinding(DefaultParameterSetName = "Query")]
param(
    [Parameter(ParameterSetName = "Query", Position = 0)]
    [string] $Query,

    [Parameter(ParameterSetName = "File")]
    [string] $File,

    [Parameter(ParameterSetName = "ListTables")]
    [switch] $ListTables,

    [string] $Database = "maintnotary",
    [string] $HostName = "127.0.0.1",
    [int] $Port = 5432,
    [string] $User = "postgres",
    [string] $Password = "postgres",
    [string] $PsqlPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $PsqlPath)) {
    Write-Error "psql not found at '$PsqlPath'. Install PostgreSQL 16 or pass -PsqlPath."
}

if ($ListTables) {
    $Query = "\dt"
}
elseif ($PSCmdlet.ParameterSetName -eq "File") {
    if (-not $File -or -not (Test-Path $File)) {
        Write-Error "SQL file not found: $File"
    }
}
elseif ([string]::IsNullOrWhiteSpace($Query)) {
    Write-Host @"
Usage:
  .\scripts\Query-Postgres.ps1 -ListTables
  .\scripts\Query-Postgres.ps1 -Query "SELECT record_id, status FROM records;"
  .\scripts\Query-Postgres.ps1 -File .\scripts\sample-queries.sql

Default connection: ${User}@${HostName}:${Port}/${Database}
"@
    exit 1
}

$env:PGPASSWORD = $Password

$psqlArgs = @(
    "-U", $User,
    "-h", $HostName,
    "-p", "$Port",
    "-d", $Database,
    "--set=ON_ERROR_STOP=1"
)

if ($PSCmdlet.ParameterSetName -eq "File") {
    $psqlArgs += @("-f", (Resolve-Path $File).Path)
}
else {
    $psqlArgs += @("-c", $Query)
}

& $PsqlPath @psqlArgs
exit $LASTEXITCODE
