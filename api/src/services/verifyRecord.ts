/**
 * GET /api/verify/:id and POST /api/verify (spec §10 Flows A/B).
 */

import {
  UnknownFieldError,
  assertKnownFields,
  hashRecord,
  hexToBytes32,
  sha256Hex,
} from "@maintnotary/shared";
import { explorerUrl, type DbRecord, type UrlConfig } from "./recordDto";
import { sourceFromBody, toMaintenanceRecord } from "./toMaintenanceRecord";

export type Integrity = "verified" | "not_found" | "not_anchored" | "mismatch";

export type VerifyDeps = {
  getById(id: string): Promise<DbRecord | null>;
  getByRecordId(recordId: string): Promise<DbRecord | null>;
  /** Returns on-chain content hash hex (64 chars) or null if unset/missing. */
  getOnChainHash(recordIdBytes32: string): Promise<string | null>;
  config: UrlConfig;
};

export type VerifyResultBody = {
  integrity: Integrity;
  record_id?: string;
  content_hash?: string | null;
  anchored_at?: string | null;
  tx_hash?: string | null;
  explorer_url?: string | null;
  message?: string;
};

function normalizeOnChainHash(value: string | null): string | null {
  if (!value) return null;
  const hex = value.startsWith("0x") ? value.slice(2) : value;
  if (/^0{64}$/i.test(hex)) return null;
  return hex.toLowerCase();
}

function buildVerifyBody(
  integrity: Integrity,
  row: DbRecord | null,
  contentHash: string | null,
  config: UrlConfig,
  message: string
): VerifyResultBody {
  if (!row) {
    return { integrity, content_hash: contentHash, message };
  }
  return {
    integrity,
    record_id: row.recordId,
    content_hash: contentHash ?? row.contentHash,
    anchored_at: row.anchoredAt ? row.anchoredAt.toISOString() : null,
    tx_hash: row.txHash,
    explorer_url: explorerUrl(row.txHash, config.explorerBaseUrl),
    message,
  };
}

async function resolveIntegrity(
  row: DbRecord,
  submittedHash: string | null,
  deps: VerifyDeps
): Promise<{ integrity: Integrity; message: string }> {
  const onChain = normalizeOnChainHash(
    await deps.getOnChainHash(hexToBytes32(sha256Hex(row.recordId)))
  );

  if (submittedHash && submittedHash !== row.contentHash) {
    return {
      integrity: "mismatch",
      message: "Submitted record hash does not match stored content_hash.",
    };
  }

  // The on-chain read is authoritative: a DB status of "anchored" is never
  // sufficient on its own. This guards against a stale/incorrect DB status,
  // an unset CONTRACT_ADDRESS, or an RPC/network issue silently making
  // unverified records look "verified".
  if (!onChain) {
    return {
      integrity: "not_anchored",
      message:
        row.status === "anchored"
          ? "Record is marked anchored in our records, but the on-chain anchor could not be confirmed. Please try again shortly."
          : "Record is not yet anchored on-chain.",
    };
  }

  if (onChain !== row.contentHash) {
    return {
      integrity: "mismatch",
      message: "Stored content_hash does not match on-chain anchor.",
    };
  }

  if (submittedHash && submittedHash !== onChain) {
    return {
      integrity: "mismatch",
      message: "Submitted record hash does not match on-chain anchor.",
    };
  }

  return {
    integrity: "verified",
    message: "Record matches on-chain anchor. No tampering detected.",
  };
}

/** GET /api/verify/:id */
export async function verifyById(id: string, deps: VerifyDeps): Promise<VerifyResultBody> {
  const row = await deps.getById(id);
  if (!row) {
    return {
      integrity: "not_found",
      message: "Record not found.",
    };
  }

  const { integrity, message } = await resolveIntegrity(row, null, deps);
  return buildVerifyBody(integrity, row, row.contentHash, deps.config, message);
}

/** POST /api/verify — Flow A (hash-only) or Flow B (full check). */
export async function verifyByBody(
  body: unknown,
  deps: VerifyDeps
): Promise<VerifyResultBody> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      integrity: "not_found",
      content_hash: null,
      message: "Request body must be a JSON record.",
    };
  }

  const obj = body as Record<string, unknown>;
  const source = sourceFromBody(obj);
  let contentHash: string;
  try {
    assertKnownFields({ ...obj, source });
    contentHash = hashRecord(toMaintenanceRecord(obj, source));
  } catch (err) {
    if (err instanceof UnknownFieldError) {
      return {
        integrity: "not_found",
        content_hash: null,
        message: err.message,
      };
    }
    throw err;
  }

  const recordId =
    typeof obj.record_id === "string" ? obj.record_id.trim() : "";
  const row = recordId ? await deps.getByRecordId(recordId) : null;

  // Flow A — no DB match
  if (!row) {
    return {
      integrity: "not_found",
      content_hash: contentHash,
      message: "No matching record_id in the database. Hash computed for the submitted JSON.",
    };
  }

  // Flow B — full check
  const { integrity, message } = await resolveIntegrity(row, contentHash, deps);
  return buildVerifyBody(integrity, row, contentHash, deps.config, message);
}
