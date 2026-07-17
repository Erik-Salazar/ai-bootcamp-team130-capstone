import "dotenv/config";
import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const RPC_URL = process.env.RPC_URL ?? "";
const ANCHOR_PRIVATE_KEY = process.env.ANCHOR_PRIVATE_KEY ?? "";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    baseSepolia: {
      url: RPC_URL || "https://sepolia.base.org",
      accounts: ANCHOR_PRIVATE_KEY ? [ANCHOR_PRIVATE_KEY] : [],
      chainId: 84532,
    },
  },
};

export default config;
