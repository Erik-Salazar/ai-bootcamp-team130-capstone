import "dotenv/config";
import { createPublicClient, createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { hexToBytes32, sha256Hex } from "@maintnotary/shared";

const rpcUrl = process.env.RPC_URL || baseSepolia.rpcUrls.default.http[0];

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(rpcUrl),
});

export function getWalletClient() {
  const privateKey = process.env.ANCHOR_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("ANCHOR_PRIVATE_KEY is not set");
  }
  const account = privateKeyToAccount(privateKey as Hex);
  return createWalletClient({ account, chain: baseSepolia, transport: http(rpcUrl) });
}

/** SHA-256(record_id) -> bytes32, per spec §12 hash adapter. */
export function recordIdToBytes32(recordId: string): Hex {
  return hexToBytes32(sha256Hex(recordId)) as Hex;
}

/** contentHash (already a SHA-256 hex string) -> bytes32. */
export function contentHashToBytes32(contentHash: string): Hex {
  return hexToBytes32(contentHash) as Hex;
}

// TODO(Blockchain): load the deployed MaintNotary ABI (from contracts/artifacts
// after `hardhat compile`) and CONTRACT_ADDRESS env var to build a typed
// contract instance for `anchor()` calls and `hashes`/`anchoredAt` reads.
