# Work Plan — Blockchain

**Owner focus:** Smart contract, anchor worker, chain client, testnet/RPC integration
**Stack:** Solidity ^0.8.20 + Hardhat, Node.js + TypeScript worker, viem, Base Sepolia (see spec §7a)
**Companion docs:** `MAINTNOTARY_SPEC.md` (source of truth), `WORKPLAN_BACKEND.md`, `WORKPLAN_FRONTEND.md`

> When this doc and `MAINTNOTARY_SPEC.md` disagree, the spec wins — raise the conflict in the weekly sync.

---

## 1. Scope summary

You own everything that touches the chain: the contract itself, the worker that submits and confirms transactions, retries and crash-recovery, and the hash adapter that turns Backend's hex hashes into `bytes32`. This used to be bundled with backend API work — now it's your dedicated lane, which means you own its correctness end-to-end, including your own tests.

**No dedicated QA person exists anymore.** You write and own your own tests for the contract and worker (unit tests, crash-recovery simulation, testnet verification). Backend and Frontend do the same for their layers.

You do **not** own: the API server, DB schema, validation rules, or canonicalization algorithm (Backend, though you consume its output); any UI (Frontend).

---

## 2. Files & modules you own

```
contracts/                    (Solidity ^0.8.20 + Hardhat)
├── MaintNotary.sol
├── test/                  ← your Hardhat unit tests
└── scripts/deploy.ts
worker/                        (Node.js + TypeScript, viem)
├── src/
│   ├── anchor.ts          ← poll/submit/confirm loop, retries, crash-recovery
│   └── chain-client.ts    ← viem client + hash→bytes32 adapter
└── package.json
```

`worker/` is its own top-level package (Appendix A) — it's your code end to end, not nested inside Backend's `api/` tree. It imports `shared/canonicalize.ts` output (Backend's hex hashes) and uses `Prisma`'s generated client (or a thin raw-SQL reader, your call) to read/write the same `records` table Backend's schema defines.

---

## 3. Interface contracts

### You PUBLISH (Backend and Frontend depend on these)

| Contract | Consumers | Where defined | Notes |
|----------|-----------|---------------|-------|
| Deployed `CONTRACT_ADDRESS` + ABI | Backend (verify Flow B on-chain compare), Frontend (explorer links) | Spec §12 | Publish immediately after Week 2 Mon testnet deploy |
| Record status vocabulary written by the worker (`tx_submitted`, `anchored`, `anchor_failed`) | Backend (serves it), Frontend (renders it) | Spec §11 | You write these statuses into the `records` table Backend owns the schema for |
| `tx_hash`, `anchored_at`, `retry_count` columns you populate | Backend, Frontend | Spec §15 | You write; they read |

### You CONSUME (you are blocked until these land)

| Contract | Provided by | Needed by | Mitigation while waiting |
|----------|-------------|-----------|---------------------------|
| Canonical JSON schema + `record_id`/`content_hash` semantics | Backend | Week 1 Mon | Needed to know what to hash into `bytes32` |
| `records` table schema (`pending_anchor` queue, columns to update) | Backend | Week 1 | Build against §15 spec directly; confirm with Backend once migrations land |
| `shared/test-vectors.json` real hash values | Backend | Week 2 Thu | Use Week 1 skeleton + your own local vectors to start; reconcile once Backend fills real values |

---

## 4. Weekly checklist

### Week 1 — Contract foundation (no live wiring yet)

- [ ] **Mon (all):** Confirm canonical schema (§8) and hash semantics with Backend. Stack is already resolved (Base Sepolia, Hardhat, viem, §7a) — no need to relitigate Q1.
- [ ] Scaffold `contracts/` with Hardhat and `worker/` as its own Node/TS package.
- [ ] Write `MaintNotary.sol` (§12) with `onlyOwner` modifier on `anchor()` and `require(hashes[recordId] == 0)` guard against re-anchoring.
- [ ] Write contract unit tests in Hardhat (local network): happy path anchor, duplicate-anchor rejection, non-owner rejection.
- [ ] Implement the hash adapter in `chain-client.ts` using viem: `hexToBytes32()` and `recordId = SHA-256(record_id string)` → bytes32 (§12). Import Backend's `shared/canonicalize.ts` output as soon as it exists and validate against it.
- [ ] Dry-run the Hardhat deploy script against a local node, then Base Sepolia testnet.
- [ ] **Fri checkpoint:** contract passes your local test suite; deploy script works end-to-end locally.

### Week 2 — Live deploy + anchor worker

- [ ] **Mon:** Deploy `MaintNotary.sol` to Base Sepolia via Hardhat. Publish `CONTRACT_ADDRESS` + ABI to Backend and Frontend immediately.
- [ ] **Tue–Wed:** Build the anchor worker (`worker/src/anchor.ts`) using viem for all chain calls:
  - [ ] Poll `pending_anchor` records every `ANCHOR_POLL_INTERVAL_MS`
  - [ ] Submit tx → set `tx_submitted` + `tx_submitted_at` + `tx_hash`
  - [ ] Wait `ANCHOR_CONFIRMATIONS` (2) blocks → set `anchored` + `anchored_at`
  - [ ] Write `audit_log` entries for each transition
- [ ] **Thu:** Cross-check your on-chain hash values against Backend's `shared/test-vectors.json` — this is the anti-drift contract for the whole project. Any mismatch, stop and resolve with Backend before moving on.
- [ ] Write worker tests: successful anchor, failed tx, RPC timeout.
- [ ] **Fri checkpoint:** submit → anchor → verify (via Backend's endpoint) shows green.

### Week 3 — Hardening

- [ ] **Mon–Tue:** Confirm contract-level idempotency: `require(hashes[recordId] == 0)` correctly blocks re-anchoring. Coordinate with Backend on their DB-level uniqueness check so both layers agree.
- [ ] **Wed:** Implement retry logic in the worker — increment `retry_count`, move to `anchor_failed` after `ANCHOR_MAX_RETRIES` (3). Pick up records that Backend's retry endpoint resets to `pending_anchor`.
- [ ] Implement crash-recovery scan on worker startup: for `tx_submitted` older than 10 minutes, query the contract by `record_id` hash → `anchored` (fill `tx_hash` from event log) or reset to `pending_anchor` (§11).
- [ ] Add `RPC_URL_FALLBACK` handling on primary RPC failure.
- [ ] Write a crash-recovery test: kill the worker mid-flight (simulated), restart, confirm it resolves the stuck record correctly.
- [ ] **Thu:** Run your own contract/worker test suite. Help seed the joint "10 demo records" — you anchor on testnet what Backend has seeded in the DB.
- [ ] **Fri checkpoint:** full flow stable; 10 records anchored with working explorer links.

### Week 4 — Deploy + docs

- [ ] Support Backend + Frontend on the `POST /api/import` flow if it touches chain behavior (it shouldn't — imports just enter the same `pending_anchor` queue).
- [ ] **Tue:** Confirm the contract stays live on Base Sepolia for the demo; run the worker as its own local process alongside the API (§24 — local demo only for v1, no staging deploy needed). Provide `.env.example` entries for `ANCHOR_PRIVATE_KEY`, `CONTRACT_ADDRESS`, `RPC_URL`, `RPC_URL_FALLBACK`, `CHAIN_ID`, `EXPLORER_BASE_URL`, `ANCHOR_CONFIRMATIONS`, `ANCHOR_MAX_RETRIES`, `ANCHOR_POLL_INTERVAL_MS` (§16).
- [ ] Verify the anchor wallet has sufficient testnet funds for the demo; document the faucet link.
- [ ] **Wed:** Write the Blockchain section of the README (contract, worker, deploy steps, faucet instructions) — shared doc, your section.
- [ ] **Thu:** Bug buffer + demo rehearsal.

---

## 5. Definition of done (your slice)

- [ ] Contract deployed with `onlyOwner`; address + ABI published to Backend and Frontend.
- [ ] Valid record anchors within 2 minutes end-to-end.
- [ ] Your on-chain hash values match `shared/test-vectors.json` exactly.
- [ ] Worker survives a mid-flight restart (crash-recovery verified by your own test).
- [ ] `anchor_failed` reachable and recoverable once Backend's retry endpoint resets a record.
- [ ] Contract-level idempotency (`require`) confirmed working alongside Backend's DB-level constraint.
- [ ] Anchor wallet funded and monitored for the demo.

---

## 6. Watch-outs

- **Hash drift is the #1 project risk.** You don't own the algorithm, but you must independently verify your bytes32 conversion matches Backend's output — don't just trust it, test it against `test-vectors.json` yourself.
- **Never mark `anchored` on tx submission alone** — wait for 2 confirmations.
- **Never store PII on-chain** — only hashes and opaque IDs ever leave for the contract (§7 privacy rule). If a field looks like real content, it doesn't belong in your `anchor()` call.
- **You share a database table with Backend** (`records`) — don't change columns or add new ones without telling them; treat §15 as a contract, not just documentation.
- **You no longer have someone writing test cases for you** — budget real time in Week 1 for contract tests and Week 3 for crash-recovery tests.
