// load env
require("dotenv").config();
const ethers = require("ethers");
const deployConfig = require("../../../deploy_data/hardhat_contracts.json");
const {
  getWallet,
  sleep,
  getTransactionEvent,
  chainId,
} = require("../helpers/utils");

const manualGas = {
  maxFeePerGas: 50000000000,
  maxPriorityFeePerGas: 50000000000,
  gasLimit: 2000000,
};

// curatorVault
const nftChainId = "1";
const nftAddress = "0xb6dae651468e9593e4581705a09c10a76ac1e0c8";
const nftId = "807";
const paymentToken = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
const curatorVaultId =
  "4270157708040711469678672722928712530658549804711490147430589639681293015675";

async function main() {
  const reactor = await getWallet("mlovan");
  const refundToAddress = reactor.address;

  console.log(reactor);

  // wallet curatorToken balance
  const CuratorToken1155 = new ethers.Contract(
    deployConfig[chainId][0].contracts.CuratorToken1155.address,
    deployConfig[chainId][0].contracts.CuratorToken1155.abi,
    reactor
  );
  const contractBalance = await CuratorToken1155.balanceOf(
    reactor.address,
    curatorVaultId
  );
  const tokensToBurn = Math.floor(contractBalance * 0.2);
  console.log({
    contractBalance: contractBalance.toString(),
    tokensToBurn,
  });

  if (tokensToBurn == 0) {
    return;
  }

  console.log("Selling curator shares: " + tokensToBurn);
  const SigmoidCuratorVault = new ethers.Contract(
    deployConfig[chainId][0].contracts.SigmoidCuratorVault.address,
    deployConfig[chainId][0].contracts.SigmoidCuratorVault.abi,
    reactor
  );
  const sellCuratorTokensTxn = await SigmoidCuratorVault.sellCuratorTokens(
    nftChainId,
    nftAddress,
    nftId,
    paymentToken,
    tokensToBurn,
    refundToAddress,
    manualGas
  );
  const receipt = await sellCuratorTokensTxn.wait();

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
