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

  //
  // Get ERC20 payment token
  //
  const TestERC20 = new ethers.Contract(
    deployConfig[chainId][0].contracts.TestErc20.address,
    deployConfig[chainId][0].contracts.TestErc20.abi,
    wallet
  );

  // get balance before withdraw
  const balanceBefore = await TestERC20.balanceOf(wallet.address);

  //
  // ReactionVault.withdrawErc20Rewards
  //
  const ReactionVault = new ethers.Contract(
    deployConfig[chainId][0].contracts.ReactionVault.address,
    deployConfig[chainId][0].contracts.ReactionVault.abi,
    wallet
  );

  // ReactionVault.ownerToRewardsMapping
  // {
  //   "inputs": [
  //     {
  //       "internalType": "contract IERC20Upgradeable",
  //       "name": "",
  //       "type": "address"
  //     },
  //     {
  //       "internalType": "address",
  //       "name": "",
  //       "type": "address"
  //     }
  //   ],
  //   "name": "ownerToRewardsMapping",
  //   "outputs": [
  //     {
  //       "internalType": "uint256",
  //       "name": "",
  //       "type": "uint256"
  //     }
  //   ],
  //   "stateMutability": "view",
  //   "type": "function"
  // },

  const rewards = await ReactionVault.ownerToRewardsMapping(
    deployConfig[chainId][0].contracts.TestErc20.address,
    wallet.address
  );
  // console.log(rewards);

  if (rewards.gt(ethers.constants.Zero)) {
    // ReactionVault.withdrawErc20Rewards
    // {
    //   "inputs": [
    //     {
    //       "internalType": "contract IERC20Upgradeable",
    //       "name": "token",
    //       "type": "address"
    //     }
    //   ],
    //   "name": "withdrawErc20Rewards",
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

    const receipt = await ReactionVault.withdrawErc20Rewards(
      deployConfig[chainId][0].contracts.TestErc20.address
    );
    // console.log(receipt);
  }

  // get balance after withdraw
  const balanceAfter = await TestERC20.balanceOf(wallet.address);

  console.log({balanceBefore, rewards, balanceAfter});
}

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
