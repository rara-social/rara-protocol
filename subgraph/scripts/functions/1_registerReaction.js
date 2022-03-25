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
  const proxyAddress = deployConfig[80001][0].contracts.MakerRegistrar.address;
  const contractABI = deployConfig[80001][0].contracts.MakerRegistrar.abi;
  const MakerRegistrar = new ethers.Contract(proxyAddress, contractABI, wallet);

  // {
  //   "inputs": [
  //     {
  //       "internalType": "address",
  //       "name": "nftContractAddress",
  //       "type": "address"
  //     },
  //     {
  //       "internalType": "uint256",
  //       "name": "nftId",
  //       "type": "uint256"
  //     },
  //     {
  //       "internalType": "address",
  //       "name": "creatorAddress",
  //       "type": "address"
  //     },
  //     {
  //       "internalType": "uint256",
  //       "name": "creatorSaleBasisPoints",
  //       "type": "uint256"
  //     },
  //     {
  //       "internalType": "uint256",
  //       "name": "optionBits",
  //       "type": "uint256"
  //     }
  //   ],
  //   "name": "registerNft",
  //   "outputs": [],
  //   "stateMutability": "nonpayable",
  //   "type": "function"
  // },

  // registerNFT
  const nftContractAddress =
    deployConfig[80001][0].contracts.TestErc721.address;
  const nftId = "1";
  const creatorAddress = ethers.constants.AddressZero;
  const creatorSaleBasisPoints = 0;
  const optionBits = 0;

  console.log({
    nftContractAddress,
    nftId,
    creatorAddress,
    creatorSaleBasisPoints,
    optionBits,
  });

  const receipt = await MakerRegistrar.registerNft(
    nftContractAddress,
    nftId,
    creatorAddress,
    creatorSaleBasisPoints,
    optionBits
  );
  console.log(receipt);

  // check owner
  // console.log(await NFTContract.ownerOf("1"));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// {
//   transforms(first: 5) {
//     id
//     source {
//       id
//     }

//   }
// }
