/**
 * Thin fetch wrapper for the MaintNotary API (spec §10).
 * Framework-agnostic on purpose — no React imports here.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export interface ApiRecordSummary {
  id: string;
  record_id: string;
  vin: string;
  service_type: string;
  completed_at: string;
  odometer_miles: number;
  status: string;
  tx_hash: string | null;
  anchored_at: string | null;
  verify_url: string;
}

export interface ListRecordsResponse {
  records: ApiRecordSummary[];
  total: number;
}

export interface VerifyResponse {
  integrity: "verified" | "not_found" | "not_anchored" | "mismatch";
  record_id?: string;
  content_hash?: string;
  anchored_at?: string;
  tx_hash?: string;
  explorer_url?: string;
  message?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.errors?.[0]?.message ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function listRecords(params: { vin?: string; status?: string } = {}) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return request<ListRecordsResponse>(`/records${qs ? `?${qs}` : ""}`);
}

export function getRecord(id: string) {
  return request(`/records/${id}`);
}

export function verifyById(id: string) {
  return request<VerifyResponse>(`/verify/${id}`);
}

export function verifyJson(record: unknown) {
  return request<VerifyResponse>("/verify", {
    method: "POST",
    body: JSON.stringify(record),
  });
}

// TODO(Frontend): submitRecord(), importRecord(), retryRecord() — all need
// the Authorization: Bearer <FLEET_API_KEY> header once auth UX is designed.
