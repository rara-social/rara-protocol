import { expect } from "chai";
import { ethers } from "hardhat";
import { ZERO_ADDRESS } from "../Scripts/constants";
import { deploySystem } from "../Scripts/deploy";
import {
  NOT_REACTION_VAULT,
  NO_BALANCE,
  TRANSFER_NOT_ALLOWED,
} from "../Scripts/errors";

describe("CuratorVault", function () {
  it("Should get initialized with address manager", async function () {
    const [OWNER] = await ethers.getSigners();
    const { curatorVault, addressManager } = await deploySystem(OWNER);

    // Verify the address manager was set
    const currentAddressManager = await curatorVault.addressManager();
    expect(currentAddressManager).to.equal(addressManager.address);
  });

  it("Should not allow address other than reaction vault purchase", async function () {
    const [OWNER] = await ethers.getSigners();
    const { curatorVault } = await deploySystem(OWNER);

    // Should fail
    await expect(
      curatorVault.buyCuratorShares(ZERO_ADDRESS, "1", "1", OWNER.address)
    ).to.be.revertedWith(NOT_REACTION_VAULT);
  });

  it("Should verify payment token", async function () {
    const [OWNER] = await ethers.getSigners();
    const { curatorVault, addressManager, paymentTokenErc20 } =
      await deploySystem(OWNER);

    // Set the owner as the address manager to allow purchase to be tried
    await addressManager.setReactionVault(OWNER.address);

    // Should fail
    await expect(
      curatorVault.buyCuratorShares(ZERO_ADDRESS, "1", "1", OWNER.address)
    ).to.be.revertedWith(NO_BALANCE);

    // Give the account a balance
    await paymentTokenErc20.mint(OWNER.address, "1000000000");

    // Should fail
    await expect(
      curatorVault.buyCuratorShares(ZERO_ADDRESS, "1", "1", OWNER.address)
    ).to.be.revertedWith(TRANSFER_NOT_ALLOWED);
  });

  it("Should allow purchase and sale", async function () {
    const [OWNER] = await ethers.getSigners();
    const { curatorVault, addressManager, paymentTokenErc20, curatorShares } =
      await deploySystem(OWNER);

    // Set the owner as the address manager to allow purchase
    await addressManager.setReactionVault(OWNER.address);

    const paymentAmount = "10000";

    // Give the account a balance
    await paymentTokenErc20.mint(OWNER.address, paymentAmount);

    // Approve the tokens
    await paymentTokenErc20.approve(curatorVault.address, paymentAmount);

    // Get the curator share ID
    const curatorShareId = await curatorVault.getTokenId(ZERO_ADDRESS, "1");

    // Expected amount for first purchase
    const expectedAmount = "38860";

    // Buy curator shares for the owner
    await expect(
      curatorVault.buyCuratorShares(
        ZERO_ADDRESS,
        "1",
        paymentAmount,
        OWNER.address
      )
    )
      .to.emit(curatorVault, "CuratorSharesBought")
      .withArgs(curatorShareId, paymentAmount, expectedAmount);

    // Verify the shares were bought
    expect(
      await curatorShares.balanceOf(OWNER.address, curatorShareId)
    ).to.equal(expectedAmount);

    // Now sell it back and get back full amount of funds
    await expect(
      curatorVault.sellCuratorShares(ZERO_ADDRESS, "1", expectedAmount)
    )
      .to.emit(curatorVault, "CuratorSharesSold")
      .withArgs(curatorShareId, "9999", expectedAmount); // 9999 due to precision loss
  });

  it("Should allow purchase and sale with increasing price", async function () {
    const [OWNER, ALICE] = await ethers.getSigners();
    const { curatorVault, addressManager, paymentTokenErc20, curatorShares } =
      await deploySystem(OWNER);

    // Set the owner as the address manager to allow purchase
    await addressManager.setReactionVault(OWNER.address);

    const paymentAmount = "10000";

    // Give the account a balance
    await paymentTokenErc20.mint(OWNER.address, paymentAmount);
    await paymentTokenErc20.mint(ALICE.address, paymentAmount);

    // Approve the tokens
    await paymentTokenErc20.approve(curatorVault.address, paymentAmount);
    await paymentTokenErc20
      .connect(ALICE)
      .approve(curatorVault.address, paymentAmount);

    // Buy for the owner
    await curatorVault.buyCuratorShares(
      ZERO_ADDRESS,
      "1",
      paymentAmount,
      OWNER.address
    );

    // Set the address to allow alice to buy
    await addressManager.setReactionVault(ALICE.address);

    await curatorVault
      .connect(ALICE)
      .buyCuratorShares(ZERO_ADDRESS, "1", paymentAmount, ALICE.address);

    // Get the curator share ID
    const curatorShareId = await curatorVault.getTokenId(ZERO_ADDRESS, "1");

    const ownerBalance = await curatorShares.balanceOf(
      OWNER.address,
      curatorShareId
    );
    const aliceBalance = await curatorShares.balanceOf(
      ALICE.address,
      curatorShareId
    );

    expect(ownerBalance.toNumber()).to.be.greaterThan(aliceBalance.toNumber());
  });
});
