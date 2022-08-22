import {expect} from "chai";
import {ethers, upgrades} from "hardhat";
import {ZERO_ADDRESS} from "../Scripts/constants";
import {deploySystem} from "../Scripts/setup";
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

    const a = "5000";
    const b = "10000000";
    const c = "19000000000000";

    // const USDCpurchase = "10";
    const USDCpurchase = "10";
    const numberOfPurchases = 125;

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
    // Setup Buy params
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
      ].join(),
    ];
    for (let index = 0; index < numberOfPurchases; index++) {
      // ----
      // Buy
      // ----
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
      // console.log(receipt);

      // ----
      // Check & Log
      // ----
      const contractTokenBalance = await curatorVault.curatorTokenSupply(
        curatorTokenId
      );
      const contractReservesBalance = await curatorVault.reserves(
        curatorTokenId
      );

      // console.log({
      //   index: index,
      //   // purchaseAmount: purchaseAmount.toNumber() / 1_000_000,
      //   // tokensPurchased: tokensPerPurchase.toNumber(),
      //   contractTokenBalance: contractTokenBalance.toNumber(),
      //   contractReservesBalance: contractReservesBalance.toNumber() / 1_000_000,
      //   // refundPerThousand: refundPerThousand.toNumber() / 1_000_000,
      // });

      let refundPerThousand =
        await curatorVault.calculatePaymentReturnedFromTokens(
          a,
          b,
          c,
          contractTokenBalance,
          contractReservesBalance,
          1000
        );
      const tokensPerPurchase =
        await curatorVault.calculateTokensBoughtFromPayment(
          a,
          b,
          c,
          contractTokenBalance,
          contractReservesBalance,
          purchaseAmount
        );

      // console.log({
      //   index: index,
      //   purchaseAmount: purchaseAmount.toNumber() / 1_000_000,
      //   tokensPurchased: tokensPerPurchase.toNumber(),
      //   contractTokenBalance: contractTokenBalance.toNumber(),
      //   contractReservesBalance: contractReservesBalance.toNumber() / 1_000_000,
      //   refundPerThousand: refundPerThousand.toNumber() / 1_000_000,
      // });

      data = data.concat(
        [
          (purchaseAmount.toNumber() / 1_000_000).toString(),
          tokensPerPurchase.toString(),
          contractTokenBalance.toString(),
          (contractReservesBalance.toNumber() / 1_000_000).toString(),
          (refundPerThousand.toNumber() / 1_000_000).toString(),
        ].join()
      );
    }

    fsPromises.writeFile(
      `./simulation_output/${USDCpurchase}_(${a},${b},${c}).csv`,
      data.join("\r\n")
    );

    console.log("done");
  });
});
