import { expect } from "chai";
import { ethers } from "hardhat";
import { ZERO_ADDRESS } from "../Scripts/constants";
import { deploySystem } from "../Scripts/setup";
import { NOT_BRIDGE } from "../Scripts/errors";

describe("Bridge Registrar", function () {
  it("Should get initialized with address manager", async function () {
    const [OWNER] = await ethers.getSigners();
    const { addressManager, childRegistrar } = await deploySystem(OWNER);

    // Verify the role manager was set
    const currentAddressManager = await childRegistrar.addressManager();
    expect(currentAddressManager).to.equal(addressManager.address);
  });

  it("Should prevent non child registrar from registering or de-registering", async function () {
    const [OWNER] = await ethers.getSigners();
    const { makerRegistrar, testingStandard1155 } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const metadataHash = "QmV288zHttJJwPBZAW3L922dBypWqukFNWzekT6chxW4Cu";

    await expect(
      makerRegistrar.registerNftFromBridge(
        OWNER.address,
        chainId,
        testingStandard1155.address,
        "1",
        [ZERO_ADDRESS],
        ["0"],
        "0",
        metadataHash
      )
    ).to.revertedWith(NOT_BRIDGE);

    await expect(
      makerRegistrar.deRegisterNftFromBridge(
        OWNER.address,
        chainId,
        testingStandard1155.address,
        "1"
      )
    ).to.revertedWith(NOT_BRIDGE);
  });

  it("Should allow register and de-register via bridge", async function () {
    const [OWNER, ALICE, BOB, CHILD] = await ethers.getSigners();
    const { makerRegistrar, roleManager, testingStandard1155, addressManager } =
      await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Mint an NFT to Alice
    const NFT_ID = "1";
    testingStandard1155.mint(ALICE.address, NFT_ID, "1", [0]);

    // Set child registrar address as the bridge so it can call the functions
    await addressManager.setChildRegistrar(CHILD.address);

    const metadataHash = "QmV288zHttJJwPBZAW3L922dBypWqukFNWzekT6chxW4Cu";

    // Register the NFT from Alice's account and put Bob as the creator
    await makerRegistrar
      .connect(CHILD)
      .registerNftFromBridge(
        ALICE.address,
        chainId,
        testingStandard1155.address,
        NFT_ID,
        [BOB.address],
        ["100"],
        "0",
        metadataHash
      );

    // De-register
    await makerRegistrar
      .connect(CHILD)
      .deRegisterNftFromBridge(
        ALICE.address,
        chainId,
        testingStandard1155.address,
        NFT_ID
      );
  });
});
