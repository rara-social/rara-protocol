import {HardhatRuntimeEnvironment} from "hardhat/types";
import {ethers} from "hardhat";

import {deployProxyContract} from "../../deploy_config/protocol";
import config from "../../deploy_config/polygon";

const deployConfig = require("../../deploy_data/hardhat_contracts.json");

const manualGas = {
  maxFeePerGas: 50000000000,
  maxPriorityFeePerGas: 50000000000,
  gasLimit: 2000000,
};

// Deploy the protocol on the L2
// You must set DEPLOY_PRIVATE_KEY which is shared in RaRa 1Password
// Run: npx hardhat deploy --network polygon --tags polygon-upgrade-v1-1-royalty --export-all ./deploy_data/hardhat_contracts.json
module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const {getNamedAccounts} = hre;
  const {deployer} = await getNamedAccounts();
  console.log("\n\nDeploying with account " + deployer);

  const chainId = "137"; // polygon
  const chainRPC = process.env.DEPLOY_RPC; // set in ENV
  const deployerPK: any = process.env.DEPLOY_PRIVATE_KEY; // set in ENV

  const provider = new ethers.providers.JsonRpcProvider(chainRPC);
  const signer = new ethers.utils.SigningKey(deployerPK);
  let wallet = new ethers.Wallet(signer);
  wallet = wallet.connect(provider);
  console.log({chainId, rpc: chainRPC, wallet: wallet.address});

  // get nonce & pricing
  const data = await provider.getFeeData();
  const nonce = await provider.getTransactionCount(wallet.address, "pending");
  console.log({data, nonce});

  const roleManagerAddress = "0x66dBF730A7F9a251C4B3a6b56d01e0749AFDf847";
  const addressManagerAddress = "0x2e6C454bde8a946172D0b43cCB84d19F12a0CE49";

  //
  // Temporarily grant roles to the deploying account
  //
  console.log("\n\nGranting temp permissions to deployer");
  const roleManager = await ethers.getContractAt(
    "RoleManager",
    roleManagerAddress
  );
  let txn = await roleManager.grantRole(
    await roleManager.ADDRESS_MANAGER_ADMIN(),
    deployer,
    manualGas
  );
  await txn.wait();

  //
  // Updating AddressManager - royaltyRegistry
  //
  console.log("\n\nUpdating AddressManager");
  const addressManager = await ethers.getContractAt(
    "AddressManager",
    addressManagerAddress
  );
  txn = await addressManager.setRoyaltyRegistry(
    config.royaltyRegistry,
    manualGas
  );
  await txn.wait();

  //
  // Remove the temporary permissions for the deploy account
  //
  console.log("\n\nRevoking temp permissions for deployer");
  txn = await roleManager.revokeRole(
    await roleManager.ADDRESS_MANAGER_ADMIN(),
    deployer,
    manualGas
  );
  await txn.wait();

  console.log("\n\nDone.");
};

module.exports.tags = ["polygon-upgrade-v1-1-royalty"];
