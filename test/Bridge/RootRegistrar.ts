import { expect } from "chai";
import { ethers } from "hardhat";
import { deploySystem } from "../Scripts/setup";
import { ONLY_DEPLOYER } from "../Scripts/errors";
import { ZERO_ADDRESS } from "../Scripts/constants";

describe("Root Registrar", function () {
  it("Should validate only deployer can update", async function () {
    const [OWNER, ALICE, BOB, CAROL] = await ethers.getSigners();

    const RootRegistrarFactory = await ethers.getContractFactory(
      "RootRegistrar"
    );
    // Fake addresses in the deploy - they aren't used
    const rootRegistrar = await RootRegistrarFactory.deploy(
      ZERO_ADDRESS,
      CAROL.address,
      "0x3d1d3E34f7fB6D26245E6640E1c50710eFFf15bA"
    );

    // Verify an account that did not deploy the contract can't set the fx root
    await expect(
      rootRegistrar.connect(ALICE).setFxChildTunnel(BOB.address)
    ).to.revertedWith(ONLY_DEPLOYER);

    // Verify the owner can update it
    await rootRegistrar.connect(OWNER).setFxChildTunnel(BOB.address);
  });

});
