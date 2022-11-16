// load env

const ethers = require("ethers");
const deployConfig = require("../../../v2_test_fresh/hardhat_contracts.json");
const {getWallet, chainId} = require("../helpers/utils");

const nftId = "105";

async function main() {
  // get creator wallet
  const creator = await getWallet("creator");
  const maker = await getWallet("maker");

  // create contract
  const NFTContract = new ethers.Contract(
    deployConfig[chainId][0].contracts.TestErc721.address,
    deployConfig[chainId][0].contracts.TestErc721.abi,
    creator
  );

  // check owner
  const preOwner = await NFTContract.ownerOf(nftId);

  // transfer
  console.log("transferring...");
  const transferFromTxn = await NFTContract.transferFrom(
    creator.address,
    maker.address,
    nftId
  );
  const reciept = await transferFromTxn.wait();
  console.log("transferred...");

  // check owner
  console.log({
    id: nftId,
    creatorWallet: creator.address,
    preOwner: preOwner,
    makerWallet: maker.address,
    postOwner: await NFTContract.ownerOf(nftId),
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
