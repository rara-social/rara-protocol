import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, upgrades } from "hardhat";
import { TEST_NFT_URI } from "./constants";

const deploySystem = async (owner: SignerWithAddress) => {
  // Deploy the Role Manager first
  const RoleManagerFactory = await ethers.getContractFactory("RoleManager");
  const deployedRoleManager = await upgrades.deployProxy(RoleManagerFactory, [
    owner.address,
  ]);
  const roleManager = RoleManagerFactory.attach(deployedRoleManager.address);

  // Deploy Address Manager
  const AddressManagerFactory = await ethers.getContractFactory(
    "AddressManager"
  );
  const deployedAddressManager = await upgrades.deployProxy(
    AddressManagerFactory,
    [roleManager.address]
  );
  const addressManager = AddressManagerFactory.attach(
    deployedAddressManager.address
  );

  // Deploy Maker Vault
  const MakerRegistrarFactory = await ethers.getContractFactory("MakerRegistrar");
  const deployedMakerRegistrar = await upgrades.deployProxy(MakerRegistrarFactory, [
    addressManager.address,
  ]);
  const makerRegistrar = MakerRegistrarFactory.attach(deployedMakerRegistrar.address);

  // Deploy Testing NFT Token 1155
  // NOTE: We are not granting any default permissions for minting in the role manager to the owner
  // because the tests of the protocol should not assume any roles are granted for external accounts.
  const Standard1155Factory = await ethers.getContractFactory("Standard1155");
  const deployedStandard1155 = await upgrades.deployProxy(Standard1155Factory, [
    TEST_NFT_URI,
    addressManager.address,
  ]);
  const testingStandard1155 = Standard1155Factory.attach(
    deployedStandard1155.address
  );

  // Return objects for tests to use
  return {
    roleManager,
    addressManager,
    makerRegistrar,
    testingStandard1155,
  };
};

export { deploySystem };
