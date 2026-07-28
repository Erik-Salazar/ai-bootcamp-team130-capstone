import type { NextFunction, Request, Response } from "express";
import { config } from "../config";

/**
 * Bearer-token auth for write endpoints (spec §10, §17).
 * Verify endpoints stay public and must not use this middleware.
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";

  if (!config.fleetApiKey) {
    return res.status(500).json({
      success: false,
      errors: [{ code: "SERVER_MISCONFIGURED", message: "FLEET_API_KEY not set" }],
    });
  }

  if (token !== config.fleetApiKey) {
    return res.status(401).json({
      success: false,
      errors: [{ code: "UNAUTHORIZED", message: "Missing or invalid API key" }],
    });
  }

  next();
}
