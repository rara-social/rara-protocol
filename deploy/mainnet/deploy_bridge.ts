import { HardhatRuntimeEnvironment } from 'hardhat/types';
import config from '../../deploy_config/mainnet'
import { deployContract } from "../../deploy_config/protocol";


// Deploy the bridge on the L1
// Run: npx hardhat deploy --network mainnet --tags mainnet
module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  console.log("\n\nDeploying with account " + deployer);

  // Deploy the root bridge
  console.log('Deploying root registrar with config:');
  console.log({ fxRootCheckPointManager: config.fxRootCheckPointManager, fxRootBridgeAddress: config.fxRootBridgeAddress, royaltyRegistry: config.royaltyRegistry });

  let res = await deployContract(hre, 'RootRegistrar', [config.fxRootCheckPointManager, config.fxRootBridgeAddress, config.royaltyRegistry]);
  const rootRegistrarAddress = res.address;
  console.log({ rootRegistrarAddress })

  console.log('\nDeployment complete')
};

module.exports.tags = ['mainnet'];
