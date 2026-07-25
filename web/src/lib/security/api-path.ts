import { isValidRecordRouteId } from "../validation/route-id";

export function assertSafeApiPath(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("..")) {
    throw new Error("Invalid API path.");
  }
  return path;
}

export function encodeApiId(id: string): string {
  if (!isValidRecordRouteId(id)) {
    throw new Error("Invalid record identifier.");
  }
  return encodeURIComponent(id);
}

export function buildRecordPath(id: string): string {
  return assertSafeApiPath(`/records/${encodeApiId(id)}`);
}

export function buildVerifyPath(id: string): string {
  return assertSafeApiPath(`/verify/${encodeApiId(id)}`);
}

export function buildRetryPath(id: string): string {
  return assertSafeApiPath(`/records/${encodeApiId(id)}/retry`);
}

export function getSafeApiBaseUrl(raw: string | undefined): string {
  const fallback = "http://localhost:4000/api";
  const value = (raw ?? fallback).trim().replace(/\/$/, "");

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return fallback;
    }
    return value;
  } catch {
    return fallback;
  }
}
