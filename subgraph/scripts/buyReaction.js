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

  //
  // Get Reaction Price
  //
  const ParameterManager = new ethers.Contract(
    deployConfig[80001][0].contracts.ParameterManager.address,
    deployConfig[80001][0].contracts.ParameterManager.abi,
    wallet
  );

  const reactionPrice = await ParameterManager.reactionPrice();
  // console.log({reactionPrice});

  //
  // Get ERC20
  //
  const TestERC20 = new ethers.Contract(
    deployConfig[80001][0].contracts.TestErc20.address,
    deployConfig[80001][0].contracts.TestErc20.abi,
    wallet
  );

  // {
  //   "inputs": [
  //     {
  //       "internalType": "address",
  //       "name": "to",
  //       "type": "address"
  //     },
  //     {
  //       "internalType": "uint256",
  //       "name": "amount",
  //       "type": "uint256"
  //     }
  //   ],
  //   "name": "mint",
  //   "outputs": [],
  //   "stateMutability": "nonpayable",
  //   "type": "function"
  // },

  // const mintRecipet = await TestERC20.mint(wallet.address, reactionPrice);
  // console.log(mintRecipet);

  // {
  //   "inputs": [
  //     {
  //       "internalType": "address",
  //       "name": "spender",
  //       "type": "address"
  //     },
  //     {
  //       "internalType": "uint256",
  //       "name": "amount",
  //       "type": "uint256"
  //     }
  //   ],
  //   "name": "approve",
  //   "outputs": [
  //     {
  //       "internalType": "bool",
  //       "name": "",
  //       "type": "bool"
  //     }
  //   ],
  //   "stateMutability": "nonpayable",
  //   "type": "function"
  // },

  // const approveRecipet = await TestERC20.approve(
  //   deployConfig[80001][0].contracts.ReactionVault_Proxy.address,
  //   reactionPrice
  // );
  // console.log(approveRecipet);

  const allowance = await TestERC20.allowance(
    wallet.address,
    deployConfig[80001][0].contracts.ReactionVault.address
  );
  // console.log(approveRecipet);
  console.log({reactionPrice, allowance});

  //
  // Buy Reaction
  //

  // {
  //   "inputs": [
  //     {
  //       "internalType": "uint256",
  //       "name": "transformId",
  //       "type": "uint256"
  //     },
  //     {
  //       "internalType": "uint256",
  //       "name": "quantity",
  //       "type": "uint256"
  //     },
  //     {
  //       "internalType": "address",
  //       "name": "destinationWallet",
  //       "type": "address"
  //     },
  //     {
  //       "internalType": "address",
  //       "name": "referrer",
  //       "type": "address"
  //     },
  //     {
  //       "internalType": "uint256",
  //       "name": "optionBits",
  //       "type": "uint256"
  //     }
  //   ],
  //   "name": "buyReaction",
  //   "outputs": [],
  //   "stateMutability": "nonpayable",
  //   "type": "function"
  // },

  // create contract
  const proxyAddress = deployConfig[80001][0].contracts.ReactionVault.address;
  const contractABI = deployConfig[80001][0].contracts.ReactionVault.abi;
  const ReactionVault = new ethers.Contract(proxyAddress, contractABI, wallet);

  // setup inputs
  const transformId =
    "95531200533042885588928647151875210995108781777760617956651355061538950665596";
  const quantity = 1;
  const destinationWallet = wallet.address;
  const referrer = ethers.constants.AddressZero;
  const optionBits = 0;

  console.log({
    transformId,
    quantity,
    destinationWallet,
    referrer,
    optionBits,
  });

  const recipet = await ReactionVault.buyReaction(
    transformId,
    quantity,
    destinationWallet,
    referrer,
    optionBits
  );
  console.log(recipet);

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

//
// Graphquery
//

// TODO - no transform (null?)
// {
//   reactions(first: 5) {
//     id
//     parameterVersion
//     totalSold
//     referrerFeesTotal
//     makerFeesTotal
//     creatorFeesTotal
//     transform {
//       id
//     }
//   }
// }

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
