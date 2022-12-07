import {HardhatRuntimeEnvironment} from "hardhat/types";
import {ethers} from "hardhat";

import {deployProxyContract} from "../../deploy_config/protocol";
import config from "../../deploy_config/polygon";

const deployConfig = require("../../deploy_data/hardhat_contracts.json");

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

  //
  // Upgrade Existing Contracts
  //
  console.log("\n\nUpgrading existing contracts");
  const DefaultProxyAdmin = new ethers.Contract(
    deployConfig[chainId][0].contracts.DefaultProxyAdmin.address,
    deployConfig[chainId][0].contracts.DefaultProxyAdmin.abi,
    wallet
  );

  // Address Manager
  const roleManagerAddress =
    deployConfig[chainId][0].contracts.RoleManager.address;
  // console.log({roleManagerAddress});
  let add = await deployProxyContract(hre, "AddressManager", [
    roleManagerAddress,
  ]);
  let txn = await DefaultProxyAdmin.upgrade(add.address, add.implementation);
  await txn.wait();
  let implementation = await DefaultProxyAdmin.getProxyImplementation(
    add.address
  );
  console.log({
    name: "AddressManager",
    address: add.address,
    imp: add.implementation,
    proxy_imp: implementation,
  });
  const addressManagerAddress = add.address;

  // ParameterManager
  let pm = await deployProxyContract(hre, "ParameterManager", [
    addressManagerAddress,
  ]);
  txn = await DefaultProxyAdmin.upgrade(pm.address, pm.implementation);
  await txn.wait();
  implementation = await DefaultProxyAdmin.getProxyImplementation(pm.address);
  console.log({
    name: "ParameterManager",
    address: pm.address,
    imp: pm.implementation,
    proxy_imp: implementation,
  });

  // Curator1155
  const ct = await deployProxyContract(hre, "CuratorToken1155", [
    config.curatorTokenNftUri,
    addressManagerAddress,
    config.curatorTokenContractUri,
  ]);
  txn = await DefaultProxyAdmin.upgrade(ct.address, ct.implementation);
  await txn.wait();
  implementation = await DefaultProxyAdmin.getProxyImplementation(ct.address);
  console.log({
    name: "CuratorToken1155",
    address: ct.address,
    imp: ct.implementation,
    proxy_imp: implementation,
  });

  // Reaction1155
  let ReactionNft1155 = await deployProxyContract(hre, "ReactionNft1155", [
    config.reactionNftUri,
    addressManagerAddress,
    config.reactionContractUri,
  ]);
  txn = await DefaultProxyAdmin.upgrade(
    ReactionNft1155.address,
    ReactionNft1155.implementation
  );
  await txn.wait();
  implementation = await DefaultProxyAdmin.getProxyImplementation(
    ReactionNft1155.address
  );
  console.log({
    name: "ReactionNft1155",
    address: ReactionNft1155.address,
    imp: ReactionNft1155.implementation,
    proxy_imp: implementation,
  });

  // ReactionVault
  const rv = await deployProxyContract(hre, "ReactionVault", [
    addressManagerAddress,
  ]);
  txn = await DefaultProxyAdmin.upgrade(rv.address, rv.implementation);
  await txn.wait();
  implementation = await DefaultProxyAdmin.getProxyImplementation(rv.address);
  console.log({
    name: "ReactionVault",
    address: rv.address,
    imp: rv.implementation,
    proxy_imp: implementation,
  });

  //
  // Deploy new contracts
  //
  console.log("\n\nDeploying new contracts");

  const scv = await deployProxyContract(hre, "SigmoidCuratorVault2", [
    addressManagerAddress,
    ct.address,
    config.bondingCurveA,
    config.bondingCurveB,
    config.bondingCurveC,
  ]);

  // LikeTokenImplementation
  const LikeTokenFactory = await ethers.getContractFactory("LikeToken1155");
  const likeTokenImpl = await LikeTokenFactory.deploy();

  // LikeTokenFactory
  let factory = await deployProxyContract(hre, "LikeTokenFactory", [
    addressManagerAddress,
    likeTokenImpl.address,
    config.likeTokenContractUri,
  ]);

  //
  // Temporarily grant roles to the deploying account
  //
  console.log("\n\nGranting temp permissions");
  const roleManager = await ethers.getContractAt(
    "RoleManager",
    roleManagerAddress
  );
  await roleManager.grantRole(
    await roleManager.ADDRESS_MANAGER_ADMIN(),
    deployer,
    {gasLimit: "200000"}
  );
  console.log("Granted ADDRESS_MANAGER_ADMIN to " + deployer);
  await roleManager.grantRole(
    await roleManager.PARAMETER_MANAGER_ADMIN(),
    deployer,
    {gasLimit: "200000"}
  );
  console.log("Granted PARAMETER_MANAGER_ADMIN to " + deployer);
  await roleManager.grantRole(
    await roleManager.REACTION_NFT_ADMIN(),
    deployer,
    {gasLimit: "200000"}
  );
  console.log("Granted REACTION_NFT_ADMIN to " + deployer);
  await roleManager.grantRole(
    await roleManager.CURATOR_TOKEN_ADMIN(),
    deployer,
    {gasLimit: "200000"}
  );
  console.log("Granted CURATOR_TOKEN_ADMIN to " + deployer);

  //
  // Updating AddressManager
  //
  console.log("\n\nUpdating AddressManager");
  const addressManager = await ethers.getContractAt(
    "AddressManager",
    add.address
  );
  await addressManager.setParameterManager(pm.address, {
    gasLimit: "200000",
  });
  await addressManager.setReactionNftContract(ReactionNft1155.address, {
    gasLimit: "200000",
  });
  await addressManager.setDefaultCuratorVault(scv.address, {
    gasLimit: "200000",
  });
  await addressManager.setLikeTokenFactory(factory.address, {
    gasLimit: "200000",
  });

  //
  // Updating ParameterManager
  //
  console.log("\n\nUpdating ParameterManager");
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
    config.nativeWrappedTokenAddress,
    {
      gasLimit: "200000",
    }
  );
  // freeReactionLimit
  await parameterManager.setFreeReactionLimit(config.freeReactionLimit, {
    gasLimit: "200000",
  });
  // reaction price
  await parameterManager.setReactionPrice(config.reactionPrice, {
    gasLimit: "200000",
  });

  //
  // Set NFT contract URI's
  //
  console.log("\n\nSetting NFT contract URI's");
  const ReactionNft1155Contract = await ethers.getContractAt(
    "ReactionNft1155",
    ReactionNft1155.address
  );
  await ReactionNft1155Contract.setContractUri(config.reactionContractUri);
  const CuratorToken1155 = await ethers.getContractAt(
    "CuratorToken1155",
    ct.address
  );
  await CuratorToken1155.setContractUri(config.curatorTokenContractUri);

  //
  // Remove the temporary permissions for the deploy account
  //
  console.log("\n\nRevoking temp permissions for deployer");
  await roleManager.revokeRole(
    await roleManager.ADDRESS_MANAGER_ADMIN(),
    deployer,
    {gasLimit: "200000"}
  );
  console.log("Revoked ADDRESS_MANAGER_ADMIN to " + deployer);
  await roleManager.revokeRole(
    await roleManager.PARAMETER_MANAGER_ADMIN(),
    deployer,
    {gasLimit: "200000"}
  );
  console.log("Revoked PARAMETER_MANAGER_ADMIN to " + deployer);
  await roleManager.revokeRole(
    await roleManager.REACTION_NFT_ADMIN(),
    deployer,
    {gasLimit: "200000"}
  );
  console.log("Revoked REACTION_NFT_ADMIN to " + deployer);
  await roleManager.revokeRole(
    await roleManager.CURATOR_TOKEN_ADMIN(),
    deployer,
    {gasLimit: "200000"}
  );
  console.log("Revoked CURATOR_TOKEN_ADMIN to " + deployer);

  console.log("\n\nDone.");
};

module.exports.tags = ["polygon-upgrade-v1-1"];
