import {HardhatRuntimeEnvironment} from "hardhat/types";

import {deployProxyContract} from "../../deploy_config/protocol";
import config from "../../deploy_config/polygon";

// Deploy the protocol on the L2
// For Mumbai testnet, we will deploy test token contracts as well as the full protocol contracts
// You must set DEPLOY_PRIVATE_KEY which is shared in RaRa 1Password
// Run: npx hardhat deploy --network polygon --tags polygon-upgrade1155 --export-all ./deploy_data/hardhat_contracts.json
module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const {getNamedAccounts} = hre;
  const {deployer} = await getNamedAccounts();
  console.log("\n\nDeploying with account " + deployer);

  //
  // Deploy new contracts
  //
  const addressManagerAddress = "0x2e6C454bde8a946172D0b43cCB84d19F12a0CE49";
  let reaction = await deployProxyContract(hre, "ReactionNft1155", [
    config.reactionNftUri,
    addressManagerAddress,
    config.reactionContractUri,
  ]);
  let curator = await deployProxyContract(hre, "CuratorToken1155", [
    config.curatorTokenNftUri,
    addressManagerAddress,
    config.curatorTokenContractUri,
  ]);

  console.log("Done.");
};

module.exports.tags = ["polygon-upgrade1155"];
