const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

const EXPLORER_HOST_RE = /^([a-z0-9-]+\.)?(basescan|etherscan)\.(org|io)$/i;

const INTERNAL_PATH_RE = /^\/[a-zA-Z0-9/_-]*$/;

export function getSafeExternalUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;

  try {
    const parsed = new URL(url.trim());
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

/** Same-origin or root-relative app links only — blocks open redirects. */
export function getSafeAppLink(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();
  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("//") || !INTERNAL_PATH_RE.test(trimmed)) return null;
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return null;
    if (parsed.origin !== window.location.origin) return null;
    const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return INTERNAL_PATH_RE.test(parsed.pathname) ? path : null;
  } catch {
    return null;
  }
}

/** Allow only known block explorer hosts over HTTPS. */
export function getSafeExplorerUrl(url: string | null | undefined): string | null {
  const safe = getSafeExternalUrl(url);
  if (!safe) return null;

  try {
    const parsed = new URL(safe);
    if (parsed.protocol !== "https:") return null;
    if (!EXPLORER_HOST_RE.test(parsed.hostname)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}
