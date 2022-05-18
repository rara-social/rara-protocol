import { HardhatRuntimeEnvironment } from "hardhat/types";

import config from "../../deploy_config/polygon";
import deployProtocol from "../../deploy_config/protocol";

// Deploy the protocol on the L2
// You must set DEPLOY_PRIVATE_KEY which is shared in RaRa 1Password
// Run: npx hardhat deploy --network polygon --tags polygon
module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  console.log("\n\nDeploying with account " + deployer);

  // Deploy the protocol with config
  await deployProtocol(hre, config);

  console.log('Deploy complete... verify contracts and hand over ownership of BOTH DefaultProxyAdmin and RoleManager to the multisig')
};

module.exports.tags = ["polygon"];
