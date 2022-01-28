import { expect } from "chai";
import { ethers } from "hardhat";

describe("AddressManager", function () {
  it("Should set Maker Vault Address", async function () {
    const MakerVault = await ethers.getContractFactory("AddressManager");
    const deployedMakerVault = await MakerVault.deploy();
    await deployedMakerVault.deployed();

    expect(await deployedMakerVault.makerVault()).to.equal(
      "0x0000000000000000000000000000000000000000"
    );

    deployedMakerVault.setMakerVault(
      "0x0000000000000000000000000000000000000001"
    );

    expect(await deployedMakerVault.makerVault()).to.equal(
      "0x0000000000000000000000000000000000000001"
    );
  });
});
