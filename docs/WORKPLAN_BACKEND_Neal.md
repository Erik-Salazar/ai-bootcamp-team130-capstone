# Work Plan — Backend

**Owner focus:** API server, validation engine, DB schema, canonicalization, import mapping
**Stack:** Node.js + TypeScript, Express, Prisma, PostgreSQL (see spec §7a)
**Companion docs:** `MAINTNOTARY_SPEC.md` (source of truth), `WORKPLAN_BLOCKCHAIN.md`, `WORKPLAN_FRONTEND.md`

> When this doc and `MAINTNOTARY_SPEC.md` disagree, the spec wins — raise the conflict in the weekly sync.

---

## 1. Scope summary

You own the API surface, the database, request validation, and canonical hashing. You are also the author of the canonical JSON schema and the shared hash test vectors — those used to belong to a dedicated integration/QA role, and now sit with you since you're the one implementing `canonicalize.ts`.

**No dedicated QA person exists anymore.** You write and own your own test cases for validation (V1–V8) and the API layer. Blockchain and Frontend do the same for their layers.

You do **not** own: the smart contract, the anchor worker, or any chain RPC calls (Blockchain); any UI (Frontend).

---

## 2. Files & modules you own

```
api/                          (Express + TypeScript)
├── src/
│   ├── routes/            ← POST/GET /records, /verify, /import, /records/:id/retry
│   ├── validation/        ← V1–V8 rules engine + your own test cases
│   └── db/                ← Prisma client wrapper, records/audit_log access
├── prisma/
│   └── schema.prisma      ← records + audit_log tables (§15)
├── package.json
shared/                        (imported by api/ AND worker/ — see spec §7a)
├── canonicalize.ts        ← the algorithm everyone else must match
└── test-vectors.json      ← you author and maintain this
```

---

## 3. Interface contracts

### You PUBLISH (Blockchain and Frontend depend on these)

| Contract | Consumers | Where defined | Notes |
|----------|-----------|---------------|-------|
| Canonical JSON schema + field defs | Blockchain, Frontend | Spec §8 | You draft Monday Week 1; all three ratify same day |
| `shared/test-vectors.json` | Blockchain (on-chain hash check), Frontend (verify-page display check) | Spec §14 | Skeleton Week 1 Fri, real hashes filled Week 2 |
| REST API request/response shapes, status codes, error codes | Frontend | Spec §9, §10 | Freeze shapes Week 1 Monday so Frontend can build against them without waiting |
| `records` / `audit_log` table shape | Blockchain (worker reads/writes the same table) | Spec §15 | Treat this as a real interface contract, not an implementation detail — don't change column names without telling Blockchain |
| `record_id`, `content_hash` semantics (SHA-256, `source` stripped) | Blockchain | Spec §8 | Blockchain's on-chain `recordId`/`contentHash` must derive from your exact algorithm |

### You CONSUME (you are blocked until these land)

| Contract | Provided by | Needed by | Mitigation while waiting |
|----------|-------------|-----------|---------------------------|
| `CONTRACT_ADDRESS` + ABI | Blockchain | Week 2 (for `GET /api/records/:id` explorer link, verify Flow B on-chain compare) | Not blocking for Week 1; stub `explorer_url` until deployed |
| Anchor status transitions (`tx_submitted`, `anchored`, `anchor_failed`) written to DB | Blockchain (worker writes these; you just read/serve them) | Week 2–3 | Your `GET` endpoints just reflect whatever status is in the table — no blocking dependency, but confirm the worker writes to your schema correctly |

---

## 4. Weekly checklist

### Week 1 — Foundation

- [ ] **Mon (all):** Draft and lock canonical schema (§8) + API contract (§9–10). Stack is already resolved (Node/TS/Express/Prisma, §7a) — no need to relitigate Q2/Q3.
- [ ] Scaffold `api/` (Express + TS) and the `shared/` package; set up Prisma with a local Postgres instance.
- [ ] Write the Prisma schema — `records` + `audit_log` models with indexed columns (`vin`, `service_type`, `odometer_miles`, `completed_at`) per §15. Publish to Blockchain since the worker touches this table too.
- [ ] Run `prisma migrate dev` to generate migrations.
- [ ] Implement `shared/canonicalize.ts`: strip `source`, reject unknown fields (strict), deep-sort keys, compact serialize, UTF-8, SHA-256 lowercase hex (§8 rules 1–6).
- [ ] Implement `POST /api/records`: auth (Bearer `FLEET_API_KEY`), validate, canonicalize, hash, persist as `pending_anchor`, return 201 body (§10).
- [ ] Implement validation engine V1–V8 (§9) with the `{ success:false, errors:[...] }` failure shape.
  - [ ] V2 VIN 17-char + ISO 3779 check-digit
  - [ ] V5 mileage monotonicity (query last anchored record for VIN)
  - [ ] V6 duplicate `record_id` (no anchored/pending)
- [ ] **Write your own validation test cases** — one passing + one failing case per rule (V1–V8). This used to be someone else's job; it's now yours.
- [ ] Seed your own DB test data for local development.
- [ ] Draft `shared/test-vectors.json` skeleton with the example vector (§14).
- [ ] Write `audit_log` entries for `submitted` / `validated` / `anchor_queued`.
- [ ] **Fri checkpoint:** valid record → `pending_anchor` in DB; invalid → 400 with error codes, verified against your own test cases.

### Week 2 — Hash contract + verify support

- [ ] **Thu:** Write the canonical hash algorithm doc (§8 rules 1–6) and fill real `expected_sha256` values into `test-vectors.json`.
- [ ] **Cross-check with Blockchain:** confirm their on-chain `recordId`/`contentHash` bytes32 values derive from the same hashes you compute. Any mismatch is a stop-the-line issue — resolve before continuing.
- [ ] Add a vector proving `manual` vs `import` of the same event produce an **identical** hash (proves `source` exclusion, §8/§20).
- [ ] Implement `GET /api/verify/:id` and `POST /api/verify` (Flow A hash-only + Flow B full check, §10). Flow B needs Blockchain's contract address once deployed — stub the on-chain compare until then.
- [ ] **Fri checkpoint:** submit → (Blockchain anchors) → verify returns `verified` once Blockchain's worker is live.

### Week 3 — Hardening

- [ ] **Mon–Tue:** Idempotency at your layer — DB unique constraint on `record_id`, API-level duplicate check (V6). Confirm with Blockchain that their contract-level `require` guard is in place too.
- [ ] Implement `GET /api/records` (filters `vin`, `status`, `limit`, `offset`) and `GET /api/records/:id` full detail body (§10) — Frontend needs both for dashboard/detail.
- [ ] **Wed:** Implement `POST /api/records/:id/retry` (auth; 409 if not `anchor_failed`; resets to `pending_anchor` + clears `retry_count`). Blockchain's worker is what actually retries the on-chain tx — you just flip the DB state.
- [ ] **Thu:** Run your own API/validation test suite end-to-end. Help seed the joint "10 demo records" — you create them in the DB; Blockchain anchors them on testnet.
- [ ] **Fri checkpoint:** full flow stable.

### Week 4 — Import + deploy + docs

- [ ] **Mon (with Frontend):** `POST /api/import` — map mock webhook payload → canonical fields, set `source:"import"`, then reuse `POST /records` flow (§10). Confirm hash of an `import` equals the `manual` equivalent.
- [ ] **Tue:** Confirm local run instructions work end-to-end (§24 — local demo only for v1, no staging deploy). Document `DATABASE_URL` and Prisma setup steps; coordinate env vars with Blockchain (`CONTRACT_ADDRESS`, RPC URLs) and Frontend (API base URL, CORS origin) so everyone's `.env` points at the same running instances.
- [ ] **Wed:** Write the Backend section of the README (local setup, API docs, DB schema) — this is a shared doc now, not a single owner's job.
- [ ] **Thu:** Bug buffer + demo rehearsal.

---

## 5. Definition of done (your slice)

- [ ] All of V1–V8 enforced; invalid records never persisted and never reach Blockchain's worker.
- [ ] Your own test cases cover every validation rule and pass.
- [ ] Your `content_hash` matches `shared/test-vectors.json` exactly, confirmed against Blockchain's on-chain values.
- [ ] All API endpoints in §10 return the exact documented shapes.
- [ ] Retry endpoint correctly gates on `anchor_failed` state and resets cleanly.
- [ ] API + DB run reliably from a documented local setup (§24).

---

## 6. Watch-outs

- **Hash drift is the #1 project risk.** Don't change canonicalization unilaterally — any change invalidates every prior anchor. Change = sync with Blockchain + re-run test vectors.
- **Never put PII on-chain** — only `record_id` hash + `content_hash` leave your layer toward Blockchain (§7 privacy rule).
- **`source` is excluded from the hash** — strip it in `canonicalize.ts`, not just in the route handler.
- **You no longer have someone writing test cases for you** — budget real time for this in Week 1, don't skip it under deadline pressure.
