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

// https://opensea.io/assets/matic/0x5377b7c147074c881c42cf6e7762947cc9130bb3/2
const nftId = "2";
const nftContractAddress = "0x5377b7c147074c881c42cf6e7762947cc9130bb3";
const creatorSaleBasisPoints = 2500;
const creatorAddress = "0x9a09D6EA1D2db80F120082b884d96698d4903467";

const optionBits = 0;
const ipfsMetadataHash = "QmbyKrvQ8m9WTzMqcdFdTdt7Ezq533qAHf4peC47GPXeQw";

async function main() {
  // const creator = await getWallet("creator");
  const maker = await getWallet("mlovan");

  // registerNFT
  const MakerRegistrar = new ethers.Contract(
    deployConfig[chainId][0].contracts.MakerRegistrar.address,
    deployConfig[chainId][0].contracts.MakerRegistrar.abi,
    maker
  );

  console.log("Submitting txn...");
  const registerNftTxn = await MakerRegistrar.registerNft(
    nftContractAddress,
    nftId,
    creatorAddress,
    creatorSaleBasisPoints,
    optionBits,
    ipfsMetadataHash,
    manualGas
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
