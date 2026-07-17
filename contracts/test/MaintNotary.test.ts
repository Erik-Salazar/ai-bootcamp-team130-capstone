import { expect } from "chai";
import { ethers } from "hardhat";

describe("MaintNotary", () => {
  async function deploy() {
    const [owner, other] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("MaintNotary");
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    return { contract, owner, other };
  }

  it("sets the deployer as owner", async () => {
    const { contract, owner } = await deploy();
    expect(await contract.owner()).to.equal(owner.address);
  });

  it("allows the owner to anchor a hash", async () => {
    const { contract } = await deploy();
    const recordId = ethers.keccak256(ethers.toUtf8Bytes("wo-test-001"));
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes("content"));

    await expect(contract.anchor(recordId, contentHash))
      .to.emit(contract, "RecordAnchored");

    expect(await contract.hashes(recordId)).to.equal(contentHash);
  });

  it("rejects a second anchor for the same recordId", async () => {
    const { contract } = await deploy();
    const recordId = ethers.keccak256(ethers.toUtf8Bytes("wo-test-002"));
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes("content"));

    await contract.anchor(recordId, contentHash);
    await expect(contract.anchor(recordId, contentHash)).to.be.revertedWith("Already anchored");
  });

  it("rejects non-owner callers", async () => {
    const { contract, other } = await deploy();
    const recordId = ethers.keccak256(ethers.toUtf8Bytes("wo-test-003"));
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes("content"));

    await expect(contract.connect(other).anchor(recordId, contentHash)).to.be.revertedWith(
      "Not authorized"
    );
  });
});
