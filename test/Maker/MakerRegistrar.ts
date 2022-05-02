import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { ZERO_ADDRESS } from "../Scripts/constants";
import { deploySystem, TEST_SALE_CREATOR_BP } from "../Scripts/setup";
import { deriveTransformId } from "../Scripts/derivedParams";
import {
  ALREADY_REGISTERED,
  INVALID_BP,
  NFT_NOT_OWNED,
  NFT_NOT_REGISTERED,
} from "../Scripts/errors";

describe("MakerRegistrar", function () {
  it("Should get initialized with address manager", async function () {
    const [OWNER] = await ethers.getSigners();
    const { makerRegistrar, addressManager } = await deploySystem(OWNER);

    // Verify the address manager was set
    const currentAddressManager = await makerRegistrar.addressManager();
    expect(currentAddressManager).to.equal(addressManager.address);
  });

  it("Should verify NFT ownership on register", async function () {
    const [OWNER] = await ethers.getSigners();
    const { makerRegistrar, testingStandard1155 } = await deploySystem(OWNER);

    // Since this is trying to register a non-existing NFT it should show the caller doesn't own it
    await expect(
      makerRegistrar.registerNft(
        testingStandard1155.address,
        "1",
        ZERO_ADDRESS,
        "0",
        "0",
        ""
      )
    ).to.revertedWith(NFT_NOT_OWNED);
  });

  it("Should allow 721 NFT registration ", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const { makerRegistrar, testingStandard721 } = await deploySystem(OWNER);

    // Mint an NFT to Alice
    const NFT_ID = "1";

    const metadataHash = "QmV288zHttJJwPBZAW3L922dBypWqukFNWzekT6chxW4Cu";

    // Should fail when it doesn't exist
    await expect(
      makerRegistrar
        .connect(ALICE)
        .registerNft(
          testingStandard721.address,
          NFT_ID,
          BOB.address,
          TEST_SALE_CREATOR_BP,
          "0",
          metadataHash
        )
    ).to.revertedWith(NFT_NOT_OWNED);

    // Mint the NFT
    testingStandard721.mint(ALICE.address, NFT_ID);

    // Register the NFT from Alice's account and put Bob as the creator
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard721.address,
        NFT_ID,
        BOB.address,
        TEST_SALE_CREATOR_BP,
        "0",
        metadataHash
      );
  });

  it("Should allow NFT registration again w/ different parameters", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const { makerRegistrar, roleManager, testingStandard1155 } =
      await deploySystem(OWNER);

    // Mint an NFT to Alice
    const NFT_ID = "1";
    testingStandard1155.mint(ALICE.address, NFT_ID, "1", [0]);

    const metadataHash = "QmV288zHttJJwPBZAW3L922dBypWqukFNWzekT6chxW4Cu";

    // Register the NFT from Alice's account and put Bob as the creator
    // Verify event as well
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        NFT_ID,
        BOB.address,
        TEST_SALE_CREATOR_BP,
        "0",
        metadataHash
      );

    // Verify it can be registered again with same transform (optionsBits) to update the curator cut
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        NFT_ID,
        BOB.address,
        TEST_SALE_CREATOR_BP + 10,
        "0",
        metadataHash
      );

    // check for creator cut

    // Verify it can be registered again with different transform (optionsBits)
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        NFT_ID,
        BOB.address,
        TEST_SALE_CREATOR_BP + 10,
        "01010",
        metadataHash
      );

    // check for creator cut
  });

  it("Should check creator BP out of bounds", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const { makerRegistrar, roleManager, testingStandard1155 } =
      await deploySystem(OWNER);

    // Mint an NFT to Alice
    const NFT_ID = "1";
    testingStandard1155.mint(ALICE.address, NFT_ID, "1", [0]);

    const metadataHash = "QmV288zHttJJwPBZAW3L922dBypWqukFNWzekT6chxW4Cu";

    // Verify anything over 100% is rejected (10_000 bp is 100%)
    await expect(
      makerRegistrar
        .connect(ALICE)
        .registerNft(
          testingStandard1155.address,
          NFT_ID,
          BOB.address,
          "10001",
          "0",
          metadataHash
        )
    ).to.revertedWith(INVALID_BP);
  });

  it("Should emit registration event and verify mappings", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const { makerRegistrar, roleManager, testingStandard1155 } =
      await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Mint an NFT to Alice
    const NFT_ID = "1";
    const OPTION_BITS = "0";
    testingStandard1155.mint(ALICE.address, NFT_ID, "1", [0]);

    // Get the source ID from the lookup
    const EXPECTED_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      testingStandard1155.address,
      NFT_ID
    );

    // Encode the params and hash it to get the meta URI
    const derivedMetaId = deriveTransformId(
      EXPECTED_SOURCE_ID,
      BigNumber.from(0)
    );

    const metadataHash = "QmV288zHttJJwPBZAW3L922dBypWqukFNWzekT6chxW4Cu";

    // Register the NFT from Alice's account and put Bob as the creator
    // Verify event as well
    await expect(
      makerRegistrar
        .connect(ALICE)
        .registerNft(
          testingStandard1155.address,
          NFT_ID,
          BOB.address,
          TEST_SALE_CREATOR_BP,
          OPTION_BITS,
          metadataHash
        )
    )
      .to.emit(makerRegistrar, "Registered")
      .withArgs(
        chainId,
        testingStandard1155.address,
        BigNumber.from(NFT_ID),
        ALICE.address,
        BOB.address,
        BigNumber.from(TEST_SALE_CREATOR_BP),
        BigNumber.from(OPTION_BITS),
        BigNumber.from(EXPECTED_SOURCE_ID),
        derivedMetaId,
        metadataHash
      );

    // Verify lookups are set in the mapping
    // Verify source id from nft param
    expect(
      await makerRegistrar.deriveSourceId(
        chainId,
        testingStandard1155.address,
        NFT_ID
      )
    ).to.equal(EXPECTED_SOURCE_ID);

    // Verify source from meta id
    expect(
      await makerRegistrar.transformToSourceLookup(derivedMetaId)
    ).to.equal(EXPECTED_SOURCE_ID);

    // Verify registration details from source id
    const [registered, owner, creator] =
      await makerRegistrar.sourceToDetailsLookup(
        BigNumber.from(EXPECTED_SOURCE_ID)
      );
    expect(registered).to.equal(true);
    expect(owner).to.equal(ALICE.address);
    expect(creator).to.equal(BOB.address);
  });

  it("Should verify NFT ownership on deregister", async function () {
    const [OWNER] = await ethers.getSigners();
    const { makerRegistrar, testingStandard1155 } = await deploySystem(OWNER);

    // Since this is trying to deregister a non-existing NFT it should show the caller doesn't own it
    await expect(
      makerRegistrar.deregisterNft(testingStandard1155.address, "1")
    ).to.revertedWith(NFT_NOT_OWNED);
  });

  it("Should register and deregister and check event", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const { makerRegistrar, testingStandard1155, roleManager } =
      await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Mint an NFT to Alice
    const NFT_ID = "1";
    testingStandard1155.mint(ALICE.address, NFT_ID, "1", [0]);

    // Verify NFT unknown in the system can't be deregsitered
    await expect(
      makerRegistrar
        .connect(ALICE)
        .deregisterNft(testingStandard1155.address, NFT_ID)
    ).to.revertedWith(NFT_NOT_REGISTERED);

    const metadataHash = "QmV288zHttJJwPBZAW3L922dBypWqukFNWzekT6chxW4Cu";

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        NFT_ID,
        BOB.address,
        TEST_SALE_CREATOR_BP,
        "0",
        metadataHash
      );

    // Get the source ID from the lookup
    const EXPECTED_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      testingStandard1155.address,
      NFT_ID
    );

    // Deregister it and check event params
    await expect(
      makerRegistrar
        .connect(ALICE)
        .deregisterNft(testingStandard1155.address, NFT_ID)
    )
      .to.emit(makerRegistrar, "Deregistered")
      .withArgs(
        chainId,
        testingStandard1155.address,
        BigNumber.from(NFT_ID),
        ALICE.address,
        EXPECTED_SOURCE_ID
      );

    // Second Deregister should fail
    await expect(
      makerRegistrar
        .connect(ALICE)
        .deregisterNft(testingStandard1155.address, NFT_ID)
    ).to.revertedWith(NFT_NOT_REGISTERED);

    // Verify the flag was set to false
    const [registered] = await makerRegistrar.sourceToDetailsLookup(
      BigNumber.from(EXPECTED_SOURCE_ID)
    );
    expect(registered).to.equal(false);
  });
});
