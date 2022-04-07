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
  "0x36532001a17f2f79d2f1f592ad3579e405239a273499c48f453fd76817767b66";
const reactionQuantity = 10;
const ipfsMetadataHash = "QmbQ25Dorr6SyegJQfUhx9GyxP7chKUFEbpnQKs61d1wQi";

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
