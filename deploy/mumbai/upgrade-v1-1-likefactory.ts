import {HardhatRuntimeEnvironment} from "hardhat/types";
import {ethers} from "hardhat";

import {deployProxyContract} from "../../deploy_config/protocol";
import config from "../../deploy_config/mumbai";

const deployConfig = require("../../deploy_data/hardhat_contracts.json");

// Deploy the protocol on the L2
// For Mumbai testnet, we will deploy test token contracts as well as the full protocol contracts
// You must set DEPLOY_PRIVATE_KEY which is shared in RaRa 1Password
// Run: npx hardhat deploy --network mumbai --tags mumbai-upgrade-v1-1-likefactory --export-all ./deploy_data/hardhat_contracts.json
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

  const AddressManagerAddress =
    deployConfig[chainId][0].contracts.AddressManager.address;
  const RoleManagerAddress =
    deployConfig[chainId][0].contracts.RoleManager.address;

  //
  // Deploy new contracts
  //
  console.log("\n\nDeploying new contracts");

  // LikeTokenImplementation
  const LikeTokenFactory = await ethers.getContractFactory("LikeToken1155");
  const likeTokenImpl = await LikeTokenFactory.deploy();

  // LikeTokenFactory
  let factory = await deployProxyContract(hre, "LikeTokenFactory", [
    AddressManagerAddress,
    likeTokenImpl.address,
    config.likeTokenContractUri,
  ]);

  //
  // Temporarily grant roles to the deploying account
  //
  console.log("\n\nGranting temp permissions");
  const roleManager = await ethers.getContractAt(
    "RoleManager",
    RoleManagerAddress
  );
  await roleManager.grantRole(
    await roleManager.ADDRESS_MANAGER_ADMIN(),
    deployer,
    {gasLimit: "200000"}
  );
  console.log("Granted ADDRESS_MANAGER_ADMIN to " + deployer);

  //
  // Updating AddressManager
  //
  console.log("\n\nUpdating AddressManager");
  const addressManager = await ethers.getContractAt(
    "AddressManager",
    AddressManagerAddress
  );
  await addressManager.setLikeTokenFactory(factory.address, {
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

module.exports.tags = ["mumbai-upgrade-v1-1-likefactory"];
