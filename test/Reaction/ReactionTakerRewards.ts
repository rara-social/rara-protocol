import {expect} from "chai";
import {BigNumber} from "ethers";
import {ethers} from "hardhat";
import {ZERO_ADDRESS} from "../Scripts/constants";
import {
  deploySystem,
  TEST_REACTION_PRICE,
  TEST_SALE_CREATOR_BP,
  TEST_SALE_CURATOR_LIABILITY_BP,
} from "../Scripts/setup";
import {
  deriveTransformId,
  deriveReactionId,
  deriveReactionParameterVersion,
  deriveTakerRewardsKey,
} from "../Scripts/derivedParams";
import {
  NFT_NOT_OWNED,
  NFT_NOT_REGISTERED,
  NO_REWARDS,
  REWARDS_LT_BURN,
} from "../Scripts/errors";

describe("ReactionVault Taker Rewards", function () {
  it("Should fail without rewards allocated", async function () {
    const [OWNER, MAKER, ALICE] = await ethers.getSigners();
    const {
      reactionVault,
      testingStandard1155,
      roleManager,
      paymentTokenErc20,
      curatorVault,
    } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Now register an NFT and get the Meta ID
    // Mint an NFT to Alice
    const NFT_ID = "1";
    testingStandard1155.mint(MAKER.address, NFT_ID, "1", [0]);

    // Verify withdrawing rewards for unknown Taker NFT fails
    expect(
      reactionVault
        .connect(ALICE)
        .withdrawTakerRewards(
          chainId,
          testingStandard1155.address,
          NFT_ID,
          paymentTokenErc20.address,
          curatorVault.address,
          NFT_ID,
          "20",
          ALICE.address
        )
    ).to.be.revertedWith(NO_REWARDS);
  });

  it("Should spend reaction and let taker withdraw - all tokens", async function () {
    const [OWNER, ALICE, CREATOR, REFERRER, TAKER] = await ethers.getSigners();
    const {
      reactionVault,
      testingStandard1155,
      makerRegistrar,
      roleManager,
      paymentTokenErc20,
      curatorVault,
    } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Now register an NFT and get the Meta ID
    // Mint an NFT to Alice
    const MAKER_NFT_ID = "1";
    const TAKER_NFT_ID = "2";
    testingStandard1155.mint(ALICE.address, MAKER_NFT_ID, "1", [0]);

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        MAKER_NFT_ID,
        CREATOR.address,
        TEST_SALE_CREATOR_BP,
        "0"
      );

    // Get the NFT source ID
    const NFT_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      testingStandard1155.address,
      MAKER_NFT_ID
    );

    // Encode the params and hash it to get the meta URI
    const TRANSFORM_ID = deriveTransformId(NFT_SOURCE_ID, BigNumber.from(0));

    // Mint the purchase price amount of tokens to the owner
    paymentTokenErc20.mint(OWNER.address, TEST_REACTION_PRICE);

    // Approve the transfer of payment tokens
    paymentTokenErc20.approve(reactionVault.address, TEST_REACTION_PRICE);

    const REACTION_AMOUNT = BigNumber.from(1);

    // Buy the reaction
    await reactionVault.buyReaction(
      TRANSFORM_ID,
      REACTION_AMOUNT,
      OWNER.address, // Where reactions should end up
      REFERRER.address, // Referrer
      BigNumber.from(0)
    );

    // Derive the reaction meta ID
    const REACTION_NFT_PARAMETER_VERSION = deriveReactionParameterVersion(
      paymentTokenErc20.address,
      TEST_REACTION_PRICE,
      BigNumber.from(TEST_SALE_CURATOR_LIABILITY_BP)
    );

    const REACTION_NFT_META_ID = deriveReactionId(
      BigNumber.from(REACTION_NFT_PARAMETER_VERSION),
      BigNumber.from(TRANSFORM_ID),
      BigNumber.from(0)
    );

    const metadataHash = BigNumber.from(111);

    // Now spend it
    await reactionVault.spendReaction(
      chainId,
      testingStandard1155.address,
      TAKER_NFT_ID,
      REACTION_NFT_META_ID,
      REACTION_AMOUNT,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      metadataHash
    );

    // Get the expected curator token token ID
    const curatorTokenId = await curatorVault.getTokenId(
      chainId,
      testingStandard1155.address,
      TAKER_NFT_ID,
      paymentTokenErc20.address
    );

    // Verify unregistered Taker NFT cannot be withdrawn
    expect(
      reactionVault
        .connect(ALICE)
        .withdrawTakerRewards(
          chainId,
          testingStandard1155.address,
          TAKER_NFT_ID,
          paymentTokenErc20.address,
          curatorVault.address,
          curatorTokenId,
          "0",
          ALICE.address
        )
    ).to.be.revertedWith(NFT_NOT_REGISTERED);

    // Mint the NFT to the taker
    testingStandard1155.mint(TAKER.address, TAKER_NFT_ID, "1", [0]);

    // Register it
    await makerRegistrar
      .connect(TAKER)
      .registerNft(
        testingStandard1155.address,
        TAKER_NFT_ID,
        CREATOR.address,
        TEST_SALE_CREATOR_BP,
        "0"
      );

    // Unregister it so that it is found but not registered
    await makerRegistrar
      .connect(TAKER)
      .deregisterNft(testingStandard1155.address, TAKER_NFT_ID);

    // Verify it checks that it is registered
    await expect(
      reactionVault
        .connect(ALICE)
        .withdrawTakerRewards(
          chainId,
          testingStandard1155.address,
          TAKER_NFT_ID,
          paymentTokenErc20.address,
          curatorVault.address,
          curatorTokenId,
          "0",
          ALICE.address
        )
    ).to.be.revertedWith(NFT_NOT_REGISTERED);

    // Register it again
    await makerRegistrar
      .connect(TAKER)
      .registerNft(
        testingStandard1155.address,
        TAKER_NFT_ID,
        CREATOR.address,
        "0",
        "0"
      );

    // Now try to get ALICE to claim... should fail since she doesn't own it
    await expect(
      reactionVault
        .connect(ALICE)
        .withdrawTakerRewards(
          chainId,
          testingStandard1155.address,
          TAKER_NFT_ID,
          paymentTokenErc20.address,
          curatorVault.address,
          curatorTokenId,
          "20",
          ALICE.address
        )
    ).to.be.revertedWith(NFT_NOT_OWNED);

    const rewardsIndex = deriveTakerRewardsKey(
      chainId,
      testingStandard1155.address,
      BigNumber.from(TAKER_NFT_ID),
      curatorVault.address,
      curatorTokenId
    );
    const expectedTokens = await reactionVault.nftOwnerRewards(rewardsIndex);
    const expectedPayment = "250000106789080000";

    // Now have the Taker claim - should be successful
    await expect(
      reactionVault
        .connect(TAKER)
        .withdrawTakerRewards(
          chainId,
          testingStandard1155.address,
          TAKER_NFT_ID,
          paymentTokenErc20.address,
          curatorVault.address,
          curatorTokenId,
          expectedTokens,
          TAKER.address
        )
    );

    // Verify the payment got sent
    expect(await paymentTokenErc20.balanceOf(TAKER.address)).to.be.equal(
      expectedPayment
    );

    // Verify nftOwnerRewards was decremented
    const remainingRewards = await reactionVault.nftOwnerRewards(rewardsIndex);
    expect(remainingRewards).to.be.equal(0);
  });

  it("Should spend reaction and let taker withdraw - some tokens", async function () {
    const [OWNER, ALICE, CREATOR, REFERRER, TAKER] = await ethers.getSigners();
    const {
      reactionVault,
      testingStandard1155,
      makerRegistrar,
      roleManager,
      paymentTokenErc20,
      curatorVault,
    } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Now register an NFT and get the Meta ID
    // Mint an NFT to Alice
    const MAKER_NFT_ID = "1";
    const TAKER_NFT_ID = "2";
    testingStandard1155.mint(ALICE.address, MAKER_NFT_ID, "1", [0]);

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        MAKER_NFT_ID,
        CREATOR.address,
        TEST_SALE_CREATOR_BP,
        "0"
      );

    // Get the NFT source ID
    const NFT_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      testingStandard1155.address,
      MAKER_NFT_ID
    );

    // Encode the params and hash it to get the meta URI
    const TRANSFORM_ID = deriveTransformId(NFT_SOURCE_ID, BigNumber.from(0));

    // Mint the purchase price amount of tokens to the owner
    paymentTokenErc20.mint(OWNER.address, TEST_REACTION_PRICE);

    // Approve the transfer of payment tokens
    paymentTokenErc20.approve(reactionVault.address, TEST_REACTION_PRICE);

    const REACTION_AMOUNT = BigNumber.from(1);

    // Buy the reaction
    await reactionVault.buyReaction(
      TRANSFORM_ID,
      REACTION_AMOUNT,
      OWNER.address, // Where reactions should end up
      REFERRER.address, // Referrer
      BigNumber.from(0)
    );

    // Derive the reaction meta ID
    const REACTION_NFT_PARAMETER_VERSION = deriveReactionParameterVersion(
      paymentTokenErc20.address,
      TEST_REACTION_PRICE,
      BigNumber.from(TEST_SALE_CURATOR_LIABILITY_BP)
    );

    const REACTION_NFT_META_ID = deriveReactionId(
      BigNumber.from(REACTION_NFT_PARAMETER_VERSION),
      BigNumber.from(TRANSFORM_ID),
      BigNumber.from(0)
    );

    const metadataHash = BigNumber.from(111);

    // Now spend it
    await reactionVault.spendReaction(
      chainId,
      testingStandard1155.address,
      TAKER_NFT_ID,
      REACTION_NFT_META_ID,
      REACTION_AMOUNT,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      metadataHash
    );

    // Get the expected curator token token ID
    const curatorTokenId = await curatorVault.getTokenId(
      chainId,
      testingStandard1155.address,
      TAKER_NFT_ID,
      paymentTokenErc20.address
    );

    // Verify unregistered Taker NFT cannot be withdrawn
    expect(
      reactionVault
        .connect(ALICE)
        .withdrawTakerRewards(
          chainId,
          testingStandard1155.address,
          TAKER_NFT_ID,
          paymentTokenErc20.address,
          curatorVault.address,
          curatorTokenId,
          "0",
          ALICE.address
        )
    ).to.be.revertedWith(NFT_NOT_REGISTERED);

    // Mint the NFT to the taker
    testingStandard1155.mint(TAKER.address, TAKER_NFT_ID, "1", [0]);

    // Register it
    await makerRegistrar
      .connect(TAKER)
      .registerNft(
        testingStandard1155.address,
        TAKER_NFT_ID,
        CREATOR.address,
        TEST_SALE_CREATOR_BP,
        "0"
      );

    // Unregister it so that it is found but not registered
    await makerRegistrar
      .connect(TAKER)
      .deregisterNft(testingStandard1155.address, TAKER_NFT_ID);

    // Verify it checks that it is registered
    await expect(
      reactionVault
        .connect(ALICE)
        .withdrawTakerRewards(
          chainId,
          testingStandard1155.address,
          TAKER_NFT_ID,
          paymentTokenErc20.address,
          curatorVault.address,
          curatorTokenId,
          "0",
          ALICE.address
        )
    ).to.be.revertedWith(NFT_NOT_REGISTERED);

    // Register it again
    await makerRegistrar
      .connect(TAKER)
      .registerNft(
        testingStandard1155.address,
        TAKER_NFT_ID,
        CREATOR.address,
        "0",
        "0"
      );

    // Now try to get ALICE to claim... should fail since she doesn't own it
    await expect(
      reactionVault
        .connect(ALICE)
        .withdrawTakerRewards(
          chainId,
          testingStandard1155.address,
          TAKER_NFT_ID,
          paymentTokenErc20.address,
          curatorVault.address,
          curatorTokenId,
          "20",
          ALICE.address
        )
    ).to.be.revertedWith(NFT_NOT_OWNED);

    // get rewards balance
    const rewardsIndex = deriveTakerRewardsKey(
      chainId,
      testingStandard1155.address,
      BigNumber.from(TAKER_NFT_ID),
      curatorVault.address,
      curatorTokenId
    );
    const startingRewards = await reactionVault.nftOwnerRewards(rewardsIndex);

    //
    // try to withdraw too much
    //
    await expect(
      reactionVault
        .connect(ALICE)
        .withdrawTakerRewards(
          chainId,
          testingStandard1155.address,
          TAKER_NFT_ID,
          paymentTokenErc20.address,
          curatorVault.address,
          curatorTokenId,
          Math.floor(startingRewards.toNumber() * 2),
          ALICE.address
        )
    ).to.be.revertedWith(REWARDS_LT_BURN);

    //
    // try to withdraw half
    //
    const tokensToBurn = Math.floor(startingRewards.toNumber() / 2); // withdraw half
    const expectedPayment = "125000053394540000";

    // Now have the Taker claim - should be successful
    await expect(
      reactionVault
        .connect(TAKER)
        .withdrawTakerRewards(
          chainId,
          testingStandard1155.address,
          TAKER_NFT_ID,
          paymentTokenErc20.address,
          curatorVault.address,
          curatorTokenId,
          tokensToBurn,
          TAKER.address
        )
    );

    // Verify the payment got sent
    expect(await paymentTokenErc20.balanceOf(TAKER.address)).to.be.equal(
      expectedPayment
    );

    // Verify nftOwnerRewards was decremented
    const remainingRewards = await reactionVault.nftOwnerRewards(rewardsIndex);
    expect(startingRewards.toNumber() - tokensToBurn).to.be.equal(
      remainingRewards.toNumber()
    );
  });

  it("Should spend reaction and let creator get all rewards withdraw", async function () {
    const [OWNER, ALICE, CREATOR, REFERRER, TAKER] = await ethers.getSigners();
    const {
      reactionVault,
      testingStandard1155,
      makerRegistrar,
      roleManager,
      paymentTokenErc20,
      curatorVault,
    } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Now register an NFT and get the Meta ID
    // Mint an NFT to Alice
    const MAKER_NFT_ID = "1";
    const TAKER_NFT_ID = "2";
    testingStandard1155.mint(ALICE.address, MAKER_NFT_ID, "1", [0]);

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        MAKER_NFT_ID,
        ZERO_ADDRESS,
        "0",
        "0"
      );

    // Get the NFT source ID
    const NFT_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      testingStandard1155.address,
      MAKER_NFT_ID
    );

    // Encode the params and hash it to get the meta URI
    const TRANSFORM_ID = deriveTransformId(NFT_SOURCE_ID, BigNumber.from(0));

    // Mint the purchase price amount of tokens to the owner
    paymentTokenErc20.mint(OWNER.address, TEST_REACTION_PRICE);

    // Approve the transfer of payment tokens
    paymentTokenErc20.approve(reactionVault.address, TEST_REACTION_PRICE);

    const REACTION_AMOUNT = BigNumber.from(1);

    // Buy the reaction
    await reactionVault.buyReaction(
      TRANSFORM_ID,
      REACTION_AMOUNT,
      OWNER.address, // Where reactions should end up
      REFERRER.address, // Referrer
      BigNumber.from(0)
    );

    // Derive the reaction meta ID
    const REACTION_NFT_PARAMETER_VERSION = deriveReactionParameterVersion(
      paymentTokenErc20.address,
      TEST_REACTION_PRICE,
      BigNumber.from(TEST_SALE_CURATOR_LIABILITY_BP)
    );

    const REACTION_NFT_META_ID = deriveReactionId(
      BigNumber.from(REACTION_NFT_PARAMETER_VERSION),
      BigNumber.from(TRANSFORM_ID),
      BigNumber.from(0)
    );

    const metadataHash = BigNumber.from(111);

    // Now spend it
    await reactionVault.spendReaction(
      chainId,
      testingStandard1155.address,
      TAKER_NFT_ID,
      REACTION_NFT_META_ID,
      REACTION_AMOUNT,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      metadataHash
    );

    // Get the expected curator Token token ID
    const curatorTokenId = await curatorVault.getTokenId(
      chainId,
      testingStandard1155.address,
      TAKER_NFT_ID,
      paymentTokenErc20.address
    );

    // Mint the NFT to the taker
    testingStandard1155.mint(TAKER.address, TAKER_NFT_ID, "1", [0]);

    // Register it
    await makerRegistrar.connect(TAKER).registerNft(
      testingStandard1155.address,
      TAKER_NFT_ID,
      CREATOR.address,
      "10000", // 100% should go to creator (10k basis points is 100%)
      "0"
    );

    const rewardsIndex = deriveTakerRewardsKey(
      chainId,
      testingStandard1155.address,
      BigNumber.from(TAKER_NFT_ID),
      curatorVault.address,
      curatorTokenId
    );
    const expectedTokens = await reactionVault.nftOwnerRewards(rewardsIndex);
    const expectedPaymentForCreator = "250000106789080000";

    // Now have the Taker claim - should be successful
    await expect(
      reactionVault
        .connect(TAKER)
        .withdrawTakerRewards(
          chainId,
          testingStandard1155.address,
          TAKER_NFT_ID,
          paymentTokenErc20.address,
          curatorVault.address,
          curatorTokenId,
          expectedTokens,
          TAKER.address
        )
    );

    // Verify the payment was assigned
    expect(
      await reactionVault.ownerToRewardsMapping(
        paymentTokenErc20.address,
        CREATOR.address
      )
    ).to.be.equal(expectedPaymentForCreator);
  });
});
