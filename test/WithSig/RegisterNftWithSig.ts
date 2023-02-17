import {expect} from "chai";
import {ethers} from "hardhat";
import {MAX_UINT256} from "../Scripts/constants";
import {deploySystem, TEST_SALE_CREATOR_BP} from "../Scripts/setup";
import {NFT_NOT_OWNED} from "../Scripts/errors";
import {getRegisterNftWithSigParts} from "../helpers/utils";

describe("MakerRegistrar RegisterNftWithSig", function () {
  it("Should allow 721 NFT registration ", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const {makerRegistrar, testingStandard721, parameterManager} =
      await deploySystem(OWNER);

    // Sig retrieval vars
    const verifyingContract = makerRegistrar.address;
    const signer = ALICE;
    // Args for registerNftWithSig
    // Args for freeReactWithSig
    const registrant = ALICE.address;
    const nftContractAddress = testingStandard721.address;
    const nftId = "1";
    const creatorAddress = BOB.address;
    const creatorSaleBasisPoints = TEST_SALE_CREATOR_BP;
    const optionBits = "0";
    const ipfsMetadataHash = "QmV288zHttJJwPBZAW3L922dBypWqukFNWzekT6chxW4Cu";

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

    // Mint the NFT to Alice
    testingStandard721.mint(ALICE.address, nftId);

    // Register the NFT from Alice's account and put Bob as the creator
    await makerRegistrar.connect(ALICE).registerNftWithSig({
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
    });
  });
});
