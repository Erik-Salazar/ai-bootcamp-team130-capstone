/**
 * App config loaded once from env (plain object — injectable in services/tests).
 */

export type AppConfig = {
  publicWebBaseUrl: string;
  explorerBaseUrl: string;
  contractAddress: string | null;
  fleetApiKey: string | undefined;
  port: number;
  corsOrigin: string | false;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const publicWebBaseUrl = (
    env.PUBLIC_WEB_BASE_URL ??
    env.CORS_ORIGIN ??
    "http://localhost:5173"
  ).replace(/\/$/, "");

  return {
    publicWebBaseUrl,
    explorerBaseUrl: (env.EXPLORER_BASE_URL ?? "https://sepolia.basescan.org").replace(
      /\/$/,
      ""
    ),
    contractAddress: env.CONTRACT_ADDRESS?.trim() || null,
    fleetApiKey: env.FLEET_API_KEY,
    port: env.PORT ? Number(env.PORT) : 4000,
    corsOrigin: env.CORS_ORIGIN ?? false,
  };
}

/** Process-wide config (dotenv must be loaded before first import). */
export const config: AppConfig = loadConfig();
