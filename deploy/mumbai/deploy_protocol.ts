import {HardhatRuntimeEnvironment} from "hardhat/types";

import config from "../../deploy_config/mumbai";
import {ZERO_ADDRESS} from "../../test/Scripts/constants";
import deployProtocol, {
  deployProxyContract,
} from "../../deploy_config/protocol";

// Deploy the protocol on the L2
// For Mumbai testnet, we will deploy test token contracts as well as the full protocol contracts
// You must set DEPLOY_PRIVATE_KEY which is shared in RaRa 1Password
// Run: npx hardhat deploy --network mumbai --tags mumbai

// For full re-deploy run: npx hardhat deploy --network mumbai --tags mumbai --export-all ./deploy_data/hardhat_contracts.json --reset
module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const {getNamedAccounts} = hre;
  const {deployer} = await getNamedAccounts();
  console.log("\n\nDeploying with account " + deployer);

  // Deploy testing token contracts
  let res = await deployProxyContract(hre, "TestErc20", ["RaUSDC", "raUSDC"]);
  const testPaymentTokenErc20 = res.address;
  console.log({testPaymentTokenErc20});

  res = await deployProxyContract(hre, "TestErc1155", [
    config.reactionNftUri,
    ZERO_ADDRESS,
  ]);
  const test155NftAddress = res.address;
  console.log({test155NftAddress});

  res = await deployProxyContract(hre, "TestErc721", [
    config.reactionNftUri,
    "RA721",
  ]);
  const test721NftAddress = res.address;
  console.log({test721NftAddress});

  // Update the payment token address
  const updatedConfig = {...config, paymentTokenAddress: testPaymentTokenErc20};

  // Deploy the protocol with config
  await deployProtocol(hre, updatedConfig);
};

module.exports.tags = ["mumbai"];
