// load env
require("dotenv").config();
const ethers = require("ethers");
const deployConfig = require("../../../v2_test_fresh/hardhat_contracts.json");
const {getWallet, sleep, getTransactionEvent} = require("../helpers/utils");

const chainId = "80001";

async function main() {
  const reactor = await getWallet("reactor");
  const referrer = await getWallet("referrer");

  // check data
  // wallet curatorToken balance
  const CuratorToken1155 = new ethers.Contract(
    deployConfig[chainId][0].contracts.CuratorToken1155.address,
    deployConfig[chainId][0].contracts.CuratorToken1155.abi,
    reactor
  );
  const contractBalance = await CuratorToken1155.balanceOf(
    reactor.address,
    "66954332059455703478329131628727554600048614184431182165646164267454208164847"
  );

  // create contract
  const SigmoidCuratorVault = new ethers.Contract(
    deployConfig[chainId][0].contracts.SigmoidCuratorVault.address,
    deployConfig[chainId][0].contracts.SigmoidCuratorVault.abi,
    reactor
  );

  // curatorVault info
  const nftChainId = chainId;
  const nftAddress = deployConfig[chainId][0].contracts.TestErc721.address;
  const nftId = "46";
  const paymentToken = deployConfig[chainId][0].contracts.TestErc20.address;

  // user input
  const tokensToBurn = 1000;
  const refundToAddress = reactor.address;
  // console.log({
  //   nftChainId,
  //   nftAddress,
  //   nftId,
  //   paymentToken,
  //   tokensToBurn,
  //   refundToAddress,
  // });
  const sellCuratorTokensTxn = await SigmoidCuratorVault.sellCuratorTokens(
    nftChainId,
    nftAddress,
    nftId,
    paymentToken,
    tokensToBurn,
    refundToAddress
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
