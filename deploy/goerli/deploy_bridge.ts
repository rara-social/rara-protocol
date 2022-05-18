import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import config from '../../deploy_config/goerli'
import { deployContract, deployProxyContract } from "../../deploy_config/protocol";
import { ZERO_ADDRESS } from '../../test/Scripts/constants';


// Deploy the protocol on the L2
// Run: npx hardhat deploy --network goerli --tags goerli
module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  console.log("\n\nDeploying with account " + deployer);

  // Deploy the root bridge
  let res = await deployContract(hre, 'RootRegistrar', [config.fxRootCheckPointManager, config.fxRootBridgeAddress, ZERO_ADDRESS]);
  const rootRegistrarAddress = res.address;
  console.log({ rootRegistrarAddress })

  // Deploy testing NFT contracts to use
  res = await deployProxyContract(hre, 'TestErc1155', [config.reactionNftUri, ZERO_ADDRESS]);
  const test155NftAddress = res.address;
  console.log({ test155NftAddress })

  res = await deployProxyContract(hre, 'TestErc721', [config.reactionNftUri, "RA721"]);
  const test721NftAddress = res.address;
  console.log({ test721NftAddress })

  console.log('\nDeployment complete')
};

module.exports.tags = ['goerli'];
