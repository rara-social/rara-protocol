import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { ZERO_ADDRESS } from "../Scripts/constants";
import { deploySystem } from "../Scripts/setup";
import {
  INVALID_ROLE_MANAGER,
  INVALID_ZERO_PARAM,
  NOT_ADMIN,
} from "../Scripts/errors";

describe("AddressManager", function () {
  it("Should get initialized with role manager", async function () {
    const [OWNER] = await ethers.getSigners();
    const { addressManager, roleManager } = await deploySystem(OWNER);

    // Verify the role manager was set
    const currentRoleManager = await addressManager.roleManager();
    expect(currentRoleManager).to.equal(roleManager.address);
  });

  it("Should allow owner to set role manager address", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const { addressManager, roleManager } = await deploySystem(OWNER);

    // Verify non owner can't update address
    await expect(
      addressManager.connect(ALICE).setRoleManager(BOB.address)
    ).to.be.revertedWith(NOT_ADMIN);

    // Verify the setter checks invalid input
    await expect(addressManager.setRoleManager(ZERO_ADDRESS)).to.revertedWith(
      INVALID_ZERO_PARAM
    );

    // Verify an invalid address that is not a contract is rejected
    await expect(addressManager.setRoleManager(BOB.address)).to.be.reverted;

    // Create a new valid Role manager
    const RoleManagerFactory = await ethers.getContractFactory("RoleManager");
    const newRoleManager = await upgrades.deployProxy(RoleManagerFactory, [
      OWNER.address,
    ]);

    // Add Bob to the old Role manager
    const adminRole = await roleManager.ADDRESS_MANAGER_ADMIN();
    await roleManager.grantRole(adminRole, BOB.address);

    // Since Bob is an admin on the old one but not the new one, it should fail
    await expect(
      addressManager.connect(BOB).setRoleManager(newRoleManager.address)
    ).to.be.revertedWith(INVALID_ROLE_MANAGER);

    // Set it to the new address
    await addressManager.setRoleManager(newRoleManager.address);

    // Verify it got set
    const currentVal = await addressManager.roleManager();
    expect(currentVal).to.equal(newRoleManager.address);
  });

  it("Should allow owner to set parameter manager address", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const { addressManager } = await deploySystem(OWNER);

    // Verify the setter checks invalid input
    await expect(
      addressManager.setParameterManager(ZERO_ADDRESS)
    ).to.revertedWith(INVALID_ZERO_PARAM);

    // Set it to Alice's address
    await addressManager.setParameterManager(ALICE.address);

    // Verify it got set
    const currentVal = await addressManager.parameterManager();
    expect(currentVal).to.equal(ALICE.address);

    // Verify non owner can't update address
    await expect(
      addressManager.connect(ALICE).setParameterManager(BOB.address)
    ).to.be.revertedWith(NOT_ADMIN);
  });

  it("Should allow owner to set maker registrar address", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const { addressManager } = await deploySystem(OWNER);

    // Verify the setter checks invalid input
    await expect(
      addressManager.setMakerRegistrar(ZERO_ADDRESS)
    ).to.revertedWith(INVALID_ZERO_PARAM);

    // Set it to Alice's address
    await addressManager.setMakerRegistrar(ALICE.address);

    // Verify it got set
    const currentVal = await addressManager.makerRegistrar();
    expect(currentVal).to.equal(ALICE.address);

    // Verify non owner can't update address
    await expect(
      addressManager.connect(ALICE).setMakerRegistrar(BOB.address)
    ).to.be.revertedWith(NOT_ADMIN);
  });

  it("Should allow owner to set reaction NFT address", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const { addressManager } = await deploySystem(OWNER);

    // Verify the setter checks invalid input
    await expect(
      addressManager.setReactionNftContract(ZERO_ADDRESS)
    ).to.revertedWith(INVALID_ZERO_PARAM);

    // Set it to Alice's address
    await addressManager.setReactionNftContract(ALICE.address);

    // Verify it got set
    const currentVal = await addressManager.reactionNftContract();
    expect(currentVal).to.equal(ALICE.address);

    // Verify non owner can't update address
    await expect(
      addressManager.connect(ALICE).setReactionNftContract(BOB.address)
    ).to.revertedWith(NOT_ADMIN);
  });

  it("Should allow owner to set child registrar address", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const { addressManager } = await deploySystem(OWNER);

    // Verify the setter checks invalid input
    await expect(
      addressManager.setChildRegistrar(ZERO_ADDRESS)
    ).to.revertedWith(INVALID_ZERO_PARAM);

    // Set it to Alice's address
    await addressManager.setChildRegistrar(ALICE.address);

    // Verify it got set
    const currentVal = await addressManager.childRegistrar();
    expect(currentVal).to.equal(ALICE.address);

    // Verify non owner can't update address
    await expect(
      addressManager.connect(ALICE).setChildRegistrar(BOB.address)
    ).to.revertedWith(NOT_ADMIN);
  });
});
