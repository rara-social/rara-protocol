// load env
require("dotenv").config();
const ethers = require("ethers");
const deployConfig = require("../../../deploy_data/hardhat_contracts.json");
const {getWallet, chainId} = require("../helpers/utils");

// taker params
// const takerNftChainId = chainId;
// const takerNftAddress = deployConfig[chainId][0].contracts.TestErc721.address;
// const takerNftId = "44";

const takerNftChainId = "80001";
const takerNftAddress = "0x42213590c2bab33d525ebd9c18518e93b64071ec";
const takerNftId = "1";

// reaction params
const transformId =
  "51838769411570288691882770256811373976193339503468138957330766858884189282853";
const optionBits = 1;
const ipfsMetadataHash = "QmUKKf2PMZdAaa4xuc9fByNVnMHERM9J23CjFt3V4ARcWZ";

async function main() {
  const reactor = await getWallet("reactor");
  const referrer = await getWallet("referrer");

  // Check reaction limit
  const ParameterManager = new ethers.Contract(
    deployConfig[chainId][0].contracts.ParameterManager.address,
    deployConfig[chainId][0].contracts.ParameterManager.abi,
    reactor
  );

  const reactionLimit = await ParameterManager.freeReactionLimit();
  console.log({reactionLimit: reactionLimit.toNumber()});

  // use reaction
  const ReactionVault = new ethers.Contract(
    deployConfig[chainId][0].contracts.ReactionVault.address,
    deployConfig[chainId][0].contracts.ReactionVault.abi,
    reactor
  );
  const curatorVaultOverride = ethers.constants.AddressZero;
  console.log("free react...");

  const spendReactionTxn = await ReactionVault.react(
    transformId,
    1,
    referrer.address,
    optionBits,
    takerNftChainId,
    takerNftAddress,
    takerNftId,
    curatorVaultOverride,
    ipfsMetadataHash,
    {
      gasLimit: 1000000,
    }
  );
  const receipt = await spendReactionTxn.wait();
  console.log(receipt);
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
