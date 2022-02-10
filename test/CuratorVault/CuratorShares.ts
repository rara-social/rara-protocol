import { expect } from "chai";
import { ethers } from "hardhat";
import { deploySystem } from "../Scripts/deploy";
import { NOT_CURATOR_VAULT } from "../Scripts/errors";

describe("CuratorShares", function () {
  it("Should get initialized with address manager", async function () {
    const [OWNER] = await ethers.getSigners();
    const { curatorShares, addressManager } = await deploySystem(OWNER);

    // Verify the address manager was set
    const currentAddressManager = await curatorShares.addressManager();
    expect(currentAddressManager).to.equal(addressManager.address);
  });

  it("Should only allow curator vault to mint or burn", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const { curatorShares, addressManager } = await deploySystem(OWNER);

    // Verify mint fails
    await expect(
      curatorShares.mint(ALICE.address, "1", "1", [0])
    ).to.be.revertedWith(NOT_CURATOR_VAULT);

    // Set the owner as the curator vault to test it succeeding
    await addressManager.setDefaultCuratorVault(OWNER.address);

    // Should succeed now
    await curatorShares.mint(ALICE.address, "1", "1", [0]);

    // Bob should not be allowed to burn
    await expect(
      curatorShares.connect(BOB).mint(ALICE.address, "1", "1", [0])
    ).to.be.revertedWith(NOT_CURATOR_VAULT);

    // Should succeed
    await curatorShares.burn(ALICE.address, "1", "1");
  });
});
