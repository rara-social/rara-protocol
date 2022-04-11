import {HardhatRuntimeEnvironment} from "hardhat/types";

import config from "../../deploy_config/mumbai";
import {ZERO_ADDRESS} from "../../test/Scripts/constants";
import {deployProxyContract} from "../../deploy_config/protocol";

// Deploy the protocol on the L2
// For Mumbai testnet, we will deploy test token contracts as well as the full protocol contracts
// You must set DEPLOY_PRIVATE_KEY which is shared in RaRa 1Password
// Run: npx hardhat deploy --network mumbai --tags mumbai
module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const {getNamedAccounts} = hre;
  const {deployer} = await getNamedAccounts();
  console.log("\n\nDeploying with account " + deployer);

  const AddressManagerAddress = "0x9F87ef076165229Da4231C90cdc5b21840CD630A";
  let res = await deployProxyContract(hre, "ReactionVault", [
    AddressManagerAddress,
  ]);
  const reactionVaultAddress = res.address;
  console.log({reactionVaultAddress});
};

module.exports.tags = ["mumbai-reaction"];
