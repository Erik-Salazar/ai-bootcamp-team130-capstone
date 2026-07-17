import { ethers } from "hardhat";

async function main() {
  const factory = await ethers.getContractFactory("MaintNotary");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`MaintNotary deployed to: ${address}`);
  console.log("Set CONTRACT_ADDRESS in api/.env and worker/.env to this value.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
