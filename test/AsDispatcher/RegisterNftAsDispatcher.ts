import {expect} from "chai";
import {ethers} from "hardhat";
import {deploySystem, TEST_SALE_CREATOR_BP} from "../Scripts/setup";
import {BigNumber} from "ethers";
import {deriveTransformId} from "../Scripts/derivedParams";
import {NOT_ACCOUNT_HOLDER_OR_DISPATCHER} from "../Scripts/errors";

describe("MakerRegistrar RegisterNftAsDispatcher", function () {
  it("Should emit registration event and verify mappings", async function () {
    const [OWNER, ALICE, BOB, DISPATCHER] = await ethers.getSigners();
    const {makerRegistrar, testingStandard1155, dispatcherManager} =
      await deploySystem(OWNER);

    // Assign a dispatcher for Alice
    await dispatcherManager.connect(ALICE).addDispatcher(DISPATCHER.address);

    // Args for registerNftAsDispatcher
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const registrant = ALICE.address;
    const nftContractAddress = testingStandard1155.address;
    const nftId = "1";
    const creatorAddress = BOB.address;
    const creatorSaleBasisPoints = TEST_SALE_CREATOR_BP;
    const optionBits = "0";
    const ipfsMetadataHash = "QmV288zHttJJwPBZAW3L922dBypWqukFNWzekT6chxW4Cu";

    // Get the source ID from the lookup
    const EXPECTED_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      nftContractAddress,
      nftId
    );

    // Encode the params and hash it to get the meta URI
    const derivedMetaId = deriveTransformId(
      EXPECTED_SOURCE_ID,
      BigNumber.from(0)
    );

    // Mint an NFT to Alice
    testingStandard1155.mint(ALICE.address, nftId, "1", [0]);

    // From Alice's dispatcher, register the NFT from Alice's account and put Bob as the creator
    await expect(
      makerRegistrar
        .connect(DISPATCHER)
        .registerNftAsDispatcher(
          registrant,
          nftContractAddress,
          nftId,
          creatorAddress,
          creatorSaleBasisPoints,
          optionBits,
          ipfsMetadataHash
        )
    )
      .to.emit(makerRegistrar, "Registered")
      .withArgs(
        chainId,
        nftContractAddress,
        BigNumber.from(nftId),
        ALICE.address,
        [BOB.address],
        [BigNumber.from(TEST_SALE_CREATOR_BP)],
        BigNumber.from(optionBits),
        BigNumber.from(EXPECTED_SOURCE_ID),
        derivedMetaId,
        ipfsMetadataHash
      );
  });
  it("Should fail as non-dispatcher", async function () {
    const [OWNER, ALICE, BOB, NOT_DISPATCHER] = await ethers.getSigners();
    const {makerRegistrar, testingStandard1155} = await deploySystem(OWNER);

    // Args for registerNftAsDispatcher
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const registrant = ALICE.address;
    const nftContractAddress = testingStandard1155.address;
    const nftId = "1";
    const creatorAddress = BOB.address;
    const creatorSaleBasisPoints = TEST_SALE_CREATOR_BP;
    const optionBits = "0";
    const ipfsMetadataHash = "QmV288zHttJJwPBZAW3L922dBypWqukFNWzekT6chxW4Cu";

    // Get the source ID from the lookup
    const EXPECTED_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      nftContractAddress,
      nftId
    );

    // Encode the params and hash it to get the meta URI
    const derivedMetaId = deriveTransformId(
      EXPECTED_SOURCE_ID,
      BigNumber.from(0)
    );

    // Mint an NFT to Alice
    testingStandard1155.mint(ALICE.address, nftId, "1", [0]);

    // From a non-dispatcher, attempt register the NFT from Alice's account and put Bob as the creator
    await expect(
      makerRegistrar
        .connect(NOT_DISPATCHER)
        .registerNftAsDispatcher(
          registrant,
          nftContractAddress,
          nftId,
          creatorAddress,
          creatorSaleBasisPoints,
          optionBits,
          ipfsMetadataHash
        )
    ).to.revertedWith(NOT_ACCOUNT_HOLDER_OR_DISPATCHER);
  });
});
