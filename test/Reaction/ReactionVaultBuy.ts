import {expect} from "chai";
import {BigNumber} from "ethers";
import {ethers} from "hardhat";
import {ZERO_ADDRESS} from "../Scripts/constants";
import {
  deploySystem,
  TEST_REACTION_PRICE,
  TEST_SALE_CREATOR_BP,
  TEST_SALE_CURATOR_LIABILITY_BP,
  TEST_SALE_REFERRER_BP,
} from "../Scripts/setup";
import {
  deriveMakerNftMetaId,
  deriveReactionNftMetaId,
  deriveReactionParameterVersion,
} from "../Scripts/derivedParams";
import {
  NFT_NOT_REGISTERED,
  NO_BALANCE,
  TRANSFER_NOT_ALLOWED,
  UNKNOWN_NFT,
} from "../Scripts/errors";

describe("ReactionVault Buy", function () {
  it("Should get initialized with address manager", async function () {
    const [OWNER] = await ethers.getSigners();
    const {reactionVault, addressManager} = await deploySystem(OWNER);

    // Verify the address manager was set
    const currentAddressManager = await reactionVault.addressManager();
    expect(currentAddressManager).to.equal(addressManager.address);
  });

  it("Should verify NFT is registered", async function () {
    const [OWNER, ALICE] = await ethers.getSigners();
    const {reactionVault, testingStandard1155, makerRegistrar, roleManager} =
      await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Trying to buy a reaction for a unknown NFT should fail
    await expect(
      reactionVault.buyReaction(
        "100", // random meta ID
        "1",
        OWNER.address,
        ZERO_ADDRESS,
        BigNumber.from(0)
      )
    ).to.revertedWith(UNKNOWN_NFT);

    // Now register and unregister an NFT and get the Meta ID
    // Mint an NFT to Alice
    const NFT_ID = "1";
    testingStandard1155.mint(ALICE.address, NFT_ID, "1", [0]);

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(testingStandard1155.address, NFT_ID, ZERO_ADDRESS, "0", "0");

    const NFT_SOURCE_ID = await makerRegistrar.nftToSourceLookup(
      chainId,
      testingStandard1155.address,
      NFT_ID
    );

    // Encode the params and hash it to get the meta URI
    const MAKER_NFT_META_ID = deriveMakerNftMetaId(
      NFT_SOURCE_ID,
      BigNumber.from(0)
    );

    // Unregister it
    await makerRegistrar
      .connect(ALICE)
      .deregisterNft(testingStandard1155.address, NFT_ID);

    // Now verify reactions can't be purchased
    await expect(
      reactionVault.buyReaction(
        MAKER_NFT_META_ID,
        "1",
        OWNER.address,
        ZERO_ADDRESS,
        BigNumber.from(0)
      )
    ).to.revertedWith(NFT_NOT_REGISTERED);
  });

  it("Should validate payment succeeds", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const {
      reactionVault,
      testingStandard1155,
      makerRegistrar,
      roleManager,
      paymentTokenErc20,
    } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Now register an NFT and get the Meta ID
    // Mint an NFT to Alice
    const NFT_ID = "1";
    testingStandard1155.mint(ALICE.address, NFT_ID, "1", [0]);

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(testingStandard1155.address, NFT_ID, ZERO_ADDRESS, "0", "0");

    // Get the NFT source ID
    const NFT_SOURCE_ID = await makerRegistrar.nftToSourceLookup(
      chainId,
      testingStandard1155.address,
      NFT_ID
    );

    // Encode the params and hash it to get the meta URI
    const MAKER_NFT_META_ID = deriveMakerNftMetaId(
      NFT_SOURCE_ID,
      BigNumber.from(0)
    );

    // Should fail since Owner has no tokens
    await expect(
      reactionVault.buyReaction(
        MAKER_NFT_META_ID,
        "1",
        OWNER.address,
        ZERO_ADDRESS,
        BigNumber.from(0)
      )
    ).to.revertedWith(TRANSFER_NOT_ALLOWED);

    // Mint some tokens to the owner
    paymentTokenErc20.mint(OWNER.address, TEST_REACTION_PRICE);

    // Should fail since Owner has not approved transfer from
    await expect(
      reactionVault.buyReaction(
        MAKER_NFT_META_ID,
        "1",
        OWNER.address,
        ZERO_ADDRESS,
        BigNumber.from(0)
      )
    ).to.revertedWith(TRANSFER_NOT_ALLOWED);

    // Even if Alice has an allowance but no tokens it should still fail
    await paymentTokenErc20
      .connect(BOB)
      .approve(reactionVault.address, "10000000000000000000");
    await expect(
      reactionVault
        .connect(BOB)
        .buyReaction(
          MAKER_NFT_META_ID,
          "1",
          OWNER.address,
          ZERO_ADDRESS,
          BigNumber.from(0)
        )
    ).to.revertedWith(NO_BALANCE);
  });

  it("Should buy a single reaction", async function () {
    const [OWNER, ALICE, CREATOR, REFERRER] = await ethers.getSigners();
    const {
      reactionVault,
      testingStandard1155,
      makerRegistrar,
      roleManager,
      paymentTokenErc20,
      reactionNFT1155,
    } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Now register an NFT and get the Meta ID
    // Mint an NFT to Alice
    const NFT_ID = "1";
    testingStandard1155.mint(ALICE.address, NFT_ID, "1", [0]);

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        NFT_ID,
        CREATOR.address,
        TEST_SALE_CREATOR_BP,
        "0"
      );

    // Get the NFT source ID
    const NFT_SOURCE_ID = await makerRegistrar.nftToSourceLookup(
      chainId,
      testingStandard1155.address,
      NFT_ID
    );

    // Encode the params and hash it to get the meta URI
    const MAKER_NFT_META_ID = deriveMakerNftMetaId(
      NFT_SOURCE_ID,
      BigNumber.from(0)
    );

    // Mint the purchase price amount of tokens to the owner
    paymentTokenErc20.mint(OWNER.address, TEST_REACTION_PRICE);

    // Approve the transfer of payment tokens
    paymentTokenErc20.approve(reactionVault.address, TEST_REACTION_PRICE);

    // Calculate how the payment will be split
    const REACTION_AMOUNT = BigNumber.from(1);
    const REFERRER_CUT = TEST_REACTION_PRICE.mul(TEST_SALE_REFERRER_BP).div(
      10_000
    );
    const CURATOR_LIABILITY = TEST_REACTION_PRICE.mul(
      TEST_SALE_CURATOR_LIABILITY_BP
    ).div(10_000);
    const TOTAL_MAKER_CUT =
      TEST_REACTION_PRICE.sub(REFERRER_CUT).sub(CURATOR_LIABILITY);
    const CREATOR_CUT = TOTAL_MAKER_CUT.mul(TEST_SALE_CREATOR_BP).div(10_000);
    const MAKER_CUT = TOTAL_MAKER_CUT.sub(CREATOR_CUT);

    // Verify allocations are correct
    expect(TEST_REACTION_PRICE).to.be.equal(
      CREATOR_CUT.add(REFERRER_CUT).add(CURATOR_LIABILITY).add(MAKER_CUT)
    );

    // Build the tx
    const transaction = await reactionVault.buyReaction(
      MAKER_NFT_META_ID,
      REACTION_AMOUNT,
      OWNER.address, // Where reactions should end up
      REFERRER.address, // Referrer
      BigNumber.from(0)
    );
    const receipt = await transaction.wait();

    // Verify the creator reward event
    const creatorRewardEvent = receipt.events?.find(
      (x) => x.event === "CreatorRewardsGranted"
    );
    expect(creatorRewardEvent!.args!.creator).to.be.equal(CREATOR.address);
    expect(creatorRewardEvent!.args!.paymentToken).to.be.equal(
      paymentTokenErc20.address
    );
    expect(creatorRewardEvent!.args!.amount).to.be.equal(CREATOR_CUT);

    // Verify the referrer reward event
    const referrerRewardEvent = receipt.events?.find(
      (x) => x.event === "ReferrerRewardsGranted"
    );
    expect(referrerRewardEvent!.args!.referrer).to.be.equal(REFERRER.address);
    expect(referrerRewardEvent!.args!.paymentToken).to.be.equal(
      paymentTokenErc20.address
    );
    expect(referrerRewardEvent!.args!.amount).to.be.equal(REFERRER_CUT);

    // Verify the maker reward event
    const makerRewardEvent = receipt.events?.find(
      (x) => x.event === "MakerRewardsGranted"
    );
    expect(makerRewardEvent!.args!.maker).to.be.equal(ALICE.address);
    expect(makerRewardEvent!.args!.paymentToken).to.be.equal(
      paymentTokenErc20.address
    );
    expect(makerRewardEvent!.args!.amount).to.be.equal(MAKER_CUT);

    // Derive the reaction meta ID
    const REACTION_NFT_PARAMETER_VERSION = deriveReactionParameterVersion(
      paymentTokenErc20.address,
      TEST_REACTION_PRICE,
      BigNumber.from(TEST_SALE_CURATOR_LIABILITY_BP)
    );

    const REACTION_NFT_META_ID = deriveReactionNftMetaId(
      BigNumber.from(REACTION_NFT_PARAMETER_VERSION),
      BigNumber.from(MAKER_NFT_META_ID),
      BigNumber.from(0)
    );

    // Verify the reaction price details were saved properly
    const [paymentTokenAddress, reactionPrice, curatorLiabilityBp] =
      await reactionVault.reactionPriceDetailsMapping(REACTION_NFT_META_ID);
    expect(paymentTokenAddress).to.be.equal(paymentTokenErc20.address);
    expect(reactionPrice).to.be.equal(TEST_REACTION_PRICE);
    expect(curatorLiabilityBp).to.be.equal(
      BigNumber.from(TEST_SALE_CURATOR_LIABILITY_BP)
    );

    // Verify the NFT got minted properly
    expect(
      await reactionNFT1155.balanceOf(OWNER.address, REACTION_NFT_META_ID)
    ).to.be.equal(REACTION_AMOUNT);

    // Verify the ReactionsPurchased event got fired
    const reactionPurchaseEvent = receipt.events?.find(
      (x) => x.event === "ReactionsPurchased"
    );
    expect(reactionPurchaseEvent!.args!.reactionId).to.be.equal(
      MAKER_NFT_META_ID
    );
    expect(reactionPurchaseEvent!.args!.quantity).to.be.equal(REACTION_AMOUNT);
    expect(reactionPurchaseEvent!.args!.destinationWallet).to.be.equal(
      OWNER.address
    );
    expect(reactionPurchaseEvent!.args!.referrer).to.be.equal(REFERRER.address);
    expect(reactionPurchaseEvent!.args!.reactionMetaId).to.be.equal(
      REACTION_NFT_META_ID
    );
  });

  it("Should buy a multiple reactions", async function () {
    const [OWNER, ALICE, CREATOR, REFERRER] = await ethers.getSigners();
    const {
      reactionVault,
      testingStandard1155,
      makerRegistrar,
      roleManager,
      paymentTokenErc20,
      reactionNFT1155,
    } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Buying 15 reactions in this test
    const REACTION_AMOUNT = BigNumber.from(15);

    // Now register an NFT and get the Meta ID
    // Mint an NFT to Alice
    const NFT_ID = "1";
    testingStandard1155.mint(ALICE.address, NFT_ID, "1", [0]);

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        NFT_ID,
        CREATOR.address,
        TEST_SALE_CREATOR_BP,
        "0"
      );

    // Get the NFT source ID
    const NFT_SOURCE_ID = await makerRegistrar.nftToSourceLookup(
      chainId,
      testingStandard1155.address,
      NFT_ID
    );

    // Encode the params and hash it to get the meta URI
    const MAKER_NFT_META_ID = deriveMakerNftMetaId(
      NFT_SOURCE_ID,
      BigNumber.from(0)
    );

    // Mint the purchase price amount of tokens to the owner
    const totalPaymentAmount = TEST_REACTION_PRICE.mul(REACTION_AMOUNT);
    paymentTokenErc20.mint(OWNER.address, totalPaymentAmount);

    // Approve the transfer of payment tokens
    paymentTokenErc20.approve(reactionVault.address, totalPaymentAmount);

    // Calculate how the payment will be split
    const REFERRER_CUT = totalPaymentAmount
      .mul(TEST_SALE_REFERRER_BP)
      .div(10_000);
    const CURATOR_LIABILITY = totalPaymentAmount
      .mul(TEST_SALE_CURATOR_LIABILITY_BP)
      .div(10_000);
    const TOTAL_MAKER_CUT = totalPaymentAmount
      .sub(REFERRER_CUT)
      .sub(CURATOR_LIABILITY);
    const CREATOR_CUT = TOTAL_MAKER_CUT.mul(TEST_SALE_CREATOR_BP).div(10_000);
    const MAKER_CUT = TOTAL_MAKER_CUT.sub(CREATOR_CUT);

    // Verify allocations are correct
    expect(totalPaymentAmount).to.be.equal(
      CREATOR_CUT.add(REFERRER_CUT).add(CURATOR_LIABILITY).add(MAKER_CUT)
    );

    // Build the tx
    const transaction = await reactionVault.buyReaction(
      MAKER_NFT_META_ID,
      REACTION_AMOUNT,
      OWNER.address, // Where reactions should end up
      REFERRER.address, // Referrer
      BigNumber.from(0)
    );
    const receipt = await transaction.wait();

    // Verify the creator reward event
    const creatorRewardEvent = receipt.events?.find(
      (x) => x.event === "CreatorRewardsGranted"
    );
    expect(creatorRewardEvent!.args!.creator).to.be.equal(CREATOR.address);
    expect(creatorRewardEvent!.args!.paymentToken).to.be.equal(
      paymentTokenErc20.address
    );
    expect(creatorRewardEvent!.args!.amount).to.be.equal(CREATOR_CUT);

    // Verify the referrer reward event
    const referrerRewardEvent = receipt.events?.find(
      (x) => x.event === "ReferrerRewardsGranted"
    );
    expect(referrerRewardEvent!.args!.referrer).to.be.equal(REFERRER.address);
    expect(referrerRewardEvent!.args!.paymentToken).to.be.equal(
      paymentTokenErc20.address
    );
    expect(referrerRewardEvent!.args!.amount).to.be.equal(REFERRER_CUT);

    // Verify the maker reward event
    const makerRewardEvent = receipt.events?.find(
      (x) => x.event === "MakerRewardsGranted"
    );
    expect(makerRewardEvent!.args!.maker).to.be.equal(ALICE.address);
    expect(makerRewardEvent!.args!.paymentToken).to.be.equal(
      paymentTokenErc20.address
    );
    expect(makerRewardEvent!.args!.amount).to.be.equal(MAKER_CUT);

    // Derive the reaction meta ID
    const REACTION_NFT_PARAMETER_VERSION = deriveReactionParameterVersion(
      paymentTokenErc20.address,
      TEST_REACTION_PRICE,
      BigNumber.from(TEST_SALE_CURATOR_LIABILITY_BP)
    );

    const REACTION_NFT_META_ID = deriveReactionNftMetaId(
      BigNumber.from(REACTION_NFT_PARAMETER_VERSION),
      BigNumber.from(MAKER_NFT_META_ID),
      BigNumber.from(0)
    );

    // Verify the reaction price details were saved properly
    const [paymentTokenAddress, reactionPrice, curatorLiabilityBp] =
      await reactionVault.reactionPriceDetailsMapping(REACTION_NFT_META_ID);
    expect(paymentTokenAddress).to.be.equal(paymentTokenErc20.address);
    expect(reactionPrice).to.be.equal(TEST_REACTION_PRICE);
    expect(curatorLiabilityBp).to.be.equal(
      BigNumber.from(TEST_SALE_CURATOR_LIABILITY_BP)
    );

    // Verify the NFT got minted properly
    expect(
      await reactionNFT1155.balanceOf(OWNER.address, REACTION_NFT_META_ID)
    ).to.be.equal(REACTION_AMOUNT);

    // Verify the ReactionsPurchased event got fired
    const reactionPurchaseEvent = receipt.events?.find(
      (x) => x.event === "ReactionsPurchased"
    );
    expect(reactionPurchaseEvent!.args!.reactionId).to.be.equal(
      MAKER_NFT_META_ID
    );
    expect(reactionPurchaseEvent!.args!.quantity).to.be.equal(REACTION_AMOUNT);
    expect(reactionPurchaseEvent!.args!.destinationWallet).to.be.equal(
      OWNER.address
    );
    expect(reactionPurchaseEvent!.args!.referrer).to.be.equal(REFERRER.address);
    expect(reactionPurchaseEvent!.args!.reactionMetaId).to.be.equal(
      REACTION_NFT_META_ID
    );
  });
});
