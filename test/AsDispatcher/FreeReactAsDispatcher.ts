import {expect} from "chai";
import {ethers} from "hardhat";
import {deploySystem, TEST_SALE_CREATOR_BP} from "../Scripts/setup";
import {BigNumber} from "ethers";
import {
  deriveLikeTokenIndex,
  deriveTransformId,
} from "../Scripts/derivedParams";
import {ZERO_ADDRESS} from "../Scripts/constants";
import {NOT_ACCOUNT_HOLDER_OR_DISPATCHER} from "../Scripts/errors";

describe("ReactionVault FreeReactAsDispatcher", function () {
  it("Should issue a like token", async function () {
    const [OWNER, ALICE, BOB, DISPATCHER] = await ethers.getSigners();
    const {
      reactionVault,
      makerRegistrar,
      likeTokenFactory,
      testingStandard1155,
      dispatcherManager,
    } = await deploySystem(OWNER);

    // Assign a dispatcher for Bob
    await dispatcherManager.connect(BOB).addDispatcher(DISPATCHER.address);

    // Mint an NFT to Alice
    const chainId = (await ethers.provider.getNetwork()).chainId;
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

    // Args for freeReactAsDispatcher
    const reactor = BOB.address;
    const transformId = TRANSFORM_ID;
    const quantity = 1;
    const optionBits = 0;
    const takerNftChainId = chainId;
    const takerNftAddress = testingStandard1155.address;
    const takerNftId = NFT_ID;
    const ipfsMetadataHash = "ipfsMetadataHash";

    // From Bob's dispatcher, register a free reaction
    const tx = await reactionVault
      .connect(DISPATCHER)
      .freeReactAsDispatcher(
        reactor,
        transformId,
        optionBits,
        takerNftChainId,
        takerNftAddress,
        takerNftId,
        quantity,
        ipfsMetadataHash
      );
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
  it("Should fail as non-dispatcher", async function () {
    const [OWNER, ALICE, BOB, NON_DISPATCHER] = await ethers.getSigners();
    const {
      reactionVault,
      makerRegistrar,
      likeTokenFactory,
      testingStandard1155,
      dispatcherManager,
    } = await deploySystem(OWNER);

    // Mint an NFT to Alice
    const chainId = (await ethers.provider.getNetwork()).chainId;
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

    // Args for freeReactAsDispatcher
    const reactor = BOB.address;
    const transformId = TRANSFORM_ID;
    const quantity = 1;
    const optionBits = 0;
    const takerNftChainId = chainId;
    const takerNftAddress = testingStandard1155.address;
    const takerNftId = NFT_ID;
    const ipfsMetadataHash = "ipfsMetadataHash";

    // From Bob's dispatcher, register a free reaction
    await expect(
      reactionVault
        .connect(NON_DISPATCHER)
        .freeReactAsDispatcher(
          reactor,
          transformId,
          optionBits,
          takerNftChainId,
          takerNftAddress,
          takerNftId,
          quantity,
          ipfsMetadataHash
        )
    ).to.revertedWith(NOT_ACCOUNT_HOLDER_OR_DISPATCHER);
  });
});
