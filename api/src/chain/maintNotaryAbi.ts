/** Inlined ABI fragment — keep in sync with worker/src/chain-client.ts and MaintNotary.sol */
export const MAINTNOTARY_ABI = [
  {
    type: "function",
    name: "hashes",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
  },
] as const;
