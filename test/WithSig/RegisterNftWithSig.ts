import {expect} from "chai";
import {ethers} from "hardhat";
import {MAX_UINT256} from "../Scripts/constants";
import {deploySystem, TEST_SALE_CREATOR_BP} from "../Scripts/setup";
import {NFT_NOT_OWNED} from "../Scripts/errors";
import {getRegisterNftWithSigParts} from "../helpers/utils";
import {BigNumber} from "ethers";
import {deriveTransformId} from "../Scripts/derivedParams";

describe("MakerRegistrar RegisterNftWithSig", function () {
  it("Should emit registration event and verify mappings", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const {makerRegistrar, testingStandard1155, parameterManager} =
      await deploySystem(OWNER);

    // Sig retrieval vars
    const verifyingContract = makerRegistrar.address;
    const signer = ALICE;
    // Args for registerNftWithSig
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

    // Sig validation vars
    const nonce = (await parameterManager.sigNonces(signer.address)).toNumber();
    const deadline = MAX_UINT256;

    const signature = await getRegisterNftWithSigParts(
      signer,
      verifyingContract,
      registrant,
      nftContractAddress,
      nftId,
      creatorAddress,
      creatorSaleBasisPoints,
      optionBits,
      ipfsMetadataHash,
      nonce,
      deadline
    );

    // Should fail when it doesn't exist
    await expect(
      makerRegistrar.connect(ALICE).registerNftWithSig({
        registrant,
        nftContractAddress,
        nftId,
        creatorAddress,
        creatorSaleBasisPoints,
        optionBits,
        ipfsMetadataHash,
        sig: {
          v: signature.v,
          r: signature.r,
          s: signature.s,
          deadline: MAX_UINT256,
        },
      })
    ).to.revertedWith(NFT_NOT_OWNED);

    // Mint an NFT to Alice
    testingStandard1155.mint(ALICE.address, nftId, "1", [0]);

    // Register the NFT from Alice's account and put Bob as the creator
    await expect(
      makerRegistrar.connect(ALICE).registerNftWithSig({
        registrant,
        nftContractAddress,
        nftId,
        creatorAddress,
        creatorSaleBasisPoints,
        optionBits,
        ipfsMetadataHash,
        sig: {
          v: signature.v,
          r: signature.r,
          s: signature.s,
          deadline: MAX_UINT256,
        },
      })
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
});
