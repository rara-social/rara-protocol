import {HardhatRuntimeEnvironment} from "hardhat/types";
import {ethers} from "hardhat";
import {BigNumber} from "ethers";

const deployConfig = require("../../deploy_data/hardhat_contracts.json");

// Verify Parameters
// Run: npx hardhat deploy --network mumbai --tags mumbai-upgrade-v1-1-verify-roles
module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const {getNamedAccounts} = hre;
  const {deployer} = await getNamedAccounts();
  console.log("\n\nDeploying with account " + deployer);

  const chainId = "80001"; // mumbai
  const chainRPC = process.env.DATA_TESTING_RPC;
  const deployerPK: any = process.env.MAKER_PRIVATE_KEY;
  const provider = new ethers.providers.JsonRpcProvider(chainRPC);
  const signer = new ethers.utils.SigningKey(deployerPK);
  let wallet = new ethers.Wallet(signer);
  wallet = wallet.connect(provider);
  console.log({chainId, rpc: chainRPC, wallet: wallet.address});

  const reactionVaultAddress =
    deployConfig[chainId][0].contracts.ReactionVault.address;

  const roleManagerAddress =
    deployConfig[chainId][0].contracts.RoleManager.address;

  const roleManager = await ethers.getContractAt(
    "RoleManager",
    roleManagerAddress,
    wallet
  );

  // check if ReactionVault is "CURATOR_VAULT_PURCHASER"
  // const hasRole = await roleManager.isCuratorVaultPurchaser(
  //   reactionVaultAddress
  // );

  // console.log({
  //   func: "isCuratorVaultPurchaser",
  //   hasRole: hasRole,
  //   address: reactionVaultAddress,
  // });

  const curatorVaultAddress =
    deployConfig[chainId][0].contracts.SigmoidCuratorVault2.address;

  console.log("granting role...");
  const txn = await roleManager.grantRole(
    await roleManager.CURATOR_TOKEN_ADMIN(),
    curatorVaultAddress,
    {gasLimit: "200000"}
  );
  await txn.wait();

  const hasRole2 = await roleManager.isCuratorTokenAdmin(curatorVaultAddress);

  console.log({
    func: "isCuratorTokenAdmin",
    hasRole: hasRole2,
    address: curatorVaultAddress,
  });
};

module.exports.tags = ["mumbai-upgrade-v1-1-verify-roles"];
