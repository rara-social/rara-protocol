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

  //
  // MakerRegistrar.registerNft
  //
  const MakerRegistrar = new ethers.Contract(
    deployConfig[chainId][0].contracts.MakerRegistrar.address,
    deployConfig[chainId][0].contracts.MakerRegistrar.abi,
    wallet
  );

  const nftContractAddress =
    deployConfig[chainId][0].contracts.TestErc721.address;
  const nftId = "2";
  const creatorAddress = ethers.constants.AddressZero;
  const creatorSaleBasisPoints = 0;
  const optionBits = 0;

  const register_receipt = await MakerRegistrar.registerNft(
    nftContractAddress,
    nftId,
    creatorAddress,
    creatorSaleBasisPoints,
    optionBits
  );
  console.log(register_receipt);

  //
  // ReactionVault.withdrawTakerRewards
  //

  // create contract
  const ReactionVault = new ethers.Contract(
    deployConfig[chainId][0].contracts.ReactionVault.address,
    deployConfig[chainId][0].contracts.ReactionVault.abi,
    wallet
  );

  // create inputs
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
  //       "internalType": "contract IERC20Upgradeable",
  //       "name": "paymentToken",
  //       "type": "address"
  //     },
  //     {
  //       "internalType": "address",
  //       "name": "curatorVault",
  //       "type": "address"
  //     },
  //     {
  //       "internalType": "uint256",
  //       "name": "curatorTokenId",
  //       "type": "uint256"
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
  //   "name": "withdrawTakerRewards",
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

  const takerNftChainId = chainId;
  const takerNftAddress = deployConfig[chainId][0].contracts.TestErc721.address;
  const takerNftId = "2";
  const paymentToken = "0x215562e0f8f5ca0576e10c4e983fa52c56f559c8";
  const curatorVault =
    deployConfig[chainId][0].contracts.SigmoidCuratorVault.address;
  const curatorTokenId =
    "42163091743077916819896557754904517006036922152631935109602909741936998027115";
  const sharesToBurn = "105";
  const refundToAddress = wallet.address;
  // console.log({
  //   takerNftChainId,
  //   takerNftAddress,
  //   takerNftId,
  //   paymentToken,
  //   curatorVault,
  //   curatorTokenId,
  //   sharesToBurn,
  //   refundToAddress,
  // });

  const receipt = await ReactionVault.withdrawTakerRewards(
    takerNftChainId,
    takerNftAddress,
    takerNftId,
    paymentToken,
    curatorVault,
    curatorTokenId,
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
