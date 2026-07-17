import { Router } from "express";

export const verifyRouter = Router();

// GET /api/verify/:id — spec §10, public
verifyRouter.get("/:id", async (_req, res) => {
  // TODO(Backend/Blockchain): look up record, compare stored content_hash to
  // on-chain hash, return integrity status: verified | not_found | not_anchored | mismatch.
  return res.status(200).json({ integrity: "not_found", message: "Verify lookup not yet implemented" });
});

// POST /api/verify — spec §10, public, dual-flow (hash-only vs full check)
verifyRouter.post("/", async (_req, res) => {
  // TODO(Backend): canonicalize + hash submitted JSON (strip `source`).
  // If record_id matches a DB row, compare DB + on-chain hash (Flow B).
  // Otherwise return hash-only result (Flow A).
  return res.status(200).json({ integrity: "not_found", content_hash: null });
});
