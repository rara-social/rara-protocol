import {expect} from "chai";
import {BigNumber} from "ethers";
import {ethers, upgrades} from "hardhat";
import {
  deploySystem,
  TEST_REACTION_PRICE,
  TEST_SALE_CREATOR_BP,
  TEST_SALE_CURATOR_LIABILITY_BP,
  TEST_SALE_REFERRER_BP,
} from "../Scripts/setup";
import {deriveTransformId} from "../Scripts/derivedParams";
import {INVALID_ZERO_PARAM, NOT_ADMIN} from "../Scripts/errors";

describe("ReactionVault Withdraw Rewards", function () {
  it("Should buy a single reaction and withdraw Native Asset", async function () {
    const [OWNER, MAKER, CREATOR, REFERRER, ALICE] = await ethers.getSigners();
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
    testingStandard1155.mint(MAKER.address, NFT_ID, "1", [0]);

    // Register it
    await makerRegistrar
      .connect(MAKER)
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

    // Calc the total maker cut
    const TOTAL_MAKER_CUT =
      TEST_REACTION_PRICE.sub(REFERRER_CUT).sub(CURATOR_LIABILITY);

    // Get the creator cut as a percent from the maker cut
    const CREATOR_CUT = TOTAL_MAKER_CUT.mul(TEST_SALE_CREATOR_BP).div(10_000);

    // Sub out the creator cut from the total maker cut
    const MAKER_CUT = TOTAL_MAKER_CUT.sub(CREATOR_CUT);

    // Build the tx
    await reactionVault.buyReaction(
      REACTION_ID,
      REACTION_AMOUNT,
      OWNER.address, // Where reactions should end up
      REFERRER.address, // Referrer
      BigNumber.from(0),
      {value: TEST_REACTION_PRICE}
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

    // Get the balance for the creator before withdrawing
    let originalBalance = await CREATOR.getBalance();

    // Withdraw creator rewards
    let tx = await reactionVault
      .connect(CREATOR)
      .withdrawErc20Rewards(paymentTokenErc20.address);
    let receipt = await tx.wait();
    let gasUsedInEth = receipt.gasUsed.mul(receipt.effectiveGasPrice);

    // Check balance
    let balance = await CREATOR.getBalance();
    expect(balance.toString()).to.be.equal(
      originalBalance.add(CREATOR_CUT).sub(gasUsedInEth)
    );

    // Check event
    let event = receipt.events?.find(
      (e: any) => e.event == "ERC20RewardsClaimed"
    );
    expect(event!.args!["token"]).to.be.equal(paymentTokenErc20.address);
    expect(event!.args!["amount"]).to.be.equal(CREATOR_CUT);
    expect(event!.args!["recipient"]).to.be.equal(CREATOR.address);

    // Withdraw referrer rewards
    originalBalance = await REFERRER.getBalance();
    tx = await reactionVault
      .connect(REFERRER)
      .withdrawErc20Rewards(paymentTokenErc20.address);
    receipt = await tx.wait();
    gasUsedInEth = receipt.gasUsed.mul(receipt.effectiveGasPrice);
    balance = await REFERRER.getBalance();
    expect(balance).to.be.equal(
      originalBalance.add(REFERRER_CUT).sub(gasUsedInEth)
    );

    // Withdraw maker rewards
    originalBalance = await MAKER.getBalance();
    tx = await reactionVault
      .connect(MAKER)
      .withdrawErc20Rewards(paymentTokenErc20.address);
    receipt = await tx.wait();
    gasUsedInEth = receipt.gasUsed.mul(receipt.effectiveGasPrice);
    balance = await MAKER.getBalance();
    expect(balance).to.be.equal(
      originalBalance.add(MAKER_CUT).sub(gasUsedInEth)
    );

    // After rewards are withdrawn, a second attempt should fail
    expect(
      reactionVault
        .connect(MAKER)
        .withdrawErc20Rewards(paymentTokenErc20.address)
    ).to.be.revertedWith(INVALID_ZERO_PARAM);
  });

  it("Should buy a single reaction and withdraw ERC20 Asset", async function () {
    const [OWNER, MAKER, CREATOR, REFERRER, ALICE] = await ethers.getSigners();
    const {
      reactionVault,
      testingStandard1155,
      makerRegistrar,
      parameterManager,
    } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Change Payment token to ERC20
    const ERC20Factory = await ethers.getContractFactory("TestErc20");
    const testErc20 = await upgrades.deployProxy(ERC20Factory, ["TEST", "TST"]);
    await parameterManager.setPaymentToken(testErc20.address);

    // Now register an NFT and get the Meta ID
    // Mint an NFT to Alice
    const NFT_ID = "1";
    testingStandard1155.mint(MAKER.address, NFT_ID, "1", [0]);

    // Register it
    await makerRegistrar
      .connect(MAKER)
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

    // Mint the purchase price amount of tokens to the owner
    await testErc20.mint(OWNER.address, TEST_REACTION_PRICE);

    // Approve the transfer of payment tokens
    await testErc20.approve(reactionVault.address, TEST_REACTION_PRICE);

    // Calculate how the payment will be split
    const REACTION_AMOUNT = BigNumber.from(1);
    const REFERRER_CUT = TEST_REACTION_PRICE.mul(TEST_SALE_REFERRER_BP).div(
      10_000
    );
    const CURATOR_LIABILITY = TEST_REACTION_PRICE.mul(
      TEST_SALE_CURATOR_LIABILITY_BP
    ).div(10_000);

    // Calc the total maker cut
    const TOTAL_MAKER_CUT =
      TEST_REACTION_PRICE.sub(REFERRER_CUT).sub(CURATOR_LIABILITY);

    // Get the creator cut as a percent from the maker cut
    const CREATOR_CUT = TOTAL_MAKER_CUT.mul(TEST_SALE_CREATOR_BP).div(10_000);

    // Sub out the creator cut from the total maker cut
    const MAKER_CUT = TOTAL_MAKER_CUT.sub(CREATOR_CUT);

    // Build the tx
    await reactionVault.buyReaction(
      REACTION_ID,
      REACTION_AMOUNT,
      OWNER.address, // Where reactions should end up
      REFERRER.address, // Referrer
      BigNumber.from(0)
    );

    // Verify a user that does not have rewards fails
    expect(
      reactionVault.connect(ALICE).withdrawErc20Rewards(testErc20.address)
    ).to.be.revertedWith(INVALID_ZERO_PARAM);

    // Verify a token that does not exist fails
    expect(
      reactionVault.withdrawErc20Rewards(ALICE.address)
    ).to.be.revertedWith(INVALID_ZERO_PARAM);

    // Withdraw creator rewards and event
    await expect(
      reactionVault.connect(CREATOR).withdrawErc20Rewards(testErc20.address)
    )
      .to.emit(reactionVault, "ERC20RewardsClaimed")
      .withArgs(testErc20.address, CREATOR_CUT, CREATOR.address);

    let balance = await testErc20.balanceOf(CREATOR.address);
    expect(balance.toString()).to.be.equal(CREATOR_CUT.toString());

    // Withdraw referrer rewards
    await reactionVault
      .connect(REFERRER)
      .withdrawErc20Rewards(testErc20.address);
    balance = await testErc20.balanceOf(REFERRER.address);
    expect(balance.toString()).to.be.equal(REFERRER_CUT.toString());

    // Withdraw maker rewards
    await reactionVault.connect(MAKER).withdrawErc20Rewards(testErc20.address);
    balance = await testErc20.balanceOf(MAKER.address);
    expect(balance.toString()).to.be.equal(MAKER_CUT.toString());

    // After rewards are withdrawn, a second attempt should fail
    expect(
      reactionVault.connect(MAKER).withdrawErc20Rewards(testErc20.address)
    ).to.be.revertedWith(INVALID_ZERO_PARAM);
  });

  it("Should sweep contract of ETH", async function () {
    const [OWNER, ALICE] = await ethers.getSigners();
    const {reactionVault} = await deploySystem(OWNER);

    const amount = ethers.utils.parseEther("1.0");

    // Send 1 ETH into contract
    await OWNER.sendTransaction({
      to: reactionVault.address,
      value: amount,
    });

    // Should verify non owner can't sweep
    await expect(reactionVault.connect(ALICE).sweep()).to.be.revertedWith(
      NOT_ADMIN
    );

    // Capture balance before call
    const originalBalance = await OWNER.getBalance();

    // Verify owner can get it out
    const tx = await reactionVault.connect(OWNER).sweep();
    let receipt = await tx.wait();
    let gasUsedInEth = receipt.gasUsed.mul(receipt.effectiveGasPrice);

    // Calculate the new balance has the sweep value
    let balance = await OWNER.getBalance();
    expect(balance.toString()).to.be.equal(
      originalBalance.add(amount).sub(gasUsedInEth)
    );
  });
});
