# MaintNotary Lite

A thin trust layer for fleet maintenance records: validate a completed
maintenance record, cryptographically hash it, anchor the hash on a public
testnet (Base Sepolia), and provide a public verify page that proves the
record hasn't been altered since it was filed.

Full product/engineering spec: [`docs/MAINTNOTARY_SPEC.md`](docs/MAINTNOTARY_SPEC.md).

Owner workplans:

- Backend: [`docs/WORKPLAN_BACKEND_Neal.md`](docs/WORKPLAN_BACKEND_Neal.md)
- Blockchain: [`docs/WORKPLAN_BLOCKCHAIN_Erik.md`](docs/WORKPLAN_BLOCKCHAIN_Erik.md)
- Frontend: [`docs/WORKPLAN_FRONTEND.md`](docs/WORKPLAN_FRONTEND.md) / [`docs/WORKPLAN_FRONTEND_Chidambari.md`](docs/WORKPLAN_FRONTEND_Chidambari.md)

> **Status:** Frontend screens and Backend API (validate → persist → verify/import) are implemented. Anchor worker needs a deployed `CONTRACT_ADDRESS` + funded key — see Erik’s blockchain workplan.

## Repo layout

```
maintnotary/
├── api/          Backend  — Express + TypeScript + Prisma (Postgres)
├── worker/       Blockchain — anchor worker, viem chain client
├── contracts/    Blockchain — MaintNotary.sol, Hardhat tests/deploy
├── web/          Frontend — React + Vite
├── shared/       canonicalize.ts + test-vectors.json (api + worker)
├── docs/         Spec and owner workplans
└── package.json  npm workspaces root
```

## Prerequisites

- Node.js 20+ and npm 10+
- PostgreSQL 14+ on `localhost:5432` (see `scripts/postgres/` for local cluster start/stop helpers)
- Base Sepolia RPC + funded wallet — only needed for contract deploy / worker anchoring

## First-time setup

```bash
# from the repo root
npm install

cp api/.env.example api/.env
cp worker/.env.example worker/.env
cp contracts/.env.example contracts/.env
cp web/.env.example web/.env

npm run build:shared

# create schema (Backend owns migrations; worker uses the same DB)
cd api && npx prisma migrate dev && cd ..

# seed ~10 demo records (anchored / pending / failed samples)
npm run prisma:seed --workspace=api
```

### Environment coordination (keep these in sync)

| Concern | Backend `api/.env` | Frontend `web/.env` | Blockchain `worker/.env` |
|---------|--------------------|---------------------|---------------------------|
| API URL | `PORT=4000` | `VITE_API_BASE_URL=http://localhost:4000/api` | — |
| CORS / web origin | `CORS_ORIGIN=http://localhost:5173` | (Vite on 5173) | — |
| Verify links | `PUBLIC_WEB_BASE_URL=http://localhost:5173` | — | — |
| Write auth | `FLEET_API_KEY=dev-local-api-key` | `VITE_API_KEY=dev-local-api-key` (optional) | — |
| Database | `DATABASE_URL=postgresql://…/maintnotary` | — | **same** `DATABASE_URL` |
| Contract | `CONTRACT_ADDRESS` (after deploy) | — | **same** `CONTRACT_ADDRESS` |
| RPC | `RPC_URL` (verify Flow B) | — | `RPC_URL` (+ optional fallback) |
| Explorer | `EXPLORER_BASE_URL` | — | `EXPLORER_BASE_URL` |

## Running locally

```bash
# ensure Postgres is up first
npm run dev:api      # http://localhost:4000
npm run dev:web      # http://localhost:5173
npm run dev:worker   # polls pending_anchor rows (needs CONTRACT_ADDRESS + key)
```

Contracts:

```bash
cd contracts
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network baseSepolia
```

Put the deployed address into `CONTRACT_ADDRESS` in **both** `api/.env` and `worker/.env`, then restart API + worker.

## Backend

Stack: Express + TypeScript + Prisma + PostgreSQL. Shared hashing lives in `@maintnotary/shared`.

### Database

- Schema: `api/prisma/schema.prisma` (`records`, `audit_log`) — interface contract with the worker
- Migrate: `cd api && npx prisma migrate dev`
- Seed: `npm run prisma:seed --workspace=api`
- Helpers: `scripts/` (`Query-Postgres.ps1`, `e2e-api.ps1`, `postgres/start-postgres.ps1`)

### API surface (spec §10)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/health` | no | Liveness |
| `POST` | `/api/records` | Bearer | Validate → hash → `pending_anchor` |
| `GET` | `/api/records` | no | Filters: `vin`, `status`, `limit`, `offset` |
| `GET` | `/api/records/:id` | no | Full detail + explorer/verify URLs |
| `POST` | `/api/records/:id/retry` | Bearer | Only if `anchor_failed` → `pending_anchor` |
| `GET` | `/api/verify/:id` | no | Integrity: verified / not_found / not_anchored / mismatch |
| `POST` | `/api/verify` | no | Flow A hash-only or Flow B full check |
| `POST` | `/api/import` | Bearer | Mock FMS webhook → same submit path (`source: import`) |

Validation rules V1–V8: see spec §9. Canonical hash: `shared/test-vectors.json`.

### Example curl (PowerShell)

```powershell
$api = "http://localhost:4000"
$key = "dev-local-api-key"
$headers = @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" }

# Submit
$body = @{
  schema_version = "1.0"
  record_id = "wo-demo-curl-001"
  vin = "1FUJGHDV8CLBR1234"
  equipment_label = "Truck 104"
  service_type = "PM-A"
  completed_at = "2026-07-18T10:00:00Z"
  odometer_miles = 144000
  shop_name = "In-house shop"
  notes = "curl demo"
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$api/api/records" -Headers $headers -Body $body

# List
Invoke-RestMethod "$api/api/records?status=pending_anchor&limit=10"

# Detail / verify (use id from submit response)
Invoke-RestMethod "$api/api/records/<uuid>"
Invoke-RestMethod "$api/api/verify/<uuid>"
```

### Demo seed

`npm run prisma:seed --workspace=api` loads **10** records across statuses (`anchored`, `pending_anchor`, `tx_submitted`, `anchor_failed`) for VINs `1FUJGHDV8CLBR1234` and `1HGCM82633A004352`. Blockchain can run the worker against the pending rows once the contract is deployed.

## Tests

```bash
npm test                 # shared + api + web + contracts
npm run test:shared
npm run test:api
npm run test --workspace=web
npm run test:contracts
```

## Frontend (`web/`)

**Owner:** Chidambari — see [`docs/WORKPLAN_FRONTEND.md`](docs/WORKPLAN_FRONTEND.md).

### Screens

| Route | Page | API |
|-------|------|-----|
| `/` | Dashboard — records table, VIN/status filters, retry | `GET /api/records` |
| `/submit` | Manual record submission | `POST /api/records` |
| `/verify`, `/verify/:id` | Public integrity check (by ID or JSON) | `GET/POST /api/verify` |
| `/records/:id` | Record detail + anchor metadata | `GET /api/records/:id` |
| `/import` | Mock FMS webhook import | `POST /api/import` |

All fetch logic lives in `web/src/api-client.ts`.

### Run locally

```bash
npm install
cp web/.env.example web/.env
npm run dev:web          # http://localhost:5173
```

`web/.env`:

```
VITE_API_BASE_URL=http://localhost:4000/api
VITE_API_KEY=<fleet-api-key>    # required for POST endpoints
```

### Test & build

```bash
npm run test --workspace=web
npm run build --workspace=web
```

Client-side validation mirrors spec §9 (V1–V8). Without a running API, read-only screens show empty/error states; write actions surface API errors instead of mock success.

## Where things stand vs. the spec

- **Canonicalization** (`shared/canonicalize.ts`) is implemented per spec §8
  (strip `source`, deep-sort keys, SHA-256).
- **DB schema** (`api/prisma/schema.prisma`, mirrored in `worker/prisma/schema.prisma`)
  matches spec §15.
- **Smart contract** (`contracts/contracts/MaintNotary.sol`) matches spec §12,
  with passing Hardhat tests for the happy path, double-anchor guard, and
  `onlyOwner` guard.
- **Frontend** (`web/`) — all five UI screens built with Vitest tests (unit + smoke + shared test vectors).
- **API** (`api/`) — validation V1–V8, submit/list/detail/retry/verify/import implemented against Prisma.
- **Anchor worker** — needs deployed `CONTRACT_ADDRESS` + funded key to complete on-chain anchoring.

## License

Internal project — no license file added yet.
