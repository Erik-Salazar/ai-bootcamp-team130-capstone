/**
 * POST /api/records/:id/retry (spec §10, §11).
 */

import type { DbRecord } from "./recordDto";

export type RetryDeps = {
  getById(id: string): Promise<DbRecord | null>;
  resetForRetry(id: string): Promise<DbRecord>;
  writeAudit(
    recordUuid: string,
    action: "retry_requested",
    details?: object
  ): Promise<void>;
};

export type RetryResult =
  | {
      ok: true;
      status: 200;
      body: { success: true; id: string; record_id: string; status: "pending_anchor" };
    }
  | {
      ok: false;
      status: 404 | 409;
      body: { success: false; errors: Array<{ code: string; message: string }> };
    };

export async function retryRecord(id: string, deps: RetryDeps): Promise<RetryResult> {
  const row = await deps.getById(id);
  if (!row) {
    return {
      ok: false,
      status: 404,
      body: {
        success: false,
        errors: [{ code: "NOT_FOUND", message: "Record not found" }],
      },
    };
  }

  if (row.status !== "anchor_failed") {
    return {
      ok: false,
      status: 409,
      body: {
        success: false,
        errors: [{
          code: "INVALID_STATUS",
          message: `Retry only allowed when status is anchor_failed (current: ${row.status}).`,
        }],
      },
    };
  }

  const updated = await deps.resetForRetry(id);
  await deps.writeAudit(updated.id, "retry_requested", {
    previous_status: "anchor_failed",
  });

  return {
    ok: true,
    status: 200,
    body: {
      success: true,
      id: updated.id,
      record_id: updated.recordId,
      status: "pending_anchor",
    },
  };
}
