import {expect} from "chai";
import {BigNumber} from "ethers";
import {ethers, upgrades} from "hardhat";
import {
  TEST_NFT_URI,
  ZERO_ADDRESS,
  TEST_CONTRACT_URI,
} from "../Scripts/constants";
import {
  deploySystem,
  TEST_REACTION_PRICE,
  TEST_SALE_CREATOR_BP,
  TEST_SALE_CURATOR_LIABILITY_BP,
  TEST_SPEND_REFERRER_BP,
} from "../Scripts/setup";
import {
  deriveTransformId,
  deriveReactionId,
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
    const {reactionVault} = await deploySystem(OWNER);
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
    const {reactionVault} = await deploySystem(OWNER);
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
      curatorVault2,
      curatorToken,
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
        "0",
        ""
      );

    // Get the NFT source ID
    const NFT_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      testingStandard1155.address,
      MAKER_NFT_ID
    );

    // Encode the params and hash it to get the meta URI
    const TRANSFORM_ID = deriveTransformId(NFT_SOURCE_ID, BigNumber.from(0));

    const REACTION_AMOUNT = BigNumber.from(1);

    // Buy the reaction
    await reactionVault.buyReaction(
      TRANSFORM_ID,
      REACTION_AMOUNT,
      OWNER.address, // Where reactions should end up
      REFERRER.address, // Referrer
      BigNumber.from(0),
      {value: TEST_REACTION_PRICE}
    );

    // Derive the reaction meta ID
    const REACTION_NFT_PARAMETER_VERSION = deriveReactionParameterVersion(
      paymentTokenErc20.address,
      TEST_REACTION_PRICE,
      BigNumber.from(TEST_SALE_CURATOR_LIABILITY_BP)
    );

    const REACTION_ID = deriveReactionId(
      BigNumber.from(REACTION_NFT_PARAMETER_VERSION),
      BigNumber.from(TRANSFORM_ID),
      BigNumber.from(0)
    );

    const metadataHash = "QmV288zHttJJwPBZAW3L922dBypWqukFNWzekT6chxW4Cu";

    // Now spend it
    const transaction = await reactionVault.spendReaction(
      chainId,
      testingStandard1155.address,
      TAKER_NFT_ID,
      REACTION_ID,
      REACTION_AMOUNT,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      metadataHash
    );
    const receipt = await transaction.wait();

    // Calculate expected amounts
    const expectedTakerCuratorTokens = BigNumber.from("25000010678907");
    const expectedSpenderCuratorTokens = BigNumber.from("25000000000000");
    const curatorTokensId = await curatorVault2.getTokenId(
      chainId,
      testingStandard1155.address,
      TAKER_NFT_ID,
      paymentTokenErc20.address
    );

    // Verify the events

    // Event ReactionsSpent
    let foundEvent = receipt.events?.find((x) => x.event === "ReactionsSpent");
    expect(foundEvent!.args!.takerNftAddress).to.be.equal(
      testingStandard1155.address
    );
    expect(foundEvent!.args!.takerNftId).to.be.equal(TAKER_NFT_ID);
    expect(foundEvent!.args!.reactionId).to.be.equal(REACTION_ID);
    expect(foundEvent!.args!.quantity).to.be.equal(REACTION_AMOUNT);
    expect(foundEvent!.args!.referrer).to.be.equal(ZERO_ADDRESS);
    expect(foundEvent!.args!.ipfsMetadataHash).to.be.equal(metadataHash);
    expect(foundEvent!.args!.curatorTokenId).to.be.equal(curatorTokensId);

    // Verify the spender (OWNER) got curator Tokens
    expect(
      await curatorToken.balanceOf(OWNER.address, curatorTokensId)
    ).to.be.equal(expectedSpenderCuratorTokens);

    // Get the rewards key for this taker
    const rewardsKey = deriveTakerRewardsKey(
      chainId,
      testingStandard1155.address,
      BigNumber.from(TAKER_NFT_ID),
      curatorVault2.address,
      curatorTokensId
    );

    // Verify the taker NFT got allocated curator Tokens
    expect(await reactionVault.nftOwnerRewards(rewardsKey)).to.be.equal(
      expectedTakerCuratorTokens
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
    testingStandard1155.mint(ALICE.address, MAKER_NFT_ID, "1", [0]);

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        MAKER_NFT_ID,
        CREATOR.address,
        TEST_SALE_CREATOR_BP,
        "0",
        ""
      );

    // Get the NFT source ID
    const NFT_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      testingStandard1155.address,
      MAKER_NFT_ID
    );

    // Encode the params and hash it to get the meta URI
    const TRANSFORM_ID = deriveTransformId(NFT_SOURCE_ID, BigNumber.from(0));

    const REACTION_AMOUNT = BigNumber.from(1);

    // Buy the reaction
    await reactionVault.buyReaction(
      TRANSFORM_ID,
      REACTION_AMOUNT,
      OWNER.address, // Where reactions should end up
      REFERRER.address, // Referrer
      BigNumber.from(0),
      {value: TEST_REACTION_PRICE}
    );

    // Derive the reaction meta ID
    const REACTION_NFT_PARAMETER_VERSION = deriveReactionParameterVersion(
      paymentTokenErc20.address,
      TEST_REACTION_PRICE,
      BigNumber.from(TEST_SALE_CURATOR_LIABILITY_BP)
    );

    const REACTION_ID = deriveReactionId(
      BigNumber.from(REACTION_NFT_PARAMETER_VERSION),
      BigNumber.from(TRANSFORM_ID),
      BigNumber.from(0)
    );

    // Now spend it
    const transaction = await reactionVault.spendReaction(
      chainId,
      testingStandard1155.address,
      TAKER_NFT_ID,
      REACTION_ID,
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
    testingStandard1155.mint(ALICE.address, MAKER_NFT_ID, "1", [0]);

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        MAKER_NFT_ID,
        CREATOR.address,
        TEST_SALE_CREATOR_BP,
        "0",
        ""
      );

    // Get the NFT source ID
    const NFT_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      testingStandard1155.address,
      MAKER_NFT_ID
    );

    // Encode the params and hash it to get the meta URI
    const TRANSFORM_ID = deriveTransformId(NFT_SOURCE_ID, BigNumber.from(0));

    const REACTION_AMOUNT = BigNumber.from(1);

    // Buy the reaction
    await reactionVault.buyReaction(
      TRANSFORM_ID,
      REACTION_AMOUNT,
      OWNER.address, // Where reactions should end up
      REFERRER.address, // Referrer
      BigNumber.from(0),
      {value: TEST_REACTION_PRICE}
    );

    // Derive the reaction meta ID
    const REACTION_NFT_PARAMETER_VERSION = deriveReactionParameterVersion(
      paymentTokenErc20.address,
      TEST_REACTION_PRICE,
      BigNumber.from(TEST_SALE_CURATOR_LIABILITY_BP)
    );

    const REACTION_ID = deriveReactionId(
      BigNumber.from(REACTION_NFT_PARAMETER_VERSION),
      BigNumber.from(TRANSFORM_ID),
      BigNumber.from(0)
    );

    // Now spend it
    await expect(
      reactionVault.spendReaction(
        chainId,
        testingStandard1155.address,
        TAKER_NFT_ID,
        REACTION_ID,
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
      paymentTokenErc20,
      addressManager,
      parameterManager,
    } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Deploy a custom curator vault
    // Deploy the curator Tokens Token Contract
    const CuratorTokens1155Factory = await ethers.getContractFactory(
      "TestErc1155"
    );
    const deployedCuratorTokens = await upgrades.deployProxy(
      CuratorTokens1155Factory,
      [TEST_NFT_URI, addressManager.address, TEST_CONTRACT_URI]
    );
    const curatorTokens = CuratorTokens1155Factory.attach(
      deployedCuratorTokens.address
    );

    // Deploy the Default Curator Vault
    const CuratorVaultFactory = await ethers.getContractFactory(
      "SigmoidCuratorVault"
    );
    const deployedCuratorVault = await upgrades.deployProxy(
      CuratorVaultFactory,
      [
        addressManager.address,
        curatorTokens.address,
        "5000",
        "10000000",
        "29000000000000",
      ]
    );
    const curatorVault2 = CuratorVaultFactory.attach(
      deployedCuratorVault.address
    );

    // Add the custom curator vault to the parameter manager
    await parameterManager.setApprovedCuratorVaults(
      curatorVault2.address,
      true
    );

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
        "0",
        ""
      );

    // Get the NFT source ID
    const NFT_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      testingStandard1155.address,
      MAKER_NFT_ID
    );

    // Encode the params and hash it to get the meta URI
    const TRANSFORM_ID = deriveTransformId(NFT_SOURCE_ID, BigNumber.from(0));

    const REACTION_AMOUNT = BigNumber.from(1);

    // Buy the reaction
    await reactionVault.buyReaction(
      TRANSFORM_ID,
      REACTION_AMOUNT,
      OWNER.address, // Where reactions should end up
      REFERRER.address, // Referrer
      BigNumber.from(0),
      {value: TEST_REACTION_PRICE}
    );

    // Derive the reaction meta ID
    const REACTION_NFT_PARAMETER_VERSION = deriveReactionParameterVersion(
      paymentTokenErc20.address,
      TEST_REACTION_PRICE,
      BigNumber.from(TEST_SALE_CURATOR_LIABILITY_BP)
    );

    const REACTION_ID = deriveReactionId(
      BigNumber.from(REACTION_NFT_PARAMETER_VERSION),
      BigNumber.from(TRANSFORM_ID),
      BigNumber.from(0)
    );

    // Now spend it
    const transaction = await reactionVault.spendReaction(
      chainId,
      testingStandard1155.address,
      TAKER_NFT_ID,
      REACTION_ID,
      REACTION_AMOUNT,
      ZERO_ADDRESS,
      curatorVault2.address, // Custom curator vault
      "0"
    );
    const receipt = await transaction.wait();

    // Calculate expected amounts
    const expectedTakerCuratorTokens = BigNumber.from("25000010678907");
    const expectedSpenderCuratorTokens = BigNumber.from("25000000000000");
    const curatorTokensId = await curatorVault2.getTokenId(
      chainId,
      testingStandard1155.address,
      TAKER_NFT_ID,
      paymentTokenErc20.address
    );

    // Verify the events

    // Event ReactionsSpent
    let foundEvent = receipt.events?.find((x) => x.event === "ReactionsSpent");
    expect(foundEvent!.args!.takerNftAddress).to.be.equal(
      testingStandard1155.address
    );
    expect(foundEvent!.args!.takerNftId).to.be.equal(TAKER_NFT_ID);
    expect(foundEvent!.args!.reactionId).to.be.equal(REACTION_ID);
    expect(foundEvent!.args!.quantity).to.be.equal(REACTION_AMOUNT);
    expect(foundEvent!.args!.referrer).to.be.equal(ZERO_ADDRESS);

    // Verify the spender (OWNER) got curator Tokens
    expect(
      await curatorTokens.balanceOf(OWNER.address, curatorTokensId)
    ).to.be.equal(expectedSpenderCuratorTokens);

    // Get the rewards key for this taker
    const rewardsKey = deriveTakerRewardsKey(
      chainId,
      testingStandard1155.address,
      BigNumber.from(TAKER_NFT_ID),
      curatorVault2.address,
      curatorTokensId
    );

    // Verify the taker NFT got allocated curator Tokens
    // NftAddress -> NftId -> RewardToken -> RewardTokenId -> balance
    expect(await reactionVault.nftOwnerRewards(rewardsKey)).to.be.equal(
      expectedTakerCuratorTokens
    );
  });
});
