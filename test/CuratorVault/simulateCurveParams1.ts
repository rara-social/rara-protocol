import {expect} from "chai";
import {ethers, upgrades} from "hardhat";
import {ZERO_ADDRESS} from "../Scripts/constants";
import {deploySystem, A, B, C} from "../Scripts/setup";
import {
  INVALID_ZERO_PARAM,
  NOT_ADMIN,
  NO_BALANCE,
  TRANSFER_NOT_ALLOWED,
} from "../Scripts/errors";
import {BigNumber} from "ethers";
import {promises as fsPromises} from "fs";

describe("Simulate Purchases - 1", function () {
  it("Setup", async function () {
    const [OWNER, ALICE] = await ethers.getSigners();
    const {curatorVault, paymentTokenErc20, curatorToken, roleManager} =
      await deploySystem(OWNER);

    const USDCpurchase = "1";
    const numberOfPurchases = 125;
    const folder = "current";
    const filename = `p1`;

    // ----
    // Setup buyer account
    // ----
    await paymentTokenErc20.mint(OWNER.address, "100000000000000");
    await paymentTokenErc20
      .connect(OWNER)
      .approve(curatorVault.address, "100000000000000");
    // Set the owner as the purchaser role to allow purchase
    await roleManager.grantRole(
      await roleManager.CURATOR_VAULT_PURCHASER(),
      OWNER.address
    );

    // ----
    // Buy
    // ----
    const chainId = "1";
    const contractAddress = ZERO_ADDRESS;
    const tokenId = "1";
    // const curatorTokenId = await curatorVault.getTokenId(
    //   chainId,
    //   contractAddress,
    //   tokenId,
    //   paymentTokenErc20.address
    // );
    const purchaseAmount = BigNumber.from(USDCpurchase).mul(
      BigNumber.from(10).pow(6)
    ); // $10
    const txn = await curatorVault.buyCuratorTokens(
      chainId,
      ZERO_ADDRESS,
      "1",
      paymentTokenErc20.address,
      purchaseAmount,
      OWNER.address,
      false
    );
    const receipt = await txn.wait();
    const filter = curatorVault.filters.CuratorTokensBought();
    const events = await curatorVault.queryFilter(filter);
    const {curatorTokenId, curatorTokensBought} = events[0].args;

    const contractTokenBalance = await curatorVault.curatorTokenSupply(
      curatorTokenId
    );
    const contractReservesBalance = await curatorVault.reserves(curatorTokenId);

    console.log({
      curatorTokensBought,
      contractTokenBalance,
      contractReservesBalance,
    });
  });
});
