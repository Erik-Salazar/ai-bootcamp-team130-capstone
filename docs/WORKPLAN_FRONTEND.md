# Work Plan — Frontend

**Owner:** Chidambari  
**Focus:** Submit form, dashboard, verify page, record detail, import UI, error UX, demo polish  
**Stack:** React + Vite, TypeScript (spec §7a)  
**Companion docs:** [`MAINTNOTARY_SPEC.md`](./MAINTNOTARY_SPEC.md) (source of truth), `WORKPLAN_BACKEND.md`, `WORKPLAN_BLOCKCHAIN.md`

> When this doc and `MAINTNOTARY_SPEC.md` disagree, the spec wins — raise the conflict in the weekly sync.

**Last updated:** 2026-07-28 — frontend screens implemented; integration with live API + chain pending Neal/Erik merge.

---

## 1. Scope summary

Own every pixel the user sees and all API integration from the browser. Make the trust story legible: submit → anchor → verify, honest error messages, demo-ready UI.

**No dedicated QA** — frontend owns Vitest UI/smoke tests. Backend and Blockchain own their layers.

**Not owned:** API/validation/DB (Backend), smart contract/worker/chain (Blockchain).

---

## 2. Files & modules

```
web/
├── src/
│   ├── pages/          Submit, Dashboard, RecordDetail, Verify, Import
│   ├── components/     Feature UI + shared (SafeLink, PageErrorCard, …)
│   ├── hooks/          useSubmitForm, useDashboardRecords, useVerifyPage, …
│   ├── lib/
│   │   ├── validation/ Client-side V1–V8 hints (spec §9)
│   │   ├── security/   Safe URLs, JSON parse, input sanitization
│   │   ├── import/     Webhook parse + canonical preview mapping
│   │   └── …
│   └── api-client.ts   ← ONLY place that talks to the API
├── tests/              Vitest smoke + integration-style tests
└── package.json
```

---

## 3. Weekly checklist

### Week 1 — Submit form ✅

- [x] Scaffold React + Vite + `api-client.ts`
- [x] Submit form (`/submit`, §13.1) — all §8 fields, inline errors, success receipt
- [x] Client validation V1–V8 hints; server remains source of truth
- [x] Unit tests for submit validation
- [ ] Smoke test against **live** `POST /api/records` — blocked until Neal merges backend

### Week 2 — Verify page ✅

- [x] Verify by ID (`GET /api/verify/:id`) and JSON paste (`POST /api/verify`)
- [x] Integrity messaging for `verified`, `mismatch`, `not_found`, `not_anchored`
- [x] Tampered-vector Vitest test (`shared/test-vectors.json`)
- [ ] Fri checkpoint (submit → anchor → verify green) — blocked until API + worker live

### Week 3 — Dashboard + detail ✅

- [x] Dashboard table, VIN/status filters, pagination, stats, retry on `anchor_failed`
- [x] Record Detail — canonical JSON, integrity section, verify link, retry
- [x] Loading/error states on all screens
- [ ] Full E2E against live stack + 10 demo records — blocked until integration

### Week 4 — Import + polish 🔄

- [x] Import UI (`/import`, §13.5) — webhook textarea, preview, `POST /api/import`
- [x] Client validation + security hardening across all screens
- [x] Vitest smoke tests for all pages
- [x] Frontend section in README
- [ ] Confirm local run end-to-end with Neal's API + Erik's deployed contract
- [ ] Demo rehearsal (§19 script)

---

## 4. Definition of done (frontend slice)

| Item | Status |
|------|--------|
| Submit, Dashboard, Verify, Record Detail, Import UI built | ✅ |
| Client validation + security on all inputs/links | ✅ |
| All API calls via `api-client.ts` | ✅ |
| Verify communicates four `integrity` states | ✅ |
| Dashboard filters + status badges + retry | ✅ |
| Vitest suite (unit + smoke) passes | ✅ |
| Functional against **live** API + chain | ⏳ Team integration |
| Explorer links with real testnet txs | ⏳ Needs anchored demo data |
| E2E against deployed stack | ⏳ After backend merge |

---

## 5. Watch-outs

- **Server is source of truth for validation** — mirror V1–V8 for UX; surface Backend error codes verbatim.
- **Don't recompute hashes in the browser** — verification is server-side (§10).
- **Copy tone:** integrity, not truth (§20).
- **`VITE_API_KEY`** is visible in the client bundle — local demo only; use a backend proxy in production.

---

## 6. Local dev (frontend only)

```bash
# from repo root
npm install
cp web/.env.example web/.env
npm run dev:web    # http://localhost:5173
```

`web/.env`:

```
VITE_API_BASE_URL=http://localhost:4000/api
VITE_API_KEY=<fleet-api-key>   # required for POST /records, /import, /retry
```

```bash
npm run test --workspace=web
npm run build --workspace=web
```
