// load env
require("dotenv").config();
const ethers = require("ethers");
const deployConfig = require("../../../deploy_data/hardhat_contracts.json");

async function main() {
  //
  // setup
  //
  const chainId = "80001"; // mumbai
  const chainRPC = process.env.DATA_TESTING_RPC;
  const deployerPK = process.env.DEPLOY_PRIVATE_KEY;

  //
  // create wallet & connect provider
  //
  const provider = new ethers.providers.JsonRpcProvider(chainRPC);
  let wallet = new ethers.Wallet(deployerPK);
  wallet = wallet.connect(provider);
  console.log({rpc: chainRPC, wallet: wallet.address, chainId});

  //
  // Setup contracts
  //
  const CuratorToken1155 = new ethers.Contract(
    deployConfig[chainId][0].contracts.CuratorToken1155.address,
    deployConfig[chainId][0].contracts.CuratorToken1155.abi,
    wallet
  );

  const ReactionNft1155 = new ethers.Contract(
    deployConfig[chainId][0].contracts.ReactionNft1155.address,
    deployConfig[chainId][0].contracts.ReactionNft1155.abi,
    wallet
  );

  //
  // Check NFT data in storage against graph data
  //
  const balance14488 = await CuratorToken1155.balanceOf(
    "0x135c21b2da426760718e39da954974c4572ae9f6",
    "105703427407224728535077864528728542612524766226609291660572720858423857677490"
  );
  const balance13710224 = await CuratorToken1155.balanceOf(
    "0x135c21b2da426760718e39da954974c4572ae9f6",
    "110609192632653004939274588165931402157041857893931355555650436800723897254755"
  );

  // check params
  const contractUri_curation = await CuratorToken1155.contractUri();
  const contractUri_reaction = await ReactionNft1155.contractUri();

  console.log({
    balance14488: balance14488.toNumber(),
    balance13710224: balance13710224.toNumber(),
    contractUri_reaction,
    contractUri_curation,
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
