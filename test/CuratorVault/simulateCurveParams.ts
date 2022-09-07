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

describe.only("Simulate Purchases", function () {
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
    // Create data
    // ----

    let data = [
      [
        "purchaseAmount",
        "tokensPurchased",
        "contractTokenBalance",
        "contractReservesBalance",
        "refundPerThousand",
        "tokensPerPurchase",
      ].join(),
    ];

    for (let index = 0; index < numberOfPurchases; index++) {
      // ----
      // Buy
      // ----
      const chainId = "1";
      const contractAddress = ZERO_ADDRESS;
      const tokenId = "1";
      const curatorTokenId = await curatorVault.getTokenId(
        chainId,
        contractAddress,
        tokenId,
        paymentTokenErc20.address
      );
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
      const {curatorTokensBought} = events[index].args;

      // ----
      // Get data
      // ----
      const contractTokenBalance = await curatorVault.curatorTokenSupply(
        curatorTokenId
      );
      const contractReservesBalance = await curatorVault.reserves(
        curatorTokenId
      );
      let refundPerThousand =
        await curatorVault.calculatePaymentReturnedFromTokens(
          A,
          B,
          C,
          contractTokenBalance,
          contractReservesBalance,
          1000
        );
      const tokensPerPurchase =
        await curatorVault.calculateTokensBoughtFromPayment(
          A,
          B,
          C,
          contractTokenBalance,
          contractReservesBalance,
          purchaseAmount
        );

      // ----
      // Concat
      // ----
      data = data.concat(
        [
          (purchaseAmount.toNumber() / 1_000_000).toString(),
          curatorTokensBought.toString(),
          contractTokenBalance.toString(),
          (contractReservesBalance.toNumber() / 1_000_000).toString(),
          (refundPerThousand.toNumber() / 1_000_000).toString(),
          tokensPerPurchase.toString(),
        ].join()
      );
    }

    // ----
    // Write
    // ----
    fsPromises.writeFile(
      `./simulation_output/${folder}/${filename}.csv`,
      data.join("\r\n")
    );

    console.log("done");
  });
});
