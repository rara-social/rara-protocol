import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from 'hardhat/config';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
// import 'hardhat-gas-reporter';
import 'solidity-coverage';
import '@openzeppelin/hardhat-upgrades';
import 'hardhat-contract-sizer';
import 'hardhat-deploy';

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

//
// Select the network you want to deploy to here:
//
// const defaultNetwork = "localhost";
// const defaultNetwork = "rinkeby";
// const defaultNetwork = 'mainnet';

const config: HardhatUserConfig = {
  solidity: '0.8.9',
  // defaultNetwork,
  // gasReporter: {
  //   currency: 'USD',
  //   coinmarketcap:
  //     process.env.COINMARKETCAP || 'e27b406d-691c-49cd-9e63-c40befea0f69'
  // },
  networks: {
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  // namedAccounts: {
  //   deployer: {
  //     default: 0, // take the first account as default
  //     rinkeby: "0x33bd8eec0288e7a87d9ba622a968897c67b0a9eb",
  //     mainnet: "0xa2FbaC36Bd5762585b8245b8A5a2CeE0F09A6Df7",
  //   },
  //   pauser: {
  //     default: 1,
  //     rinkeby: "0xffc1f3a276b5f71b0466733f937d3239a755eaaf",
  //     mainnet: "0xa2FbaC36Bd5762585b8245b8A5a2CeE0F09A6Df7",
  //   },
  //   updater: {
  //     default: 2,
  //     rinkeby: "0xb751906298028c00f35de3a2181d9a3ab4ad0c50",
  //     mainnet: "0xb751906298028c00f35de3a2181d9a3ab4ad0c50",
  //   },
  // },
};

export default config;
