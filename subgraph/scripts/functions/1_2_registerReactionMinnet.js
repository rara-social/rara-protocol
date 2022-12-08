// load env
require("dotenv").config();
const ethers = require("ethers");
const deployConfig = require("../../../deploy_data/hardhat_contracts.json");
const {getWallet, chainId} = require("../helpers/utils");

// const manualGas = {
//   maxFeePerGas: 50000000000,
//   maxPriorityFeePerGas: 50000000000,
//   gasLimit: 2000000,
// };

// https://opensea.io/assets/ethereum/0x7d8d74b44b433ca6f134e43eec1e63b0c43eeafa/1
const nftId = "1";
const nftContractAddress = "0x7d8d74b44b433ca6f134e43eec1e63b0c43eeafa";
const creatorSaleBasisPoints = 2500;
const creatorAddress = "0x9a09D6EA1D2db80F120082b884d96698d4903467";

const optionBits = 0;
const ipfsMetadataHash = "QmbyKrvQ8m9WTzMqcdFdTdt7Ezq533qAHf4peC47GPXeQw";

async function main() {
  // const creator = await getWallet("creator");
  const maker = await getWallet("mlovan");

  // registerNFT
  const RootRegistrar = new ethers.Contract(
    deployConfig[chainId][0].contracts.RootRegistrar.address,
    deployConfig[chainId][0].contracts.RootRegistrar.abi,
    maker
  );

  console.log("Submitting txn...");
  const registerNftTxn = await RootRegistrar.registerNft(
    nftContractAddress,
    nftId,
    creatorAddress,
    creatorSaleBasisPoints,
    optionBits,
    ipfsMetadataHash
  );

  // Receipt
  console.log("Waiting...");
  const receipt = await registerNftTxn.wait();
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
