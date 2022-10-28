import {expect} from "chai";
import {ethers, upgrades} from "hardhat";
import {ZERO_ADDRESS} from "../Scripts/constants";
import {deploySystem} from "../Scripts/setup";
import {
  INVALID_BP,
  INVALID_ZERO_PARAM,
  NOT_ADMIN,
  OUT_OF_BOUNDS,
} from "../Scripts/errors";
import {BigNumber} from "ethers";

describe.only("ParameterManager", function () {
  it("Should get initialized with address manager", async function () {
    const [OWNER] = await ethers.getSigners();
    const {addressManager, parameterManager} = await deploySystem(OWNER);

    // Verify the role manager was set
    const currentAddressManager = await parameterManager.addressManager();
    expect(currentAddressManager).to.equal(addressManager.address);
  });

  it("Should check address on init", async function () {
    const ParameterManagerFactory = await ethers.getContractFactory(
      "ParameterManager"
    );
    await expect(
      upgrades.deployProxy(ParameterManagerFactory, [ZERO_ADDRESS])
    ).to.revertedWith(INVALID_ZERO_PARAM);
  });

  it("Should allow owner to set payment token address", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const {parameterManager} = await deploySystem(OWNER);

    // Verify the setter checks invalid input
    await expect(
      parameterManager.setPaymentToken(ZERO_ADDRESS)
    ).to.revertedWith(INVALID_ZERO_PARAM);

    // Set it to Alice's address
    await expect(parameterManager.setPaymentToken(ALICE.address))
      .to.emit(parameterManager, "PaymentTokenUpdated")
      .withArgs(ALICE.address);

    // Verify it got set
    const currentVal = await parameterManager.paymentToken();
    expect(currentVal).to.equal(ALICE.address);

    // Verify non owner can't update address
    await expect(
      parameterManager.connect(ALICE).setPaymentToken(BOB.address)
    ).to.be.revertedWith(NOT_ADMIN);
  });

  it("Should allow owner to set native wrapped token address", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const {parameterManager} = await deploySystem(OWNER);

    // Verify the setter checks invalid input
    await expect(
      parameterManager.setNativeWrappedToken(ZERO_ADDRESS)
    ).to.revertedWith(INVALID_ZERO_PARAM);

    // Set it to Alice's address
    await expect(parameterManager.setNativeWrappedToken(ALICE.address))
      .to.emit(parameterManager, "NativeWrappedTokenUpdated")
      .withArgs(ALICE.address);

    // Verify it got set
    const currentVal = await parameterManager.nativeWrappedToken();
    expect(currentVal).to.equal(ALICE.address);

    // Verify non owner can't update address
    await expect(
      parameterManager.connect(ALICE).setNativeWrappedToken(BOB.address)
    ).to.be.revertedWith(NOT_ADMIN);
  });

  it("Should allow owner to set reaction price", async function () {
    const [OWNER, ALICE] = await ethers.getSigners();
    const {parameterManager} = await deploySystem(OWNER);

    const val = 100;

    // Verify the setter checks invalid input
    await expect(parameterManager.setReactionPrice(0)).to.revertedWith(
      INVALID_ZERO_PARAM
    );

    // Set it to the value
    await expect(parameterManager.setReactionPrice(val))
      .to.emit(parameterManager, "ReactionPriceUpdated")
      .withArgs(val);

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
    const {parameterManager} = await deploySystem(OWNER);

    const val = 200;

    // Verify the setter checks invalid input
    await expect(
      parameterManager.setSaleCuratorLiabilityBasisPoints(0)
    ).to.revertedWith(INVALID_ZERO_PARAM);

    // Set it to the value
    await expect(parameterManager.setSaleCuratorLiabilityBasisPoints(val))
      .to.emit(parameterManager, "SaleCuratorLiabilityBasisPointsUpdated")
      .withArgs(val);

    // Verify the setter checks invalid input
    await expect(
      parameterManager.setSaleCuratorLiabilityBasisPoints(10_001)
    ).to.revertedWith(INVALID_BP);

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
    const {parameterManager} = await deploySystem(OWNER);

    const val = 400;

    // Verify the setter checks invalid input
    await expect(
      parameterManager.setSaleReferrerBasisPoints(0)
    ).to.revertedWith(INVALID_ZERO_PARAM);

    // Set it to the value
    await expect(parameterManager.setSaleReferrerBasisPoints(val))
      .to.emit(parameterManager, "SaleReferrerBasisPointsUpdated")
      .withArgs(val);

    // Verify the setter checks invalid input
    await expect(
      parameterManager.setSaleReferrerBasisPoints(10_001)
    ).to.revertedWith(INVALID_BP);

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
    const {parameterManager} = await deploySystem(OWNER);

    const val = 400;

    // Verify the setter checks invalid input
    await expect(parameterManager.setSpendTakerBasisPoints(0)).to.revertedWith(
      INVALID_ZERO_PARAM
    );

    // Set it to the value
    await expect(parameterManager.setSpendTakerBasisPoints(val))
      .to.emit(parameterManager, "SpendTakerBasisPointsUpdated")
      .withArgs(val);

    // Verify the setter checks invalid input
    await expect(
      parameterManager.setSpendTakerBasisPoints(10_001)
    ).to.revertedWith(INVALID_BP);

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
    const {parameterManager} = await deploySystem(OWNER);

    const val = 400;

    // Verify the setter checks invalid input
    await expect(
      parameterManager.setSpendReferrerBasisPoints(0)
    ).to.revertedWith(INVALID_ZERO_PARAM);

    // Set it to the value
    await expect(parameterManager.setSpendReferrerBasisPoints(val))
      .to.emit(parameterManager, "SpendReferrerBasisPointsUpdated")
      .withArgs(val);

    // Verify the setter checks invalid input
    await expect(
      parameterManager.setSpendReferrerBasisPoints(10_001)
    ).to.revertedWith(INVALID_BP);

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
    const {parameterManager} = await deploySystem(OWNER);

    // Verify the setter checks invalid input
    await expect(
      parameterManager.setApprovedCuratorVaults(ZERO_ADDRESS, true)
    ).to.revertedWith(INVALID_ZERO_PARAM);

    // Set it to allowed
    await expect(parameterManager.setApprovedCuratorVaults(ALICE.address, true))
      .to.emit(parameterManager, "ApprovedCuratorVaultsUpdated")
      .withArgs(ALICE.address, true);

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

  it("Should allow owner to set free reaction limit", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const {parameterManager} = await deploySystem(OWNER);

    // Verify the setter checks invalid input
    await expect(
      parameterManager.setFreeReactionLimit(ZERO_ADDRESS)
    ).to.revertedWith(INVALID_ZERO_PARAM);

    // Set it to Alice's address
    await expect(parameterManager.setFreeReactionLimit(1))
      .to.emit(parameterManager, "FreeReactionLimitUpdated")
      .withArgs(1);

    // Verify it got set
    const currentVal = await parameterManager.freeReactionLimit();
    expect(currentVal).to.equal(1);

    // Verify non owner can't update address
    await expect(
      parameterManager.connect(ALICE).setFreeReactionLimit(100)
    ).to.be.revertedWith(NOT_ADMIN);
  });
});
