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

  it("Should allow owner to set address manager", async function () {
    // eslint-disable-next-line no-unused-vars
    const [OWNER, ALICE, BOB, CAROL] = await ethers.getSigners();

    // Deploy the RoleManger using the upgrades plugin with a proxy
    const RoleManagerFactory = await ethers.getContractFactory("RoleManager");
    const deployedManager = await upgrades.deployProxy(RoleManagerFactory, [
      OWNER.address,
    ]);

    // This attach call is just for typings on the object (not necessary but helpful)
    const manager = RoleManagerFactory.attach(deployedManager.address);

    const role = await manager.ADDRESS_MANAGER_ADMIN();

    // Verify bob does not haver permission
    let result = await manager.hasRole(role, BOB.address);
    expect(result).to.equal(false);

    // Add BOB
    await manager.grantRole(role, BOB.address);

    // Verify it was set
    result = await manager.isAddressManagerAdmin(BOB.address);
    expect(result).to.equal(true);

    // Verify a non owner (ALICE) can't set the permission
    await expect(
      manager.connect(ALICE).grantRole(role, CAROL.address)
    ).to.be.reverted;

    // Remove BOB and verify
    await manager.revokeRole(role, BOB.address);
    result = await manager.isAddressManagerAdmin(BOB.address);
    expect(result).to.equal(false);
  });


  it("Should allow owner to set parameter manager", async function () {
    // eslint-disable-next-line no-unused-vars
    const [OWNER, ALICE, BOB, CAROL] = await ethers.getSigners();

    // Deploy the RoleManger using the upgrades plugin with a proxy
    const RoleManagerFactory = await ethers.getContractFactory("RoleManager");
    const deployedManager = await upgrades.deployProxy(RoleManagerFactory, [
      OWNER.address,
    ]);

    // This attach call is just for typings on the object (not necessary but helpful)
    const manager = RoleManagerFactory.attach(deployedManager.address);

    const role = await manager.PARAMETER_MANAGER_ADMIN();

    // Verify bob does not haver permission
    let result = await manager.hasRole(role, BOB.address);
    expect(result).to.equal(false);

    // Add BOB
    await manager.grantRole(role, BOB.address);

    // Verify it was set
    result = await manager.isParameterManagerAdmin(BOB.address);
    expect(result).to.equal(true);

    // Verify a non owner (ALICE) can't set the permission
    await expect(
      manager.connect(ALICE).grantRole(role, CAROL.address)
    ).to.be.reverted;

    // Remove BOB and verify
    await manager.revokeRole(role, BOB.address);
    result = await manager.isParameterManagerAdmin(BOB.address);
    expect(result).to.equal(false);
  });


  it("Should allow owner to set reaction nft admin", async function () {
    // eslint-disable-next-line no-unused-vars
    const [OWNER, ALICE, BOB, CAROL] = await ethers.getSigners();

    // Deploy the RoleManger using the upgrades plugin with a proxy
    const RoleManagerFactory = await ethers.getContractFactory("RoleManager");
    const deployedManager = await upgrades.deployProxy(RoleManagerFactory, [
      OWNER.address,
    ]);

    // This attach call is just for typings on the object (not necessary but helpful)
    const manager = RoleManagerFactory.attach(deployedManager.address);

    const role = await manager.REACTION_NFT_ADMIN();

    // Verify bob does not haver permission
    let result = await manager.hasRole(role, BOB.address);
    expect(result).to.equal(false);

    // Add BOB
    await manager.grantRole(role, BOB.address);

    // Verify it was set
    result = await manager.isReactionNftAdmin(BOB.address);
    expect(result).to.equal(true);

    // Verify a non owner (ALICE) can't set the permission
    await expect(
      manager.connect(ALICE).grantRole(role, CAROL.address)
    ).to.be.reverted;

    // Remove BOB and verify
    await manager.revokeRole(role, BOB.address);
    result = await manager.isReactionNftAdmin(BOB.address);
    expect(result).to.equal(false);
  });


  it("Should allow owner to set curator vault purchaser", async function () {
    // eslint-disable-next-line no-unused-vars
    const [OWNER, ALICE, BOB, CAROL] = await ethers.getSigners();

    // Deploy the RoleManger using the upgrades plugin with a proxy
    const RoleManagerFactory = await ethers.getContractFactory("RoleManager");
    const deployedManager = await upgrades.deployProxy(RoleManagerFactory, [
      OWNER.address,
    ]);

    // This attach call is just for typings on the object (not necessary but helpful)
    const manager = RoleManagerFactory.attach(deployedManager.address);

    const role = await manager.CURATOR_VAULT_PURCHASER();

    // Verify bob does not haver permission
    let result = await manager.hasRole(role, BOB.address);
    expect(result).to.equal(false);

    // Add BOB
    await manager.grantRole(role, BOB.address);

    // Verify it was set
    result = await manager.isCuratorVaultPurchaser(BOB.address);
    expect(result).to.equal(true);

    // Verify a non owner (ALICE) can't set the permission
    await expect(
      manager.connect(ALICE).grantRole(role, CAROL.address)
    ).to.be.reverted;

    // Remove BOB and verify
    await manager.revokeRole(role, BOB.address);
    result = await manager.isCuratorVaultPurchaser(BOB.address);
    expect(result).to.equal(false);
  });


  it("Should allow owner to set curator shares admin", async function () {
    // eslint-disable-next-line no-unused-vars
    const [OWNER, ALICE, BOB, CAROL] = await ethers.getSigners();

    // Deploy the RoleManger using the upgrades plugin with a proxy
    const RoleManagerFactory = await ethers.getContractFactory("RoleManager");
    const deployedManager = await upgrades.deployProxy(RoleManagerFactory, [
      OWNER.address,
    ]);

    // This attach call is just for typings on the object (not necessary but helpful)
    const manager = RoleManagerFactory.attach(deployedManager.address);

    const role = await manager.CURATOR_SHARES_ADMIN();

    // Verify bob does not haver permission
    let result = await manager.hasRole(role, BOB.address);
    expect(result).to.equal(false);

    // Add BOB
    await manager.grantRole(role, BOB.address);

    // Verify it was set
    result = await manager.isCuratorSharesAdmin(BOB.address);
    expect(result).to.equal(true);

    // Verify a non owner (ALICE) can't set the permission
    await expect(
      manager.connect(ALICE).grantRole(role, CAROL.address)
    ).to.be.reverted;

    // Remove BOB and verify
    await manager.revokeRole(role, BOB.address);
    result = await manager.isCuratorSharesAdmin(BOB.address);
    expect(result).to.equal(false);
  });

});
