import "dotenv/config";
import {
  createPublicClient,
  createWalletClient,
  fallback,
  getContract,
  http,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { hexToBytes32, sha256Hex } from "@maintnotary/shared";

// ---------------------------------------------------------------------------
// ABI — inlined so the worker has no cross-package artifact dependency.
// Keep in sync with contracts/contracts/MaintNotary.sol.
// ---------------------------------------------------------------------------
export const MAINTNOTARY_ABI = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "anchor",
    inputs: [
      { name: "recordId", type: "bytes32" },
      { name: "contentHash", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "hashes",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "anchoredAt",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "RecordAnchored",
    inputs: [
      { name: "recordId", type: "bytes32", indexed: true },
      { name: "contentHash", type: "bytes32", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;

// ---------------------------------------------------------------------------
// Transport — primary + optional fallback RPC (spec §16 RPC_URL_FALLBACK)
// ---------------------------------------------------------------------------
function buildTransport() {
  const primary = http(process.env.RPC_URL || baseSepolia.rpcUrls.default.http[0]);
  const fallbackUrl = process.env.RPC_URL_FALLBACK;
  return fallbackUrl ? fallback([primary, http(fallbackUrl)]) : primary;
}

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: buildTransport(),
});

export function getWalletClient() {
  const privateKey = process.env.ANCHOR_PRIVATE_KEY;
  if (!privateKey) throw new Error("ANCHOR_PRIVATE_KEY is not set");
  const account = privateKeyToAccount(privateKey as Hex);
  return createWalletClient({
    account,
    chain: baseSepolia,
    transport: buildTransport(),
  });
}

/** Returns a typed viem contract instance bound to the deployed address. */
export function getAnchorContract(walletClient?: ReturnType<typeof getWalletClient>) {
  const address = process.env.CONTRACT_ADDRESS as Address | undefined;
  if (!address) throw new Error("CONTRACT_ADDRESS is not set");

  return getContract({
    address,
    abi: MAINTNOTARY_ABI,
    client: walletClient
      ? { public: publicClient, wallet: walletClient }
      : publicClient,
  });
}

// ---------------------------------------------------------------------------
// Hash adapters (spec §12)
// ---------------------------------------------------------------------------

/** SHA-256(record_id string) → 0x-prefixed bytes32 for the contract. */
export function recordIdToBytes32(recordId: string): Hex {
  return hexToBytes32(sha256Hex(recordId)) as Hex;
}

/** content_hash (64-char hex from DB) → 0x-prefixed bytes32 for the contract. */
export function contentHashToBytes32(contentHash: string): Hex {
  return hexToBytes32(contentHash) as Hex;
}
