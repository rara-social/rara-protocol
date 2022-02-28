import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers, upgrades } from "hardhat";
import { TEST_NFT_URI, ZERO_ADDRESS } from "../Scripts/constants";
import {
  deploySystem,
  TEST_REACTION_PRICE,
  TEST_SALE_CURATOR_LIABILITY_BP,
  TEST_SPEND_REFERRER_BP,
} from "../Scripts/deploy";
import {
  deriveMakerNftMetaId,
  deriveReactionNftMetaId,
  deriveReactionParameterVersion,
  deriveTakerRewardsKey,
} from "../Scripts/derivedParams";
import {
  INVALID_CURATOR_VAULT,
  INVALID_ZERO_PARAM,
  NO_TOKENS_TO_BURN,
} from "../Scripts/errors";

describe("ReactionVault Sell", function () {
  it("Should verify spender has reaction NFT", async function () {
    const [OWNER] = await ethers.getSigners();
    const { reactionVault } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // If the user tries to spend reactions they don't have it should fail
    await expect(
      reactionVault.spendReaction(
        chainId,
        ZERO_ADDRESS,
        "0",
        "0",
        "1",
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        "0"
      )
    ).to.be.revertedWith(NO_TOKENS_TO_BURN);
  });

  it("Should verify reaction quantity > 0", async function () {
    const [OWNER] = await ethers.getSigners();
    const { reactionVault } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // If the user tries to spend reactions they don't have it should fail
    await expect(
      reactionVault.spendReaction(
        chainId,
        ZERO_ADDRESS,
        "0",
        "0",
        "0",
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        "0"
      )
    ).to.be.revertedWith(INVALID_ZERO_PARAM);
  });

  it("Should allow spending", async function () {
    const [OWNER, ALICE, CREATOR, REFERRER] = await ethers.getSigners();
    const {
      reactionVault,
      testingStandard1155,
      makerRegistrar,
      roleManager,
      paymentTokenErc20,
      curatorVault,
      curatorShares,
    } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Now register an NFT and get the Meta ID
    // Mint an NFT to Alice
    const MAKER_NFT_ID = "1";
    const TAKER_NFT_ID = "2";
    const reactionMinterRole = await roleManager.REACTION_MINTER_ROLE();
    roleManager.grantRole(reactionMinterRole, OWNER.address);
    testingStandard1155.mint(ALICE.address, MAKER_NFT_ID, "1", [0]);

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        MAKER_NFT_ID,
        CREATOR.address,
        "0"
      );

    // Get the NFT source ID
    const NFT_SOURCE_ID = await makerRegistrar.nftToSourceLookup(
      chainId,
      testingStandard1155.address,
      MAKER_NFT_ID
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

    const REACTION_AMOUNT = BigNumber.from(1);

    // Buy the reaction
    await reactionVault.buyReaction(
      MAKER_NFT_META_ID,
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

    const REACTION_NFT_META_ID = deriveReactionNftMetaId(
      BigNumber.from(REACTION_NFT_PARAMETER_VERSION),
      BigNumber.from(MAKER_NFT_META_ID),
      BigNumber.from(0)
    );

    const metadataHash = BigNumber.from(111);

    // Now spend it
    const transaction = await reactionVault.spendReaction(
      chainId,
      testingStandard1155.address,
      TAKER_NFT_ID,
      REACTION_NFT_META_ID,
      REACTION_AMOUNT,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      metadataHash
    );
    const receipt = await transaction.wait();

    // Calculate expected amounts
    const expectedTakerCuratorShares = BigNumber.from("91027210151");
    const expectedSpenderCuratorShares = BigNumber.from("29084233246");
    const curatorSharesId = await curatorVault.getTokenId(
      chainId,
      testingStandard1155.address,
      TAKER_NFT_ID,
      paymentTokenErc20.address
    );

    // Verify the events
    // Event TakerRewardsGranted
    let foundEvent = receipt.events?.find(
      (x) => x.event === "TakerRewardsGranted"
    );
    expect(foundEvent!.args!.takerNftAddress).to.be.equal(
      testingStandard1155.address
    );
    expect(foundEvent!.args!.takerNftId).to.be.equal(TAKER_NFT_ID);
    expect(foundEvent!.args!.curatorVault).to.be.equal(curatorVault.address);
    expect(foundEvent!.args!.curatorTokenId).to.be.equal(curatorSharesId);
    expect(foundEvent!.args!.curatorShareAmount).to.be.equal(
      expectedTakerCuratorShares
    );

    // Event SpenderRewardsGranted
    foundEvent = receipt.events?.find(
      (x) => x.event === "SpenderRewardsGranted"
    );
    expect(foundEvent!.args!.takerNftAddress).to.be.equal(
      testingStandard1155.address
    );
    expect(foundEvent!.args!.takerNftId).to.be.equal(TAKER_NFT_ID);
    expect(foundEvent!.args!.curatorVault).to.be.equal(curatorVault.address);
    expect(foundEvent!.args!.curatorTokenId).to.be.equal(curatorSharesId);
    expect(foundEvent!.args!.curatorShareAmount).to.be.equal(
      expectedSpenderCuratorShares
    );

    // Event ReactionsSpent
    foundEvent = receipt.events?.find((x) => x.event === "ReactionsSpent");
    expect(foundEvent!.args!.takerNftAddress).to.be.equal(
      testingStandard1155.address
    );
    expect(foundEvent!.args!.takerNftId).to.be.equal(TAKER_NFT_ID);
    expect(foundEvent!.args!.reactionMetaId).to.be.equal(REACTION_NFT_META_ID);
    expect(foundEvent!.args!.quantity).to.be.equal(REACTION_AMOUNT);
    expect(foundEvent!.args!.referrer).to.be.equal(ZERO_ADDRESS);
    expect(foundEvent!.args!.metaDataHash).to.be.equal(metadataHash);

    // Verify the spender (OWNER) got curator shares
    expect(
      await curatorShares.balanceOf(OWNER.address, curatorSharesId)
    ).to.be.equal(expectedSpenderCuratorShares);

    // Get the rewards key for this taker
    const rewardsKey = deriveTakerRewardsKey(
      chainId,
      testingStandard1155.address,
      BigNumber.from(TAKER_NFT_ID),
      curatorVault.address,
      curatorSharesId
    );

    // Verify the taker NFT got allocated curator shares
    expect(await reactionVault.nftOwnerRewards(rewardsKey)).to.be.equal(
      expectedTakerCuratorShares
    );
  });

  it("Should verify referrer cut", async function () {
    const [OWNER, ALICE, CREATOR, REFERRER] = await ethers.getSigners();
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
    const MAKER_NFT_ID = "1";
    const TAKER_NFT_ID = "2";
    const reactionMinterRole = await roleManager.REACTION_MINTER_ROLE();
    roleManager.grantRole(reactionMinterRole, OWNER.address);
    testingStandard1155.mint(ALICE.address, MAKER_NFT_ID, "1", [0]);

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        MAKER_NFT_ID,
        CREATOR.address,
        "0"
      );

    // Get the NFT source ID
    const NFT_SOURCE_ID = await makerRegistrar.nftToSourceLookup(
      chainId,
      testingStandard1155.address,
      MAKER_NFT_ID
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

    const REACTION_AMOUNT = BigNumber.from(1);

    // Buy the reaction
    await reactionVault.buyReaction(
      MAKER_NFT_META_ID,
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

    const REACTION_NFT_META_ID = deriveReactionNftMetaId(
      BigNumber.from(REACTION_NFT_PARAMETER_VERSION),
      BigNumber.from(MAKER_NFT_META_ID),
      BigNumber.from(0)
    );

    // Now spend it
    const transaction = await reactionVault.spendReaction(
      chainId,
      testingStandard1155.address,
      TAKER_NFT_ID,
      REACTION_NFT_META_ID,
      REACTION_AMOUNT,
      REFERRER.address, // Referrer
      ZERO_ADDRESS,
      "0"
    );
    const receipt = await transaction.wait();

    // Calculate expected amounts
    const CURATOR_LIABILITY = TEST_REACTION_PRICE.mul(
      TEST_SALE_CURATOR_LIABILITY_BP
    ).div(10_000);
    const referrerCut = CURATOR_LIABILITY.mul(TEST_SPEND_REFERRER_BP).div(
      10_000
    );

    // Verify the events
    // Event TakerRewardsGranted
    const foundEvent = receipt.events?.find(
      (x) => x.event === "ReferrerRewardsGranted"
    );
    expect(foundEvent!.args!.referrer).to.be.equal(REFERRER.address);
    expect(foundEvent!.args!.paymentToken).to.be.equal(
      paymentTokenErc20.address
    );
    expect(foundEvent!.args!.amount).to.be.equal(referrerCut);
  });

  it("Should reject invalid curator vault", async function () {
    const [OWNER, ALICE, CREATOR, REFERRER] = await ethers.getSigners();
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
    const MAKER_NFT_ID = "1";
    const TAKER_NFT_ID = "2";
    const reactionMinterRole = await roleManager.REACTION_MINTER_ROLE();
    roleManager.grantRole(reactionMinterRole, OWNER.address);
    testingStandard1155.mint(ALICE.address, MAKER_NFT_ID, "1", [0]);

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        MAKER_NFT_ID,
        CREATOR.address,
        "0"
      );

    // Get the NFT source ID
    const NFT_SOURCE_ID = await makerRegistrar.nftToSourceLookup(
      chainId,
      testingStandard1155.address,
      MAKER_NFT_ID
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

    const REACTION_AMOUNT = BigNumber.from(1);

    // Buy the reaction
    await reactionVault.buyReaction(
      MAKER_NFT_META_ID,
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

    const REACTION_NFT_META_ID = deriveReactionNftMetaId(
      BigNumber.from(REACTION_NFT_PARAMETER_VERSION),
      BigNumber.from(MAKER_NFT_META_ID),
      BigNumber.from(0)
    );

    // Now spend it
    await expect(
      reactionVault.spendReaction(
        chainId,
        testingStandard1155.address,
        TAKER_NFT_ID,
        REACTION_NFT_META_ID,
        REACTION_AMOUNT,
        ZERO_ADDRESS,
        ALICE.address, // Invalid address
        "0"
      )
    ).to.be.revertedWith(INVALID_CURATOR_VAULT);
  });

  it("Should allow spending with custom curator vault", async function () {
    const [OWNER, ALICE, CREATOR, REFERRER] = await ethers.getSigners();
    const {
      reactionVault,
      testingStandard1155,
      makerRegistrar,
      roleManager,
      paymentTokenErc20,
      addressManager,
      parameterManager,
    } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Deploy a custom curator vault
    // Deploy the curator Shares Token Contract
    const CuratorShares1155Factory = await ethers.getContractFactory(
      "TestErc1155"
    );
    const deployedCuratorShares = await upgrades.deployProxy(
      CuratorShares1155Factory,
      [TEST_NFT_URI, addressManager.address]
    );
    const curatorShares = CuratorShares1155Factory.attach(
      deployedCuratorShares.address
    );

    // Deploy the Default Curator Vault
    const CuratorVaultFactory = await ethers.getContractFactory(
      "PermanentCuratorVault"
    );
    const deployedCuratorVault = await upgrades.deployProxy(
      CuratorVaultFactory,
      [addressManager.address, 400000, curatorShares.address]
    );
    const curatorVault = CuratorVaultFactory.attach(
      deployedCuratorVault.address
    );

    // Add the custom curator vault to the parameter manager
    await parameterManager.setApprovedCuratorVaults(curatorVault.address, true);

    // Now register an NFT and get the Meta ID
    // Mint an NFT to Alice
    const MAKER_NFT_ID = "1";
    const TAKER_NFT_ID = "2";
    const reactionMinterRole = await roleManager.REACTION_MINTER_ROLE();
    roleManager.grantRole(reactionMinterRole, OWNER.address);
    testingStandard1155.mint(ALICE.address, MAKER_NFT_ID, "1", [0]);

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        MAKER_NFT_ID,
        CREATOR.address,
        "0"
      );

    // Get the NFT source ID
    const NFT_SOURCE_ID = await makerRegistrar.nftToSourceLookup(
      chainId,
      testingStandard1155.address,
      MAKER_NFT_ID
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

    const REACTION_AMOUNT = BigNumber.from(1);

    // Buy the reaction
    await reactionVault.buyReaction(
      MAKER_NFT_META_ID,
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

    const REACTION_NFT_META_ID = deriveReactionNftMetaId(
      BigNumber.from(REACTION_NFT_PARAMETER_VERSION),
      BigNumber.from(MAKER_NFT_META_ID),
      BigNumber.from(0)
    );

    // Now spend it
    const transaction = await reactionVault.spendReaction(
      chainId,
      testingStandard1155.address,
      TAKER_NFT_ID,
      REACTION_NFT_META_ID,
      REACTION_AMOUNT,
      ZERO_ADDRESS,
      curatorVault.address, // Custom curator vault
      "0"
    );
    const receipt = await transaction.wait();

    // Calculate expected amounts
    const expectedTakerCuratorShares = BigNumber.from("91027210151");
    const expectedSpenderCuratorShares = BigNumber.from("29084233246");
    const curatorSharesId = await curatorVault.getTokenId(
      chainId,
      testingStandard1155.address,
      TAKER_NFT_ID,
      paymentTokenErc20.address
    );

    // Verify the events
    // Event TakerRewardsGranted
    let foundEvent = receipt.events?.find(
      (x) => x.event === "TakerRewardsGranted"
    );
    expect(foundEvent!.args!.takerNftAddress).to.be.equal(
      testingStandard1155.address
    );
    expect(foundEvent!.args!.takerNftId).to.be.equal(TAKER_NFT_ID);
    expect(foundEvent!.args!.curatorVault).to.be.equal(curatorVault.address);
    expect(foundEvent!.args!.curatorTokenId).to.be.equal(curatorSharesId);
    expect(foundEvent!.args!.curatorShareAmount).to.be.equal(
      expectedTakerCuratorShares
    );

    // Event SpenderRewardsGranted
    foundEvent = receipt.events?.find(
      (x) => x.event === "SpenderRewardsGranted"
    );
    expect(foundEvent!.args!.takerNftAddress).to.be.equal(
      testingStandard1155.address
    );
    expect(foundEvent!.args!.takerNftId).to.be.equal(TAKER_NFT_ID);
    expect(foundEvent!.args!.curatorVault).to.be.equal(curatorVault.address);
    expect(foundEvent!.args!.curatorTokenId).to.be.equal(curatorSharesId);
    expect(foundEvent!.args!.curatorShareAmount).to.be.equal(
      expectedSpenderCuratorShares
    );

    // Event ReactionsSpent
    foundEvent = receipt.events?.find((x) => x.event === "ReactionsSpent");
    expect(foundEvent!.args!.takerNftAddress).to.be.equal(
      testingStandard1155.address
    );
    expect(foundEvent!.args!.takerNftId).to.be.equal(TAKER_NFT_ID);
    expect(foundEvent!.args!.reactionMetaId).to.be.equal(REACTION_NFT_META_ID);
    expect(foundEvent!.args!.quantity).to.be.equal(REACTION_AMOUNT);
    expect(foundEvent!.args!.referrer).to.be.equal(ZERO_ADDRESS);

    // Verify the spender (OWNER) got curator shares
    expect(
      await curatorShares.balanceOf(OWNER.address, curatorSharesId)
    ).to.be.equal(expectedSpenderCuratorShares);

    // Get the rewards key for this taker
    const rewardsKey = deriveTakerRewardsKey(
      chainId,
      testingStandard1155.address,
      BigNumber.from(TAKER_NFT_ID),
      curatorVault.address,
      curatorSharesId
    );

    // Verify the taker NFT got allocated curator shares
    // NftAddress -> NftId -> RewardToken -> RewardTokenId -> balance
    expect(await reactionVault.nftOwnerRewards(rewardsKey)).to.be.equal(
      expectedTakerCuratorShares
    );
  });
});
