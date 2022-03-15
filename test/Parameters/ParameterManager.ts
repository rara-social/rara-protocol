import { expect } from "chai";
import { ethers } from "hardhat";
import { ZERO_ADDRESS } from "../Scripts/constants";
import { deploySystem } from "../Scripts/setup";
import { INVALID_ZERO_PARAM, NOT_ADMIN } from "../Scripts/errors";

describe("ParameterManager", function () {
  it("Should get initialized with address manager", async function () {
    const [OWNER] = await ethers.getSigners();
    const { addressManager, parameterManager } = await deploySystem(OWNER);

    // Verify the role manager was set
    const currentAddressManager = await parameterManager.addressManager();
    expect(currentAddressManager).to.equal(addressManager.address);
  });

  it("Should allow owner to set payment token address", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const { parameterManager } = await deploySystem(OWNER);

    // Verify the setter checks invalid input
    await expect(
      parameterManager.setPaymentToken(ZERO_ADDRESS)
    ).to.revertedWith(INVALID_ZERO_PARAM);

    // Set it to Alice's address
    await parameterManager.setPaymentToken(ALICE.address);

    // Verify it got set
    const currentVal = await parameterManager.paymentToken();
    expect(currentVal).to.equal(ALICE.address);

    // Verify non owner can't update address
    await expect(
      parameterManager.connect(ALICE).setPaymentToken(BOB.address)
    ).to.be.revertedWith(NOT_ADMIN);
  });

  it("Should allow owner to set reaction price", async function () {
    const [OWNER, ALICE] = await ethers.getSigners();
    const { parameterManager } = await deploySystem(OWNER);

    const val = 100;

    // Verify the setter checks invalid input
    await expect(parameterManager.setReactionPrice(0)).to.revertedWith(
      INVALID_ZERO_PARAM
    );

    // Set it to Alice's address
    await parameterManager.setReactionPrice(val);

    // Verify it got set
    const currentVal = await parameterManager.reactionPrice();
    expect(currentVal).to.equal(val);

    // Verify non owner can't update address
    await expect(
      parameterManager.connect(ALICE).setReactionPrice(val)
    ).to.be.revertedWith(NOT_ADMIN);
  });

  it("Should allow owner to set curator liability", async function () {
    const [OWNER, ALICE] = await ethers.getSigners();
    const { parameterManager } = await deploySystem(OWNER);

    const val = 200;

    // Verify the setter checks invalid input
    await expect(
      parameterManager.setSaleCuratorLiabilityBasisPoints(0)
    ).to.revertedWith(INVALID_ZERO_PARAM);

    // Set it to Alice's address
    await parameterManager.setSaleCuratorLiabilityBasisPoints(val);

    // Verify it got set
    const currentVal = await parameterManager.saleCuratorLiabilityBasisPoints();
    expect(currentVal).to.equal(val);

    // Verify non owner can't update address
    await expect(
      parameterManager.connect(ALICE).setSaleCuratorLiabilityBasisPoints(val)
    ).to.be.revertedWith(NOT_ADMIN);
  });

  it("Should allow owner to set sale referrer bp", async function () {
    const [OWNER, ALICE] = await ethers.getSigners();
    const { parameterManager } = await deploySystem(OWNER);

    const val = 400;

    // Verify the setter checks invalid input
    await expect(
      parameterManager.setSaleReferrerBasisPoints(0)
    ).to.revertedWith(INVALID_ZERO_PARAM);

    // Set it to Alice's address
    await parameterManager.setSaleReferrerBasisPoints(val);

    // Verify it got set
    const currentVal = await parameterManager.saleReferrerBasisPoints();
    expect(currentVal).to.equal(val);

    // Verify non owner can't update address
    await expect(
      parameterManager.connect(ALICE).setSaleReferrerBasisPoints(val)
    ).to.be.revertedWith(NOT_ADMIN);
  });

  it("Should allow owner to set spend Taker bp", async function () {
    const [OWNER, ALICE] = await ethers.getSigners();
    const { parameterManager } = await deploySystem(OWNER);

    const val = 400;

    // Verify the setter checks invalid input
    await expect(parameterManager.setSpendTakerBasisPoints(0)).to.revertedWith(
      INVALID_ZERO_PARAM
    );

    // Set it to Alice's address
    await parameterManager.setSpendTakerBasisPoints(val);

    // Verify it got set
    const currentVal = await parameterManager.spendTakerBasisPoints();
    expect(currentVal).to.equal(val);

    // Verify non owner can't update address
    await expect(
      parameterManager.connect(ALICE).setSpendTakerBasisPoints(val)
    ).to.be.revertedWith(NOT_ADMIN);
  });

  it("Should allow owner to set spend Referrer bp", async function () {
    const [OWNER, ALICE] = await ethers.getSigners();
    const { parameterManager } = await deploySystem(OWNER);

    const val = 400;

    // Verify the setter checks invalid input
    await expect(
      parameterManager.setSpendReferrerBasisPoints(0)
    ).to.revertedWith(INVALID_ZERO_PARAM);

    // Set it to Alice's address
    await parameterManager.setSpendReferrerBasisPoints(val);

    // Verify it got set
    const currentVal = await parameterManager.spendReferrerBasisPoints();
    expect(currentVal).to.equal(val);

    // Verify non owner can't update address
    await expect(
      parameterManager.connect(ALICE).setSpendReferrerBasisPoints(val)
    ).to.be.revertedWith(NOT_ADMIN);
  });

  it("Should allow owner to set allowed curator vault", async function () {
    const [OWNER, ALICE] = await ethers.getSigners();
    const { parameterManager } = await deploySystem(OWNER);

    // Verify the setter checks invalid input
    await expect(
      parameterManager.setApprovedCuratorVaults(ZERO_ADDRESS, true)
    ).to.revertedWith(INVALID_ZERO_PARAM);

    // Set it to Alice's address
    await parameterManager.setApprovedCuratorVaults(ALICE.address, true);

    // Verify it got set
    const currentVal = await parameterManager.approvedCuratorVaults(
      ALICE.address
    );
    expect(currentVal).to.equal(true);

    // Verify non owner can't update address
    await expect(
      parameterManager
        .connect(ALICE)
        .setApprovedCuratorVaults(ALICE.address, false)
    ).to.be.revertedWith(NOT_ADMIN);
  });

  it("Should allow owner to set bonding curve params", async function () {
    const [OWNER, ALICE] = await ethers.getSigners();
    const { parameterManager } = await deploySystem(OWNER);

    // Verify the setter checks invalid input
    await expect(
      parameterManager.setBondingCurveParams("0", "1", "1")
    ).to.revertedWith(INVALID_ZERO_PARAM);

    await expect(
      parameterManager.setBondingCurveParams("1", "0", "1")
    ).to.revertedWith(INVALID_ZERO_PARAM);

    await expect(
      parameterManager.setBondingCurveParams("1", "1", "0")
    ).to.revertedWith(INVALID_ZERO_PARAM);

    // Set it 
    await parameterManager.setBondingCurveParams("1", "2", "3")

    // Verify it got set
    const values = await parameterManager.bondingCurveParams();
    expect(values[0]).to.equal("1");
    expect(values[1]).to.equal("2");
    expect(values[2]).to.equal("3");

    // Verify non owner can't update address
    await expect(
      parameterManager
        .connect(ALICE)
        .setBondingCurveParams("1", "2", "3")
    ).to.be.revertedWith(NOT_ADMIN);
  });
});
