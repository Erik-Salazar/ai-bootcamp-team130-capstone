# Work Plan — Frontend

**Owner focus:** Submit form, dashboard, verify page, record detail, import UI, error UX, demo polish
**Stack:** React + Vite, TypeScript (see spec §7a) — a departure from the existing vanilla `lab2` load-board style, justified by 5 screens with live API state
**Companion docs:** `MAINTNOTARY_SPEC.md` (source of truth), `WORKPLAN_BACKEND.md`, `WORKPLAN_BLOCKCHAIN.md`

> When this doc and `MAINTNOTARY_SPEC.md` disagree, the spec wins — raise the conflict in the weekly sync.

---

## 1. Scope summary

You own every pixel the user sees and all API integration from the browser. Your job is to make the trust story legible: a clean submit → anchor → verify flow, honest error messages, and a demo that reads well.

**No dedicated QA person exists anymore.** You write and own your own UI/E2E tests against the live API. Backend and Blockchain do the same for their layers.

You do **not** own: the API/validation/DB (Backend), the smart contract/worker/chain calls (Blockchain).

---

## 2. Files & modules you own

```
web/
├── src/
│   ├── pages/
│   │   ├── Submit          (/submit)          §13.1
│   │   ├── Dashboard       (/)                §13.2
│   │   ├── RecordDetail    (/records/:id)     §13.3
│   │   ├── Verify          (/verify/:id, /verify) §13.4
│   │   └── Import          (/import)          §13.5
│   └── api-client.ts       ← the ONLY place that talks to the API
├── tests/                  ← your own E2E/UI tests
└── package.json
```

Keep all fetch logic in `api-client.ts` so Backend's contract changes touch exactly one file.

---

## 3. Interface contracts

### You CONSUME (you build against these; you are blocked until they exist)

| Contract | Provided by | Needed by | Mitigation while waiting |
|----------|-------------|-----------|---------------------------|
| API request/response shapes + error codes | Backend | Week 1 Tue | Build `api-client.ts` against the spec (§9–10) and stub responses locally until Backend's endpoints are live |
| `verify` result shape + `integrity` values (`verified`/`not_found`/`not_anchored`/`mismatch`) | Backend | Week 2 | Spec §10 |
| Status vocabulary for badges/filters (`pending_anchor`, `tx_submitted`, `anchored`, `anchor_failed`) | Backend serves it, but Blockchain's worker is what sets it | Week 3 | Spec §11 |
| `explorer_url` / `CONTRACT_ADDRESS` context | Blockchain (deploys), Backend (serves via API) | Week 3 | Spec §10, §12, §16 |

### You PUBLISH

| Contract | Consumers | Notes |
|----------|-----------|-------|
| UI screens + stable selectors/labels | Yourself (your own E2E suite) | Keep IDs/labels stable so your tests don't churn every visual pass |

> **Decouple from Backend early:** don't wait for real endpoints. Code to the documented API shapes and use a stub/mock layer so a Week 1 backend delay never blocks your UI work.

---

## 4. Weekly checklist

### Week 1 — Submit form

- [ ] **Mon (all):** Confirm API contract (§9–10) and canonical schema (§8) with Backend and Blockchain. Stack is already resolved (React + Vite, §7a) — no need to relitigate Q3.
- [ ] Scaffold the web app with Vite (`npm create vite@latest -- --template react-ts`) + `api-client.ts` with all endpoints stubbed to spec shapes.
- [ ] **Tue–Wed:** Build Submit form (`/submit`, §13.1):
  - [ ] Fields matching canonical schema (§8) — required markers per §8 table
  - [ ] Client-side hints, but rely on server as source of truth for V1–V8
  - [ ] Render server validation errors inline, mapped by `errors[].field` + `code` (§9)
  - [ ] Success → show receipt / `verify_url`, or redirect to record detail
- [ ] Write your own smoke tests for the Submit flow (valid submit, one validation error case) against Backend's real endpoint once available.
- [ ] **Fri checkpoint:** form submits to Backend's `POST /api/records`; invalid input shows the 400 error codes clearly.

### Week 2 — Verify page

- [ ] **Tue–Wed:** Build Verify (`/verify/:id` and `/verify`, §13.4):
  - [ ] By ID: auto-load `GET /api/verify/:id`, render integrity result
  - [ ] By JSON paste/upload: `POST /api/verify` (Flow B), show match/mismatch
  - [ ] Copy for each `integrity` value:
    - `verified` → "This record matches its on-chain anchor."
    - `mismatch` → "This data does not match what was anchored."
    - `not_found` / `not_anchored` → clear, non-alarming messaging
  - [ ] Show `anchored_at`, `tx_hash`, and explorer link when present
- [ ] Write your own test using one of Backend's `test-vectors.json` entries — confirm your verify page displays `mismatch` correctly for a tampered record.
- [ ] **Fri checkpoint:** submit → (Blockchain anchors) → verify shows the green check.

### Week 3 — Dashboard + detail

- [ ] **Mon–Tue:** Dashboard (`/`, §13.2):
  - [ ] Table: `record_id`, VIN, equipment, service, date, odometer, status, actions
  - [ ] Filters: VIN + status (drive off `GET /api/records` query params)
  - [ ] Status badges from §11 vocabulary
  - [ ] Links to detail + verify
- [ ] **Wed:** Record Detail (`/records/:id`, §13.3):
  - [ ] Full record JSON read-only
  - [ ] Integrity section: `content_hash`, `anchored_at`, explorer link
  - [ ] Copy verify URL button
  - [ ] **Retry button on `anchor_failed` rows** → `POST /api/records/:id/retry` (§11, §13.2)
- [ ] Handle empty/loading/error states across all screens.
- [ ] **Thu:** Run your own E2E suite across all screens against the live (Backend + Blockchain) stack. Use the 10 jointly-seeded demo records to validate dashboard/detail/verify end to end.
- [ ] **Fri checkpoint:** full flow stable in the UI.

### Week 4 — Import + polish

- [ ] **Mon (with Backend):** Import UI (`/import`, §13.5):
  - [ ] Textarea for mock webhook JSON (shape in §10)
  - [ ] Preview normalized record before submit
  - [ ] Submit via `POST /api/import`
- [ ] Visual polish pass for the demo (spacing, empty states, copy tone — "integrity, not truth" per §20).
- [ ] **Tue:** Confirm local run instructions work end-to-end (§24 — local demo only for v1, no staging deploy). Point `api-client.ts` at Backend's local API URL (e.g. `http://localhost:3000/api`); confirm CORS is open for verify endpoints.
- [ ] **Wed:** Write the Frontend section of the README (screens, how to run `npm run dev`) — shared doc, your section.
- [ ] **Thu:** Bug buffer + demo rehearsal; you drive the live UI in the §19 demo script.

---

## 5. Definition of done (your slice)

- [ ] Submit, Dashboard, Verify, Record Detail, Import all functional against the live API + chain.
- [ ] Verify page works with no login and communicates all four `integrity` states clearly.
- [ ] Dashboard filters by VIN and status; shows correct status badges.
- [ ] `anchor_failed` rows expose a working Retry button.
- [ ] Explorer links open the correct testnet transaction.
- [ ] All API calls funnel through `api-client.ts`.
- [ ] Your own E2E suite passes against the deployed stack.

---

## 6. Watch-outs

- **The server is the source of truth for validation** — mirror V1–V8 hints for UX, but always surface Backend's error codes verbatim.
- **Don't recompute hashes in the browser** — verification hashing happens server-side (§10); the UI just displays results.
- **Copy matters:** the product proves *integrity, not truth* (§20). Avoid wording that implies blockchain guarantees the data is correct.
- **You no longer have someone writing E2E tests for you** — budget real time for your own test suite in Weeks 2–3, not just Week 4 polish.
