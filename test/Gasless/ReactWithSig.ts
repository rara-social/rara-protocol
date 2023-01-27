import {expect} from "chai";
import {BigNumber} from "ethers";
import {ethers, upgrades} from "hardhat";
import {ZERO_ADDRESS, MAX_UINT256} from "../Scripts/constants";
import {deploySystem, TEST_REACTION_PRICE} from "../Scripts/setup";
import {deriveTransformId} from "../Scripts/derivedParams";
import {
  NFT_NOT_REGISTERED,
  UNKNOWN_NFT,
  REACTION_QUANTITY_TOO_HIGH,
} from "../Scripts/errors";
import {getReactWithSigParts} from "../helpers/utils";

describe("ReactWithSig Free Reaction", function () {
  it("Should issue a like token", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const {raraGasless, testingStandard1155, makerRegistrar} =
      await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;
    // Mint an NFT to Alice
    const NFT_ID = "1";
    testingStandard1155.mint(ALICE.address, NFT_ID, "1", [0]);
    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        NFT_ID,
        ZERO_ADDRESS,
        "0",
        "0",
        ""
      );
    const NFT_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      testingStandard1155.address,
      NFT_ID
    );
    // Encode the params and hash it to get the meta URI
    const TRANSFORM_ID = deriveTransformId(NFT_SOURCE_ID, BigNumber.from(0));
    // Assemble necessary variables for a reactWithSig call on Bob's behalf
    const vars = {
      // Sig retrieval vars
      signer: BOB,
      verifyingContract: raraGasless.address,
      // Function args for reactWithSig
      reactor: BOB.address,
      transformId: TRANSFORM_ID,
      quantity: 1,
      optionBits: 0,
      takerNftChainId: chainId,
      takerNftAddress: testingStandard1155.address,
      takerNftId: NFT_ID,
      ipfsMetadataHash: "ipfsMetadataHash",
      // Sig validation vars
      nonce: (await raraGasless.sigNonces(BOB.address)).toNumber(),
      deadline: MAX_UINT256,
    };
    // Produce a signature that can be passed to reactWithSig()
    const bobSignature = await getReactWithSigParts(
      vars.signer,
      vars.verifyingContract,
      vars.reactor,
      vars.transformId,
      vars.quantity,
      vars.optionBits,
      vars.takerNftChainId,
      vars.takerNftAddress,
      vars.takerNftId,
      vars.ipfsMetadataHash,
      vars.nonce,
      vars.deadline
    );
    // Execute Bob's reaction using his signature, paying bob's gas as the owner
    // Reacting for free with a registered reaction should succeed
    await expect(
      raraGasless.connect(OWNER).reactWithSig({
        reactor: vars.reactor,
        transformId: vars.transformId,
        quantity: vars.quantity,
        optionBits: vars.optionBits,
        takerNftChainId: vars.takerNftAddress,
        takerNftAddress: vars.takerNftAddress,
        takerNftId: vars.takerNftId,
        ipfsMetadataHash: vars.ipfsMetadataHash,
        sig: {
          v: bobSignature.v,
          r: bobSignature.r,
          s: bobSignature.s,
          deadline: MAX_UINT256,
        },
      })
    ).to.not.be.reverted;
  });
});
