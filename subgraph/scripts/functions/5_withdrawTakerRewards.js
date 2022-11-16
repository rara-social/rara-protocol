// load env
require("dotenv").config();
const ethers = require("ethers");
const deployConfig = require("../../../v2_test_fresh/hardhat_contracts.json");
const {getWallet, sleep, getTransactionEvent} = require("../helpers/utils");

const chainId = "80001";

async function main() {
  const creator = await getWallet("creator");

  // setup curator vault
  const takerNftChainId = chainId;
  const takerNftAddress = deployConfig[chainId][0].contracts.TestErc721.address;
  const takerNftId = "15";
  const paymentToken = deployConfig[chainId][0].contracts.TestErc20.address;
  const curatorVault =
    deployConfig[chainId][0].contracts.SigmoidCuratorVault.address;
  const curatorTokenId =
    "41270118657600183315736307945898820710535619845004420983575306950395984883859";

  //
  // check registration
  //
  const MakerRegistrar = new ethers.Contract(
    deployConfig[chainId][0].contracts.MakerRegistrar.address,
    deployConfig[chainId][0].contracts.MakerRegistrar.abi,
    creator
  );
  const sourceId = deriveSourceId(takerNftChainId, takerNftAddress, takerNftId);
  const {registered} = await MakerRegistrar.sourceToDetailsLookup(sourceId);
  if (!registered) {
    throw new Error(
      "taker nft not registered. " +
        JSON.stringify({
          takerNftChainId,
          takerNftAddress,
          takerNftId,
        })
    );
  }

  //
  // ReactionVault.withdrawTakerRewards()
  //
  const ReactionVault = new ethers.Contract(
    deployConfig[chainId][0].contracts.ReactionVault.address,
    deployConfig[chainId][0].contracts.ReactionVault.abi,
    creator
  );

  // user input
  const tokensToBurn = "100";
  const refundToAddress = creator.address;

  // check rewards balance
  const takerRewardsKey = deriveTakerRewardsKey(
    takerNftChainId,
    takerNftAddress,
    takerNftId,
    curatorVault,
    curatorTokenId
  );

  const rewardsStart = await ReactionVault.nftOwnerRewards(takerRewardsKey);
  if (rewardsStart < tokensToBurn) {
    throw new Error(
      "rewards < tokensToBurn " +
        JSON.stringify({
          rewardsStart: rewardsStart.toNumber(),
          tokensToBurn: tokensToBurn,
        })
    );
  }

  // withdraw
  const withdrawTakerRewardsTxn = await ReactionVault.withdrawTakerRewards(
    takerNftChainId,
    takerNftAddress,
    takerNftId,
    paymentToken,
    curatorVault,
    curatorTokenId,
    tokensToBurn,
    refundToAddress
  );
  const receipt = await withdrawTakerRewardsTxn.wait();
  console.log("done. transactionHash:", receipt.transactionHash);

  const rewardsLeft = await ReactionVault.nftOwnerRewards(takerRewardsKey);
  console.log({
    rewardsStart: rewardsStart.toNumber(),
    tokensToBurn: tokensToBurn,
    rewardsEnd: rewardsLeft.toNumber(),
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

function deriveTakerRewardsKey(
  takerNftChainId,
  takerNftAddress,
  takerNftId,
  curatorVaultAddress,
  curatorTokenId
) {
  const encodedParams = ethers.utils.defaultAbiCoder.encode(
    ["uint256", "address", "uint256", "address", "uint256"],
    [
      takerNftChainId,
      takerNftAddress,
      takerNftId,
      curatorVaultAddress,
      curatorTokenId,
    ]
  );
  return ethers.utils.keccak256(encodedParams);
}

const deriveSourceId = (takerNftChainId, takerNftAddress, takerNftId) => {
  // Encode the params and hash it to get the meta URI
  const encodedParams = ethers.utils.defaultAbiCoder.encode(
    ["uint256", "address", "uint256"],
    [takerNftChainId, takerNftAddress, takerNftId]
  );
  return ethers.utils.keccak256(encodedParams);
};
