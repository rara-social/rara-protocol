// load env
require("dotenv").config();
const ethers = require("ethers");
const deployConfig = require("../../deploy_data/hardhat_contracts.json");

const chainId = "1337";

async function main() {
  // create provider
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.DATA_TESTING_RPC
  );

  // create wallet & connect provider
  let wallet = new ethers.Wallet(process.env.DATA_TESTING_PRIVATE_KEY);
  wallet = wallet.connect(provider);

  // create contract
  const SigmoidCuratorVault = new ethers.Contract(
    deployConfig[chainId][0].contracts.SigmoidCuratorVault.address,
    deployConfig[chainId][0].contracts.SigmoidCuratorVault.abi,
    wallet
  );

  // setup inputs
  // {
  //   "inputs": [
  //     {
  //       "internalType": "uint256",
  //       "name": "nftChainId",
  //       "type": "uint256"
  //     },
  //     {
  //       "internalType": "address",
  //       "name": "nftAddress",
  //       "type": "address"
  //     },
  //     {
  //       "internalType": "uint256",
  //       "name": "nftId",
  //       "type": "uint256"
  //     },
  //     {
  //       "internalType": "contract IERC20Upgradeable",
  //       "name": "paymentToken",
  //       "type": "address"
  //     },
  //     {
  //       "internalType": "uint256",
  //       "name": "sharesToBurn",
  //       "type": "uint256"
  //     },
  //     {
  //       "internalType": "address",
  //       "name": "refundToAddress",
  //       "type": "address"
  //     }
  //   ],
  //   "name": "sellCuratorShares",
  //   "outputs": [
  //     {
  //       "internalType": "uint256",
  //       "name": "",
  //       "type": "uint256"
  //     }
  //   ],
  //   "stateMutability": "nonpayable",
  //   "type": "function"
  // },

  const nftChainId = "chainId";
  const nftAddress = deployConfig[chainId][0].contracts.TestErc721.address;
  const nftId = "2";
  const paymentToken = "0x215562e0f8f5ca0576e10c4e983fa52c56f559c8";
  const sharesToBurn = "1400";
  const refundToAddress = wallet.address;
  // console.log({
  //   nftChainId,
  //   nftAddress,
  //   nftId,
  //   paymentToken,
  //   sharesToBurn,
  //   refundToAddress,
  // });

  const receipt = await SigmoidCuratorVault.sellCuratorShares(
    nftChainId,
    nftAddress,
    nftId,
    paymentToken,
    sharesToBurn,
    refundToAddress
  );
  console.log(receipt);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

//
// Graphquery
//

// TODO - only one created, the taker (id collision?) user spends shows 1400, taker Userposition shows 1505
// {
//   userPositions(first: 5) {
//      id
//     user {
//       id
//     }
//     isTakerPostion
//     curatorVaultToken {
//       id
//     }
//     sharesTotal
//     sharesAvailable
//     refundsTotal
//   }
// }

// reduced to 105
// {
//   curatorVaultTokens(first: 5) {
//    id
//     curatorVaultAddress
//     curatorTokenId
//     nftChainId
//     nftContractAddress
//     nftId
//     paymentToken
//     sharesOutstanding
//     currentBalance
//     sharesTotal
//     depositsTotal
//   }
// }
