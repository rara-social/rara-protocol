import { expect } from "chai";
import { ethers } from "hardhat";
import { ZERO_ADDRESS } from "../Scripts/constants";
import { deploySystem } from "../Scripts/setup";
import { NOT_ADMIN, NO_BALANCE, TRANSFER_NOT_ALLOWED } from "../Scripts/errors";

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
    const { curatorVault, paymentTokenErc20 } = await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Should fail
    await expect(
      curatorVault.buyCuratorTokens(
        chainId,
        ZERO_ADDRESS,
        "1",
        paymentTokenErc20.address,
        "1",
        OWNER.address,
        false
      )
    ).to.be.revertedWith(NOT_ADMIN);
  });

  it("Should verify payment token", async function () {
    const [OWNER, ALICE] = await ethers.getSigners();
    const { curatorVault, paymentTokenErc20, roleManager } = await deploySystem(
      OWNER
    );
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Set the owner as the address manager to allow purchase to be tried
    await roleManager.grantRole(
      await roleManager.CURATOR_VAULT_PURCHASER(),
      OWNER.address
    );

    // Should fail
    await expect(
      curatorVault.buyCuratorTokens(
        chainId,
        ZERO_ADDRESS,
        "1",
        paymentTokenErc20.address,
        "1",
        OWNER.address,
        false
      )
    ).to.be.revertedWith(NO_BALANCE);

    // Give the account a balance
    await paymentTokenErc20.connect(OWNER).deposit({ value: "1000000000" });

    // Should fail since there is no allowance
    await expect(
      curatorVault.buyCuratorTokens(
        chainId,
        ZERO_ADDRESS,
        "1",
        paymentTokenErc20.address,
        "1",
        OWNER.address,
        false
      )
    ).to.be.revertedWith(TRANSFER_NOT_ALLOWED);

    // Set the Alice as the purchaser role to allow purchase to be tried
    await roleManager.grantRole(
      await roleManager.CURATOR_VAULT_PURCHASER(),
      ALICE.address
    );

    // Even if Alice has an allowance but no tokens it should still fail
    await paymentTokenErc20
      .connect(ALICE)
      .approve(curatorVault.address, "1000000000");
    await expect(
      curatorVault
        .connect(ALICE)
        .buyCuratorTokens(
          chainId,
          ZERO_ADDRESS,
          "1",
          paymentTokenErc20.address,
          "1",
          OWNER.address,
          false
        )
    ).to.be.revertedWith(NO_BALANCE);
  });

  it("Should allow purchase and sale", async function () {
    const [OWNER] = await ethers.getSigners();
    const { curatorVault, paymentTokenErc20, curatorToken, roleManager } =
      await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Set the owner as the purchaser role to allow purchase
    await roleManager.grantRole(
      await roleManager.CURATOR_VAULT_PURCHASER(),
      OWNER.address
    );

    const paymentAmount = "100000000";

    // Give the account a balance
    await paymentTokenErc20.connect(OWNER).deposit({ value: paymentAmount });

    // Approve the tokens
    await paymentTokenErc20.approve(curatorVault.address, paymentAmount);

    // Get the curator Token ID
    const curatorTokenId = await curatorVault.getTokenId(
      chainId,
      ZERO_ADDRESS,
      "1",
      paymentTokenErc20.address
    );

    // Expected amount for first purchase
    const expectedAmount = "165012";

    // Buy curator Tokens for the owner
    await expect(
      curatorVault.buyCuratorTokens(
        chainId,
        ZERO_ADDRESS,
        "1",
        paymentTokenErc20.address,
        paymentAmount,
        OWNER.address,
        false
      )
    )
      .to.emit(curatorVault, "CuratorTokensBought")
      .withArgs(
        curatorTokenId,
        chainId,
        ZERO_ADDRESS,
        "1",
        paymentTokenErc20.address,
        paymentAmount,
        expectedAmount,
        false
      );

    // Verify the Tokens were bought
    expect(
      await curatorToken.balanceOf(OWNER.address, curatorTokenId)
    ).to.equal(expectedAmount);

    // Now sell it back and get back full amount of funds
    await expect(
      curatorVault.sellCuratorTokens(
        chainId,
        ZERO_ADDRESS,
        "1",
        paymentTokenErc20.address,
        expectedAmount,
        OWNER.address
      )
    )
      .to.emit(curatorVault, "CuratorTokensSold")
      .withArgs(curatorTokenId, paymentAmount, expectedAmount);
  });

  it("Should allow purchase and sale with increasing price", async function () {
    const [OWNER, ALICE] = await ethers.getSigners();
    const { curatorVault, roleManager, paymentTokenErc20, curatorToken } =
      await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Set the owner as the purchaser role to allow purchase
    await roleManager.grantRole(
      await roleManager.CURATOR_VAULT_PURCHASER(),
      OWNER.address
    );

    const paymentAmount = "100000000"; // 6 decimal places for $1

    // Give the account a balance
    await paymentTokenErc20.connect(ALICE).deposit({ value: paymentAmount });
    await paymentTokenErc20.connect(OWNER).deposit({ value: paymentAmount });

    // Approve the tokens
    await paymentTokenErc20.approve(curatorVault.address, paymentAmount);
    await paymentTokenErc20
      .connect(ALICE)
      .approve(curatorVault.address, paymentAmount);

    // Buy for the owner
    await curatorVault.buyCuratorTokens(
      chainId,
      ZERO_ADDRESS,
      "1",
      paymentTokenErc20.address,
      paymentAmount,
      OWNER.address,
      false
    );

    // Set alice as the purchaser role to allow purchase
    await roleManager.grantRole(
      await roleManager.CURATOR_VAULT_PURCHASER(),
      ALICE.address
    );

    await curatorVault
      .connect(ALICE)
      .buyCuratorTokens(
        chainId,
        ZERO_ADDRESS,
        "1",
        paymentTokenErc20.address,
        paymentAmount,
        ALICE.address,
        true
      );

    // Get the curator Token ID
    const curatorTokenId = await curatorVault.getTokenId(
      chainId,
      ZERO_ADDRESS,
      "1",
      paymentTokenErc20.address
    );

    const ownerBalance = await curatorToken.balanceOf(
      OWNER.address,
      curatorTokenId
    );
    const aliceBalance = await curatorToken.balanceOf(
      ALICE.address,
      curatorTokenId
    );

    expect(ownerBalance.toNumber()).to.be.greaterThan(aliceBalance.toNumber());
  });
});
