import { Router } from "express";
import { requireApiKey } from "../middleware/auth";

export const importRouter = Router();

// POST /api/import — spec §10, mock FMS webhook payload
importRouter.post("/", requireApiKey, async (_req, res) => {
  // TODO(Backend): map mock webhook payload fields to canonical schema
  // (work_order_id -> record_id, vehicle_vin -> vin, etc.), set source="import",
  // then run the same validate -> canonicalize -> persist flow as POST /records.
  return res.status(501).json({ success: false, errors: [{ code: "NOT_IMPLEMENTED", message: "Import not yet implemented" }] });
});
