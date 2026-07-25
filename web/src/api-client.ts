/**
 * Thin fetch wrapper for the MaintNotary API (spec §10).
 * Framework-agnostic on purpose — no React imports here.
 *
 * Security note: VITE_API_KEY is bundled into the client build. Use only for
 * local demos; production should proxy writes through a trusted backend.
 */

import {
  assertSafeApiPath,
  buildRecordPath,
  buildRetryPath,
  buildVerifyPath,
  getSafeApiBaseUrl,
} from "./lib/security/api-path";
import { API_REQUEST_TIMEOUT_MS } from "./lib/security/constants";

const API_BASE_URL = getSafeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
const API_KEY = import.meta.env.VITE_API_KEY as string | undefined;

export interface ApiRecordSummary {
  id: string;
  record_id: string;
  vin: string;
  equipment_label?: string;
  service_type: string;
  completed_at: string;
  odometer_miles: number;
  status: string;
  tx_hash: string | null;
  anchored_at: string | null;
  verify_url: string;
}

export interface ApiRecordDetail {
  id: string;
  record_id: string;
  vin: string;
  equipment_label?: string;
  service_type: string;
  completed_at: string;
  odometer_miles: number;
  shop_name: string;
  notes?: string;
  source: string;
  status: string;
  content_hash: string | null;
  tx_hash: string | null;
  anchored_at: string | null;
  explorer_url?: string | null;
  verify_url: string;
  retry_count: number;
  created_at: string;
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

export interface SubmitRecordRequest {
  record_id: string;
  vin: string;
  equipment_label?: string;
  service_type: string;
  completed_at: string;
  odometer_miles: number;
  shop_name: string;
  notes?: string;
}

export interface SubmitRecordResponse {
  success: true;
  id: string;
  record_id: string;
  status: "pending_anchor";
  verify_url: string;
}

export interface ImportPayload {
  event: "work_order.completed";
  payload: {
    work_order_id: string;
    vehicle_vin: string;
    vehicle_name?: string;
    service_type: string;
    completed_at: string;
    odometer: number;
    vendor_name: string;
    description?: string;
  };
}

export interface ApiValidationError {
  code: string;
  field: string;
  message: string;
}

export class ApiError extends Error {
  public status: number;
  public errors: ApiValidationError[];

  constructor(status: number, errors: ApiValidationError[], message?: string) {
    super(message ?? errors[0]?.message ?? `Request failed: ${status}`);
    this.status = status;
    this.errors = errors;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const safePath = assertSafeApiPath(path);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (API_KEY && init?.method && init.method !== "GET") {
    headers.Authorization = `Bearer ${API_KEY}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${safePath}`, {
      ...init,
      headers,
      signal: controller.signal,
      credentials: "same-origin",
      redirect: "follow",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body?.errors ?? [], body?.errors?.[0]?.message);
    }

    return res.json() as Promise<T>;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(408, [], "Request timed out. Please try again.");
    }
    throw err;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function listRecords(params: { vin?: string; status?: string; limit?: number; offset?: number } = {}) {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([key, value]) => [key, String(value)]),
  ).toString();
  return request<ListRecordsResponse>(`/records${qs ? `?${qs}` : ""}`);
}

export function getRecord(id: string) {
  return request<ApiRecordDetail>(buildRecordPath(id));
}

export function verifyById(id: string) {
  return request<VerifyResponse>(buildVerifyPath(id));
}

export function verifyJson(record: unknown) {
  return request<VerifyResponse>("/verify", {
    method: "POST",
    body: JSON.stringify(record),
  });
}

export function submitRecord(record: SubmitRecordRequest) {
  return request<SubmitRecordResponse>("/records", {
    method: "POST",
    body: JSON.stringify(record),
  });
}

export function importRecord(payload: ImportPayload) {
  return request<SubmitRecordResponse>("/import", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function retryRecord(id: string) {
  return request<{ success: true }>(buildRetryPath(id), {
    method: "POST",
  });
}
