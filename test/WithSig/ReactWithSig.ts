import {expect} from "chai";
import {BigNumber} from "ethers";
import {ethers} from "hardhat";
import {ZERO_ADDRESS, MAX_UINT256} from "../Scripts/constants";
import {deploySystem} from "../Scripts/setup";
import {
  deriveTransformId,
  deriveLikeTokenIndex,
} from "../Scripts/derivedParams";
import {
  NFT_NOT_REGISTERED,
  UNKNOWN_NFT,
  REACTION_QUANTITY_TOO_HIGH,
  SIGNATURE_EXPIRED,
  SIGNATURE_INVALID,
} from "../Scripts/errors";
import {getReactWithSigParts} from "../helpers/utils";

describe("ReactionVault ReactWithSig", function () {
  it("Should reject unknown transform", async function () {
    const [OWNER, , BOB] = await ethers.getSigners();
    const {reactionVault, parameterManager} = await deploySystem(OWNER);

    // Sig retrieval vars
    const verifyingContract = reactionVault.address;
    const signer = BOB;
    // Args for reactWithSig
    const reactor = BOB.address;
    const transformId = 123456;
    const quantity = 1;
    const optionBits = 0;
    const takerNftChainId = 0;
    const takerNftAddress = ZERO_ADDRESS;
    const takerNftId = 0;
    const ipfsMetadataHash = "ipfsMetadataHash";

    // Sig validation vars
    const nonce = (await parameterManager.sigNonces(signer.address)).toNumber();
    const deadline = MAX_UINT256;

    // Produce a signature that can be passed to reactWithSig()
    const signature = await getReactWithSigParts(
      signer,
      verifyingContract,
      reactor,
      transformId,
      quantity,
      optionBits,
      takerNftChainId,
      takerNftAddress,
      takerNftId,
      ipfsMetadataHash,
      nonce,
      deadline
    );

    await expect(
      reactionVault.connect(OWNER).reactWithSig({
        reactor,
        transformId,
        quantity,
        optionBits,
        takerNftChainId,
        takerNftAddress,
        takerNftId,
        ipfsMetadataHash,
        sig: {
          v: signature.v,
          r: signature.r,
          s: signature.s,
          deadline: MAX_UINT256,
        },
      })
    ).to.be.revertedWith(UNKNOWN_NFT);
  });
  it("Should reject unregistered transform", async function () {
    const [OWNER, ALICE] = await ethers.getSigners();
    const {
      reactionVault,
      testingStandard1155,
      makerRegistrar,
      parameterManager,
    } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Now register and unregister an NFT and get the Meta ID
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

    // Unregister it
    await makerRegistrar
      .connect(ALICE)
      .deregisterNft(testingStandard1155.address, NFT_ID);

    // Sig retrieval vars
    const verifyingContract = reactionVault.address;
    const signer = ALICE;
    // Args for reactWithSig
    const reactor = ALICE.address;
    const transformId = TRANSFORM_ID;
    const quantity = 1;
    const optionBits = 0;
    const takerNftChainId = chainId;
    const takerNftAddress = testingStandard1155.address;
    const takerNftId = NFT_ID;
    const ipfsMetadataHash = "ipfsMetadataHash";

    // Sig validation vars
    const nonce = (await parameterManager.sigNonces(signer.address)).toNumber();
    const deadline = MAX_UINT256;

    // Produce a signature that can be passed to reactWithSig()
    const signature = await getReactWithSigParts(
      signer,
      verifyingContract,
      reactor,
      transformId,
      quantity,
      optionBits,
      takerNftChainId,
      takerNftAddress,
      takerNftId,
      ipfsMetadataHash,
      nonce,
      deadline
    );

    await expect(
      reactionVault.connect(OWNER).reactWithSig({
        reactor,
        transformId,
        quantity,
        optionBits,
        takerNftChainId,
        takerNftAddress,
        takerNftId,
        ipfsMetadataHash,
        sig: {
          v: signature.v,
          r: signature.r,
          s: signature.s,
          deadline: MAX_UINT256,
        },
      })
    ).to.be.revertedWith(NFT_NOT_REGISTERED);
  });
  it("Should fail on sig with invalid deadline", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const {
      reactionVault,
      testingStandard1155,
      makerRegistrar,
      parameterManager,
    } = await deploySystem(OWNER);
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

    // Define variables neeeded for a reactWithSig call on Bob's behalf
    // ----------------------------------------------------------------
    // Sig retrieval vars
    const verifyingContract = reactionVault.address;
    const signer = BOB;
    // Args for reactWithSig
    const reactor = BOB.address;
    const transformId = TRANSFORM_ID;
    const quantity = 1;
    const optionBits = 0;
    const takerNftChainId = chainId;
    const takerNftAddress = testingStandard1155.address;
    const takerNftId = NFT_ID;
    const ipfsMetadataHash = "ipfsMetadataHash";
    // Sig validation vars
    const nonce = (await parameterManager.sigNonces(signer.address)).toNumber();
    const deadline = MAX_UINT256;

    // Produce a signature that can be passed to reactWithSig()
    const signature = await getReactWithSigParts(
      signer,
      verifyingContract,
      reactor,
      transformId,
      quantity,
      optionBits,
      takerNftChainId,
      takerNftAddress,
      takerNftId,
      ipfsMetadataHash,
      nonce,
      deadline
    );

    await expect(
      reactionVault.connect(OWNER).reactWithSig({
        reactor,
        transformId,
        quantity,
        optionBits,
        takerNftChainId,
        takerNftAddress,
        takerNftId,
        ipfsMetadataHash,
        sig: {
          v: signature.v,
          r: signature.r,
          s: signature.s,
          deadline: "0", // make the deadline expired
        },
      })
    ).to.be.revertedWith(SIGNATURE_EXPIRED);
  });
  it("Should fail on sig with invalid nonce", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const {
      reactionVault,
      testingStandard1155,
      makerRegistrar,
      parameterManager,
    } = await deploySystem(OWNER);
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

    // Define variables neeeded for a reactWithSig call on Bob's behalf
    // ----------------------------------------------------------------
    // Sig retrieval vars
    const verifyingContract = reactionVault.address;
    const signer = BOB;
    // Args for reactWithSig
    const reactor = BOB.address;
    const transformId = TRANSFORM_ID;
    const quantity = 1;
    const optionBits = 0;
    const takerNftChainId = chainId;
    const takerNftAddress = testingStandard1155.address;
    const takerNftId = NFT_ID;
    const ipfsMetadataHash = "ipfsMetadataHash";
    // Sig validation vars
    const nonce = (await parameterManager.sigNonces(signer.address)).toNumber();
    const deadline = MAX_UINT256;

    // Produce a signature that can be passed to reactWithSig()
    const signature = await getReactWithSigParts(
      signer,
      verifyingContract,
      reactor,
      transformId,
      quantity,
      optionBits,
      takerNftChainId,
      takerNftAddress,
      takerNftId,
      ipfsMetadataHash,
      nonce + 1, // make the nonce invalid
      deadline
    );

    await expect(
      reactionVault.connect(OWNER).reactWithSig({
        reactor,
        transformId,
        quantity,
        optionBits,
        takerNftChainId,
        takerNftAddress,
        takerNftId,
        ipfsMetadataHash,
        sig: {
          v: signature.v,
          r: signature.r,
          s: signature.s,
          deadline,
        },
      })
    ).to.be.revertedWith(SIGNATURE_INVALID);
  });
  it("Should issue a like token", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const {
      reactionVault,
      likeTokenFactory,
      testingStandard1155,
      makerRegistrar,
      parameterManager,
    } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;
    // Mint an NFT to Alice
    const NFT_ID = 1;
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

    // Define variables neeeded for a reactWithSig call on Bob's behalf
    // ----------------------------------------------------------------
    // Sig retrieval vars
    const verifyingContract = reactionVault.address;
    const signer = BOB;
    // Args for reactWithSig
    const reactor = BOB.address;
    const transformId = TRANSFORM_ID;
    const quantity = 1;
    const optionBits = 0;
    const takerNftChainId = chainId;
    const takerNftAddress = testingStandard1155.address;
    const takerNftId = NFT_ID;
    const ipfsMetadataHash = "ipfsMetadataHash";
    // Sig validation vars
    const nonce = (await parameterManager.sigNonces(signer.address)).toNumber();
    const deadline = MAX_UINT256;

    // Produce a signature that can be passed to reactWithSig()
    const signature = await getReactWithSigParts(
      signer,
      verifyingContract,
      reactor,
      transformId,
      quantity,
      optionBits,
      takerNftChainId,
      takerNftAddress,
      takerNftId,
      ipfsMetadataHash,
      nonce,
      deadline
    );

    const tx = await reactionVault.connect(OWNER).reactWithSig({
      reactor,
      transformId,
      quantity,
      optionBits,
      takerNftChainId,
      takerNftAddress,
      takerNftId,
      ipfsMetadataHash,
      sig: {
        v: signature.v,
        r: signature.r,
        s: signature.s,
        deadline: MAX_UINT256,
      },
    });
    const receipt = await tx.wait();

    // Confirm a LikeToken was deployed
    const likeTokenInitializedEvent = receipt.events?.find(
      ({event}) => event === "Initialized"
    );
    expect(likeTokenInitializedEvent);

    // Confirm the LikeToken contract address
    const tokenKey = deriveLikeTokenIndex(chainId, takerNftAddress, takerNftId);
    const likeTokenAddress = await likeTokenFactory.likeTokens(tokenKey);
    expect(likeTokenInitializedEvent?.address).equals(likeTokenAddress);

    // Confirm the reactor's new LikeToken balance is 1
    const LikeTokenFactory = await ethers.getContractFactory("LikeToken1155");
    const likeToken = LikeTokenFactory.attach(likeTokenAddress);
    const reactorLikeTokenId = await likeToken.idCount();
    const balance = await likeToken.balanceOf(reactor, reactorLikeTokenId);
    expect(balance.toNumber()).equals(1);
  });

  it("Should prevent spending more reactions than freeReactionLimit param", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const {
      reactionVault,
      testingStandard1155,
      makerRegistrar,
      parameterManager,
    } = await deploySystem(OWNER);
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

    // Encode the params and hash it to get the meta URI
    const NFT_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      testingStandard1155.address,
      NFT_ID
    );
    const TRANSFORM_ID = deriveTransformId(NFT_SOURCE_ID, BigNumber.from(0));

    // Define variables neeeded for a reactWithSig call on Bob's behalf
    // ----------------------------------------------------------------
    // Sig retrieval vars
    const verifyingContract = reactionVault.address;
    const signer = BOB;
    // Args for reactWithSig
    const reactor = BOB.address;
    const transformId = TRANSFORM_ID;
    const quantity = 2; // invalid quantity
    const optionBits = 0;
    const takerNftChainId = chainId;
    const takerNftAddress = testingStandard1155.address;
    const takerNftId = NFT_ID;
    const ipfsMetadataHash = "ipfsMetadataHash";
    // Sig validation vars
    const nonce = (await parameterManager.sigNonces(signer.address)).toNumber();
    const deadline = MAX_UINT256;

    // Produce a signature that can be passed to reactWithSig()
    const signature = await getReactWithSigParts(
      signer,
      verifyingContract,
      reactor,
      transformId,
      quantity,
      optionBits,
      takerNftChainId,
      takerNftAddress,
      takerNftId,
      ipfsMetadataHash,
      nonce,
      deadline
    );

    await expect(
      reactionVault.connect(OWNER).reactWithSig({
        reactor,
        transformId,
        quantity,
        optionBits,
        takerNftChainId,
        takerNftAddress,
        takerNftId,
        ipfsMetadataHash,
        sig: {
          v: signature.v,
          r: signature.r,
          s: signature.s,
          deadline: MAX_UINT256,
        },
      })
    ).to.be.revertedWith(REACTION_QUANTITY_TOO_HIGH);
  });
});
