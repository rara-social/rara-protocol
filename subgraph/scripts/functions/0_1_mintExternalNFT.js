// load env

const ethers = require("ethers");
const deployConfig = require("../../../v2_test_fresh/hardhat_contracts.json");
const {getWallet, chainId} = require("../helpers/utils");
const nftId = "105";

// wallet, chainId, nftId
async function main() {
  // get creator wallet
  const creator = await getWallet("creator");
  console.log({wallet: creator.address});

  // create contract
  const NFTContract = new ethers.Contract(
    deployConfig[chainId][0].contracts.TestErc721.address,
    deployConfig[chainId][0].contracts.TestErc721.abi,
    creator
  );

  // mint
  console.log("minting...");
  const mintTxn = await NFTContract.mint(creator.address, nftId);
  const receipt = await mintTxn.wait();

  // check owner
  console.log("checking...");
  console.log({
    owner: await NFTContract.ownerOf(nftId),
    id: nftId,
  });

  console.log("done. txn", receipt.transactionHash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
