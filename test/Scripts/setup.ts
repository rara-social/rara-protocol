import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { ethers, upgrades } from "hardhat";
import { TEST_LIKE_NFT_URI, TEST_NFT_URI } from "./constants";

export const TEST_REACTION_PRICE = BigNumber.from(10).pow(18); // Reactions cost 1 Token (token has 18 decimal places)
export const TEST_SALE_CURATOR_LIABILITY_BP = 5_000; // 50% goes to curator liability
export const TEST_SALE_CREATOR_BP = 200; // 2% goes to the creator
export const TEST_SALE_REFERRER_BP = 100; // 1% goes to the referrer
export const TEST_SPEND_REFERRER_BP = 100; // 1% of curator liability goes to the referrer
export const TEST_SPEND_TAKER_BP = 5_000; // 50% of curator liability goes to the taker

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
  const Test1155Factory = await ethers.getContractFactory("TestErc1155");
  const deployedTest1155 = await upgrades.deployProxy(Test1155Factory, [
    TEST_NFT_URI,
    addressManager.address,
  ]);
  const testingStandard1155 = Test1155Factory.attach(deployedTest1155.address);

  // Deploy a 721 for Testing
  const TestErc721Factory = await ethers.getContractFactory("TestErc721");
  const deployedTest721 = await upgrades.deployProxy(TestErc721Factory, [
    TEST_NFT_URI,
    addressManager.address,
  ]);
  const testingStandard721 = TestErc721Factory.attach(deployedTest721.address);

  // Deploy 1155 for NFT Reactions
  const ReactionNft1155Factory = await ethers.getContractFactory(
    "ReactionNft1155"
  );
  const deployedReactionNFT1155 = await upgrades.deployProxy(
    ReactionNft1155Factory,
    [TEST_NFT_URI, addressManager.address]
  );
  const reactionNFT1155 = ReactionNft1155Factory.attach(
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

  // Deploy test Wrapped Matic
  const WMaticFactory = await ethers.getContractFactory(
    "WMATIC"
  );
  const paymentTokenErc20 = await WMaticFactory.deploy();

  // Deploy the curator token Contract
  const CuratorToken1155Factory = await ethers.getContractFactory(
    "CuratorToken1155"
  );
  const deployedCuratorToken = await upgrades.deployProxy(
    CuratorToken1155Factory,
    [TEST_NFT_URI, addressManager.address]
  );
  const curatorToken = CuratorToken1155Factory.attach(
    deployedCuratorToken.address
  );

  // Deploy the Default Curator Vault
  const CuratorVaultFactory = await ethers.getContractFactory(
    "SigmoidCuratorVault"
  );
  const deployedCuratorVault = await upgrades.deployProxy(CuratorVaultFactory, [
    addressManager.address,
    curatorToken.address,
    "5000",
    "10000000",
    "29000000000000"
  ]);
  const curatorVault = CuratorVaultFactory.attach(deployedCuratorVault.address);

  // Deploy the Child Registrar on the current chain.
  // Note that this is not a proxy contract.
  const ChildRegistrarFactory = await ethers.getContractFactory(
    "ChildRegistrar"
  );
  // FX Child address is from Mumbai - see https://github.com/fx-portal/contracts
  const childRegistrar = await ChildRegistrarFactory.deploy(
    "0xCf73231F28B7331BBe3124B907840A94851f9f11",
    addressManager.address
  );

  // Deploy Like Token Impl and Factory
  const LikeTokenFactory = await ethers.getContractFactory(
    "LikeToken1155"
  );
  const likeTokenImpl = await LikeTokenFactory.deploy();
  await likeTokenImpl.initialize(TEST_LIKE_NFT_URI, addressManager.address);

  const LikeTokenFactoryFactory = await ethers.getContractFactory(
    "LikeTokenFactory"
  );
  const deployedLikeTokenFactory = await upgrades.deployProxy(
    LikeTokenFactoryFactory,
    [addressManager.address, likeTokenImpl.address, TEST_LIKE_NFT_URI]
  );
  const likeTokenFactory = LikeTokenFactoryFactory.attach(
    deployedLikeTokenFactory.address
  );

  // Update permissions in the Role Manager
  // Owner can update addresses
  await roleManager.grantRole(
    await roleManager.ADDRESS_MANAGER_ADMIN(),
    owner.address
  );
  // Owner can update parameters
  await roleManager.grantRole(
    await roleManager.PARAMETER_MANAGER_ADMIN(),
    owner.address
  );
  // Reaction Vault can mint/burn reactions
  await roleManager.grantRole(
    await roleManager.REACTION_NFT_ADMIN(),
    reactionVault.address
  );
  // Reaction Vault can purchase curator token
  await roleManager.grantRole(
    await roleManager.CURATOR_VAULT_PURCHASER(),
    reactionVault.address
  );
  // Curator Vault can mint/burn curator token
  await roleManager.grantRole(
    await roleManager.CURATOR_TOKEN_ADMIN(),
    curatorVault.address
  );

  // Update address manager
  await addressManager.setRoleManager(roleManager.address);
  await addressManager.setParameterManager(parameterManager.address);
  await addressManager.setMakerRegistrar(makerRegistrar.address);
  await addressManager.setReactionNftContract(reactionNFT1155.address);
  await addressManager.setDefaultCuratorVault(curatorVault.address);
  await addressManager.setChildRegistrar(childRegistrar.address);
  await addressManager.setLikeTokenFactory(likeTokenFactory.address);

  // Update the Parameters in the protocol
  await parameterManager.setPaymentToken(paymentTokenErc20.address);
  await parameterManager.setNativeWrappedToken(paymentTokenErc20.address);
  await parameterManager.setReactionPrice(TEST_REACTION_PRICE);
  await parameterManager.setSaleCuratorLiabilityBasisPoints(
    TEST_SALE_CURATOR_LIABILITY_BP
  );
  await parameterManager.setSaleReferrerBasisPoints(TEST_SALE_REFERRER_BP);
  await parameterManager.setSpendTakerBasisPoints(TEST_SPEND_TAKER_BP);
  await parameterManager.setSpendReferrerBasisPoints(TEST_SPEND_REFERRER_BP);

  // Return objects for tests to use
  return {
    addressManager,
    childRegistrar,
    curatorToken,
    curatorVault,
    likeTokenFactory,
    likeTokenImpl,
    makerRegistrar,
    parameterManager,
    paymentTokenErc20,
    reactionNFT1155,
    reactionVault,
    roleManager,
    testingStandard1155,
    testingStandard721,
  };
};

export { deploySystem };
