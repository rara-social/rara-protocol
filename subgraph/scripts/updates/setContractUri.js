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
  console.log({chainId, rpc: chainRPC, wallet: wallet.address});

  //
  // Grant Admin Role
  //
  const RoleManager = new ethers.Contract(
    deployConfig[chainId][0].contracts.RoleManager.address,
    deployConfig[chainId][0].contracts.RoleManager.abi,
    wallet
  );
  const role = await RoleManager.REACTION_NFT_ADMIN();
  const role2 = await RoleManager.CURATOR_TOKEN_ADMIN();
  await RoleManager.grantRole(role, wallet.address);
  await RoleManager.grantRole(role2, wallet.address);

  //
  // Call set URI function
  //
  const ReactionNft1155 = new ethers.Contract(
    deployConfig[chainId][0].contracts.ReactionNft1155.address,
    deployConfig[chainId][0].contracts.ReactionNft1155.abi,
    wallet
  );
  const reactionTxn = await ReactionNft1155.setContractUri(
    "https://protocol-api-staging.rara.social/internal/contract/reaction",
    {gasLimit: "200000"}
  );
  reactionTxn.wait();
  const contractUri_reaction = await ReactionNft1155.contractUri();
  console.log({contractUri_reaction});

  const CuratorToken1155 = new ethers.Contract(
    deployConfig[chainId][0].contracts.CuratorToken1155.address,
    deployConfig[chainId][0].contracts.CuratorToken1155.abi,
    wallet
  );
  const curatorTxn = await CuratorToken1155.setContractUri(
    "https://protocol-api-staging.rara.social/internal/contract/curatortoken",
    {gasLimit: "200000"}
  );
  await curatorTxn.wait();
  const contractUri_curation = await CuratorToken1155.contractUri();
  console.log({contractUri_curation});

  //
  // remove permissions
  //
  await RoleManager.revokeRole(role, wallet.address);
  console.log("role revoked: REACTION_NFT_ADMIN");
  await RoleManager.revokeRole(role2, wallet.address);
  console.log("role revoked: CURATOR_TOKEN_ADMIN");

  console.log("re-test permissions");
  try {
    const curatorTxn2 = await CuratorToken1155.setContractUri("bad mojo", {
      gasLimit: "200000",
    });
    await curatorTxn2.wait();
    console.log("update succeeded (ie, failure)");
  } catch (error) {
    console.log("update failed (ie, success)");
    // console.log(error);
  }

  console.log("done");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
