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
const nftAddress = "0x7d8d74b44b433ca6f134e43eec1e63b0c43eeafa";
const nftId = "1";

const paymentToken = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
const curatorVaultId =
  "85318877694048722382284364402992064412681665354072922937830819238283916033300";

async function main() {
  const reactor = await getWallet("deployer");

  // wallet curatorToken balance
  const CuratorToken1155 = new ethers.Contract(
    deployConfig[chainId][0].contracts.CuratorToken1155.address,
    deployConfig[chainId][0].contracts.CuratorToken1155.abi,
    reactor
  );

  console.log({
    reactor: reactor.address,
    curatorVaultId,
    token: deployConfig[chainId][0].contracts.CuratorToken1155.address,
  });

  const contractBalance = await CuratorToken1155.balanceOf(
    reactor.address,
    curatorVaultId
  );

  const tokensToBurn = Math.floor(contractBalance * 0.2);
  const refundToAddress = reactor.address;

  console.log({
    contractBalance: contractBalance.toString(),
    tokensToBurn,
  });

  if (tokensToBurn == 0) {
    console.log("no tokens...");
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
