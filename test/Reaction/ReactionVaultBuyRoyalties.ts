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
import {deriveTransformId} from "../Scripts/derivedParams";

describe("ReactionVault Royalties Buy", function () {
  it("Should buy a single reaction with invalid royalty params - none set", async function () {
    const [OWNER, ALICE, CREATOR, REFERRER] = await ethers.getSigners();
    const {
      reactionVault,
      testingStandard1155,
      makerRegistrar,
      paymentTokenErc20,
      addressManager,
    } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Now register an NFT and get the Meta ID
    // Mint an NFT to Alice
    const NFT_ID = "1";
    testingStandard1155.mint(ALICE.address, NFT_ID, "1", [0]);

    // Now deploy and set the rewards registry
    const TestRoyaltyRegistryFactory = await ethers.getContractFactory(
      "TestRoyaltyRegistry"
    );
    const royaltyRegistry = await TestRoyaltyRegistryFactory.deploy();
    await addressManager.setRoyaltyRegistry(royaltyRegistry.address);

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        NFT_ID,
        CREATOR.address,
        TEST_SALE_CREATOR_BP,
        "0",
        ""
      );

    // Get the NFT source ID
    const NFT_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      testingStandard1155.address,
      NFT_ID
    );

    // Encode the params and hash it to get the meta URI
    const REACTION_ID = deriveTransformId(NFT_SOURCE_ID, BigNumber.from(0));

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

    //////////////
    // No rewards registry values set
    /////////////

    // Build the tx
    let transaction = await reactionVault.buyReaction(
      REACTION_ID,
      REACTION_AMOUNT,
      OWNER.address, // Where reactions should end up
      REFERRER.address, // Referrer
      BigNumber.from(0),
      {value: TEST_REACTION_PRICE.mul(REACTION_AMOUNT)}
    );
    let receipt = await transaction.wait();

    // Verify the creator reward event
    let creatorRewardEvent = receipt.events?.find(
      (x: any) => x.event === "CreatorRewardsGranted"
    );
    expect(creatorRewardEvent!.args!.creator).to.be.equal(CREATOR.address);
    expect(creatorRewardEvent!.args!.paymentToken).to.be.equal(
      paymentTokenErc20.address
    );
    expect(creatorRewardEvent!.args!.amount).to.be.equal(CREATOR_CUT);
  });

  it("Should buy a single reaction with invalid royalty params - Invalid array lengths set", async function () {
    const [OWNER, ALICE, CREATOR, REFERRER] = await ethers.getSigners();
    const {
      reactionVault,
      testingStandard1155,
      makerRegistrar,
      paymentTokenErc20,
      addressManager,
    } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Now register an NFT and get the Meta ID
    // Mint an NFT to Alice
    const NFT_ID = "1";
    testingStandard1155.mint(ALICE.address, NFT_ID, "1", [0]);

    // Now deploy and set the rewards registry
    const TestRoyaltyRegistryFactory = await ethers.getContractFactory(
      "TestRoyaltyRegistry"
    );
    const royaltyRegistry = await TestRoyaltyRegistryFactory.deploy();
    await addressManager.setRoyaltyRegistry(royaltyRegistry.address);

    await royaltyRegistry.setRoyalties([CREATOR.address], ["100", "200"]);

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        NFT_ID,
        CREATOR.address,
        TEST_SALE_CREATOR_BP,
        "0",
        ""
      );

    // Get the NFT source ID
    const NFT_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      testingStandard1155.address,
      NFT_ID
    );

    // Encode the params and hash it to get the meta URI
    const REACTION_ID = deriveTransformId(NFT_SOURCE_ID, BigNumber.from(0));

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

    //////////////
    // Invalid array lengths set
    /////////////

    const transaction = await reactionVault.buyReaction(
      REACTION_ID,
      REACTION_AMOUNT,
      OWNER.address, // Where reactions should end up
      REFERRER.address, // Referrer
      BigNumber.from(0),
      {value: TEST_REACTION_PRICE.mul(REACTION_AMOUNT)}
    );
    const receipt = await transaction.wait();

    // Verify the creator reward event
    const creatorRewardEvent = receipt.events?.find(
      (x: any) => x.event === "CreatorRewardsGranted"
    );
    expect(creatorRewardEvent!.args!.creator).to.be.equal(CREATOR.address);
    expect(creatorRewardEvent!.args!.paymentToken).to.be.equal(
      paymentTokenErc20.address
    );
    expect(creatorRewardEvent!.args!.amount).to.be.equal(CREATOR_CUT);
  });

  it("Should buy a single reaction with invalid royalty params - Zero address set", async function () {
    const [OWNER, ALICE, CREATOR, REFERRER] = await ethers.getSigners();
    const {
      reactionVault,
      testingStandard1155,
      makerRegistrar,
      paymentTokenErc20,
      addressManager,
    } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Now register an NFT and get the Meta ID
    // Mint an NFT to Alice
    const NFT_ID = "1";
    testingStandard1155.mint(ALICE.address, NFT_ID, "1", [0]);

    // Now deploy and set the rewards registry
    const TestRoyaltyRegistryFactory = await ethers.getContractFactory(
      "TestRoyaltyRegistry"
    );
    const royaltyRegistry = await TestRoyaltyRegistryFactory.deploy();
    await addressManager.setRoyaltyRegistry(royaltyRegistry.address);

    await royaltyRegistry.setRoyalties([ZERO_ADDRESS], ["100"]);

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        NFT_ID,
        CREATOR.address,
        TEST_SALE_CREATOR_BP,
        "0",
        ""
      );

    // Get the NFT source ID
    const NFT_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      testingStandard1155.address,
      NFT_ID
    );

    // Encode the params and hash it to get the meta URI
    const REACTION_ID = deriveTransformId(NFT_SOURCE_ID, BigNumber.from(0));

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

    //////////////
    // Zero address set
    /////////////

    const transaction = await reactionVault.buyReaction(
      REACTION_ID,
      REACTION_AMOUNT,
      OWNER.address, // Where reactions should end up
      REFERRER.address, // Referrer
      BigNumber.from(0),
      {value: TEST_REACTION_PRICE.mul(REACTION_AMOUNT)}
    );
    const receipt = await transaction.wait();

    // Verify the creator reward event
    const creatorRewardEvent = receipt.events?.find(
      (x: any) => x.event === "CreatorRewardsGranted"
    );
    expect(creatorRewardEvent!.args!.creator).to.be.equal(CREATOR.address);
    expect(creatorRewardEvent!.args!.paymentToken).to.be.equal(
      paymentTokenErc20.address
    );
    expect(creatorRewardEvent!.args!.amount).to.be.equal(CREATOR_CUT);
  });

  it("Should buy a single reaction with invalid royalty params - Over 100% set", async function () {
    const [OWNER, ALICE, CREATOR, REFERRER] = await ethers.getSigners();
    const {
      reactionVault,
      testingStandard1155,
      makerRegistrar,
      paymentTokenErc20,
      addressManager,
    } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Now register an NFT and get the Meta ID
    // Mint an NFT to Alice
    const NFT_ID = "1";
    testingStandard1155.mint(ALICE.address, NFT_ID, "1", [0]);

    // Now deploy and set the rewards registry
    const TestRoyaltyRegistryFactory = await ethers.getContractFactory(
      "TestRoyaltyRegistry"
    );
    const royaltyRegistry = await TestRoyaltyRegistryFactory.deploy();
    await addressManager.setRoyaltyRegistry(royaltyRegistry.address);

    await royaltyRegistry.setRoyalties([CREATOR.address], ["20000"]);

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        NFT_ID,
        CREATOR.address,
        TEST_SALE_CREATOR_BP,
        "0",
        ""
      );

    // Get the NFT source ID
    const NFT_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      testingStandard1155.address,
      NFT_ID
    );

    // Encode the params and hash it to get the meta URI
    const REACTION_ID = deriveTransformId(NFT_SOURCE_ID, BigNumber.from(0));

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

    //////////////
    // Over 100% set
    /////////////

    const transaction = await reactionVault.buyReaction(
      REACTION_ID,
      REACTION_AMOUNT,
      OWNER.address, // Where reactions should end up
      REFERRER.address, // Referrer
      BigNumber.from(0),
      {value: TEST_REACTION_PRICE.mul(REACTION_AMOUNT)}
    );
    const receipt = await transaction.wait();

    // Verify the creator reward event
    const creatorRewardEvent = receipt.events?.find(
      (x: any) => x.event === "CreatorRewardsGranted"
    );
    expect(creatorRewardEvent!.args!.creator).to.be.equal(CREATOR.address);
    expect(creatorRewardEvent!.args!.paymentToken).to.be.equal(
      paymentTokenErc20.address
    );
    expect(creatorRewardEvent!.args!.amount).to.be.equal(CREATOR_CUT);
  });

  it("Should buy a single reaction with invalid royalty params - Over 100% set across multiple", async function () {
    const [OWNER, ALICE, CREATOR, REFERRER, CREATOR2] =
      await ethers.getSigners();
    const {
      reactionVault,
      testingStandard1155,
      makerRegistrar,
      paymentTokenErc20,
      addressManager,
    } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Now register an NFT and get the Meta ID
    // Mint an NFT to Alice
    const NFT_ID = "1";
    testingStandard1155.mint(ALICE.address, NFT_ID, "1", [0]);

    // Now deploy and set the rewards registry
    const TestRoyaltyRegistryFactory = await ethers.getContractFactory(
      "TestRoyaltyRegistry"
    );
    const royaltyRegistry = await TestRoyaltyRegistryFactory.deploy();
    await addressManager.setRoyaltyRegistry(royaltyRegistry.address);

    await royaltyRegistry.setRoyalties(
      [CREATOR.address, CREATOR2.address],
      ["9000", "9000"]
    );

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        NFT_ID,
        CREATOR.address,
        TEST_SALE_CREATOR_BP,
        "0",
        ""
      );

    // Get the NFT source ID
    const NFT_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      testingStandard1155.address,
      NFT_ID
    );

    // Encode the params and hash it to get the meta URI
    const REACTION_ID = deriveTransformId(NFT_SOURCE_ID, BigNumber.from(0));

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

    //////////////
    // Over 100% set across multiple
    /////////////

    const transaction = await reactionVault.buyReaction(
      REACTION_ID,
      REACTION_AMOUNT,
      OWNER.address, // Where reactions should end up
      REFERRER.address, // Referrer
      BigNumber.from(0),
      {value: TEST_REACTION_PRICE.mul(REACTION_AMOUNT)}
    );
    const receipt = await transaction.wait();

    // Verify the creator reward event
    const creatorRewardEvent = receipt.events?.find(
      (x: any) => x.event === "CreatorRewardsGranted"
    );
    expect(creatorRewardEvent!.args!.creator).to.be.equal(CREATOR.address);
    expect(creatorRewardEvent!.args!.paymentToken).to.be.equal(
      paymentTokenErc20.address
    );
    expect(creatorRewardEvent!.args!.amount).to.be.equal(CREATOR_CUT);
  });

  it("Should buy a single reaction with multiple royalty params", async function () {
    const [OWNER, ALICE, CREATOR, REFERRER, CREATOR2] =
      await ethers.getSigners();
    const {
      reactionVault,
      testingStandard1155,
      makerRegistrar,
      paymentTokenErc20,
      addressManager,
    } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Now register an NFT and get the Meta ID
    // Mint an NFT to Alice
    const NFT_ID = "1";
    testingStandard1155.mint(ALICE.address, NFT_ID, "1", [0]);

    // Now deploy and set the rewards registry
    const TestRoyaltyRegistryFactory = await ethers.getContractFactory(
      "TestRoyaltyRegistry"
    );
    const royaltyRegistry = await TestRoyaltyRegistryFactory.deploy();
    await addressManager.setRoyaltyRegistry(royaltyRegistry.address);

    // Set both creator addresses to get rewards
    await royaltyRegistry.setRoyalties(
      [CREATOR2.address, CREATOR.address],
      [TEST_SALE_CREATOR_BP, TEST_SALE_CREATOR_BP]
    );

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        NFT_ID,
        CREATOR.address,
        TEST_SALE_CREATOR_BP,
        "0",
        ""
      );

    // Get the NFT source ID
    const NFT_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      testingStandard1155.address,
      NFT_ID
    );

    // Encode the params and hash it to get the meta URI
    const REACTION_ID = deriveTransformId(NFT_SOURCE_ID, BigNumber.from(0));

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

    const transaction = await reactionVault.buyReaction(
      REACTION_ID,
      REACTION_AMOUNT,
      OWNER.address, // Where reactions should end up
      REFERRER.address, // Referrer
      BigNumber.from(0),
      {value: TEST_REACTION_PRICE.mul(REACTION_AMOUNT)}
    );
    const receipt = await transaction.wait();

    // Verify the creator reward event
    const creatorRewardEvents = receipt.events?.filter(
      (x: any) => x.event === "CreatorRewardsGranted"
    );

    // First creator
    expect(creatorRewardEvents![0].args!.creator).to.be.equal(CREATOR2.address);
    expect(creatorRewardEvents![0].args!.paymentToken).to.be.equal(
      paymentTokenErc20.address
    );
    expect(creatorRewardEvents![0].args!.amount).to.be.equal(CREATOR_CUT);

    // Second creator
    expect(creatorRewardEvents![1].args!.creator).to.be.equal(CREATOR.address);
    expect(creatorRewardEvents![1].args!.paymentToken).to.be.equal(
      paymentTokenErc20.address
    );
    expect(creatorRewardEvents![1].args!.amount).to.be.equal(CREATOR_CUT);
  });
});
