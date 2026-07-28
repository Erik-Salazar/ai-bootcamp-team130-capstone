/**
 * Production on-chain content-hash reader for verify Flow B.
 * Returns null when CONTRACT_ADDRESS is unset or the slot is empty.
 */

import { createPublicClient, http, type Address, type Hex } from "viem";
import { baseSepolia } from "viem/chains";
import { MAINTNOTARY_ABI } from "./maintNotaryAbi";

export type OnChainHashReader = (recordIdBytes32: string) => Promise<string | null>;

export function createOnChainHashReader(options: {
  contractAddress: string | null;
  rpcUrl?: string;
}): OnChainHashReader {
  const { contractAddress, rpcUrl } = options;

  if (!contractAddress) {
    return async () => null;
  }

  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl || baseSepolia.rpcUrls.default.http[0]),
  });

  return async (recordIdBytes32: string): Promise<string | null> => {
    const value = (await client.readContract({
      address: contractAddress as Address,
      abi: MAINTNOTARY_ABI,
      functionName: "hashes",
      args: [recordIdBytes32 as Hex],
    })) as Hex;

    if (!value || /^0x0+$/i.test(value)) return null;
    return value.slice(2).toLowerCase();
  };
}
