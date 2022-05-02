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

describe("Sigmoid Curator Vault", function () {
  it("Should check address on init", async function () {
    const SigmoidCuratorVaultFactory = await ethers.getContractFactory(
      "SigmoidCuratorVault"
    );
    const [OWNER] = await ethers.getSigners();
    await expect(
      upgrades.deployProxy(SigmoidCuratorVaultFactory, [
        ZERO_ADDRESS,
        OWNER.address,
        0,
        0,
        0,
      ])
    ).to.revertedWith(INVALID_ZERO_PARAM);

    await expect(
      upgrades.deployProxy(SigmoidCuratorVaultFactory, [
        ZERO_ADDRESS,
        OWNER.address,
        0,
        0,
        0,
      ])
    ).to.revertedWith(INVALID_ZERO_PARAM);
  });

  it("Should buy and sell small amounts", async function () {
    const SigmoidFactory = await ethers.getContractFactory("Sigmoid");

    const sigmoid = await SigmoidFactory.deploy();

    // This is just a very small curve for testing - low numbers will have rounding errors but
    // this was easy to calculate manually on paper and eyeball with using a curve simulator
    // https://www.desmos.com/calculator/j1yxue0euk
    const a = "10";
    const b = "10";
    const c = "1";

    // If the curve is at midway point, 10 tokens sold, 10 tokens in reserve, buying another 10 should cost 190
    let tokensPurchased = await sigmoid.calculateTokensBoughtFromPayment(
      a,
      b,
      c,
      "10",
      "10",
      "190"
    );
    expect(tokensPurchased).to.be.equal("10"); // Should be 10

    // Test starting at 0 and buying half and whole
    tokensPurchased = await sigmoid.calculateTokensBoughtFromPayment(
      a,
      b,
      c,
      "0",
      "0",
      "10"
    );
    expect(tokensPurchased).to.be.equal("10"); // Should be 10

    tokensPurchased = await sigmoid.calculateTokensBoughtFromPayment(
      a,
      b,
      c,
      "0",
      "0",
      "200"
    );
    expect(tokensPurchased).to.be.equal("20"); // Should be 20 but rounds to 19

    // Try buying past the flattening of the curve
    tokensPurchased = await sigmoid.calculateTokensBoughtFromPayment(
      a,
      b,
      c,
      "0",
      "0",
      "400"
    );
    expect(tokensPurchased).to.be.equal("29"); // Should be 30 but rounds to 29

    // If the curve is at the top at 20 tokens minted and 200 paid, selling 10 should give back 190 out of the reserves
    let saleRefund = await sigmoid.calculatePaymentReturnedFromTokens(
      a,
      b,
      c,
      "20",
      "200",
      "10"
    );
    expect(saleRefund).to.be.equal("190"); // Should be 190

    // Test starting at full curve and sell all 20
    saleRefund = await sigmoid.calculatePaymentReturnedFromTokens(
      a,
      b,
      c,
      "20",
      "200",
      "20"
    );
    expect(saleRefund).to.be.equal("200"); // Should be 200
  });

  it("Should be able to sell the same amount it bought", async function () {
    const SigmoidFactory = await ethers.getContractFactory("Sigmoid");

    const sigmoid = await SigmoidFactory.deploy();

    const a = "10";
    const b = "10";
    const c = "5";

    // Iterate from 1 to X payment token purchases and ensure purchases and sales return the same amount
    for (let i = 0; i <= 400; i += 20) {
      // Purchase tokens with i payment tokens
      let tokensPurchased = await sigmoid.calculateTokensBoughtFromPayment(
        a,
        b,
        c,
        "0",
        "0",
        BigNumber.from(i)
      );

      // Sell purchased tokens
      let saleRefund = await sigmoid.calculatePaymentReturnedFromTokens(
        a,
        b,
        c,
        tokensPurchased,
        BigNumber.from(i),
        tokensPurchased
      );

      // Ensure selling it back got same amount
      expect(saleRefund).to.be.equal(BigNumber.from(i));
    }
  });

  it("Should buy the max curve with 10^6 decimal token", async function () {
    const SigmoidFactory = await ethers.getContractFactory("Sigmoid");

    const sigmoid = await SigmoidFactory.deploy();

    // At curve flattening this should have 100,000 * 10^6 tokens in it
    const a = "500000"; // 0.5 * 1_000_000 => max price / 2 => 1 is max price of curve
    const b = "100000"; // midpoint is 100k tokens sold
    const c = "2900000000"; // Super flat curve

    // We want to ensure we can buy and sell 2X past the endpoint of the curve flattening and
    // make sure there are no math overflows
    const maxPurchaseAmount = 200_000;
    const increment = 10_000;
    for (let i = 0; i <= maxPurchaseAmount; i += increment) {
      const priceAmount = BigNumber.from(i).mul(BigNumber.from(10).pow(6));

      // Purchase tokens with i payment tokens
      let tokensPurchased = await sigmoid.calculateTokensBoughtFromPayment(
        a,
        b,
        c,
        "0",
        "0",
        priceAmount
      );

      // Sell purchased tokens
      let saleRefund = await sigmoid.calculatePaymentReturnedFromTokens(
        a,
        b,
        c,
        tokensPurchased,
        priceAmount,
        tokensPurchased
      );

      expect(saleRefund).to.be.equal(priceAmount);
    }
  });

  it("Should validate full curve price", async function () {
    const SigmoidFactory = await ethers.getContractFactory("Sigmoid");

    const sigmoid = await SigmoidFactory.deploy();

    // At curve flattening this should have 100,000 * 10^6 tokens in it
    const a = "5000"; // 0.5 * 1_000_000 => max price / 2 => 1 is max price of curve
    const b = "10000000"; // midpoint is 10m tokens sold
    const c = "2900000000"; // Super flat curve

    // Buying the full curve should cost 100k and get 20m tokens
    const priceAmount = BigNumber.from(100_000).mul(BigNumber.from(10).pow(6));
    let tokensPurchased = await sigmoid.calculateTokensBoughtFromPayment(
      a,
      b,
      c,
      "0",
      "0",
      priceAmount
    );
    expect(BigNumber.from(20_000_000)).to.be.equal(tokensPurchased);

    // Should be able to sell them all back
    let saleRefund = await sigmoid.calculatePaymentReturnedFromTokens(
      a,
      b,
      c,
      tokensPurchased,
      priceAmount,
      tokensPurchased
    );
    expect(saleRefund).to.be.equal(priceAmount);
  });

  it("Should buy small amount at start and end of curve", async function () {
    const SigmoidFactory = await ethers.getContractFactory("Sigmoid");

    const sigmoid = await SigmoidFactory.deploy();

    // At curve flattening this should have 100,000 * 10^6 tokens in it
    const a = "5000"; // 0.5 * 1_000_000 => max price / 2 => 1 is max price of curve
    const b = "10000000"; // midpoint is 10m tokens sold
    const c = "29000000000000"; // Super flat curve

    // Start with 1 cent worth
    let priceAmount = BigNumber.from(10_000);
    let tokensPurchased = await sigmoid.calculateTokensBoughtFromPayment(
      a,
      b,
      c,
      "0",
      "0",
      priceAmount
    );
    expect(BigNumber.from(16)).to.be.equal(tokensPurchased);

    // Should be able to sell them all back
    let saleRefund = await sigmoid.calculatePaymentReturnedFromTokens(
      a,
      b,
      c,
      tokensPurchased,
      priceAmount,
      tokensPurchased
    );
    expect(saleRefund).to.be.equal(priceAmount);

    // Buy a thousand dollars worth from $0
    priceAmount = BigNumber.from(1_000_000_000);
    tokensPurchased = await sigmoid.calculateTokensBoughtFromPayment(
      a,
      b,
      c,
      "0",
      "0",
      priceAmount
    );
    expect(BigNumber.from(1471009)).to.be.equal(tokensPurchased);

    // Buy another penny after the $1k buy
    let newPriceAmount = BigNumber.from(10_000);
    tokensPurchased = await sigmoid.calculateTokensBoughtFromPayment(
      a,
      b,
      c,
      tokensPurchased,
      priceAmount,
      newPriceAmount
    );
    expect(BigNumber.from(13)).to.be.equal(tokensPurchased);

    // Buy past the full curve flattening out
    priceAmount = BigNumber.from(400_000).mul(BigNumber.from(10).pow(6));
    tokensPurchased = await sigmoid.calculateTokensBoughtFromPayment(
      a,
      b,
      c,
      "0",
      "0",
      priceAmount
    );
    expect(BigNumber.from(50_500_682)).to.be.equal(tokensPurchased);

    // Now ensure buying a penny can still buy 1 token
    newPriceAmount = BigNumber.from(10_000);
    tokensPurchased = await sigmoid.calculateTokensBoughtFromPayment(
      a,
      b,
      c,
      tokensPurchased,
      priceAmount,
      newPriceAmount
    );
    expect(BigNumber.from(1)).to.be.equal(tokensPurchased);

    // Check buying $1 at the start
    priceAmount = BigNumber.from(1_000_000);
    tokensPurchased = await sigmoid.calculateTokensBoughtFromPayment(
      a,
      b,
      c,
      "0",
      "0",
      priceAmount
    );
    expect(BigNumber.from(1672)).to.be.equal(tokensPurchased);

    // Check buying $10 at the start
    priceAmount = BigNumber.from(10_000_000);
    tokensPurchased = await sigmoid.calculateTokensBoughtFromPayment(
      a,
      b,
      c,
      "0",
      "0",
      priceAmount
    );
    expect(BigNumber.from(16706)).to.be.equal(tokensPurchased);

    // Check buying $100 at the start
    priceAmount = BigNumber.from(100_000_000);
    tokensPurchased = await sigmoid.calculateTokensBoughtFromPayment(
      a,
      b,
      c,
      "0",
      "0",
      priceAmount
    );
    expect(BigNumber.from(165012)).to.be.equal(tokensPurchased);

    // Check buying $1,000 at the start
    priceAmount = BigNumber.from(1_000_000_000);
    tokensPurchased = await sigmoid.calculateTokensBoughtFromPayment(
      a,
      b,
      c,
      "0",
      "0",
      priceAmount
    );
    expect(BigNumber.from(1_471_009)).to.be.equal(tokensPurchased);

    // Check buying $10,000 at the start
    priceAmount = BigNumber.from(10_000_000_000);
    tokensPurchased = await sigmoid.calculateTokensBoughtFromPayment(
      a,
      b,
      c,
      "0",
      "0",
      priceAmount
    );
    expect(BigNumber.from(7_360_625)).to.be.equal(tokensPurchased);
  });
});
