// load env
require("dotenv").config();
const ethers = require("ethers");
const deployConfig = require("../../../v2_test_upgrade/hardhat_contracts.json");
const {getWallet, chainId} = require("../helpers/utils");

// taker params
const takerNftChainId = chainId;
const takerNftAddress = deployConfig[chainId][0].contracts.TestErc721.address;
const takerNftId = "44";

// reaction params
const transformId =
  "82422974008605986100164926026435778462042571413439638208706175089232148510666";
const optionBits = 1;
const ipfsMetadataHash = "QmSBE5W5tyz8M7ve4n7Tw3sJgdHqak7k6whsorM7dDKsDL";

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
