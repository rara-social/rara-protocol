import {HardhatRuntimeEnvironment} from "hardhat/types";
import {ethers, upgrades} from "hardhat";

import {deployProxyContract} from "../../deploy_config/protocol";
import {DeployResult} from "hardhat-deploy/types";

const deployConfig = require("../../deploy_data/hardhat_contracts.json");

// Deploy the protocol on the L2
// For Mumbai testnet, we will deploy test token contracts as well as the full protocol contracts
// You must set DEPLOY_PRIVATE_KEY which is shared in RaRa 1Password
// Run: npx hardhat deploy --network mumbai --tags mumbai-upgrade-v2 --export-all ./deploy_data/hardhat_contracts.json
module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const {getNamedAccounts} = hre;
  const {deployer} = await getNamedAccounts();
  console.log("\n\nDeploying with account " + deployer);

  const chainId = "80001"; // mumbai
  const chainRPC = process.env.DATA_TESTING_RPC;
  const deployerPK: any = process.env.DEPLOY_PRIVATE_KEY;
  const provider = new ethers.providers.JsonRpcProvider(chainRPC);
  const signer = new ethers.utils.SigningKey(deployerPK);
  let wallet = new ethers.Wallet(signer);
  wallet = wallet.connect(provider);
  console.log({chainId, rpc: chainRPC, wallet: wallet.address});

  //
  // Upgrade Existing Contracts
  //
  console.log("\n\nUpgrading existing contracts");
  const DefaultProxyAdmin = new ethers.Contract(
    deployConfig[chainId][0].contracts.DefaultProxyAdmin.address,
    deployConfig[chainId][0].contracts.DefaultProxyAdmin.abi,
    wallet
  );

  // Update implementation for RoleManager
  const rm = await deployProxyContract(hre, "RoleManager", [wallet.address]);
  let txn = await DefaultProxyAdmin.upgrade(rm.address, rm.implementation);
  await txn.wait();
  let implementation = await DefaultProxyAdmin.getProxyImplementation(
    rm.address
  );
  console.log({
    name: "RoleManager",
    address: rm.address,
    imp: rm.implementation,
    proxy_imp: implementation,
  });

  // Update implementation for AddressManager
  let addressManager: DeployResult = await deployProxyContract(
    hre,
    "AddressManager",
    [rm.address]
  );
  txn = await DefaultProxyAdmin.upgrade(
    addressManager.address,
    addressManager.implementation
  );
  await txn.wait();
  implementation = await DefaultProxyAdmin.getProxyImplementation(
    addressManager.address
  );
  console.log({
    name: "AddressManager",
    address: addressManager.address,
    imp: addressManager.implementation,
    proxy_imp: implementation,
  });
  const addressManagerAddress = addressManager.address;

  // Update implementation for ParameterManager
  let pm = await deployProxyContract(hre, "ParameterManager", [
    addressManagerAddress,
  ]);
  txn = await DefaultProxyAdmin.upgrade(pm.address, pm.implementation);
  await txn.wait();
  implementation = await DefaultProxyAdmin.getProxyImplementation(pm.address);
  console.log({
    name: "ParameterManager",
    address: pm.address,
    imp: pm.implementation,
    proxy_imp: implementation,
  });

  // Update implementation for MakerRegistrar
  let mr = await deployProxyContract(hre, "MakerRegistrar", [
    addressManagerAddress,
  ]);
  txn = await DefaultProxyAdmin.upgrade(mr.address, mr.implementation);
  await txn.wait();
  implementation = await DefaultProxyAdmin.getProxyImplementation(mr.address);
  console.log({
    name: "MakerRegistrar",
    address: mr.address,
    imp: mr.implementation,
    proxy_imp: implementation,
  });

  // Update implementation for ReactionVault
  const rv = await deployProxyContract(hre, "ReactionVault", [
    addressManagerAddress,
  ]);
  txn = await DefaultProxyAdmin.upgrade(rv.address, rv.implementation);
  await txn.wait();
  implementation = await DefaultProxyAdmin.getProxyImplementation(rv.address);
  console.log({
    name: "ReactionVault",
    address: rv.address,
    imp: rv.implementation,
    proxy_imp: implementation,
  });

  //
  // Deploy new contracts
  //
  console.log("\n\nDeploying new contracts");

  // Deploy DispatcherManager
  const DispatcherManagerFactory = await ethers.getContractFactory(
    "DispatcherManager"
  );
  const deployedDispatcherManager = await upgrades.deployProxy(
    DispatcherManagerFactory,
    [addressManagerAddress]
  );
  const dispatcherManager = DispatcherManagerFactory.attach(
    deployedDispatcherManager.address
  );

  //
  // Temporarily grant roles to the deploying account
  //
  console.log("\n\nGranting temp permissions");
  const roleManager = await ethers.getContractAt("RoleManager", rm.address);
  await roleManager.grantRole(
    await roleManager.ADDRESS_MANAGER_ADMIN(),
    deployer,
    {gasLimit: "200000"}
  );
  console.log("Granted ADDRESS_MANAGER_ADMIN to " + deployer);

  //
  // Permanently grant roles to the sig nonce updaters
  //
  // Allow reaction vault to update sig nonces
  await roleManager.grantRole(
    await roleManager.SIG_NONCE_UPDATER(),
    rv.address,
    {gasLimit: "200000"}
  );
  // Allow maker registrar to update sig nonces
  await roleManager.grantRole(
    await roleManager.SIG_NONCE_UPDATER(),
    mr.address,
    {gasLimit: "200000"}
  );

  //
  // Updating AddressManager
  //
  console.log("\n\nUpdating AddressManager");
  const _addressManager = await ethers.getContractAt(
    "AddressManager",
    addressManager.address
  );
  await _addressManager.setDispatcherManager(dispatcherManager.address, {
    gasLimit: "200000",
  });

  //
  // Remove the temporary permissions for the deploy account
  //
  console.log("\n\nRevoking temp permissions for deployer");
  await roleManager.revokeRole(
    await roleManager.ADDRESS_MANAGER_ADMIN(),
    deployer,
    {gasLimit: "200000"}
  );
  console.log("Revoked ADDRESS_MANAGER_ADMIN to " + deployer);

  console.log("\n\nDone.");
};

module.exports.tags = ["mumbai-upgrade-v2"];
