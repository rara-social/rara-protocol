// load env
require("dotenv").config();
const ethers = require("ethers");
const deployConfig = require("../../../deploy_v2/hardhat_contracts.json");
const {getWallet, chainId} = require("../helpers/utils");

// taker params
const takerNftChainId = chainId;
const takerNftAddress = deployConfig[chainId][0].contracts.TestErc721.address;
const takerNftId = "45";

// reaction params
const transformId =
  "17439504053626652433665070451660905710392213568054283344862170916900764029373";
const optionBits = 1;
const reactionQuantity = 1;
const ipfsMetadataHash = "QmSBE5W5tyz8M7ve4n7Tw3sJgdHqak7k6whsorM7dDKsDL";

async function main() {
  const reactor = await getWallet("reactor");
  const referrer = await getWallet("referrer");

  //
  // Get Reaction Price
  //
  const ParameterManager = new ethers.Contract(
    deployConfig[chainId][0].contracts.ParameterManager.address,
    deployConfig[chainId][0].contracts.ParameterManager.abi,
    reactor
  );
  const reactionPrice = await ParameterManager.reactionPrice();

  //
  // react with value
  //
  const ReactionVault = new ethers.Contract(
    deployConfig[chainId][0].contracts.ReactionVault.address,
    deployConfig[chainId][0].contracts.ReactionVault.abi,
    reactor
  );
  const curatorVaultOverride = ethers.constants.AddressZero;
  console.log("free react...");
  console.log({
    reactionPrice: reactionPrice.toString(),
    reactionQuantity,
    value: reactionPrice.mul(reactionQuantity).toString(),
    reactor: reactor.address,
  });

  const spendReactionTxn = await ReactionVault.react(
    transformId,
    reactionQuantity,
    referrer.address,
    optionBits,
    takerNftChainId,
    takerNftAddress,
    takerNftId,
    curatorVaultOverride,
    ipfsMetadataHash,
    {
      gasLimit: 1000000,
      value: reactionPrice.mul(reactionQuantity),
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
