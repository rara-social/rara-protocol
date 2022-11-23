import {HardhatRuntimeEnvironment} from "hardhat/types";
import {ethers} from "hardhat";
import {BigNumber} from "ethers";

// const deployConfig = require("../../v2_test_upgrade/hardhat_contracts.json");

// Verify Parameters
// Run: npx hardhat deploy --network mumbai --tags mumbai-upgrade-v1-1-verify
module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const {getNamedAccounts} = hre;
  const {deployer} = await getNamedAccounts();
  console.log("\n\nDeploying with account " + deployer);

  const chainId = "80001"; // mumbai
  const chainRPC = process.env.DATA_TESTING_RPC;
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
    deployConfig[chainId][0].contracts.LikeTokenFactory_Implementation.address
  );
  const baseTokenUri = await LikeToken1155.baseTokenUri();
  console.log({
    name: "LikeToken1155",
    baseTokenUri,
  });

  //
  // CuratorVault
  //
  console.log("\n\nVerifying Curator Params");
  const CuratorVault = await ethers.getContractAt(
    "SigmoidCuratorVault",
    deployConfig[chainId][0].contracts.SigmoidCuratorVault.address
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
    name: "CuratorVault",
    a,
    b,
    c,
    // oneMatic,
  });
};

module.exports.tags = ["mumbai-upgrade-v1-1-verify"];
