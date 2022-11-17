import {HardhatRuntimeEnvironment} from "hardhat/types";
import {ethers} from "hardhat";

import {deployProxyContract} from "../../deploy_config/protocol";
import config from "../../deploy_config/mumbai";

// Deploy the protocol on the L2
// For Mumbai testnet, we will deploy test token contracts as well as the full protocol contracts
// You must set DEPLOY_PRIVATE_KEY which is shared in RaRa 1Password
// Run: npx hardhat deploy --network mumbai --tags mumbai-upgrade-v1-1 --export-all ./v2_test_upgrade/hardhat_contracts.json
module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const {getNamedAccounts} = hre;
  const {deployer} = await getNamedAccounts();
  console.log("\n\nDeploying with account " + deployer);

  const chainId = "80001"; // mumbai
  const chainRPC = process.env.DATA_TESTING_RPC;
  const deployerPK = process.env.DEPLOY_PRIVATE_KEY;

  const roleManagerAddress = "0x2eC607cC101dD30C4192330c0e3004CAbEAcFe68";
  const curatorToken1155Address = "0xc0aa23C4221bF9C47fa9f9C145C0A7699D5e598E";
  let addressManagerAddress = "0x85E7BD499d60A4cD0FB36E2370b89c7f83AdBf2a";
  // console.log({
  //   roleManagerAddress,
  //   curatorToken1155Address,
  //   addressManagerAddress,
  // });

  //
  // Deploy new contracts
  //
  const DefaultProxyAdmin = await ethers.getContractAt(
    "DefaultProxyAdmin",
    "0xa0a2b7ef6a04f1D3e2aC64E422c7cf5E8238c7EE"
  );

  // Address Manager
  const res = await deployProxyContract(hre, "AddressManager", [
    roleManagerAddress,
  ]);
  addressManagerAddress = res.address;
  console.log({addressManagerAddress});

  // Curator1155
  let curator = await deployProxyContract(hre, "CuratorToken1155", [
    config.curatorTokenNftUri,
    addressManagerAddress,
    config.curatorTokenContractUri,
  ]);
  console.log({CuratorToken1155: curator.address});

  //   console.log("bailing...");
  //   return;

  // LikeTokenImplementation
  const LikeTokenFactory = await ethers.getContractFactory("LikeToken1155");
  const likeTokenImpl = await LikeTokenFactory.deploy();
  await likeTokenImpl.initialize(
    config.likeTokenNftUri,
    addressManagerAddress,
    config.likeTokenNftUri + "/contract/0X"
  );

  // LikeTokenFactory
  let factory = await deployProxyContract(hre, "LikeTokenFactory", [
    addressManagerAddress,
    likeTokenImpl.address,
    config.likeTokenNftUri,
  ]);

  // ParameterManager
  let pm = await deployProxyContract(hre, "ParameterManager", [
    addressManagerAddress,
  ]);

  // Reaction1155
  let reaction = await deployProxyContract(hre, "ReactionNft1155", [
    config.reactionNftUri,
    addressManagerAddress,
    config.reactionContractUri,
  ]);

  // ReactionVault
  const rv = await deployProxyContract(hre, "ReactionVault", [
    addressManagerAddress,
  ]);

  // SigmoidCuratorVault
  const scv = await deployProxyContract(hre, "SigmoidCuratorVault", [
    addressManagerAddress,
    curatorToken1155Address,
    config.bondingCurveA,
    config.bondingCurveB,
    config.bondingCurveC,
  ]);

  // Set addresses in address manager for the protocol
  console.log("\n\nUpdating addresses in the protocol");
  const addressManager = await ethers.getContractAt(
    "AddressManager",
    addressManagerAddress
  );
  await addressManager.setRoleManager(roleManagerAddress, {gasLimit: "200000"});
  await addressManager.setParameterManager(pm.address, {
    gasLimit: "200000",
  });
  await addressManager.setReactionNftContract(reaction.address, {
    gasLimit: "200000",
  });
  await addressManager.setDefaultCuratorVault(curator.address, {
    gasLimit: "200000",
  });

  console.log("\n\nUpdating parameters in the protocol");
  const parameterManager = await ethers.getContractAt(
    "ParameterManager",
    pm.address
  );
  // payment token
  await parameterManager.setPaymentToken(config.paymentTokenAddress, {
    gasLimit: "200000",
  });
  // nativeWrappedTokenAddress
  await parameterManager.setNativeWrappedToken(
    config.nativeWrappedTokenAddress
  );
  // freeReactionLimit
  await parameterManager.setFreeReactionLimit(config.freeReactionLimit, {
    gasLimit: "200000",
  });
  // reaction price
  await parameterManager.setReactionPrice(config.reactionPrice, {
    gasLimit: "200000",
  });

  console.log("Done.");
};

module.exports.tags = ["mumbai-upgrade-v1-1"];
