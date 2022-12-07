import {HardhatRuntimeEnvironment} from "hardhat/types";
import {ethers} from "hardhat";

import {deployProxyContract} from "../../deploy_config/protocol";
import config from "../../deploy_config/mumbai";

const deployConfig = require("../../deploy_data/hardhat_contracts.json");

// Deploy the protocol on the L2
// For Mumbai testnet, we will deploy test token contracts as well as the full protocol contracts
// You must set DEPLOY_PRIVATE_KEY which is shared in RaRa 1Password
// Run: npx hardhat deploy --network mumbai --tags mumbai-upgrade-v1-1-like-proxy-setup --export-all ./deploy_data/hardhat_contracts.json
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

  const LikeTokenFactory =
    deployConfig[chainId][0].contracts.LikeTokenFactory.address;
  const LikeTokenImp =
    deployConfig[chainId][0].contracts.LikeTokenFactory_Implementation.address;

  const addressManagerAddress =
    deployConfig[chainId][0].contracts.AddressManager.address;

  console.log({LikeTokenFactory, LikeTokenImp});

  //
  // Deploy new contracts
  //
  console.log("\n\nUpgrading DefaultProxyAdmin...");

  const addressManager = await ethers.getContractAt(
    "AddressManager",
    deployConfig[chainId][0].contracts.AddressManager.address
  );
  const likeFactory = await addressManager.likeTokenFactory();

  // cehck proxy manager
  const DefaultProxyAdmin = new ethers.Contract(
    deployConfig[chainId][0].contracts.DefaultProxyAdmin.address,
    deployConfig[chainId][0].contracts.DefaultProxyAdmin.abi,
    wallet
  );
  let implementation = await DefaultProxyAdmin.getProxyImplementation(
    LikeTokenFactory
  );
  console.log({
    name: "LikeTokenFactory",
    address: LikeTokenFactory,
    imp: LikeTokenImp,
    proxy_imp: implementation,
    AddressMgrLikeFactory: likeFactory,
  });

  console.log("\n\nDone.");
};

module.exports.tags = ["mumbai-upgrade-v1-1-like-proxy-setup"];
