// load env
require("dotenv").config();
const ethers = require("ethers");
const deployConfig = require("../../../deploy_v2/hardhat_contracts.json");
const {getWallet, chainId} = require("../helpers/utils");

const quantity = 50;
const transformId =
  "17439504053626652433665070451660905710392213568054283344862170916900764029373";
const optionBits = 1;

async function main() {
  // get creator wallet
  const reactor = await getWallet("reactor");
  const referrer = await getWallet("referrer");

  //
  // Get Reaction Price
  //
  const ParameterManager = new ethers.Contract(
    deployConfig[chainId][0].contracts.ParameterManager.address,
    deployConfig[chainId][0].contracts.ParameterManager.abi,
    reactor
  );
  const reactionPrice = await ParameterManager.reactionPrice(); // buy 100
  const purchasePrice = reactionPrice.mul(quantity);
  // console.log({reactionPrice});

  //
  // Get ERC20 Contract
  // - mint ERC20 funds & wait
  const TestERC20 = new ethers.Contract(
    deployConfig[chainId][0].contracts.TestErc20.address,
    deployConfig[chainId][0].contracts.TestErc20.abi,
    reactor
  );
  console.log("minting payment token...");
  const mintTxn = await TestERC20.mint(reactor.address, purchasePrice);
  const mintReceipt = await mintTxn.wait();
  // - approve allowance & wait
  console.log("approving payment token...");
  const approveTxn = await TestERC20.approve(
    deployConfig[chainId][0].contracts.ReactionVault.address,
    purchasePrice
  );
  const approveReceipt = await approveTxn.wait();

  // check balances
  console.log("getting payment token balances...");
  const balance = await TestERC20.balanceOf(reactor.address);
  const allowance = await TestERC20.allowance(
    reactor.address,
    deployConfig[chainId][0].contracts.ReactionVault.address
  );
  console.log({
    balance: balance.toNumber(),
    purchasePrice: purchasePrice.toNumber(),
    allowance: allowance.toNumber(),
  });

  //
  // Buy Reaction
  //
  const ReactionVault = new ethers.Contract(
    deployConfig[chainId][0].contracts.ReactionVault.address,
    deployConfig[chainId][0].contracts.ReactionVault.abi,
    reactor
  );

  // purchase info

  console.log("buying reaction...");
  const txn = await ReactionVault.buyReaction(
    transformId,
    quantity,
    reactor.address,
    referrer.address,
    optionBits
  );
  const receipt = await txn.wait();
  console.log("done. transactionHash:", receipt.transactionHash);

  // const eventData = getTransactionEvent(
  //   receipt,
  //   ReactionVault,
  //   "ReactionsPurchased"
  // );
  // console.log(eventData);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.buyReaction = main;
