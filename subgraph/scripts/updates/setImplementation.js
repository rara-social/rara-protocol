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
  console.log({rpc: chainRPC, wallet: wallet.address});

  const ProxyAdmin = new ethers.Contract(
    deployConfig[chainId][0].contracts.DefaultProxyAdmin.address,
    deployConfig[chainId][0].contracts.DefaultProxyAdmin.abi,
    wallet
  );

  // upgrade reaction
  const reactionProxy = "0x76dC4217D77B23e0013E4Ba885Ca585f4b7d0866";
  const reactionImp = "0x09EE981c679E30dE96A0BCcD7321Ba714139788f";
  const upgrade1 = await ProxyAdmin.upgrade(reactionProxy, reactionImp);
  const r1 = await upgrade1.wait();
  console.log({r1: r1.transactionHash});

  // update curation
  const curationProxy = "0xa059f2e0e6e5cD9e62E4E2191EE87A1024247b7D";
  const curationImp = "0xc552eb248197bf84798cdf82c97a31772022aa12";
  const upgrade2 = await ProxyAdmin.upgrade(curationProxy, curationImp);
  const r2 = await upgrade2.wait();
  console.log({r2: r2.transactionHash});

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
