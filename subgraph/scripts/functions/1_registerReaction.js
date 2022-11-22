// load env
require("dotenv").config();
const ethers = require("ethers");
const deployConfig = require("../../../v2_test_upgrade/hardhat_contracts.json");
const {getWallet, chainId} = require("../helpers/utils");

const nftId = "104";
const nftContractAddress =
  deployConfig[chainId][0].contracts.TestErc721.address;

const creatorSaleBasisPoints = 2500;
const optionBits = 0;
const ipfsMetadataHash = "QmbyKrvQ8m9WTzMqcdFdTdt7Ezq533qAHf4peC47GPXeQw";

async function main() {
  const creator = await getWallet("creator");
  const maker = await getWallet("maker");

  // registerNFT
  const MakerRegistrar = new ethers.Contract(
    deployConfig[chainId][0].contracts.MakerRegistrar.address,
    deployConfig[chainId][0].contracts.MakerRegistrar.abi,
    maker
  );
  const registerNftTxn = await MakerRegistrar.registerNft(
    nftContractAddress,
    nftId,
    creator.address,
    creatorSaleBasisPoints,
    optionBits,
    ipfsMetadataHash
  );
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
