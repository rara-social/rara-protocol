import {HardhatRuntimeEnvironment} from "hardhat/types";
import {ethers} from "hardhat";

import {deployProxyContract} from "../../deploy_config/protocol";
import config from "../../deploy_config/polygon";

const deployConfig = require("../../deploy_data/hardhat_contracts.json");

const manualGas = {
  maxFeePerGas: 50000000000,
  maxPriorityFeePerGas: 50000000000,
};

// Deploy the protocol on the L2
// You must set DEPLOY_PRIVATE_KEY which is shared in RaRa 1Password
// Run: npx hardhat deploy --network polygon --tags polygon-upgrade-v1-1-checkRoles --export-all ./deploy_data/hardhat_contracts.json
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

  // setup role manager
  const roleManagerAddress = "0x66dBF730A7F9a251C4B3a6b56d01e0749AFDf847";
  const roleManager = await ethers.getContractAt(
    "RoleManager",
    roleManagerAddress
  );

  // grant role curator token admin to curator vault
  const curatorVaultAddress = "0x0De3FF886d5296A474117E7C4C287416dd4460bE";
  // await roleManager.grantRole(
  //   await roleManager.CURATOR_TOKEN_ADMIN(),
  //   curatorVaultAddress,
  //   manualGas
  // );

  // REACTION_NFT_ADMIN
  const reactionVaultAddress = "0xE5BA5c73378BC8Da94738CB04490680ae3eab88C";
  const isReactionNftAdmin = await roleManager.isReactionNftAdmin(
    reactionVaultAddress
  );
  const isCuratorVaultPurchaser = await roleManager.isCuratorVaultPurchaser(
    reactionVaultAddress
  );
  console.log({
    reactionVault: reactionVaultAddress,
    isReactionNftAdmin,
    isCuratorVaultPurchaser,
  });

  // CURATOR_TOKEN_ADMIN
  const isCuratorTokenAdmin = await roleManager.isCuratorTokenAdmin(
    curatorVaultAddress
  );
  console.log({
    curatorVaultAddress: curatorVaultAddress,
    isCuratorTokenAdmin,
  });

  console.log("\n\nDone.");
};

module.exports.tags = ["polygon-upgrade-v1-1-checkRoles"];
