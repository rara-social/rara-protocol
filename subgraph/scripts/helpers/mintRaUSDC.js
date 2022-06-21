const ethers = require("ethers");
require("dotenv").config();

const deployConfig = require("../../../deploy_data/hardhat_contracts.json");
const {getWallet, chainId} = require("../helpers/utils");

const userAddress = "0x64E8B17A8C5C439156584112C66Cf5619C4C6D70";
const amount = 1000;

async function main() {
  const reactor = await getWallet("reactor");

  const TestERC20 = new ethers.Contract(
    deployConfig[chainId][0].contracts.TestErc20.address,
    deployConfig[chainId][0].contracts.TestErc20.abi,
    reactor
  );
  console.log("minting payment token...");
  const mintTxn = await TestERC20.mint(userAddress, amount * 1000000);
  const mintReceipt = await mintTxn.wait();
  console.log(
    "done. transactionHash:",
    mintReceipt.transactionHash,
    "Contract address:",
    TestERC20.address
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
