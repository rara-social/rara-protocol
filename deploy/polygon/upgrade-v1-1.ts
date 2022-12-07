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
// Run: npx hardhat deploy --network polygon --tags polygon-upgrade-v1-1 --export-all ./deploy_data/hardhat_contracts.json
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

  // //
  // // Upgrade Existing Contracts
  // //
  // console.log("\n\nUpgrading existing contracts");
  // const DefaultProxyAdmin = new ethers.Contract(
  //   deployConfig[chainId][0].contracts.DefaultProxyAdmin.address,
  //   deployConfig[chainId][0].contracts.DefaultProxyAdmin.abi,
  //   wallet
  // );

  // // Address Manager
  // const roleManagerAddress =
  //   deployConfig[chainId][0].contracts.RoleManager.address;
  // let add = await deployProxyContract(
  //   hre,
  //   "AddressManager",
  //   [roleManagerAddress],
  //   manualGas
  // );
  // let txn = await DefaultProxyAdmin.upgrade(
  //   add.address,
  //   add.implementation,
  //   manualGas
  // );
  // await txn.wait();
  // let implementation = await DefaultProxyAdmin.getProxyImplementation(
  //   add.address
  // );
  // console.log({
  //   name: "AddressManager",
  //   address: add.address,
  //   imp: add.implementation,
  //   proxy_imp: implementation,
  // });
  // const addressManagerAddress = add.address;

  // // ParameterManager
  // let pm = await deployProxyContract(
  //   hre,
  //   "ParameterManager",
  //   [addressManagerAddress],
  //   manualGas
  // );
  // txn = await DefaultProxyAdmin.upgrade(
  //   pm.address,
  //   pm.implementation,
  //   manualGas
  // );
  // await txn.wait();
  // implementation = await DefaultProxyAdmin.getProxyImplementation(pm.address);
  // console.log({
  //   name: "ParameterManager",
  //   address: pm.address,
  //   imp: pm.implementation,
  //   proxy_imp: implementation,
  // });

  // // Curator1155
  // const ct = await deployProxyContract(
  //   hre,
  //   "CuratorToken1155",
  //   [
  //     config.curatorTokenNftUri,
  //     addressManagerAddress,
  //     config.curatorTokenContractUri,
  //   ],
  //   manualGas
  // );
  // txn = await DefaultProxyAdmin.upgrade(
  //   ct.address,
  //   ct.implementation,
  //   manualGas
  // );
  // await txn.wait();
  // implementation = await DefaultProxyAdmin.getProxyImplementation(ct.address);
  // console.log({
  //   name: "CuratorToken1155",
  //   address: ct.address,
  //   imp: ct.implementation,
  //   proxy_imp: implementation,
  // });

  // // Reaction1155
  // let ReactionNft1155 = await deployProxyContract(
  //   hre,
  //   "ReactionNft1155",
  //   [config.reactionNftUri, addressManagerAddress, config.reactionContractUri],
  //   manualGas
  // );
  // txn = await DefaultProxyAdmin.upgrade(
  //   ReactionNft1155.address,
  //   ReactionNft1155.implementation,
  //   manualGas
  // );
  // await txn.wait();
  // implementation = await DefaultProxyAdmin.getProxyImplementation(
  //   ReactionNft1155.address
  // );
  // console.log({
  //   name: "ReactionNft1155",
  //   address: ReactionNft1155.address,
  //   imp: ReactionNft1155.implementation,
  //   proxy_imp: implementation,
  // });

  // // ReactionVault
  // const rv = await deployProxyContract(
  //   hre,
  //   "ReactionVault",
  //   [addressManagerAddress],
  //   manualGas
  // );
  // txn = await DefaultProxyAdmin.upgrade(
  //   rv.address,
  //   rv.implementation,
  //   manualGas
  // );
  // await txn.wait();
  // implementation = await DefaultProxyAdmin.getProxyImplementation(rv.address);
  // console.log({
  //   name: "ReactionVault",
  //   address: rv.address,
  //   imp: rv.implementation,
  //   proxy_imp: implementation,
  // });

  // //
  // // Deploy new contracts
  // //
  // console.log("\n\nDeploying new contracts");

  // const scv = await deployProxyContract(
  //   hre,
  //   "SigmoidCuratorVault2",
  //   [
  //     addressManagerAddress,
  //     ct.address,
  //     config.bondingCurveA,
  //     config.bondingCurveB,
  //     config.bondingCurveC,
  //   ],
  //   manualGas
  // );

  // // LikeTokenImplementation
  // const LikeTokenFactory = await ethers.getContractFactory("LikeToken1155");
  // const likeTokenImpl = await LikeTokenFactory.deploy(manualGas);

  // // LikeTokenFactory
  // let factory = await deployProxyContract(
  //   hre,
  //   "LikeTokenFactory",
  //   [addressManagerAddress, likeTokenImpl.address, config.likeTokenContractUri],
  //   manualGas
  // );

  const roleManagerAddress = "0x66dBF730A7F9a251C4B3a6b56d01e0749AFDf847";
  const addressManagerAddress = "0x2e6C454bde8a946172D0b43cCB84d19F12a0CE49";
  const parameterManagerAddress = "0xF60de25472b10e5886270b13dDec51D8BaDcd764";
  const reactionNFTAddress = "0x472760D7595bAB1BE04a071C4cE2cf6AA028695F";
  const sigmoidCuratorAddress = "0x0De3FF886d5296A474117E7C4C287416dd4460bE";
  const likeTokenFactoryAddress = "0x2154E3fE0a01764784690f60cF2d4Ed4A7F4Ba15";
  const curatorToken1155Address = "0x91b529573825452Ea900863A4cEb4C417F97B87D";

  //
  // Temporarily grant roles to the deploying account
  //
  // console.log("\n\nGranting temp permissions");
  const roleManager = await ethers.getContractAt(
    "RoleManager",
    roleManagerAddress
  );
  // await roleManager.grantRole(
  //   await roleManager.ADDRESS_MANAGER_ADMIN(),
  //   deployer,
  //   manualGas
  // );
  // console.log("Granted ADDRESS_MANAGER_ADMIN to " + deployer);
  // await roleManager.grantRole(
  //   await roleManager.PARAMETER_MANAGER_ADMIN(),
  //   deployer,
  //   manualGas
  // );
  // console.log("Granted PARAMETER_MANAGER_ADMIN to " + deployer);
  // await roleManager.grantRole(
  //   await roleManager.REACTION_NFT_ADMIN(),
  //   deployer,
  //   manualGas
  // );
  // console.log("Granted REACTION_NFT_ADMIN to " + deployer);
  // await roleManager.grantRole(
  //   await roleManager.CURATOR_TOKEN_ADMIN(),
  //   deployer,
  //   manualGas
  // );
  // console.log("Granted CURATOR_TOKEN_ADMIN to " + deployer);

  //
  // Updating AddressManager
  //
  console.log("\n\nUpdating AddressManager");
  // const addressManager = await ethers.getContractAt(
  //   "AddressManager",
  //   addressManagerAddress
  // );
  // await addressManager.setParameterManager(parameterManagerAddress, manualGas);
  // await addressManager.setReactionNftContract(reactionNFTAddress, manualGas);
  // await addressManager.setDefaultCuratorVault(sigmoidCuratorAddress, manualGas);
  // await addressManager.setLikeTokenFactory(likeTokenFactoryAddress, manualGas);

  //
  // Updating ParameterManager
  //
  console.log("\n\nUpdating ParameterManager");
  const parameterManager = await ethers.getContractAt(
    "ParameterManager",
    parameterManagerAddress
  );
  // // payment token
  // await parameterManager.setPaymentToken(config.paymentTokenAddress, manualGas);
  // // nativeWrappedTokenAddress
  // await parameterManager.setNativeWrappedToken(
  //   config.nativeWrappedTokenAddress,
  //   manualGas
  // );
  // // freeReactionLimit
  // await parameterManager.setFreeReactionLimit(
  //   config.freeReactionLimit,
  //   manualGas
  // );
  // reaction price
  await parameterManager.setReactionPrice(config.reactionPrice, manualGas);

  //
  // Set NFT contract URI's
  //
  console.log("\n\nSetting NFT contract URI's");
  const ReactionNft1155Contract = await ethers.getContractAt(
    "ReactionNft1155",
    reactionNFTAddress
  );
  await ReactionNft1155Contract.setContractUri(
    config.reactionContractUri,
    manualGas
  );
  const CuratorToken1155 = await ethers.getContractAt(
    "CuratorToken1155",
    curatorToken1155Address
  );
  await CuratorToken1155.setContractUri(
    config.curatorTokenContractUri,
    manualGas
  );

  //
  // Remove the temporary permissions for the deploy account
  //
  console.log("\n\nRevoking temp permissions for deployer");
  await roleManager.revokeRole(
    await roleManager.ADDRESS_MANAGER_ADMIN(),
    deployer,
    manualGas
  );
  console.log("Revoked ADDRESS_MANAGER_ADMIN to " + deployer);
  await roleManager.revokeRole(
    await roleManager.PARAMETER_MANAGER_ADMIN(),
    deployer,
    manualGas
  );
  console.log("Revoked PARAMETER_MANAGER_ADMIN to " + deployer);
  await roleManager.revokeRole(
    await roleManager.REACTION_NFT_ADMIN(),
    deployer,
    manualGas
  );
  console.log("Revoked REACTION_NFT_ADMIN to " + deployer);
  await roleManager.revokeRole(
    await roleManager.CURATOR_TOKEN_ADMIN(),
    deployer,
    manualGas
  );
  console.log("Revoked CURATOR_TOKEN_ADMIN to " + deployer);

  console.log("\n\nDone.");
};

module.exports.tags = ["polygon-upgrade-v1-1"];
