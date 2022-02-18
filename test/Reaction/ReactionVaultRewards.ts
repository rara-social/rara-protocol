import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import {
  deploySystem,
  TEST_REACTION_PRICE,
  TEST_SALE_CREATOR_BP,
  TEST_SALE_CURATOR_LIABILITY_BP,
  TEST_SALE_REFERRER_BP,
} from "../Scripts/deploy";
import { deriveMakerNftMetaId } from "../Scripts/derivedParams";
import { INVALID_ZERO_PARAM } from "../Scripts/errors";

describe.only("ReactionVault Withdraw ERC20", function () {
  it("Should buy a single reaction", async function () {
    const [OWNER, MAKER, CREATOR, REFERRER, ALICE] = await ethers.getSigners();
    const {
      reactionVault,
      testingStandard1155,
      makerRegistrar,
      roleManager,
      paymentTokenErc20,
    } = await deploySystem(OWNER);

    // Now register an NFT and get the Meta ID
    // Mint an NFT to Alice
    const NFT_ID = "1";
    const reactionMinterRole = await roleManager.REACTION_MINTER_ROLE();
    roleManager.grantRole(reactionMinterRole, OWNER.address);
    testingStandard1155.mint(MAKER.address, NFT_ID, "1", [0]);

    // Register it
    await makerRegistrar
      .connect(MAKER)
      .registerNFT(testingStandard1155.address, NFT_ID, CREATOR.address, "0");

    // Get the NFT source ID
    const NFT_SOURCE_ID = await makerRegistrar.nftToSourceLookup(
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
    const CREATOR_CUT =
      TEST_REACTION_PRICE.mul(TEST_SALE_CREATOR_BP).div(10_000);
    const REFERRER_CUT = TEST_REACTION_PRICE.mul(TEST_SALE_REFERRER_BP).div(
      10_000
    );
    const CURATOR_LIABILITY = TEST_REACTION_PRICE.mul(
      TEST_SALE_CURATOR_LIABILITY_BP
    ).div(10_000);
    const MAKER_CUT = TEST_REACTION_PRICE.sub(CREATOR_CUT)
      .sub(REFERRER_CUT)
      .sub(CURATOR_LIABILITY);

    // Build the tx
    await reactionVault.buyReaction(
      MAKER_NFT_META_ID,
      REACTION_AMOUNT,
      OWNER.address, // Where reactions should end up
      REFERRER.address, // Referrer
      BigNumber.from(0)
    );

    // Verify a user that does not have rewards fails
    expect(
      reactionVault
        .connect(ALICE)
        .withdrawErc20Rewards(paymentTokenErc20.address)
    ).to.be.revertedWith(INVALID_ZERO_PARAM);

    // Verify a token that does not exist fails
    expect(
      reactionVault.withdrawErc20Rewards(ALICE.address)
    ).to.be.revertedWith(INVALID_ZERO_PARAM);

    // Withdraw creator rewards
    await reactionVault
      .connect(CREATOR)
      .withdrawErc20Rewards(paymentTokenErc20.address);
    let balance = await paymentTokenErc20.balanceOf(CREATOR.address);
    expect(balance.toString()).to.be.equal(CREATOR_CUT.toString());

    // Withdraw referrer rewards
    await reactionVault
      .connect(REFERRER)
      .withdrawErc20Rewards(paymentTokenErc20.address);
    balance = await paymentTokenErc20.balanceOf(REFERRER.address);
    expect(balance.toString()).to.be.equal(REFERRER_CUT.toString());

    // Withdraw maker rewards
    await reactionVault
      .connect(MAKER)
      .withdrawErc20Rewards(paymentTokenErc20.address);
    balance = await paymentTokenErc20.balanceOf(MAKER.address);
    expect(balance.toString()).to.be.equal(MAKER_CUT.toString());
  });
});
