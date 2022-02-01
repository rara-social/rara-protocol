import { expect } from "chai";
import { ethers } from "hardhat";
import { deploySystem } from "../Scripts/deploy";

describe("AddressManager", function () {
  it("Should get initialized with role manager", async function () {
    const [OWNER] = await ethers.getSigners();
    const { addressManager, roleManager } = await deploySystem(OWNER);

    // Verify the role manager was set
    const currentAddressManager = await addressManager.roleManager();
    expect(currentAddressManager).to.equal(roleManager.address);
  });

  it("Should allow owner to set role manager address", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const { addressManager } = await deploySystem(OWNER);

    // Set it to Alice's address
    await addressManager.setRoleManager(ALICE.address);

    // Verify it got set
    const currentAddressManager = await addressManager.roleManager();
    expect(currentAddressManager).to.equal(ALICE.address);

    // Verify non owner can't update address
    await expect(addressManager.connect(ALICE).setRoleManager(BOB.address)).to
      .be.reverted;
  });
});
