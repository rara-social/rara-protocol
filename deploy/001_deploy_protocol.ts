import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { DeployResult } from 'hardhat-deploy/dist/types';

import config from '../deploy_config/hardhat'
import { ethers } from 'hardhat';

const DEBUG_LOG = true;


// Helper to deploy proxy with OZ implementation
const deployProxyContract = async (hre: HardhatRuntimeEnvironment, name: string, initializeVars: any[]) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  return deploy(name, {
    contract: name,
    from: deployer,
    proxy: {
      owner: deployer,
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        init: {
          methodName: "initialize",
          args: initializeVars
        }
      }
    },
    log: DEBUG_LOG,
  });
}

// Helper to deploy non-proxy contracts
const deployContract = async (hre: HardhatRuntimeEnvironment, name: string, initializeVars: any[]) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  return deploy(name, {
    contract: name,
    from: deployer,
    args: initializeVars,
    log: DEBUG_LOG,
  });
}


// Deploy the protocol on the L2
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  console.log("\n\nDeploying with account " + deployer);

  let res: DeployResult = await deployProxyContract(hre, 'RoleManager', [deployer]);
  const roleManagerAddress = res.address;
  console.log({ roleManagerAddress })

  res = await deployProxyContract(hre, 'AddressManager', [roleManagerAddress]);
  const addressManagerAddress = res.address;
  console.log({ addressManagerAddress })

  res = await deployProxyContract(hre, 'MakerRegistrar', [addressManagerAddress]);
  const makerRegistrarAddress = res.address;
  console.log({ makerRegistrarAddress })

  res = await deployProxyContract(hre, 'ReactionVault', [addressManagerAddress]);
  const reactionVaultAddress = res.address;
  console.log({ reactionVaultAddress })

  res = await deployProxyContract(hre, 'ReactionNft1155', [config.reactionNftUri, addressManagerAddress]);
  const reactionNft1155Address = res.address;
  console.log({ reactionNft1155Address })

  res = await deployProxyContract(hre, 'ParameterManager', [addressManagerAddress]);
  const parameterManagerAddress = res.address;
  console.log({ parameterManagerAddress })

  res = await deployProxyContract(hre, 'CuratorShares1155', [config.reactionNftUri, addressManagerAddress]);
  const curatorShares1155Address = res.address;
  console.log({ curatorShares1155Address })

  res = await deployProxyContract(hre, 'SigmoidCuratorVault', [addressManagerAddress, curatorShares1155Address]);
  const curatorVaultAddress = res.address;
  console.log({ curatorVaultAddress })

  res = await deployContract(hre, 'ChildRegistrar', [config.fxChildBridgeAddress, addressManagerAddress]);
  const childRegistrarAddress = res.address;
  console.log({ childRegistrarAddress })

  // TODO: This needs to be refactored out so it doesn't run on anything but hardhat or local networks
  //*************************************************** */
  res = await deployProxyContract(hre, 'TestErc20', ["TEST", "TST",]);
  const testPaymentTokenErc20 = res.address;
  console.log({ testPaymentTokenErc20 })

  res = await deployProxyContract(hre, 'TestErc1155', [config.reactionNftUri, addressManagerAddress]);
  const test155NftAddress = res.address;
  console.log({ test155NftAddress })

  res = await deployProxyContract(hre, 'TestErc721', [config.reactionNftUri, addressManagerAddress]);
  const test721NftAddress = res.address;
  console.log({ test721NftAddress })
  //*************************************************** */


  // Grant Roles for contracts in the protocol
  const roleManager = await ethers.getContractAt("RoleManager", roleManagerAddress)

  console.log('\n\nUpdating Roles')
  await roleManager.grantRole(await roleManager.REACTION_NFT_ADMIN(), reactionVaultAddress);
  console.log('\n\nGranted REACTION_NFT_ADMIN to ' + reactionVaultAddress)

  await roleManager.grantRole(await roleManager.CURATOR_VAULT_PURCHASER(), reactionVaultAddress);
  console.log('Granted CURATOR_VAULT_PURCHASER to ' + reactionVaultAddress)

  await roleManager.grantRole(await roleManager.CURATOR_SHARES_ADMIN(), curatorVaultAddress);
  console.log('Granted CURATOR_SHARES_ADMIN to ' + curatorVaultAddress)

  // Temporarily grant address manager and parameter manager roles to the deploying account
  await roleManager.grantRole(await roleManager.ADDRESS_MANAGER_ADMIN(), deployer);
  console.log('Granted ADDRESS_MANAGER_ADMIN to ' + deployer)

  await roleManager.grantRole(await roleManager.PARAMETER_MANAGER_ADMIN(), deployer);
  console.log('Granted PARAMETER_MANAGER_ADMIN to ' + deployer)

  // Set addresses in address manager for the protocol
  console.log('\n\nUpdating addresses and parameters in the protocol')
  const addressManager = await ethers.getContractAt("AddressManager", addressManagerAddress)
  await addressManager.setRoleManager(roleManagerAddress);
  await addressManager.setParameterManager(parameterManagerAddress);
  await addressManager.setMakerRegistrar(makerRegistrarAddress);
  await addressManager.setReactionNftContract(reactionNft1155Address);
  await addressManager.setDefaultCuratorVault(curatorVaultAddress);
  await addressManager.setChildRegistrar(childRegistrarAddress);

  // Set parameters in the protocol
  const parameterManager = await ethers.getContractAt("ParameterManager", parameterManagerAddress)
  await parameterManager.setPaymentToken(testPaymentTokenErc20);
  await parameterManager.setReactionPrice(config.reactionPrice);
  await parameterManager.setSaleCuratorLiabilityBasisPoints(config.curatorLiabilityBasisPoints);
  await parameterManager.setSaleReferrerBasisPoints(config.saleReferrerBasisPoints);
  await parameterManager.setSpendTakerBasisPoints(config.spendTakerBasisPoints);
  await parameterManager.setSpendReferrerBasisPoints(config.spendReferrerBasisPoints);
  await parameterManager.setBondingCurveParams(config.bondingCurveA, config.bondingCurveB, config.bondingCurveC);

  // Remove the temporary permissions for the deploy account not that params are updated
  console.log('\n\nRevoking temp permissions for deployer')
  await roleManager.revokeRole(await roleManager.ADDRESS_MANAGER_ADMIN(), deployer);
  console.log('Revoked ADDRESS_MANAGER_ADMIN to ' + deployer)

  await roleManager.revokeRole(await roleManager.PARAMETER_MANAGER_ADMIN(), deployer);
  console.log('Revoked PARAMETER_MANAGER_ADMIN to ' + deployer)

  console.log('\n\nDeploy complete')

};

module.exports.tags = ['RA'];
export default func;
