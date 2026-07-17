# MaintNotary Lite — Product & Engineering Spec

**Version:** 1.3  
**Timeline:** 4 weeks  
**Team size:** 3  
**Status:** Tech stack resolved — see changelog at bottom

---

## 1. Executive Summary

**MaintNotary Lite** is a thin trust layer for fleet maintenance records. It does not replace systems like TMT Fleet Maintenance. Instead, it accepts a completed maintenance record, validates it, cryptographically signs it, anchors a hash on a public testnet blockchain, and provides a public verification page that proves the record has not been altered since it was filed.

**One-line pitch:**  
*Prove a maintenance record hasn't been tampered with since it was submitted — without replacing your existing fleet software.*

**Demo outcome (week 4):** A locally-run app (see §24 — public deploy is a stretch goal, not required for v1) where the team can submit a work order, see it rejected if invalid, watch it anchor on-chain, and verify integrity via a receipt link.

---

## 2. Problem Statement

Fleet maintenance data lives in siloed systems. When disputes arise (DOT audits, warranty claims, used-vehicle sales, insurance), parties struggle to prove:

1. What record existed at a point in time
2. Whether that record was changed after the fact

Spreadsheets, PDFs, and editable database rows are easy to alter. Blockchain anchoring provides **tamper-evidence**, not automatic truth — but that alone is valuable when combined with validation rules and a trusted submitter.

---

## 3. Goals & Non-Goals

### Goals (in scope)

| # | Goal |
|---|------|
| G1 | Accept maintenance records via web form and mock JSON import (simulating FMS webhooks) |
| G2 | Validate records before anchoring (schema, VIN, dates, mileage monotonicity) |
| G3 | Anchor record hash on a testnet (Base Sepolia or Polygon Amoy) |
| G4 | Provide a public verify page (integrity check: match / no match) |
| G5 | Dashboard listing all records with status and explorer links |
| G6 | Document canonical hashing so verification is reproducible |

### Non-Goals (explicitly out of scope for v1)

| # | Non-goal |
|---|----------|
| NG1 | Live integration with TMT APIs |
| NG2 | Telematics odometer cross-check |
| NG3 | Multi-party attestation (shop + fleet co-signing) |
| NG4 | Mobile native app |
| NG5 | Mainnet deployment or production key management (HSM/KMS) |
| NG6 | Full amendment/supersede workflow (manual void + resubmit is acceptable) |
| NG7 | Storing full PII on-chain |

---

## 4. Users & Use Cases

### Primary user (MVP)

**Fleet administrator** — submits completed maintenance records and shares verification links with auditors, insurers, or buyers.

### Secondary user (MVP)

**Verifier** — anyone with a receipt URL or record JSON who needs to confirm integrity (no login required).

### Use cases

| ID | Use case | Acceptance |
|----|----------|------------|
| UC1 | Submit valid PM record | Record saved, anchored within 2 min, receipt URL returned |
| UC2 | Submit invalid record (bad VIN, future date, mileage rollback) | Rejected with clear error; never anchored |
| UC3 | Verify anchored record | Page shows "Integrity verified" + anchor date + explorer link |
| UC4 | Verify tampered record | Page shows "No match — record was altered" |
| UC5 | Import mock webhook JSON | Same flow as manual submit after normalization |
| UC6 | Browse dashboard | All records visible with filter by VIN and status |

---

## 5. Team Structure (3 people)

One dedicated owner per layer — **Backend**, **Blockchain**, **Frontend**. There is no separate integration/QA role: each owner is responsible for testing, seeding, and validating their own layer, and for integrating cleanly with the other two.

> **Detailed per-person work plans:** `WORKPLAN_BACKEND.md`, `WORKPLAN_BLOCKCHAIN.md`, `WORKPLAN_FRONTEND.md` — each has owned files, interface contracts (published vs consumed), a week-by-week task checklist, a self-QA checklist, and a definition of done.

| Role | Owner focus | Primary deliverables | Owns QA/integration for |
|------|-------------|---------------------|--------------------------|
| **Backend** | API, validation engine, DB schema, canonicalization, import mapping | `/api/records`, `/api/import`, validation engine, `canonicalize.ts`, DB migrations | Validation test cases (V1–V8), API-level tests, canonical hash test vectors |
| **Blockchain** | Smart contract, anchor worker, chain client, RPC/testnet integration | `MaintNotary.sol`, deploy scripts, `worker/anchor.ts`, hash→bytes32 adapter | Contract tests, worker/crash-recovery tests, testnet anchoring verification |
| **Frontend** | Submit form, dashboard, verify page, record detail, import UI, error UX | All UI screens, `api-client.ts`, demo polish | UI/E2E flow tests against the live API, verify-page correctness |

### Cross-cutting artifacts (owned by one, consumed by others)

| Artifact | Owner | Consumers | Notes |
|----------|-------|-----------|-------|
| Canonical JSON schema (§8) | Backend (drafts + implements) | Blockchain, Frontend (ratify Mon) | Backend is the sole author now — implementer and spec-owner are the same person, so drift risk is lower |
| `shared/test-vectors.json` (§14) | Backend | Blockchain (validates on-chain hash matches), Frontend (validates verify-page display) | Backend publishes; each consumer runs it against their own layer as part of their own QA |
| Deployment (staging/prod) | Each owner deploys their own piece | All | Backend deploys API+DB, Blockchain deploys the contract + worker, Frontend deploys the web app; coordinate env vars in sync |
| README / architecture doc / demo script | Shared, assembled Week 4 | All | Each person writes the section for their own layer; no single doc owner |
| Demo seed data (10 records) | Backend seeds DB + Blockchain anchors them on testnet | Frontend (demos with them) | Joint Week 3 task |

### Shared responsibilities

- Weekly sync (30 min): blockers, API contract changes, demo readiness
- Each owner writes their own test cases/self-QA — no handoff of "write my tests for me"
- Backend and Blockchain must independently confirm their hash output matches `test-vectors.json` — treat any mismatch as a stop-the-line issue
- All three: week 4 demo rehearsal

---

## 6. Timeline (4 weeks)

### Week 1 — Foundation (contract work starts in parallel, no wiring yet)

| Day | Milestone | Owner |
|-----|-----------|-------|
| Mon | Kickoff; finalize schema + API contract (section 8–9) | All |
| Tue–Wed | DB schema + POST `/api/records` + validation v1 + own test cases | Backend |
| Tue–Wed | Submit form (static, wired to API) | Frontend |
| Tue–Wed | Write + unit-test `MaintNotary.sol`; local testnet deploy dry run | Blockchain |
| Thu | Backend seeds own DB test data; Blockchain seeds local contract test cases | Backend + Blockchain |
| Fri | **Checkpoint:** Valid record → `pending_anchor` in DB; invalid → 400 with errors | All |

### Week 2 — Blockchain + Verify

| Day | Milestone | Owner |
|-----|-----------|-------|
| Mon | Deploy hash-store contract to public testnet; publish address + ABI | Blockchain |
| Tue–Wed | Anchor worker (pending → on-chain → `anchored`) + own worker tests | Blockchain |
| Tue–Wed | Verify page (by record ID + JSON upload) | Frontend |
| Thu | Backend publishes canonical hash algorithm doc + `test-vectors.json`; Blockchain runs cross-check against it | Backend + Blockchain |
| Fri | **Checkpoint:** Submit → anchor → verify shows green check | All |

### Week 3 — Dashboard + Hardening

| Day | Milestone | Owner |
|-----|-----------|-------|
| Mon–Tue | Dashboard (list, filters, detail view) | Frontend |
| Mon–Tue | Idempotency: DB unique constraint + API check | Backend |
| Mon–Tue | Idempotency: contract-level `require` guard | Blockchain |
| Wed | Record detail with explorer link + integrity section | Frontend |
| Wed | Retry endpoint (`POST /api/records/:id/retry`) | Backend |
| Wed | Retry logic in anchor worker + crash-recovery scan | Blockchain |
| Thu | Each owner runs their own test suite (API/validation, contract/worker, UI/E2E); jointly seed 10 demo records anchored on testnet | All |
| Fri | **Checkpoint:** Full flow stable; 10 seeded records with explorer links | All |

### Week 4 — Polish + Demo

| Day | Milestone | Owner |
|-----|-----------|-------|
| Mon | Mock JSON import endpoint + UI | Backend + Frontend |
| Tue | Confirm each layer runs end-to-end from a documented local setup (API+DB, contract+worker, web app) — see §24 | All |
| Wed | README, architecture diagram, API docs — each writes their own section | All |
| Thu | Bug buffer + demo script rehearsal | All |
| Fri | **Delivery:** Live demo + handoff doc | All |

---

## 7. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  Submit Form │ Dashboard │ Verify Page │ JSON Import        │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│                     API Server (Node/Express)                  │
│  POST /records │ GET /records │ GET /verify/:id │ POST /import│
│  Validation │ Canonicalize │ Sign │ Queue anchor job         │
└──────────────┬─────────────────────────────┬────────────────┘
               │                             │
       ┌───────▼───────┐             ┌───────▼───────┐
       │   PostgreSQL   │             │ Anchor Worker │
       │ records, audit │             │ (polls pending)│
       └───────────────┘             └───────┬───────┘
                                             │
                                     ┌───────▼───────┐
                                     │ Testnet (L2)  │
                                     │ Base Sepolia  │
                                     └───────────────┘
```

### Components

| Component | Responsibility | Owner |
|-----------|----------------|-------|
| **API Server** | Auth, validation, persistence, enqueue anchor | Backend |
| **PostgreSQL** | Full records, anchor metadata, audit log | Backend |
| **Anchor Worker** | Poll `pending_anchor` records, submit tx, update status | Blockchain |
| **Smart Contract** | `store(bytes32 recordId, bytes32 hash, uint256 timestamp)` | Blockchain |
| **Frontend** | User-facing submit, browse, verify | Frontend |

> The Anchor Worker lives in its own `worker/` package (Appendix A) but reads/writes the same `records` table Backend owns the schema for — it's a shared DB, not a shared codebase. Treat the `records`/`audit_log` table shape (§15) as an interface contract between Backend and Blockchain.

### On-chain vs off-chain

| Stored on-chain | Stored off-chain (DB) |
|-----------------|----------------------|
| `record_id` (bytes32 hash of ID string) | Full canonical JSON |
| Content hash (SHA-256 of canonical JSON) | Validation result |
| Anchor timestamp | Signer identity |
| | Transaction hash, block number |
| | Source (`manual`, `import`) |

**Privacy rule:** Never store VIN, shop name, or notes on-chain in v1. Only hashes and opaque IDs.

### 7a. Tech Stack (resolved — see §22)

Everything runs in **TypeScript** end to end. This is the deciding factor for the whole stack, not framework preference: `canonicalize.ts` (Backend) must produce byte-identical hashes to what Blockchain's worker anchors and what Frontend displays as verified/mismatched. One language means `canonicalize.ts` can be a literal shared file instead of three independent reimplementations of the same spec (§8) — directly mitigating the hash-drift risk in §20.

| Layer | Choice | Owner | Notes |
|-------|--------|-------|-------|
| Backend runtime | Node.js + TypeScript | Backend | |
| API framework | Express | Backend | Matches the §7 architecture diagram; swap for Fastify if preferred, no spec impact |
| Database | PostgreSQL | Backend | Already specified in §15 |
| DB access layer | Prisma | Backend | Migrations + type-safe client; Blockchain's worker uses the same generated client to read/write `records` (§15 is the shared contract) |
| Contract language | Solidity ^0.8.20 | Blockchain | Already specified in §12 |
| Contract dev/test framework | Hardhat | Blockchain | TS-native, keeps contract tests in the same toolchain as the worker |
| Chain client (worker → RPC) | viem | Blockchain | No wallet-connect UI needed — the worker holds `ANCHOR_PRIVATE_KEY` server-side (§16) |
| Testnet | Base Sepolia | Blockchain | Chain ID `84532`; explorer `sepolia.basescan.org` (already used in §12, §16, §23 examples) |
| Frontend framework | React + Vite | Frontend | A departure from the existing vanilla `lab2` load-board style, justified by 5 screens with live API state; `api-client.ts` stays framework-agnostic |
| Hosting | **Local demo only** (v1) | All | See §24 for what this changes vs the original "public URL" framing |

### Shared code

`canonicalize.ts` should live in a `shared/` package (see Appendix A) importable by both `api/` (Backend) and the worker (Blockchain), not copy-pasted. Frontend does not need it — verification hashing is always server-side (§10).

---

## 8. Canonical Record Schema

All records must normalize to this JSON before hashing.

```json
{
  "schema_version": "1.0",
  "record_id": "wo-2026-0042",
  "vin": "1FUJGHDV8CLBR1234",
  "equipment_label": "Truck 104",
  "service_type": "PM-A",
  "completed_at": "2026-07-08T14:22:00Z",
  "odometer_miles": 142318,
  "shop_name": "In-house shop",
  "notes": "Oil, filters, brake inspection",
  "source": "manual"
}
```

### Field definitions

| Field | Type | Required | Editable after submit | Notes |
|-------|------|----------|----------------------|-------|
| `schema_version` | string | Yes | No | Always `"1.0"` for v1 |
| `record_id` | string | Yes | No | Unique per fleet; e.g. work order number |
| `vin` | string | Yes | No | 17-character VIN |
| `equipment_label` | string | No | No | Human-readable label (truck/trailer name) |
| `service_type` | string | Yes | No | e.g. `PM-A`, `PM-B`, `Brake Service`, `DOT Annual` |
| `completed_at` | ISO 8601 UTC | Yes | No | When work was completed |
| `odometer_miles` | integer | Yes | No | Whole miles |
| `shop_name` | string | Yes | No | Shop or "In-house" |
| `notes` | string | No | No | Free text summary |
| `source` | string | Yes | No | `manual` or `import` |

### Fields excluded from the canonical hash

The `source` field is server-set metadata, not attested content. It is stored in the DB but **excluded from the JSON that gets hashed**. This means the hash of a `manual` and an `import` of the same record is identical — which is the correct behavior (the maintenance event itself doesn't change based on how it was submitted).

### Canonicalization rules (for hashing)

1. Take the full record object and **remove** the `source` field before hashing
2. Parse the remaining fields; reject unknown fields in strict mode
3. Sort object keys alphabetically at every level (deep sort)
4. Serialize with no extra whitespace, no trailing newline
5. UTF-8 encode the resulting string
6. Apply **SHA-256** — output as lowercase 64-character hex string

**Hash algorithm is SHA-256 everywhere** (off-chain and on-chain storage). Do not use keccak256 for content hashes. The `recordId` passed to the contract is also `SHA-256(UTF-8(record_id string))` truncated/padded to 32 bytes — not keccak256. See section 12 for exact adapter code.

**Backend and Blockchain must implement the same algorithm.** Backend owns the shared test vector file (see section 14); Blockchain validates their on-chain hash against it as part of their own QA.

---

## 9. Validation Rules

Records that fail validation are **rejected** and **never anchored**.

| Rule ID | Rule | Error code |
|---------|------|------------|
| V1 | All required fields present | `MISSING_FIELD` |
| V2 | VIN is 17 characters and passes check-digit validation | `INVALID_VIN` |
| V3 | `completed_at` is not in the future | `FUTURE_DATE` |
| V4 | `odometer_miles` is a positive integer < 2,000,000 | `INVALID_ODOMETER` |
| V5 | `odometer_miles` >= last anchored record for same VIN | `MILEAGE_ROLLBACK` |
| V6 | `record_id` is unique (no duplicate anchored or pending) | `DUPLICATE_RECORD` |
| V7 | `service_type` is non-empty, max 64 chars | `INVALID_SERVICE` |
| V8 | `schema_version` === `"1.0"` | `UNSUPPORTED_SCHEMA` |

### Response format (validation failure)

```json
{
  "success": false,
  "errors": [
    { "code": "MILEAGE_ROLLBACK", "field": "odometer_miles", "message": "Odometer 140000 is below last recorded 142318 for this VIN." }
  ]
}
```

---

## 10. API Specification

Base URL: `http://localhost:<port>/api` for v1 (local demo, see §24); `https://<deployed-host>/api` if the public-deploy stretch goal is picked up  
Auth (MVP): `Authorization: Bearer <FLEET_API_KEY>` on write endpoints. Verify endpoint is public.

### `POST /api/records`

Submit a new maintenance record.

**Request body:** Canonical record fields (without `source`; server sets `source: "manual"`).

**Success (201):**

```json
{
  "success": true,
  "id": "uuid-internal",
  "record_id": "wo-2026-0042",
  "status": "pending_anchor",
  "verify_url": "https://<host>/verify/uuid-internal"
}
```

### `GET /api/records`

List records. Query params: `vin`, `status`, `limit`, `offset`.

**Response (200):**

```json
{
  "records": [
    {
      "id": "uuid",
      "record_id": "wo-2026-0042",
      "vin": "1FUJGHDV8CLBR1234",
      "service_type": "PM-A",
      "completed_at": "2026-07-08T14:22:00Z",
      "odometer_miles": 142318,
      "status": "anchored",
      "tx_hash": "0x...",
      "anchored_at": "2026-07-08T14:25:00Z",
      "verify_url": "https://<host>/verify/uuid"
    }
  ],
  "total": 1
}
```

### `GET /api/records/:id`

Full record detail including canonical JSON and anchor metadata.

**Response (200):**

```json
{
  "id": "uuid-internal",
  "record_id": "wo-2026-0042",
  "vin": "1FUJGHDV8CLBR1234",
  "equipment_label": "Truck 104",
  "service_type": "PM-A",
  "completed_at": "2026-07-08T14:22:00Z",
  "odometer_miles": 142318,
  "shop_name": "In-house shop",
  "notes": "Oil, filters, brake inspection",
  "source": "manual",
  "status": "anchored",
  "content_hash": "a1b2c3...",
  "tx_hash": "0x...",
  "anchored_at": "2026-07-08T14:25:00Z",
  "explorer_url": "https://sepolia.basescan.org/tx/0x...",
  "verify_url": "https://<host>/verify/uuid-internal",
  "retry_count": 0,
  "created_at": "2026-07-08T14:22:30Z"
}
```

### `GET /api/verify/:id`

Public. Returns integrity check result.

**Response (200):**

```json
{
  "integrity": "verified",
  "record_id": "wo-2026-0042",
  "content_hash": "a1b2c3...",
  "anchored_at": "2026-07-08T14:25:00Z",
  "tx_hash": "0x...",
  "explorer_url": "https://sepolia.basescan.org/tx/0x...",
  "message": "Record matches on-chain anchor. No tampering detected."
}
```

Possible `integrity` values: `verified`, `not_found`, `not_anchored`, `mismatch`.

### `POST /api/verify`

Public. Two distinct flows depending on what the caller provides:

**Flow A — hash-only (no DB lookup):** Body is a JSON record without a matching `record_id` in the DB, or caller just wants the hash.

```json
// Response
{ "content_hash": "a1b2c3...", "integrity": "not_found" }
```

**Flow B — full check:** Body contains a JSON record whose `record_id` exists in the DB.

1. Canonicalize + hash the submitted JSON
2. Compare to `content_hash` stored in DB
3. Compare to on-chain hash (live contract call)
4. Return unified integrity result (same shape as `GET /api/verify/:id`)

Note: `source` is stripped before hashing in both flows (see section 8).

### `POST /api/records/:id/retry`

Auth required. Resets an `anchor_failed` record back to `pending_anchor` and clears `retry_count`. Returns 409 if record is not in `anchor_failed` state.

### `POST /api/import`

Accept mock FMS webhook payload; map to canonical schema; then same flow as `POST /records`.

**Mock import shape:**

```json
{
  "event": "work_order.completed",
  "payload": {
    "work_order_id": "wo-2026-0042",
    "vehicle_vin": "1FUJGHDV8CLBR1234",
    "vehicle_name": "Truck 104",
    "service_type": "PM-A",
    "completed_at": "2026-07-08T14:22:00Z",
    "odometer": 142318,
    "vendor_name": "In-house shop",
    "description": "Oil, filters, brake inspection"
  }
}
```

---

## 11. Record Lifecycle & Status

```
 [invalid]──► rejected (never persisted to records table)

 submitted ──► pending_anchor ──► tx_submitted ──► anchored
                    │                  │               │
                    │                  ▼               ▼
                    │           anchor_failed      (terminal)
                    │                  ▲
                    └── (retry_count   │
                          maxed out) ──┘
```

| Status | Meaning |
|--------|---------|
| `pending_anchor` | Validated; queued for worker |
| `tx_submitted` | Worker sent tx; awaiting confirmations |
| `anchored` | On-chain tx confirmed (≥ 2 blocks) |
| `anchor_failed` | Tx failed after max retries (3); requires manual retry |
| `rejected` | Failed validation — not written to `records` table |

### Crash-recovery rule (anchor worker)

When the worker starts, it also checks for records in `tx_submitted` state with a `tx_submitted_at` older than 10 minutes. For these, it queries the contract by `record_id` hash:

- If the contract has the hash → update DB to `anchored`, fill `tx_hash` from event log
- If not → reset to `pending_anchor` and retry

This prevents records from getting stuck if the worker crashes mid-flight.

### Manual retry endpoint

`POST /api/records/:id/retry` — Auth required. Resets `anchor_failed` records back to `pending_anchor` (resets `retry_count`). Add a simple "Retry" button on the dashboard for `anchor_failed` rows.

---

## 12. Smart Contract (v1)

Minimal storage contract on Base Sepolia.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MaintNotary {
    address public owner;

    event RecordAnchored(bytes32 indexed recordId, bytes32 contentHash, uint256 timestamp);

    mapping(bytes32 => bytes32) public hashes;
    mapping(bytes32 => uint256) public anchoredAt;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    // onlyOwner prevents any external party from poisoning a record_id
    // with a fake hash before the anchor worker gets to it.
    function anchor(bytes32 recordId, bytes32 contentHash) external onlyOwner {
        require(hashes[recordId] == bytes32(0), "Already anchored");
        hashes[recordId] = contentHash;
        anchoredAt[recordId] = block.timestamp;
        emit RecordAnchored(recordId, contentHash, block.timestamp);
    }
}
```

### Hash adapter (off-chain → on-chain)

Both `recordId` and `contentHash` use **SHA-256** to keep the algorithm consistent. SHA-256 produces 32 bytes, which fits exactly in `bytes32`.

```typescript
import { createHash } from "crypto";

// Convert a hex SHA-256 string to bytes32 for the contract
function hexToBytes32(hexHash: string): string {
  return "0x" + hexHash; // already 64 hex chars = 32 bytes
}

const recordIdBytes32  = hexToBytes32(sha256(record.record_id));
const contentHashBytes32 = hexToBytes32(sha256(canonicalJson));
```

- Single deployer wallet for MVP; API holds key via env var
- Wait for **2 block confirmations** before marking status `anchored` — do not mark on tx submission alone

---

## 13. UI Screens

### 13.1 Submit Record (`/submit`)

- Form fields matching canonical schema
- Inline validation errors
- Success → redirect to record detail or show receipt link

### 13.2 Dashboard (`/`)

- Table: record_id, VIN, equipment, service, date, odometer, status, actions
- Filters: VIN, status
- Link to detail and verify
- For rows with status `anchor_failed`: show **Retry** button (calls `POST /api/records/:id/retry`)

### 13.3 Record Detail (`/records/:id`)

- Full record JSON (read-only)
- Status badge
- Integrity section: hash, anchored_at, explorer link
- Copy verify URL button

### 13.4 Verify (`/verify/:id` or `/verify`)

- By ID: auto-load and show integrity result
- By JSON paste/upload: compute hash and compare (if record exists in DB)
- Clear messaging:
  - **Verified:** "This record matches its on-chain anchor."
  - **Mismatch:** "This data does not match what was anchored."

### 13.5 Import (`/import`)

- Textarea for mock webhook JSON
- Preview normalized record before submit

---

## 14. Test Vectors (shared contract)

Backend delivers `test-vectors.json` by end of Week 1 (skeleton) / Week 2 (real hashes filled in). Backend and Blockchain implementations must produce identical hashes; Frontend uses vectors to validate verify-page display logic.

**Example vector:**

```json
{
  "input": {
    "schema_version": "1.0",
    "record_id": "wo-test-001",
    "vin": "1FUJGHDV8CLBR1234",
    "equipment_label": "Truck 104",
    "service_type": "PM-A",
    "completed_at": "2026-07-08T14:22:00Z",
    "odometer_miles": 142318,
    "shop_name": "In-house shop",
    "notes": "Oil, filters, brake inspection",
    "source": "manual"
  },
  "expected_sha256": "<to be computed and filled in week 1>"
}
```

Minimum test cases:

| # | Case | Expected |
|---|------|----------|
| T1 | Valid record | 201, `pending_anchor` |
| T2 | Invalid VIN | 400, `INVALID_VIN` |
| T3 | Future date | 400, `FUTURE_DATE` |
| T4 | Mileage rollback | 400, `MILEAGE_ROLLBACK` |
| T5 | Duplicate record_id | 400, `DUPLICATE_RECORD` |
| T6 | Tampered JSON on verify | `mismatch` |
| T7 | Valid record after anchor | `verified` |

---

## 15. Database Schema

### `records`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | Internal ID |
| `record_id` | VARCHAR UNIQUE | Business key (work order number) |
| `vin` | VARCHAR(17) | Indexed — enables dashboard VIN filter without JSONB query |
| `service_type` | VARCHAR(64) | Indexed — enables dashboard service filter |
| `odometer_miles` | INTEGER | Indexed — used by mileage monotonicity check |
| `completed_at` | TIMESTAMPTZ | Indexed — used for ordering |
| `shop_name` | VARCHAR(255) | Stored as column for display; also in canonical_json |
| `source` | VARCHAR(16) | `manual` or `import`; NOT part of the canonical hash |
| `canonical_json` | JSONB | Normalized record **without** `source` field (this is what gets hashed) |
| `content_hash` | VARCHAR(64) | SHA-256 hex of canonical_json |
| `status` | ENUM | `pending_anchor`, `tx_submitted`, `anchored`, `anchor_failed` |
| `tx_hash` | VARCHAR | Nullable; filled after tx submitted |
| `tx_submitted_at` | TIMESTAMPTZ | Nullable; used by crash-recovery logic |
| `anchored_at` | TIMESTAMPTZ | Nullable; filled after 2 confirmations |
| `retry_count` | INTEGER | Default 0; max 3 before `anchor_failed` |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

> **Why redundant columns?** Storing `vin`, `service_type`, `odometer_miles`, and `completed_at` as top-level indexed columns avoids slow JSONB field extraction for dashboard list queries and the mileage monotonicity check.

### `audit_log`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `record_uuid` | UUID FK → records.id | Named `record_uuid` to avoid confusion with the string business key `record_id` |
| `action` | VARCHAR | `submitted`, `validated`, `anchor_queued`, `tx_submitted`, `anchored`, `anchor_failed`, `retry_requested` |
| `details` | JSONB | e.g. error message, tx hash, retry count |
| `created_at` | TIMESTAMPTZ | |

---

## 16. Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Postgres connection string |
| `FLEET_API_KEY` | Bearer token for write endpoints |
| `ANCHOR_PRIVATE_KEY` | Testnet wallet private key (funded with faucet ETH) |
| `CONTRACT_ADDRESS` | Deployed MaintNotary contract address |
| `RPC_URL` | Primary Base Sepolia RPC endpoint |
| `RPC_URL_FALLBACK` | Secondary RPC (e.g. Alchemy backup) — used on primary failure |
| `CHAIN_ID` | `84532` (Base Sepolia) |
| `EXPLORER_BASE_URL` | `https://sepolia.basescan.org` |
| `ANCHOR_CONFIRMATIONS` | Block confirmations before marking `anchored` (default: `2`) |
| `ANCHOR_MAX_RETRIES` | Max tx retries before `anchor_failed` (default: `3`) |
| `ANCHOR_POLL_INTERVAL_MS` | Worker polling interval in ms (default: `15000`) |
| `CORS_ORIGIN` | Allowed origin for write endpoints (default: same-origin) |

---

## 17. Security (MVP level)

| Concern | Mitigation |
|---------|------------|
| Unauthorized submits | API key on write endpoints |
| Contract poisoning (external caller anchors fake hash) | `onlyOwner` modifier on `anchor()` — see section 12 |
| Key exposure | Env vars only; never commit keys; testnet wallet with minimal funds |
| PII on-chain | Hash-only anchoring; `source` and display fields never go on-chain |
| Duplicate anchors | DB unique constraint + contract `require(hash == 0)` |
| Testnet instability | Retry worker with cap (max 3); show `anchor_failed` clearly |
| Cross-origin verify requests | Enable CORS on `/api/verify/*` for all origins; restrict to same-origin on write endpoints |
| Worker crash leaving stale `tx_submitted` | Crash-recovery scan on worker startup (see section 11) |

---

## 18. Definition of Done (project)

- [ ] Valid record anchors on testnet within 2 minutes
- [ ] Invalid records never reach the chain
- [ ] Verify page works without login
- [ ] Dashboard shows all records with correct status
- [ ] 10 demo records with working explorer links
- [ ] README with setup, architecture, and demo script
- [ ] Runs end-to-end locally via documented setup steps (§24); public deploy is a stretch goal, not required
- [ ] 2-minute demo rehearsed by team

---

## 19. Demo Script (2 minutes)

1. Open dashboard — show existing anchored records for a VIN.
2. Submit new PM record (valid) → status `pending_anchor` → `anchored`.
3. Submit record with lower odometer → show validation error.
4. Open verify page for anchored record → **Integrity verified**.
5. Paste same JSON with one digit changed → **No match**.
6. Show block explorer transaction link.
7. (Stretch) Import mock webhook JSON → same happy path.

---

## 20. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Testnet RPC downtime | Anchoring delays | Retry queue; `RPC_URL_FALLBACK` env var |
| Hash algorithm inconsistency across team | Silent verify failures | SHA-256 everywhere; shared test vectors week 1 |
| Worker crash between tx submit and DB update | Record stuck in `tx_submitted` forever | Crash-recovery scan on startup (section 11) |
| Contract called by external attacker | Fake hash anchored for real record_id | `onlyOwner` modifier blocks this (section 12) |
| Scope creep (real FMS integration) | Miss deadline | Defer to v2; mock import only |
| Wallet funds exhausted | Can't anchor | Monitor balance; faucet link in README |
| "Blockchain proves truth" misconception | Stakeholder confusion | UI copy: "integrity, not truth"; explain in demo |
| `source` field in hash causes identical records to differ | Verify fails on import vs manual | `source` excluded from canonical hash (section 8) |

---

## 21. Future (v2 — post 4 weeks)

- Fleetio / Samsara webhook adapters
- Telematics odometer cross-check
- Shop co-attestation workflow
- Amendment chain (`supersedes` pointer)
- Optional link from load board equipment to last PM date
- Mainnet deployment with proper key management

---

## 22. Open Questions — RESOLVED

| # | Question | Decision |
|---|----------|----------|
| Q1 | Base Sepolia vs Polygon Amoy? | **Base Sepolia** |
| Q2 | Node/Express vs Python/FastAPI? | **Node.js + TypeScript** |
| Q3 | React vs vanilla HTML/JS (match existing lab2 style)? | **React + Vite** |
| Q4 | Shared hosting (Render/Railway) or local demo only? | **Local demo only** — see §24 for what this changes |

See §7a for the full stack breakdown (framework, ORM, chain client, contract tooling).

---

## 23. References

- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
- [Base Sepolia Explorer](https://sepolia.basescan.org)
- ISO 3779 (VIN structure) for check-digit validation
- Existing load board context: `BRIEF.md` in this repo (equipment/VIN linkage is a v2 stretch)

---

## 24. Local Demo Scope (Q4 resolution)

Q4 resolved to **local demo only** — no shared hosting for v1. This changes a few things that were originally written assuming a public URL:

| What changes | v1 (local) | Stretch (if picked up later) |
|---|---|---|
| API base URL | `http://localhost:<port>/api` | `https://<deployed-host>/api` |
| Verify links (`verify_url`, receipt links) | `http://localhost:<port>/verify/:id` | Public HTTPS URL |
| Sharing a verify link with an external auditor/insurer (UC3, §4) | Not possible in v1 — reviewer must be on the same machine/network as the demo | Works as originally pitched |
| Week 4 timeline (§6) | "Deploy each layer to staging/production" step is dropped; replaced with a documented local setup (`README.md` — one command per layer, or a single `docker-compose`/dev script) | Revisit Railway (recommended) if the team wants a real public URL |

**What does NOT change:** the anchoring itself is still real — Base Sepolia is a public testnet, so `tx_hash` and explorer links (`sepolia.basescan.org`) work regardless of where the API/frontend run. Only the *verify page's reachability* is local-only in v1; the on-chain proof itself is still publicly inspectable via the block explorer.

**Revisit trigger:** if the team wants the "share a link with an external auditor" pitch (UC3) to actually work before the demo, promote hosting to Railway (§7a) — this is a same-day change since Backend/Blockchain/Frontend each already deploy their own piece independently.

---

## Appendix A — Suggested Repo Structure

```
maintnotary/
├── api/                        (Backend — Node/TS, Express, Prisma)
│   ├── src/
│   │   ├── routes/
│   │   ├── validation/
│   │   └── db/                (Prisma schema + migrations)
│   ├── prisma/schema.prisma
│   └── package.json
├── worker/                     (Blockchain — Node/TS, viem)
│   ├── src/
│   │   ├── anchor.ts
│   │   └── chain-client.ts    (viem client + hash→bytes32 adapter)
│   └── package.json
├── contracts/                   (Blockchain — Solidity + Hardhat)
│   ├── MaintNotary.sol
│   ├── test/
│   └── scripts/deploy.ts
├── web/                         (Frontend — React + Vite)
│   ├── src/
│   │   ├── pages/   (Submit, Dashboard, Verify, RecordDetail, Import)
│   │   └── api-client.ts
│   └── package.json
├── shared/                      (imported by api/ and worker/ — see §7a)
│   ├── canonicalize.ts
│   └── test-vectors.json
├── docs/
│   └── MAINTNOTARY_SPEC.md  (this file)
└── README.md                    (local setup steps — see §24)
```

---

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-07-09 | Initial spec |
| 1.1 | 2026-07-09 | Architecture review: added `onlyOwner` to contract; unified hash algorithm to SHA-256 throughout; added `tx_submitted` state + crash-recovery rule; added `retry_count` + max retry cap; defined `GET /api/records/:id` response body; clarified `POST /api/verify` dual-flow behavior; moved `source` out of canonical hash; added indexed columns to DB schema; renamed `audit_log.record_id` to `record_uuid`; added `RPC_URL_FALLBACK` and worker config env vars; added CORS note; added retry endpoint and UI button |
| 1.2 | 2026-07-15 | Restructured team from Backend&Chain / Frontend / Integration&QA into three single-layer roles — **Backend**, **Blockchain**, **Frontend**. Removed the dedicated integration/QA role; each owner now does their own testing, seeding, and deployment. Backend absorbs canonical schema authorship and test-vector ownership (previously Integration&QA); Blockchain absorbs the anchor worker (previously Backend). Timeline (§6) and architecture components (§7) owners remapped accordingly. See `WORKPLAN_BACKEND.md`, `WORKPLAN_BLOCKCHAIN.md`, `WORKPLAN_FRONTEND.md`. |
| 1.3 | 2026-07-15 | Resolved all four Open Questions (§22): Node.js+TypeScript backend, Base Sepolia testnet, React+Vite frontend, local demo only (no shared hosting for v1). Added §7a Tech Stack (Express, Prisma, Hardhat, viem) and §24 Local Demo Scope documenting what the local-only decision changes vs the original public-URL framing (§1, UC3, §18). Moved anchor worker into its own `worker/` package and `canonicalize.ts` into `shared/`, importable by both Backend and Blockchain, to keep hashing byte-identical across layers (Appendix A). |

*End of spec — v1.3*
