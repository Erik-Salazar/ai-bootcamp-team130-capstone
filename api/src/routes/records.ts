import { Router } from "express";
import { requireApiKey } from "../middleware/auth";
import { validateRecord } from "../validation/validateRecord";

export const recordsRouter = Router();

// POST /api/records — spec §10
recordsRouter.post("/", requireApiKey, async (req, res) => {
  const result = await validateRecord(req.body);
  if (!result.valid) {
    return res.status(400).json({ success: false, errors: result.errors });
  }

  // TODO(Backend): canonicalize + hash (shared/canonicalize.ts), persist via
  // Prisma with status "pending_anchor", write audit_log "submitted" entry.
  return res.status(501).json({ success: false, errors: [{ code: "NOT_IMPLEMENTED", message: "POST /api/records not yet implemented" }] });
});

// GET /api/records — spec §10, query: vin, status, limit, offset
recordsRouter.get("/", async (_req, res) => {
  // TODO(Backend): query Prisma with filters + pagination.
  return res.status(200).json({ records: [], total: 0 });
});

// GET /api/records/:id — spec §10
recordsRouter.get("/:id", async (_req, res) => {
  // TODO(Backend): fetch full record detail including canonical JSON + anchor metadata.
  return res.status(404).json({ success: false, errors: [{ code: "NOT_FOUND", message: "Record not found" }] });
});

// POST /api/records/:id/retry — spec §10, §11
recordsRouter.post("/:id/retry", requireApiKey, async (_req, res) => {
  // TODO(Backend): reset anchor_failed -> pending_anchor, retry_count = 0.
  // Return 409 if record is not currently anchor_failed.
  return res.status(501).json({ success: false, errors: [{ code: "NOT_IMPLEMENTED", message: "Retry not yet implemented" }] });
});
