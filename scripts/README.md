# MaintNotary helper scripts

Team-shared PowerShell helpers (Windows). Do **not** put local Postgres data or secrets here — data stays gitignored under `.local/` or `.cursor/PostgresSetup/data`.

| Script | Purpose |
|--------|---------|
| `postgres/start-postgres.ps1` | Start local PostgreSQL 16 cluster on port 5432 |
| `postgres/stop-postgres.ps1` | Stop that cluster |
| `Query-Postgres.ps1` | Run SQL via `psql` against `maintnotary` |
| `sample-queries.sql` | Example SELECT statements |
| `e2e-api.ps1` | API + import + verify smoke test (API on :4000, web on :5173) |

## Examples

```powershell
# from repo root
.\scripts\postgres\start-postgres.ps1
.\scripts\Query-Postgres.ps1 -ListTables
.\scripts\Query-Postgres.ps1 -File .\scripts\sample-queries.sql
.\scripts\e2e-api.ps1
.\scripts\postgres\stop-postgres.ps1
```

Postgres data directory resolution (first match with `PG_VERSION`):

1. `.local/postgres-data` (preferred for new setups)
2. `.cursor/PostgresSetup/data` (existing local clusters)
3. `scripts/postgres/data`
