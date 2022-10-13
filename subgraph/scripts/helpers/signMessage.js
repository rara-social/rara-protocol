const ethers = require("ethers");
require("dotenv").config();

const deployConfig = require("../../../deploy_data/hardhat_contracts.json");
const {getWallet, chainId} = require("../helpers/utils");

const userAddress = "0x64E8B17A8C5C439156584112C66Cf5619C4C6D70";
const amount = 1000;

async function main() {
  const signer = await getWallet("signer");

  const address = "0x2665aa3846ec61e6d28a0d9f76b70047719f3664";
  const tagName = "RARA Root Registrar";
  const date = new Date();
  const time = date.now();
  const message = `Etherscan.io 21/09/2022 11:57:14 I am the owner/creator of the address ${address} and it is to be tagged as ${tagName}.`;

  let flatSig = await wallet.signMessage(message);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
