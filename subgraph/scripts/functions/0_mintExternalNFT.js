// load env
require("dotenv").config();
const ethers = require("ethers");
const deployConfig = require("../../../deploy_data/hardhat_contracts.json");

const chainId = "80001";
const nftId = "4";

async function main() {
  // create provider
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.DATA_TESTING_RPC
  );

  // create wallet & connect provider
  let wallet = new ethers.Wallet(process.env.DATA_TESTING_PRIVATE_KEY);
  wallet = wallet.connect(provider);
  console.log({wallet: wallet.address});

  // create contract
  const NFTContract = new ethers.Contract(
    deployConfig[chainId][0].contracts.TestErc721.address,
    deployConfig[chainId][0].contracts.TestErc721.abi,
    wallet
  );

  // mint
  // {
  //   "inputs": [
  //     {
  //       "internalType": "address",
  //       "name": "to",
  //       "type": "address"
  //     },
  //     {
  //       "internalType": "uint256",
  //       "name": "tokenId",
  //       "type": "uint256"
  //     }
  //   ],
  //   "name": "mint",
  //   "outputs": [],
  //   "stateMutability": "nonpayable",
  //   "type": "function"
  // },
  // const receipt = await NFTContract.mint(wallet.address, nftId);
  // console.log(receipt);

  // check owner
  console.log({
    owner: await NFTContract.ownerOf(nftId),
    id: nftId,
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
