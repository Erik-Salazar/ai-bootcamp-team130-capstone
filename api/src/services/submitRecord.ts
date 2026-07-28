/**
 * Submit a maintenance record: validate → canonicalize/hash → persist → audit.
 * Spec §10 POST /api/records. Deps are injected for unit testing.
 */

import {
  UnknownFieldError,
  assertKnownFields,
  hashRecord,
  toCanonicalJson,
} from "@maintnotary/shared";
import {
  validateRecord,
  type RecordLookups,
  type ValidateRecordOptions,
} from "../validation/validateRecord";
import type { ValidationError } from "../validation/types";
import { toMaintenanceRecord, type RecordSource } from "./toMaintenanceRecord";
import { verifyUrl } from "./recordDto";

export type { RecordSource };

export type SavedRecord = {
  id: string;
  recordId: string;
  status: "pending_anchor";
};

export type SaveRecordInput = {
  recordId: string;
  vin: string;
  serviceType: string;
  odometerMiles: number;
  completedAt: Date;
  shopName: string;
  source: RecordSource;
  canonicalJson: object;
  contentHash: string;
};

export type SubmitDeps = {
  lookups: RecordLookups;
  saveRecord(input: SaveRecordInput): Promise<SavedRecord>;
  writeAudit(
    recordUuid: string,
    action: "submitted" | "validated" | "anchor_queued",
    details?: object
  ): Promise<void>;
  config: { publicWebBaseUrl: string };
  now?: Date;
};

export type SubmitSuccessBody = {
  success: true;
  id: string;
  record_id: string;
  status: "pending_anchor";
  verify_url: string;
};

export type SubmitFailureBody = {
  success: false;
  errors: ValidationError[];
};

export type SubmitResult =
  | { ok: true; status: 201; body: SubmitSuccessBody }
  | { ok: false; status: 400; body: SubmitFailureBody };

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  );
}

/**
 * Validate and persist a new record. Never persists on validation failure.
 */
export async function submitRecord(
  body: unknown,
  source: RecordSource,
  deps: SubmitDeps
): Promise<SubmitResult> {
  const validateOpts: ValidateRecordOptions = {
    lookups: deps.lookups,
    now: deps.now,
  };

  const validation = await validateRecord(body, validateOpts);
  if (!validation.valid) {
    return {
      ok: false,
      status: 400,
      body: { success: false, errors: validation.errors },
    };
  }

  const obj = body as Record<string, unknown>;
  // Ignore any client-supplied source; server is authoritative.
  // Strict allowlist on the request object (spec §8 rule 2) before we reshape.
  try {
    assertKnownFields({ ...obj, source });
  } catch (err) {
    if (err instanceof UnknownFieldError) {
      return {
        ok: false,
        status: 400,
        body: {
          success: false,
          errors: [{
            code: "UNKNOWN_FIELD",
            message: err.message,
            field: err.fields[0],
          }],
        },
      };
    }
    throw err;
  }

  const record = toMaintenanceRecord(obj, source);
  const canonicalJson = JSON.parse(toCanonicalJson(record)) as object;
  const contentHash = hashRecord(record);

  let saved: SavedRecord;
  try {
    saved = await deps.saveRecord({
      recordId: record.record_id,
      vin: record.vin,
      serviceType: record.service_type,
      odometerMiles: record.odometer_miles,
      completedAt: new Date(record.completed_at),
      shopName: record.shop_name,
      source,
      canonicalJson,
      contentHash,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return {
        ok: false,
        status: 400,
        body: {
          success: false,
          errors: [{
            code: "DUPLICATE_RECORD",
            field: "record_id",
            message: `record_id "${record.record_id}" already exists.`,
          }],
        },
      };
    }
    throw err;
  }

  await deps.writeAudit(saved.id, "submitted");
  await deps.writeAudit(saved.id, "validated");
  await deps.writeAudit(saved.id, "anchor_queued");

  return {
    ok: true,
    status: 201,
    body: {
      success: true,
      id: saved.id,
      record_id: saved.recordId,
      status: "pending_anchor",
      verify_url: verifyUrl(saved.id, deps.config.publicWebBaseUrl),
    },
  };
}
