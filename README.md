# MaintNotary Lite

A thin trust layer for fleet maintenance records: validate a completed
maintenance record, cryptographically hash it, anchor the hash on a public
testnet (Base Sepolia), and provide a public verify page that proves the
record hasn't been altered since it was filed.

Full product/engineering spec: [`docs/MAINTNOTARY_SPEC.md`](docs/MAINTNOTARY_SPEC.md).

> **Status:** baseline scaffold only. This repo sets up the monorepo
> structure, tooling, shared types, DB schema, contract, and route/page
> stubs described in the spec — it is a starting point for the team, not a
> working implementation. See the `TODO(...)` comments throughout for what's
> left to build, and the spec's `WORKPLAN_BACKEND.md` / `WORKPLAN_BLOCKCHAIN.md`
> / `WORKPLAN_FRONTEND.md` references for per-owner task breakdowns (not yet
> created — add them when the team kicks off).

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
```

## Where things stand vs. the spec

- **Canonicalization** (`shared/canonicalize.ts`) is implemented per spec §8
  (strip `source`, deep-sort keys, SHA-256).
- **DB schema** (`api/prisma/schema.prisma`, mirrored in `worker/prisma/schema.prisma`)
  matches spec §15.
- **Smart contract** (`contracts/contracts/MaintNotary.sol`) matches spec §12,
  with passing Hardhat tests for the happy path, double-anchor guard, and
  `onlyOwner` guard.
- **API routes, validation rules (V1-V8), anchor worker polling loop, and all
  UI screens** are stubbed with `TODO(...)` comments pointing at the relevant
  spec section — these are the actual Week 1-4 deliverables per §6.

## License

Internal project — no license file added yet.
