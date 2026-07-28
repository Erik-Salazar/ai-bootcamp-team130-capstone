import { Router } from "express";
import { verifyDeps } from "../deps";
import { verifyByBody, verifyById } from "../services/verifyRecord";

export const verifyRouter = Router();

// GET /api/verify/:id — spec §10, public
verifyRouter.get("/:id", async (req, res) => {
  const body = await verifyById(req.params.id, verifyDeps);
  return res.status(200).json(body);
});

// POST /api/verify — spec §10, public, dual-flow (hash-only vs full check)
verifyRouter.post("/", async (req, res) => {
  const body = await verifyByBody(req.body, verifyDeps);
  return res.status(200).json(body);
});
