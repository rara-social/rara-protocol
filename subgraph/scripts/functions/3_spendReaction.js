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
  "56820534594088484793016473710069920552601759317788946470797647824142104550660";
const reactionQuantity = 10;
const ipfsMetadataHash = "QmSBE5W5tyz8M7ve4n7Tw3sJgdHqak7k6whsorM7dDKsDL";

async function main() {
  const reactor = await getWallet("reactor");
  const referrer = await getWallet("referrer");

  const ReactionVault = new ethers.Contract(
    deployConfig[chainId][0].contracts.ReactionVault.address,
    deployConfig[chainId][0].contracts.ReactionVault.abi,
    reactor
  );

  const ReactionNft1155 = new ethers.Contract(
    deployConfig[chainId][0].contracts.ReactionNft1155.address,
    deployConfig[chainId][0].contracts.ReactionNft1155.abi,
    reactor
  );
  const tokenBalance = await ReactionNft1155.balanceOf(
    reactor.address,
    reactionId
  );
  console.log({tokenBalance: tokenBalance.toNumber(), reactionQuantity});

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
    ipfsMetadataHash,
    {
      gasLimit: 1000000,
    }
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
