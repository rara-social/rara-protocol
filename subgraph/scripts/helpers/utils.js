require("dotenv").config();
const ethers = require("ethers");

const chainId = "1337";

async function getWallet(name) {
  // create provider
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.DATA_TESTING_RPC
  );

  let privateKey = null;
  switch (name) {
    case "creator":
      privateKey = process.env.CREATOR_PRIVATE_KEY;
      break;
    case "maker":
      privateKey = process.env.MAKER_PRIVATE_KEY;
      break;
    case "reactor":
      privateKey = process.env.REACTOR_PRIVATE_KEY;
      break;
    case "referrer":
      privateKey = process.env.REFERRER_PRIVATE_KEY;
      break;
    default:
      break;
  }

  if (!privateKey) {
    throw new Error("no private key found for user:", name);
  }

  // create wallet & connect provider
  let wallet = new ethers.Wallet(privateKey);
  wallet = wallet.connect(provider);
  return wallet;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getTransactionEvent(receipt, contract, event) {
  const topic = contract.interface.getEventTopic(event);
  const log = receipt.logs.find((x) => x.topics.indexOf(topic) >= 0);
  const deployedEvent = contract.interface.parseLog(log);

  // const formatted = {};
  // deployedEvent.args.forEach((item) => {
  //   console.log(item, typeof item);
  // });

  return deployedEvent;
}

exports.chainId = chainId;
exports.getWallet = getWallet;
exports.sleep = sleep;
exports.getTransactionEvent = getTransactionEvent;
