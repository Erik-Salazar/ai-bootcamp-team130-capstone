# MaintNotary Lite

A thin trust layer for fleet maintenance records: validate a completed
maintenance record, cryptographically hash it, anchor the hash on a public
testnet (Base Sepolia), and provide a public verify page that proves the
record hasn't been altered since it was filed.

Full product/engineering spec: [`docs/MAINTNOTARY_SPEC.md`](docs/MAINTNOTARY_SPEC.md).

Work plans: [`docs/WORKPLAN_FRONTEND.md`](docs/WORKPLAN_FRONTEND.md) (and Backend/Blockchain plans from Erik).

> **Status:** Frontend screens are implemented in `web/` (Submit, Dashboard, Verify, Record Detail, Import). API routes and the anchor worker are still being integrated by Neal and Erik — see each package's `TODO(...)` comments.

## Repo layout

```
maintnotary/
├── api/          Backend  — Express + TypeScript + Prisma (Postgres)
├── worker/       Blockchain — anchor worker, viem chain client
├── contracts/    Blockchain — MaintNotary.sol, Hardhat tests/deploy
├── web/          Frontend — React + Vite
├── shared/       canonicalize.ts + test-vectors.json (imported by api/ and worker/)
├── docs/         Spec and other shared docs
└── package.json  npm workspaces root
```

This mirrors Appendix A of the spec. One person owns each of `api/`,
`worker` + `contracts/`, and `web/` (Backend, Blockchain, Frontend
respectively) — see spec §5.

## Prerequisites

- Node.js 20+ and npm 10+
- PostgreSQL 14+ running locally (or via Docker)
- A Base Sepolia RPC URL and a funded testnet wallet private key (only
  needed once you get to contract deployment / anchoring — not required to
  run the API or web app locally against a stub worker)

## First-time setup

```bash
# from the repo root
npm install          # installs and links all workspaces

# copy env files and fill in real values
cp api/.env.example api/.env
cp worker/.env.example worker/.env
cp contracts/.env.example contracts/.env
cp web/.env.example web/.env

# build the shared package (api/ and worker/ import it)
npm run build:shared

# create the database schema
cd api && npx prisma migrate dev --name init && cd ..
```

## Running each layer locally

```bash
npm run dev:api      # API server on http://localhost:4000
npm run dev:web      # React app on http://localhost:5173
npm run dev:worker   # Anchor worker (polls the DB)
```

Contracts (Hardhat) are compiled/tested/deployed separately:

```bash
cd contracts
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network baseSepolia   # needs a funded wallet
```

After deploying, put the resulting contract address into
`CONTRACT_ADDRESS` in both `api/.env` and `worker/.env`.

## Tests

```bash
npm run test:shared      # canonicalization/hash unit tests
npm run test:api         # API unit tests (once written)
npm run test:contracts   # Hardhat contract tests
npm run test --workspace=web   # Frontend Vitest (unit + smoke)
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
- **Frontend** (`web/`) — all five UI screens built with Vitest tests; awaits live API + chain for full integration.
- **API routes, validation rules (V1-V8), anchor worker polling loop** are stubbed
  with `TODO(...)` comments — Neal (API) and Erik (worker/chain) own these.

## License

Internal project — no license file added yet.
