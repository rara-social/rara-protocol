import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { ethers, upgrades } from "hardhat";
import { TEST_NFT_URI } from "./constants";

const TEST_REACTION_PRICE = BigNumber.from(10).pow(18); // Reactions cost 1 Token (token has 18 decimal places)
const TEST_SALE_CURATOR_LIABILITY_BP = 5_000; // 50% goes to curator liability
const TEST_SALE_CREATOR_BP = 200; // 2% goes to the creator
const TEST_SALE_REFERRER_BP = 100; // 1% goes to the referrer

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

  // Deploy Maker Registrar
  const MakerRegistrarFactory = await ethers.getContractFactory(
    "MakerRegistrar"
  );
  const deployedMakerRegistrar = await upgrades.deployProxy(
    MakerRegistrarFactory,
    [addressManager.address]
  );
  const makerRegistrar = MakerRegistrarFactory.attach(
    deployedMakerRegistrar.address
  );

  // Deploy Reaction Vault
  const ReactionVaultFactory = await ethers.getContractFactory("ReactionVault");
  const deployedReactionVault = await upgrades.deployProxy(
    ReactionVaultFactory,
    [addressManager.address]
  );
  const reactionVault = ReactionVaultFactory.attach(
    deployedReactionVault.address
  );

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

  // Deploy 1155 for NFT Reactions
  const deployedReactionNFT1155 = await upgrades.deployProxy(
    Standard1155Factory,
    [TEST_NFT_URI, addressManager.address]
  );
  const reactionNFT1155 = Standard1155Factory.attach(
    deployedReactionNFT1155.address
  );

  // Deploy the Parameter Manager
  const ParameterManagerFactory = await ethers.getContractFactory(
    "ParameterManager"
  );
  const deployedParameterManager = await upgrades.deployProxy(
    ParameterManagerFactory,
    [addressManager.address]
  );
  const parameterManager = ParameterManagerFactory.attach(
    deployedParameterManager.address
  );

  // Deploy an ERC20 Token for testing payments
  const TestErc20Factory = await ethers.getContractFactory("TestErc20");
  const deployedTestErc20 = await upgrades.deployProxy(TestErc20Factory, [
    "TEST",
    "TST",
  ]);
  const testingErc20 = TestErc20Factory.attach(deployedTestErc20.address);

  // Update address manager
  await addressManager.setRoleManager(roleManager.address);
  await addressManager.setParameterManager(parameterManager.address);
  await addressManager.setMakerRegistrar(makerRegistrar.address);
  await addressManager.setReactionNftContract(reactionNFT1155.address);

  // Update permissions in the Role Manager
  // Reaction Vault should be allowed to mint reactions
  const minterRole = await roleManager.REACTION_MINTER_ROLE();
  roleManager.grantRole(minterRole, reactionVault.address);

  // Update the Parameters in the protocol
  parameterManager.setPaymentToken(testingErc20.address);
  parameterManager.setReactionPrice(TEST_REACTION_PRICE);
  parameterManager.setSaleCuratorLiabilityBasisPoints(
    TEST_SALE_CURATOR_LIABILITY_BP
  );
  parameterManager.setSaleCreatorBasisPoints(TEST_SALE_CREATOR_BP);
  parameterManager.setSaleReferrerBasisPoints(TEST_SALE_REFERRER_BP);

  // Return objects for tests to use
  return {
    roleManager,
    addressManager,
    makerRegistrar,
    testingStandard1155,
    parameterManager,
    reactionNFT1155,
    reactionVault,
    testingErc20,
  };
};

export { deploySystem };
