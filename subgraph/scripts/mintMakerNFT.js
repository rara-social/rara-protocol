// load env
require("dotenv").config();
const ethers = require("ethers");
const deployConfig = require("../../deploy_data/hardhat_contracts.json");

// create provider
const provider = new ethers.providers.JsonRpcProvider(
  process.env.DATA_TESTING_RPC
);

// create wallet & connect provider
let wallet = new ethers.Wallet(process.env.DATA_TESTING_PRIVATE_KEY);
wallet = wallet.connect(provider);

// create contract
const proxyAddress = deployConfig[80001][0].contracts.TestErc721_Proxy.address;
const contractABI = deployConfig[80001][0].contracts.TestErc721.abi;
const NFTContract = new ethers.Contract(proxyAddress, contractABI, wallet);

// create 10
await NFTContract.mint(wallet.address, "1");
await NFTContract.mint(wallet.address, "2");
await NFTContract.mint(wallet.address, "3");
await NFTContract.mint(wallet.address, "4");
await NFTContract.mint(wallet.address, "5");
await NFTContract.mint(wallet.address, "6");
await NFTContract.mint(wallet.address, "7");

console.log(NFTContract.ownerOf("1"));
console.log(NFTContract.ownerOf("2"));
console.log(NFTContract.ownerOf("3"));
console.log(NFTContract.ownerOf("4"));
console.log(NFTContract.ownerOf("5"));
console.log(NFTContract.ownerOf("6"));
console.log(NFTContract.ownerOf("7"));
