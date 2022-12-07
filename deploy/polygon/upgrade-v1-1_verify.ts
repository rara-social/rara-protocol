import {HardhatRuntimeEnvironment} from "hardhat/types";
import {ethers} from "hardhat";
import {BigNumber} from "ethers";

const deployConfig = require("../../deploy_data/hardhat_contracts.json");

// Verify Parameters
// Run: npx hardhat deploy --network polygon --tags polygon-upgrade-v1-1-verify
module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const {getNamedAccounts} = hre;
  const {deployer} = await getNamedAccounts();
  console.log("\n\nDeploying with account " + deployer);

  const chainId = "137"; // mumbai
  const chainRPC = process.env.DEPLOY_RPC;
  const deployerPK: any = process.env.DEPLOY_PRIVATE_KEY;

  const provider = new ethers.providers.JsonRpcProvider(chainRPC);
  const signer = new ethers.utils.SigningKey(deployerPK);
  let wallet = new ethers.Wallet(signer);
  wallet = wallet.connect(provider);
  console.log({chainId, rpc: chainRPC, wallet: wallet.address});

  //
  // test addresses
  //
  // get address manager
  console.log("\n\nVerifying Addresses");
  const addressManager = await ethers.getContractAt(
    "AddressManager",
    deployConfig[chainId][0].contracts.AddressManager.address
  );
  const likeFactory = await addressManager.likeTokenFactory();
  const reaction = await addressManager.reactionNftContract();
  const defaultCuratorVault = await addressManager.defaultCuratorVault();
  const paramManager = await addressManager.parameterManager();
  console.log({likeFactory, reaction, defaultCuratorVault, paramManager});

  //
  // check params
  //
  console.log("\n\nVerifying Parameters");
  const parameterManager = await ethers.getContractAt(
    "ParameterManager",
    deployConfig[chainId][0].contracts.ParameterManager.address
  );
  const paymentToken = await parameterManager.paymentToken();
  const nativePaymentToken = await parameterManager.nativeWrappedToken();
  const reactionPrice = await parameterManager.reactionPrice();
  const freeReactionLimit = await parameterManager.freeReactionLimit();
  const onApprovedCuratorVaults = await parameterManager.approvedCuratorVaults(
    deployConfig[chainId][0].contracts.SigmoidCuratorVault.address
  );
  console.log({
    paymentToken,
    nativePaymentToken,
    reactionPrice,
    freeReactionLimit,
    onApprovedCuratorVaults,
  });

  //
  // NFT URI's
  //
  console.log("\n\nVerifying NFT URI's");
  const CuratorToken1155 = await ethers.getContractAt(
    "CuratorToken1155",
    deployConfig[chainId][0].contracts.CuratorToken1155.address
  );
  let URI = await CuratorToken1155.uri(1);
  let contractURI = await CuratorToken1155.contractURI();
  console.log({
    name: "CuratorToken1155",
    URI,
    contractURI,
  });

  const ReactionNft1155 = await ethers.getContractAt(
    "ReactionNft1155",
    deployConfig[chainId][0].contracts.ReactionNft1155.address
  );
  URI = await ReactionNft1155.uri(1);
  contractURI = await ReactionNft1155.contractURI();
  console.log({
    name: "ReactionNft1155",
    URI,
    contractURI,
  });

  const LikeToken1155 = await ethers.getContractAt(
    "LikeTokenFactory",
    deployConfig[chainId][0].contracts.LikeTokenFactory.address
  );
  const baseTokenUri = await LikeToken1155.baseTokenUri();
  console.log({
    name: "LikeTokenFactory",
    baseTokenUri,
  });

  //
  // CuratorVault
  //
  console.log("\n\nVerifying Curator Params");
  const CuratorVault = await ethers.getContractAt(
    "SigmoidCuratorVault2",
    deployConfig[chainId][0].contracts.SigmoidCuratorVault2.address
  );
  const a = await CuratorVault.a();
  const b = await CuratorVault.b();
  const c = await CuratorVault.c();
  // const oneMatic = await CuratorVault.calculateTokensBoughtFromPayment(
  //   a,
  //   b,
  //   c,
  //   0,
  //   0,
  //   "1000000000000000000"
  // );
  console.log({
    name: "SigmoidCuratorVault2",
    a,
    b,
    c,
    // oneMatic,
  });

  //
  // CuratorVault Proxies
  //
  // const DefaultProxyAdmin = new ethers.Contract(
  //   deployConfig[chainId][0].contracts.DefaultProxyAdmin.address,
  //   deployConfig[chainId][0].contracts.DefaultProxyAdmin.abi,
  //   wallet
  // );

  // set old curator vault to old implementation
  // const oldProxy = "0xff63B24Ce497d1e0ea7F45a08bF2C93631B017C1";
  // const oldImplementation = "0x6Ed0B9932529E79204Aaee1E423944ac06b02d03";
  // let txn = await DefaultProxyAdmin.upgrade(oldProxy, oldImplementation);
  // await txn.wait();
  // let implementation = await DefaultProxyAdmin.getProxyImplementation(oldProxy);
  // console.log({
  //   name: "SigmoidCuratorVault",
  //   address: oldProxy,
  //   imp: oldImplementation,
  //   proxy_imp: implementation,
  // });
};

module.exports.tags = ["polygon-upgrade-v1-1-verify"];
