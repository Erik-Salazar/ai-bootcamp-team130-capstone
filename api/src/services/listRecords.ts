/**
 * GET /api/records and GET /api/records/:id (spec §10).
 */

import {
  toDetail,
  toListItem,
  type DbRecord,
  type UrlConfig,
} from "./recordDto";

export type ListRecordsQuery = {
  vin?: string;
  status?: string;
  limit?: number;
  offset?: number;
};

export type ListRecordsDeps = {
  list(params: {
    vin?: string;
    status?: string;
    limit: number;
    offset: number;
  }): Promise<{ rows: DbRecord[]; total: number }>;
  getById(id: string): Promise<DbRecord | null>;
  config: UrlConfig;
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function listRecords(query: ListRecordsQuery, deps: ListRecordsDeps) {
  const limit = Math.min(
    Math.max(Number(query.limit) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  const offset = Math.max(Number(query.offset) || 0, 0);

  const { rows, total } = await deps.list({
    vin: query.vin?.trim() || undefined,
    status: query.status?.trim() || undefined,
    limit,
    offset,
  });

  return {
    records: rows.map((row) => toListItem(row, deps.config)),
    total,
  };
}

export async function getRecordById(id: string, deps: ListRecordsDeps) {
  const row = await deps.getById(id);
  if (!row) {
    return {
      ok: false as const,
      status: 404 as const,
      body: {
        success: false as const,
        errors: [{ code: "NOT_FOUND", message: "Record not found" }],
      },
    };
  }
  return {
    ok: true as const,
    status: 200 as const,
    body: toDetail(row, deps.config),
  };
}
