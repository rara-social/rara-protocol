// load env
require("dotenv").config();
const ethers = require("ethers");
const deployConfig = require("../../../deploy_data/hardhat_contracts.json");
const {getWallet, chainId} = require("../helpers/utils");

const manualGas = {
  maxFeePerGas: 50000000000,
  maxPriorityFeePerGas: 50000000000,
  gasLimit: 2000000,
};

// taker params
// https://opensea.io/assets/ethereum/0x7d8d74b44b433ca6f134e43eec1e63b0c43eeafa/1
const takerNftChainId = "1";
const takerNftAddress = "0x7d8d74b44b433ca6f134e43eec1e63b0c43eeafa";
const takerNftId = "1";

//
// Reaction params
//
// https://res.cloudinary.com/rara-social/image/upload/v1668803582/production-transform/21222597829815043879131890909130725186067670589628458523536587623117932898228.png
const transformId =
  "51838769411570288691882770256811373976193339503468138957330766858884189282853";
const optionBits = 0;
const ipfsMetadataHash = "QmUKKf2PMZdAaa4xuc9fByNVnMHERM9J23CjFt3V4ARcWZ";

async function main() {
  const reactor = await getWallet("reactor");
  const referrer = await getWallet("referrer");

  // Check reaction limit
  const ParameterManager = new ethers.Contract(
    deployConfig[chainId][0].contracts.ParameterManager.address,
    deployConfig[chainId][0].contracts.ParameterManager.abi,
    reactor
  );
  const reactionLimit = await ParameterManager.freeReactionLimit();
  // console.log({reactionLimit: reactionLimit.toNumber()});

  // use reaction
  const ReactionVault = new ethers.Contract(
    deployConfig[chainId][0].contracts.ReactionVault.address,
    deployConfig[chainId][0].contracts.ReactionVault.abi,
    reactor
  );
  const curatorVaultOverride = ethers.constants.AddressZero;

  console.log("Sending txn...");
  const spendReactionTxn = await ReactionVault.react(
    transformId,
    reactionLimit,
    referrer.address,
    optionBits,
    takerNftChainId,
    takerNftAddress,
    takerNftId,
    curatorVaultOverride,
    ipfsMetadataHash,
    manualGas
  );
  const receipt = await spendReactionTxn.wait();
  console.log(receipt);
  console.log("done. transactionHash:", receipt.transactionHash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
