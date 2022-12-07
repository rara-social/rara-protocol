import * as dotenv from "dotenv";

import {HardhatUserConfig, task} from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
// import 'hardhat-gas-reporter';
import "solidity-coverage";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-contract-sizer";
import "hardhat-deploy";
import "@nomiclabs/hardhat-etherscan";

const NULL_PK =
  "0000000000000000000000000000000000000000000000000000000000000000"; // dummy private key

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100,
      },
    },
  },
  // gasReporter: {
  //   currency: 'USD',
  //   coinmarketcap:
  //     process.env.COINMARKETCAP || 'e27b406d-691c-49cd-9e63-c40befea0f69'
  // },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [
        process.env.DEPLOY_PRIVATE_KEY || NULL_PK, // Env should set private key used for deploy
      ],
    },
    goerli: {
      url: process.env.INFURA_RPC_GOERLI || "", // Get infura endpoint from free acct
      accounts: [
        process.env.DEPLOY_PRIVATE_KEY || NULL_PK, // Env should set private key used for deploy
      ],
    },
    mainnet: {
      url: process.env.INFURA_RPC_MAINNET || "", // Get infura endpoint from free acct
      accounts: [
        process.env.DEPLOY_PRIVATE_KEY || NULL_PK, // Env should set private key used for deploy
      ],
    },
    polygon: {
      url: process.env.INFURA_RPC_POLYGON || "", // Get infura endpoint from free acct
      accounts: [
        process.env.DEPLOY_PRIVATE_KEY || NULL_PK, // Env should set private key used for deploy
      ],
      gasPrice: 52000000000,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY, // Get key on etherscan/polygonscan with free account
  },
  namedAccounts: {
    // For deployment scripts under /deploy
    deployer: {
      default: 0, // take the first account as default from the network config
      // This account will deploy contracts and be set as protocol admin and also admin for all proxies
    },
  },
  mocha: {
    timeout: 400000,
  },
};

export default config;
