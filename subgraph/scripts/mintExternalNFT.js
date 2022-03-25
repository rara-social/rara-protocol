// load env
require("dotenv").config();
const ethers = require("ethers");
const deployConfig = require("../../deploy_data/hardhat_contracts.json");

async function main() {
  // create provider
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.DATA_TESTING_RPC
  );

  // create wallet & connect provider
  let wallet = new ethers.Wallet(process.env.DATA_TESTING_PRIVATE_KEY);
  wallet = wallet.connect(provider);

  // create contract
  const proxyAddress = deployConfig[80001][0].contracts.TestErc721.address;
  const contractABI = deployConfig[80001][0].contracts.TestErc721.abi;
  const NFTContract = new ethers.Contract(proxyAddress, contractABI, wallet);

  // create
  //   const recipet = await NFTContract.mint(wallet.address, "2");
  //   console.log(recipet);

  console.log(await NFTContract.ownerOf("2"));

  console.log();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
