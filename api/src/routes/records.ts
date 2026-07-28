import { Router } from "express";
import { requireApiKey } from "../middleware/auth";
import { listRecordsDeps, retryDeps, submitDeps } from "../deps";
import { submitRecord } from "../services/submitRecord";
import { getRecordById, listRecords } from "../services/listRecords";
import { retryRecord } from "../services/retryRecord";

export const recordsRouter = Router();

// POST /api/records — spec §10
recordsRouter.post("/", requireApiKey, async (req, res) => {
  const result = await submitRecord(req.body, "manual", submitDeps);
  return res.status(result.status).json(result.body);
});

// GET /api/records — spec §10, query: vin, status, limit, offset
recordsRouter.get("/", async (req, res) => {
  const body = await listRecords(
    {
      vin: typeof req.query.vin === "string" ? req.query.vin : undefined,
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      limit: typeof req.query.limit === "string" ? Number(req.query.limit) : undefined,
      offset: typeof req.query.offset === "string" ? Number(req.query.offset) : undefined,
    },
    listRecordsDeps
  );
  return res.status(200).json(body);
});

// GET /api/records/:id — spec §10
recordsRouter.get("/:id", async (req, res) => {
  const result = await getRecordById(req.params.id, listRecordsDeps);
  return res.status(result.status).json(result.body);
});

// POST /api/records/:id/retry — spec §10, §11
recordsRouter.post("/:id/retry", requireApiKey, async (req, res) => {
  const result = await retryRecord(req.params.id, retryDeps);
  return res.status(result.status).json(result.body);
});
