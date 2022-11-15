import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployResult} from "hardhat-deploy/dist/types";
import DeployConfig from "./types";

import {ethers} from "hardhat";

const DEBUG_LOG = true;

// Helper to deploy proxy with OZ implementation
export const deployProxyContract = async (
  hre: HardhatRuntimeEnvironment,
  name: string,
  initializeVars: any[]
) => {
  const {deployments, getNamedAccounts} = hre;
  const {deployer} = await getNamedAccounts();
  const {deploy} = deployments;

  return deploy(name, {
    contract: name,
    from: deployer,
    proxy: {
      owner: deployer,
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        init: {
          methodName: "initialize",
          args: initializeVars,
        },
      },
    },
    log: DEBUG_LOG,
  });
};

// Helper to deploy non-proxy contracts
export const deployContract = async (
  hre: HardhatRuntimeEnvironment,
  name: string,
  initializeVars: any[]
) => {
  const {deployments, getNamedAccounts} = hre;
  const {deployer} = await getNamedAccounts();
  const {deploy} = deployments;

  return deploy(name, {
    contract: name,
    from: deployer,
    args: initializeVars,
    log: DEBUG_LOG,
  });
};

// Deploy the protocol on the L2
const deployProtocol = async (
  hre: HardhatRuntimeEnvironment,
  config: DeployConfig
) => {
  const {getNamedAccounts} = hre;
  const {deployer} = await getNamedAccounts();

  let res: DeployResult = await deployProxyContract(hre, "RoleManager", [
    deployer,
  ]);
  const roleManagerAddress = res.address;
  console.log({roleManagerAddress});

  res = await deployProxyContract(hre, "AddressManager", [roleManagerAddress]);
  const addressManagerAddress = res.address;
  console.log({addressManagerAddress});

  res = await deployProxyContract(hre, "MakerRegistrar", [
    addressManagerAddress,
  ]);
  const makerRegistrarAddress = res.address;
  console.log({makerRegistrarAddress});

  res = await deployProxyContract(hre, "ReactionVault", [
    addressManagerAddress,
  ]);
  const reactionVaultAddress = res.address;
  console.log({reactionVaultAddress});

  res = await deployProxyContract(hre, "ReactionNft1155", [
    config.reactionNftUri,
    addressManagerAddress,
    config.reactionContractUri,
  ]);
  const reactionNft1155Address = res.address;
  console.log({reactionNft1155Address});

  res = await deployProxyContract(hre, "ParameterManager", [
    addressManagerAddress,
  ]);
  const parameterManagerAddress = res.address;
  console.log({parameterManagerAddress});

  res = await deployProxyContract(hre, "CuratorToken1155", [
    config.curatorTokenNftUri,
    addressManagerAddress,
    config.curatorTokenContractUri,
  ]);
  const curatorToken1155Address = res.address;
  console.log({curatorToken1155Address});

  res = await deployProxyContract(hre, "SigmoidCuratorVault", [
    addressManagerAddress,
    curatorToken1155Address,
    config.bondingCurveA,
    config.bondingCurveB,
    config.bondingCurveC,
  ]);
  const curatorVaultAddress = res.address;
  console.log({curatorVaultAddress});

  res = await deployContract(hre, "ChildRegistrar", [
    config.fxChildBridgeAddress,
    addressManagerAddress,
  ]);
  const childRegistrarAddress = res.address;
  console.log({childRegistrarAddress});

  // Grant Roles for contracts in the protocol
  const roleManager = await ethers.getContractAt(
    "RoleManager",
    roleManagerAddress
  );

  console.log("\n\nUpdating Roles");
  await roleManager.grantRole(
    await roleManager.REACTION_NFT_ADMIN(),
    reactionVaultAddress,
    {gasLimit: "200000"}
  );
  console.log("\n\nGranted REACTION_NFT_ADMIN to " + reactionVaultAddress);

  await roleManager.grantRole(
    await roleManager.CURATOR_VAULT_PURCHASER(),
    reactionVaultAddress,
    {gasLimit: "200000"}
  );
  console.log("Granted CURATOR_VAULT_PURCHASER to " + reactionVaultAddress);

  await roleManager.grantRole(
    await roleManager.CURATOR_TOKEN_ADMIN(),
    curatorVaultAddress,
    {gasLimit: "200000"}
  );
  console.log("Granted CURATOR_TOKEN_ADMIN to " + curatorVaultAddress);

  // Temporarily grant address manager and parameter manager roles to the deploying account
  const roleRes = await roleManager.grantRole(
    await roleManager.ADDRESS_MANAGER_ADMIN(),
    deployer,
    {gasLimit: "200000"}
  );
  console.log("Granted ADDRESS_MANAGER_ADMIN to " + deployer);

  await roleManager.grantRole(
    await roleManager.PARAMETER_MANAGER_ADMIN(),
    deployer,
    {gasLimit: "200000"}
  );
  console.log("Granted PARAMETER_MANAGER_ADMIN to " + deployer);

  // Set addresses in address manager for the protocol
  console.log("\n\nUpdating addresses in the protocol");
  const addressManager = await ethers.getContractAt(
    "AddressManager",
    addressManagerAddress
  );
  await addressManager.setRoleManager(roleManagerAddress, {gasLimit: "200000"});
  await addressManager.setParameterManager(parameterManagerAddress, {
    gasLimit: "200000",
  });
  await addressManager.setMakerRegistrar(makerRegistrarAddress, {
    gasLimit: "200000",
  });
  await addressManager.setReactionNftContract(reactionNft1155Address, {
    gasLimit: "200000",
  });
  await addressManager.setDefaultCuratorVault(curatorVaultAddress, {
    gasLimit: "200000",
  });
  await addressManager.setChildRegistrar(childRegistrarAddress, {
    gasLimit: "200000",
  });

  // Set parameters in the protocol
  console.log("\n\nUpdating parameters in the protocol");
  const parameterManager = await ethers.getContractAt(
    "ParameterManager",
    parameterManagerAddress
  );
  await parameterManager.setPaymentToken(config.paymentTokenAddress, {
    gasLimit: "200000",
  });
  await parameterManager.setNativeWrappedToken(
    config.nativeWrappedTokenAddress
  );
  await parameterManager.setReactionPrice(config.reactionPrice, {
    gasLimit: "200000",
  });
  await parameterManager.setSaleCuratorLiabilityBasisPoints(
    config.curatorLiabilityBasisPoints,
    {gasLimit: "200000"}
  );
  await parameterManager.setSaleReferrerBasisPoints(
    config.saleReferrerBasisPoints,
    {gasLimit: "200000"}
  );
  await parameterManager.setSpendTakerBasisPoints(
    config.spendTakerBasisPoints,
    {gasLimit: "200000"}
  );
  await parameterManager.setSpendReferrerBasisPoints(
    config.spendReferrerBasisPoints,
    {gasLimit: "200000"}
  );
  await parameterManager.setFreeReactionLimit(config.freeReactionLimit, {
    gasLimit: "200000",
  });

  // Remove the temporary permissions for the deploy account not that params are updated
  console.log("\n\nRevoking temp permissions for deployer");
  await roleManager.revokeRole(
    await roleManager.ADDRESS_MANAGER_ADMIN(),
    deployer,
    {gasLimit: "200000"}
  );
  console.log("Revoked ADDRESS_MANAGER_ADMIN to " + deployer);

  await roleManager.revokeRole(
    await roleManager.PARAMETER_MANAGER_ADMIN(),
    deployer,
    {gasLimit: "200000"}
  );
  console.log("Revoked PARAMETER_MANAGER_ADMIN to " + deployer);

  console.log(
    '\n\nDeploy complete, run "hardhat --network XXXX etherscan-verify" to verify contracts'
  );
};

export default deployProtocol;
