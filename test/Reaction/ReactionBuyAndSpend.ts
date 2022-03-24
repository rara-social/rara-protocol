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
import {
  NFT_NOT_REGISTERED,
  NO_BALANCE,
  TRANSFER_NOT_ALLOWED,
  UNKNOWN_NFT,
} from "../Scripts/errors";

describe("ReactionVault Buy", function () {
  it("Should buy and spend a single reaction", async function () {
    const [OWNER, ALICE, CREATOR, REFERRER] = await ethers.getSigners();
    const {
      reactionVault,
      testingStandard1155,
      makerRegistrar,
      roleManager,
      paymentTokenErc20,
      curatorToken,
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
    const NFT_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      testingStandard1155.address,
      NFT_ID
    );

    // Encode the params and hash it to get the meta URI
    const REACTION_ID = deriveTransformId(NFT_SOURCE_ID, BigNumber.from(0));

    // Mint the purchase price amount of tokens to the owner
    paymentTokenErc20.mint(OWNER.address, TEST_REACTION_PRICE);

    // Approve the transfer of payment tokens
    paymentTokenErc20.approve(reactionVault.address, TEST_REACTION_PRICE);

    // Buying 1 reaction
    const REACTION_AMOUNT = BigNumber.from(1);

    const TAKER_NFT_ID = "2";

    // Buy and spend the reaction
    const transaction = await reactionVault.buyAndSpendReaction(
      REACTION_ID,
      REACTION_AMOUNT,
      REFERRER.address, // Referrer
      BigNumber.from(0), // Option Bits
      chainId,
      testingStandard1155.address,
      TAKER_NFT_ID,
      ZERO_ADDRESS, // Curator vault override
      0 // metadata hash
    );
    const receipt = await transaction.wait();

    // Verify the buy event
    const purchaseEvent = receipt.events?.find(
      (x) => x.event === "ReactionsPurchased"
    );
    expect(purchaseEvent).to.not.be.null;

    // Verify the spend event
    const spendEvent = receipt.events?.find(
      (x) => x.event === "ReactionsSpent"
    );
    expect(spendEvent).to.not.be.null;

    // Verify curator tokens are in the wallet
    expect(
      await curatorToken.balanceOf(
        OWNER.address,
        spendEvent!.args!.curatorTokenId!
      )
    ).to.be.equal(spendEvent!.args!.curatorTokenAmount);
  });

  it("Should buy and spend multiple reactions", async function () {
    const [OWNER, ALICE, CREATOR, REFERRER] = await ethers.getSigners();
    const {
      reactionVault,
      testingStandard1155,
      makerRegistrar,
      roleManager,
      paymentTokenErc20,
      curatorToken,
    } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Now register an NFT and get the Meta ID
    // Mint an NFT to Alice
    const NFT_ID = "1";

    // Buying 10 reactions
    const REACTION_AMOUNT = BigNumber.from(10);

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
    const NFT_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      testingStandard1155.address,
      NFT_ID
    );

    // Encode the params and hash it to get the meta URI
    const REACTION_ID = deriveTransformId(NFT_SOURCE_ID, BigNumber.from(0));

    // Mint the purchase price amount of tokens to the owner
    paymentTokenErc20.mint(
      OWNER.address,
      TEST_REACTION_PRICE.mul(REACTION_AMOUNT)
    );

    // Approve the transfer of payment tokens
    paymentTokenErc20.approve(
      reactionVault.address,
      TEST_REACTION_PRICE.mul(REACTION_AMOUNT)
    );

    const TAKER_NFT_ID = "2";

    // Buy and spend the reaction
    const transaction = await reactionVault.buyAndSpendReaction(
      REACTION_ID,
      REACTION_AMOUNT,
      REFERRER.address, // Referrer
      BigNumber.from(0), // Option Bits
      chainId,
      testingStandard1155.address,
      TAKER_NFT_ID,
      ZERO_ADDRESS, // Curator vault override
      0 // metadata hash
    );
    const receipt = await transaction.wait();

    // Verify the buy event
    const purchaseEvent = receipt.events?.find(
      (x) => x.event === "ReactionsPurchased"
    );
    expect(purchaseEvent).to.not.be.null;

    // Verify the spend event
    const spendEvent = receipt.events?.find(
      (x) => x.event === "ReactionsSpent"
    );
    expect(spendEvent).to.not.be.null;

    // Verify curator Tokens are in the wallet
    expect(
      await curatorToken.balanceOf(
        OWNER.address,
        spendEvent!.args!.curatorTokenId!
      )
    ).to.be.equal(spendEvent!.args!.curatorTokenAmount);
  });
});
