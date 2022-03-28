// load env
require("dotenv").config();
const ethers = require("ethers");
const deployConfig = require("../../../deploy_data/hardhat_contracts.json");

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
  const ReactionVault = new ethers.Contract(
    deployConfig[chainId][0].contracts.ReactionVault.address,
    deployConfig[chainId][0].contracts.ReactionVault.abi,
    wallet
  );

  // spendReaction
  // {
  //   "inputs": [
  //     {
  //       "internalType": "uint256",
  //       "name": "takerNftChainId",
  //       "type": "uint256"
  //     },
  //     {
  //       "internalType": "address",
  //       "name": "takerNftAddress",
  //       "type": "address"
  //     },
  //     {
  //       "internalType": "uint256",
  //       "name": "takerNftId",
  //       "type": "uint256"
  //     },
  //     {
  //       "internalType": "uint256",
  //       "name": "reactionId",
  //       "type": "uint256"
  //     },
  //     {
  //       "internalType": "uint256",
  //       "name": "reactionQuantity",
  //       "type": "uint256"
  //     },
  //     {
  //       "internalType": "address",
  //       "name": "referrer",
  //       "type": "address"
  //     },
  //     {
  //       "internalType": "address",
  //       "name": "curatorVaultOverride",
  //       "type": "address"
  //     },
  //     {
  //       "internalType": "uint256",
  //       "name": "ipfsMetadataHash",
  //       "type": "uint256"
  //     }
  //   ],
  //   "name": "spendReaction",
  //   "outputs": [],
  //   "stateMutability": "nonpayable",
  //   "type": "function"
  // },

  const takerNftChainId = "chainId";
  const takerNftAddress = deployConfig[chainId][0].contracts.TestErc721.address;
  const takerNftId = "2";
  const reactionId =
    "0x3fc28b8fc4f55f93b527d8b4deb1d33c9673eee30bed6a224e4675826d62bd1d";
  const reactionQuantity = 1;
  const referrer = ethers.constants.AddressZero;
  const curatorVaultOverride = ethers.constants.AddressZero;
  const ipfsMetadataHash = ethers.constants.MaxInt256;

  console.log({
    takerNftChainId,
    takerNftAddress,
    takerNftId,
    reactionId,
    reactionQuantity,
    referrer,
    curatorVaultOverride,
    ipfsMetadataHash,
  });

  const receipt = await ReactionVault.spendReaction(
    takerNftChainId,
    takerNftAddress,
    takerNftId,
    reactionId,
    reactionQuantity,
    referrer,
    curatorVaultOverride,
    ipfsMetadataHash
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
// {
//   userReactions(first: 5) {
//     id
//     user {
//       id
//     }
//     reaction {
//       id
//     }
//     quantityPurchased
//     quantityAvailable
//   }
// }

// TODO - CuratorVault null
// {
//   userSpends(first: 5) {
//      id
//     user {
//       id
//     }
//     reaction {
//       id
//     }
//     quantity
//     ipfsMetadataHash
//     curatorVault {
//       id
//     }
//     tokensPurchased
//   }
// }

// TODO - No UserPositions
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
//     tokensTotal
//     tokensAvailable
//     refundsTotal
//   }
// }

// TODO - No curator vault tokens
// {
//   curatorVaultTokens(first: 5) {
//    id
//     curatorVaultAddress
//     curatorTokenId
//     nftChainId
//     nftContractAddress
//     nftId
//     paymentToken
//     tokensOutstanding
//     currentBalance
//     tokensTotal
//     depositsTotal
//   }
// }
