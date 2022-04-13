// load env
require("dotenv").config();
const ethers = require("ethers");
const deployConfig = require("../../../deploy_data/hardhat_contracts.json");
const {getWallet, chainId} = require("../helpers/utils");

// taker params
const takerNftChainId = chainId;
const takerNftAddress = deployConfig[chainId][0].contracts.TestErc721.address;
const takerNftId = "44";

// reaction params
const reactionId =
  "0x341c6ffe3493b3337dcde53c58aec123f85799a68d0dc4d2e46424f90bc3db0d";
const reactionQuantity = 10;
// const ipfsMetadataHash = 0;
const ipfsMetadataHash = "QmV288zHttJJwPBZAW3L922dBypWqukFNWzekT6chxW4Cu";

async function main() {
  const reactor = await getWallet("reactor");
  const referrer = await getWallet("referrer");

  // spendReaction
  // const ReactionVault = new ethers.Contract(
  //   deployConfig[chainId][0].contracts.ReactionVault.address,
  //   deployConfig[chainId][0].contracts.ReactionVault.abi,
  //   reactor
  // );
  const ReactionVault = new ethers.Contract(
    deployConfig[chainId][0].contracts.ReactionVault.address,
    deployConfig[chainId][0].contracts.ReactionVault.abi,
    reactor
  );

  const curatorVaultOverride = ethers.constants.AddressZero;
  console.log("spending reactions...");
  const spendReactionTxn = await ReactionVault.spendReaction(
    takerNftChainId,
    takerNftAddress,
    takerNftId,
    reactionId,
    reactionQuantity,
    referrer.address,
    curatorVaultOverride,
    ipfsMetadataHash
  );
  const receipt = await spendReactionTxn.wait();
  console.log("done. transactionHash:", receipt.transactionHash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
