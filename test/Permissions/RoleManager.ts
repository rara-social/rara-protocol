import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("RoleManager", function () {
  it("Should set deploying address as owner by default", async function () {
    const [OWNER, ALICE] = await ethers.getSigners();

    // Deploy the RoleManger using the upgrades plugin with a proxy
    const RoleManagerFactory = await ethers.getContractFactory("RoleManager");
    const deployedManager = await upgrades.deployProxy(RoleManagerFactory, [
      OWNER.address,
    ]);

    // This attach call is just for typings on the object (not necessary but helpful)
    const manager = RoleManagerFactory.attach(deployedManager.address);

    const defaultAdminRole = await manager.DEFAULT_ADMIN_ROLE();
    let result = await manager.hasRole(defaultAdminRole, OWNER.address);
    expect(result).to.equal(true);

    result = await manager.hasRole(defaultAdminRole, ALICE.address);
    expect(result).to.equal(false);
  });

  it("Should allow owner to set Reaction Minter", async function () {
    // eslint-disable-next-line no-unused-vars
    const [OWNER, ALICE, BOB, CAROL] = await ethers.getSigners();

    // Deploy the RoleManger using the upgrades plugin with a proxy
    const RoleManagerFactory = await ethers.getContractFactory("RoleManager");
    const deployedManager = await upgrades.deployProxy(RoleManagerFactory, [
      OWNER.address,
    ]);

    // This attach call is just for typings on the object (not necessary but helpful)
    const manager = RoleManagerFactory.attach(deployedManager.address);

    const reactionMinterRole = await manager.REACTION_MINTER_ROLE();

    // Verify bob does not haver permission
    let result = await manager.hasRole(reactionMinterRole, BOB.address);
    expect(result).to.equal(false);

    // Add BOB
    await manager.grantRole(reactionMinterRole, BOB.address);

    // Verify it was set
    result = await manager.isReactionMinter(BOB.address);
    expect(result).to.equal(true);

    // Verify a non owner (ALICE) can't set the permission
    await expect(
      manager.connect(ALICE).grantRole(reactionMinterRole, CAROL.address)
    ).to.be.reverted;

    // Remove BOB and verify
    await manager.revokeRole(reactionMinterRole, BOB.address);
    result = await manager.isReactionMinter(BOB.address);
    expect(result).to.equal(false);
  });
});
