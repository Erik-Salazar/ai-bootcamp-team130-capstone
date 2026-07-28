/**
 * Map Prisma/DB record rows to API response shapes (spec §10).
 */

export type DbRecord = {
  id: string;
  recordId: string;
  vin: string;
  serviceType: string;
  odometerMiles: number;
  completedAt: Date;
  shopName: string;
  source: "manual" | "import";
  canonicalJson: unknown;
  contentHash: string;
  status: string;
  txHash: string | null;
  anchoredAt: Date | null;
  retryCount: number;
  createdAt: Date;
};

export type UrlConfig = {
  publicWebBaseUrl: string;
  explorerBaseUrl: string;
};

function iso(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null;
}

function canonicalField(canonicalJson: unknown, key: string): string | undefined {
  if (!canonicalJson || typeof canonicalJson !== "object") return undefined;
  const value = (canonicalJson as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

export function explorerUrl(txHash: string | null, explorerBaseUrl: string): string | null {
  if (!txHash) return null;
  return `${explorerBaseUrl.replace(/\/$/, "")}/tx/${txHash}`;
}

export function verifyUrl(id: string, publicWebBaseUrl: string): string {
  return `${publicWebBaseUrl.replace(/\/$/, "")}/verify/${id}`;
}

export function toListItem(row: DbRecord, config: UrlConfig) {
  return {
    id: row.id,
    record_id: row.recordId,
    vin: row.vin,
    service_type: row.serviceType,
    completed_at: row.completedAt.toISOString(),
    odometer_miles: row.odometerMiles,
    status: row.status,
    tx_hash: row.txHash,
    anchored_at: iso(row.anchoredAt),
    verify_url: verifyUrl(row.id, config.publicWebBaseUrl),
  };
}

export function toDetail(row: DbRecord, config: UrlConfig) {
  return {
    id: row.id,
    record_id: row.recordId,
    vin: row.vin,
    equipment_label: canonicalField(row.canonicalJson, "equipment_label") ?? null,
    service_type: row.serviceType,
    completed_at: row.completedAt.toISOString(),
    odometer_miles: row.odometerMiles,
    shop_name: row.shopName,
    notes: canonicalField(row.canonicalJson, "notes") ?? null,
    source: row.source,
    status: row.status,
    content_hash: row.contentHash,
    tx_hash: row.txHash,
    anchored_at: iso(row.anchoredAt),
    explorer_url: explorerUrl(row.txHash, config.explorerBaseUrl),
    verify_url: verifyUrl(row.id, config.publicWebBaseUrl),
    retry_count: row.retryCount,
    created_at: row.createdAt.toISOString(),
  };
}
