import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { ZERO_ADDRESS } from "../Scripts/constants";
import { deploySystem } from "../Scripts/deploy";
import { ALREADY_REGISTERED, NFT_NOT_OWNED } from "../Scripts/errors";

describe("MakerVault", function () {
  it("Should get initialized with address manager", async function () {
    const [OWNER] = await ethers.getSigners();
    const { makerVault, addressManager } = await deploySystem(OWNER);

    // Verify the address manager was set
    const currentAddressManager = await makerVault.addressManager();
    expect(currentAddressManager).to.equal(addressManager.address);
  });

  it("Should verify NFT ownership", async function () {
    const [OWNER] = await ethers.getSigners();
    const { makerVault, testingStandard1155 } = await deploySystem(OWNER);

    // Since this is trying to register a non-existing NFT it should show the caller doesn't own it
    await expect(
      makerVault.registerNFT(
        testingStandard1155.address,
        "1",
        ZERO_ADDRESS,
        "0"
      )
    ).to.revertedWith(NFT_NOT_OWNED);
  });

  it("Should allow NFT registration only once", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const { makerVault, roleManager, testingStandard1155 } = await deploySystem(
      OWNER
    );

    // Mint an NFT to Alice
    const NFT_ID = "1";
    const reactionMinterRole = await roleManager.REACTION_MINTER_ROLE();
    roleManager.grantRole(reactionMinterRole, OWNER.address);
    testingStandard1155.mint(ALICE.address, NFT_ID, "1", [0]);

    // Register the NFT from Alice's account and put Bob as the creator
    // Verify event as well
    await makerVault
      .connect(ALICE)
      .registerNFT(testingStandard1155.address, NFT_ID, BOB.address, "0");

    // Verify it can't be registered again now that it is registered
    await expect(
      makerVault
        .connect(ALICE)
        .registerNFT(testingStandard1155.address, NFT_ID, BOB.address, "0")
    ).to.revertedWith(ALREADY_REGISTERED);
  });

  it("Should emit registration event and verify mappings", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const { makerVault, roleManager, testingStandard1155 } = await deploySystem(
      OWNER
    );

    // Mint an NFT to Alice
    const NFT_ID = "1";
    const OPTION_BITS = "0";
    const reactionMinterRole = await roleManager.REACTION_MINTER_ROLE();
    roleManager.grantRole(reactionMinterRole, OWNER.address);
    testingStandard1155.mint(ALICE.address, NFT_ID, "1", [0]);

    // Encode the params and hash it to get the meta URI
    const encodedParams = ethers.utils.defaultAbiCoder.encode(
      ["string", "uint256", "uint256"],
      ["MAKER", 1, 0]
    );
    const derivedMetaId = ethers.utils.keccak256(encodedParams);

    // First one registered should have source ID 1
    const EXPECTED_SOURCE_ID = "1";

    // Register the NFT from Alice's account and put Bob as the creator
    // Verify event as well
    await expect(
      makerVault
        .connect(ALICE)
        .registerNFT(
          testingStandard1155.address,
          NFT_ID,
          BOB.address,
          OPTION_BITS
        )
    )
      .to.emit(makerVault, "Registered")
      .withArgs(
        testingStandard1155.address,
        BigNumber.from(NFT_ID),
        ALICE.address,
        BOB.address,
        BigNumber.from(OPTION_BITS),
        BigNumber.from(EXPECTED_SOURCE_ID),
        derivedMetaId
      );

    // Verify lookups are set in the mapping
    // Verify source id from nft param
    expect(
      await makerVault.nftToSourceLookup(testingStandard1155.address, NFT_ID)
    ).to.equal(EXPECTED_SOURCE_ID);

    // Verify source from meta id
    expect(await makerVault.metaToSourceLookup(derivedMetaId)).to.equal(
      EXPECTED_SOURCE_ID
    );

    // Verify registration details from source id
    const [registered, owner, creator] = await makerVault.sourceToDetailsLookup(
      BigNumber.from(EXPECTED_SOURCE_ID)
    );
    expect(registered).to.equal(true);
    expect(owner).to.equal(ALICE.address);
    expect(creator).to.equal(BOB.address);
  });
});
