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
  // MakerRegistrar.registerNft
  //
  const MakerRegistrar = new ethers.Contract(
    deployConfig[80001][0].contracts.MakerRegistrar.address,
    deployConfig[80001][0].contracts.MakerRegistrar.abi,
    wallet
  );

  const nftContractAddress =
    deployConfig[80001][0].contracts.TestErc721.address;
  const nftId = "2";
  const creatorAddress = ethers.constants.AddressZero;
  const creatorSaleBasisPoints = 0;
  const optionBits = 0;

  const register_recipet = await MakerRegistrar.registerNft(
    nftContractAddress,
    nftId,
    creatorAddress,
    creatorSaleBasisPoints,
    optionBits
  );
  console.log(register_recipet);

  //
  // ReactionVault.withdrawTakerRewards
  //

  // create contract
  const contractAddress =
    deployConfig[80001][0].contracts.ReactionVault.address;
  const contractABI = deployConfig[80001][0].contracts.ReactionVault.abi;
  const ReactionVault = new ethers.Contract(
    contractAddress,
    contractABI,
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

  const takerNftChainId = "80001";
  const takerNftAddress = deployConfig[80001][0].contracts.TestErc721.address;
  const takerNftId = "2";
  const paymentToken = "0x215562e0f8f5ca0576e10c4e983fa52c56f559c8";

  const curatorVault =
    deployConfig[80001][0].contracts.SigmoidCuratorVault.address;
  const curatorTokenId =
    "42163091743077916819896557754904517006036922152631935109602909741936998027115";

  const sharesToBurn = "105";
  const refundToAddress = wallet.address;

  console.log({
    takerNftChainId,
    takerNftAddress,
    takerNftId,
    paymentToken,
    curatorVault,
    curatorTokenId,
    sharesToBurn,
    refundToAddress,
  });

  const recipet = await ReactionVault.withdrawTakerRewards(
    takerNftChainId,
    takerNftAddress,
    takerNftId,
    paymentToken,
    curatorVault,
    curatorTokenId,
    sharesToBurn,
    refundToAddress
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
