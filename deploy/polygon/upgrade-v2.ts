import {HardhatRuntimeEnvironment} from "hardhat/types";
import {ethers, upgrades} from "hardhat";

import {deployProxyContract} from "../../deploy_config/protocol";
import {DeployResult} from "hardhat-deploy/types";
import { Overrides } from "ethers";

const deployData = require("../../deploy_data/hardhat_contracts.json");

/* 
## What has happened before this script?
1. The Deployer (hot-wallet) has been made the owner of the DefaultProxyAdmin contract
2. The Deployer (hot-wallet) has been given the DEFAULT_ADMIN role via the RoleManager
  a. This allows us to perform step #4 below

## What will happen in this script?
1. We will upgrade implementations for the following contracts:
  * RoleManager
  * AddressManager
  * ParameterManager
  * MakerRegistrar
  * ReactionVault

2. We will deploy a new protocol contract:
  * DispatcherManager

3. We will grant the ADDRESS_MANAGER_ADMIN role to the Deployer (hot-wallet)
  a. This allows us to perform step #5 below

4. We will grant the SIG_NONCE_UPDATER role to the following contracts:
  * ReactionVault
  * MakerRegistrar
  * DispatcherManager

5. We will set the DispatcherManager address on the AddressManager contract

6. We will revoke the ADDRESS_MANAGER_ADMIN role from the Deployer

## What will happen after this script is run?
1. We will transfer ownership of DefaultProxyAdmin from Deployer back to ProxyOwner
2. We will renounce the Deployer’s DEFAULT_ADMIN role on RoleManager
*/

const manualGas = {
  // gasPrice: 200000000000,
  maxFeePerGas: 200000000000,
  maxPriorityFeePerGas: 200000000000,
} as Overrides;

// You must set DEPLOY_PRIVATE_KEY which is shared in RaRa 1Password
// Run: npx hardhat deploy --network polygon --tags polygon-upgrade-v2 --export-all ./deploy_data/hardhat_contracts.json
module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const {getNamedAccounts} = hre;
  const {deployer} = await getNamedAccounts();
  console.log("\n\nDeploying with account " + deployer);

  const chainId = "137"; // polygon
  const chainRPC = process.env.INFURA_RPC_POLYGON; // set in ENV
  const deployerPK: any = process.env.DEPLOY_PRIVATE_KEY; // set in ENV

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
    deployData[chainId][0].contracts.DefaultProxyAdmin.address,
    deployData[chainId][0].contracts.DefaultProxyAdmin.abi,
    wallet
  );

  // Update implementation for RoleManager
  const rm = await deployProxyContract(
    hre,
    "RoleManager",
    [wallet.address],
    manualGas
  );
  let txn = await DefaultProxyAdmin.upgrade(
    rm.address,
    rm.implementation,
    manualGas
  );
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
    [rm.address],
    manualGas
  );
  txn = await DefaultProxyAdmin.upgrade(
    addressManager.address,
    addressManager.implementation,
    manualGas
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
  let pm = await deployProxyContract(
    hre,
    "ParameterManager",
    [addressManagerAddress],
    manualGas
  );
  txn = await DefaultProxyAdmin.upgrade(
    pm.address,
    pm.implementation,
    manualGas
  );
  await txn.wait();
  implementation = await DefaultProxyAdmin.getProxyImplementation(pm.address);
  console.log({
    name: "ParameterManager",
    address: pm.address,
    imp: pm.implementation,
    proxy_imp: implementation,
  });

  // Update implementation for MakerRegistrar
  let mr = await deployProxyContract(
    hre,
    "MakerRegistrar",
    [addressManagerAddress],
    manualGas
  );
  txn = await DefaultProxyAdmin.upgrade(
    mr.address,
    mr.implementation,
    manualGas
  );
  await txn.wait();
  implementation = await DefaultProxyAdmin.getProxyImplementation(mr.address);
  console.log({
    name: "MakerRegistrar",
    address: mr.address,
    imp: mr.implementation,
    proxy_imp: implementation,
  });

  // Update implementation for ReactionVault
  const rv = await deployProxyContract(
    hre,
    "ReactionVault",
    [addressManagerAddress],
    manualGas
  );
  txn = await DefaultProxyAdmin.upgrade(
    rv.address,
    rv.implementation,
    manualGas
  );
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

  const deployedDispatcherManager = await deployProxyContract(
    hre,
    "DispatcherManager",
    [addressManagerAddress],
    manualGas
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
    {gasLimit: "200000", ...manualGas}
  );
  console.log("Granted ADDRESS_MANAGER_ADMIN to " + deployer);

  //
  // Permanently grant roles to the sig nonce updaters
  //
  // Allow reaction vault to update sig nonces
  await roleManager.grantRole(
    await roleManager.SIG_NONCE_UPDATER(),
    rv.address,
    {gasLimit: "200000", ...manualGas}
  );
  console.log("Granted SIG_NONCE_UPDATER to " + rv.address)
  // Allow maker registrar to update sig nonces
  await roleManager.grantRole(
    await roleManager.SIG_NONCE_UPDATER(),
    mr.address,
    {gasLimit: "200000", ...manualGas}
  );
  console.log("Granted SIG_NONCE_UPDATER to " + mr.address);
  // Allow dispatcher manager to update sig nonces
  await roleManager.grantRole(
    await roleManager.SIG_NONCE_UPDATER(),
    dispatcherManager.address,
    {gasLimit: "200000", ...manualGas}
  );
  console.log("Granted SIG_NONCE_UPDATER to " + dispatcherManager.address);

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
    ...manualGas,
  });
  console.log("Set AddressManager.dispatcherManager to " + dispatcherManager.address)

  //
  // Remove the temporary permissions for the deploy account
  //
  console.log("\n\nRevoking temp permissions for deployer");
  await roleManager.revokeRole(
    await roleManager.ADDRESS_MANAGER_ADMIN(),
    deployer,
    {gasLimit: "200000", ...manualGas}
  );
  console.log("Revoked ADDRESS_MANAGER_ADMIN to " + deployer);

  console.log("\n\nDone.");
};;

module.exports.tags = ["polygon-upgrade-v2"];
