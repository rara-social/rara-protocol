import {expect} from "chai";
import {ethers} from "hardhat";
import {deploySystem} from "../Scripts/setup";
import {ONLY_DEPLOYER} from "../Scripts/errors";

describe.only("Child Registrar", function () {
  it("Should validate only deployer can update", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const {childRegistrar} = await deploySystem(OWNER);

    // Verify an account that did not deploy the contract can't set the fx root
    await expect(
      childRegistrar.connect(ALICE).setFxRootTunnel(BOB.address)
    ).to.revertedWith(ONLY_DEPLOYER);

    // Verify the owner can update it
    await childRegistrar.connect(OWNER).setFxRootTunnel(BOB.address);
  });
});
