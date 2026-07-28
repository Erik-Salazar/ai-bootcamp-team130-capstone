import { Router } from "express";
import { requireApiKey } from "../middleware/auth";
import { submitDeps } from "../deps";
import { mapImportPayload } from "../services/mapImportPayload";
import { submitRecord } from "../services/submitRecord";

export const importRouter = Router();

// POST /api/import — spec §10, mock FMS webhook payload
importRouter.post("/", requireApiKey, async (req, res) => {
  const mapped = mapImportPayload(req.body);
  if (!mapped.ok) {
    return res.status(400).json({ success: false, errors: mapped.errors });
  }

  const result = await submitRecord(mapped.body, "import", submitDeps);
  return res.status(result.status).json(result.body);
});
