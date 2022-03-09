import { expect } from "chai";
import { ethers } from "hardhat";
import { deploySystem } from "../Scripts/setup";
import { NOT_ADMIN } from "../Scripts/errors";

describe("CuratorShares", function () {
  it("Should get initialized with address manager", async function () {
    const [OWNER] = await ethers.getSigners();
    const { curatorShares, addressManager } = await deploySystem(OWNER);

    // Verify the address manager was set
    const currentAddressManager = await curatorShares.addressManager();
    expect(currentAddressManager).to.equal(addressManager.address);
  });

  it("Should only allow curator vault admin to mint or burn", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const { curatorShares, roleManager } = await deploySystem(OWNER);

    // Verify mint fails
    await expect(
      curatorShares.mint(ALICE.address, "1", "1", [0])
    ).to.be.revertedWith(NOT_ADMIN);

    // Set the owner as the curator share admin to test it succeeding
    await roleManager.grantRole(await roleManager.CURATOR_SHARES_ADMIN(), OWNER.address);

    // Should succeed now
    await curatorShares.mint(ALICE.address, "1", "1", [0]);

    // Bob should not be allowed to burn
    await expect(
      curatorShares.connect(BOB).mint(ALICE.address, "1", "1", [0])
    ).to.be.revertedWith(NOT_ADMIN);

    // Should succeed
    await curatorShares.burn(ALICE.address, "1", "1");
  });
});
