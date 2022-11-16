// load env
require("dotenv").config();
const ethers = require("ethers");
const deployConfig = require("../../../v2_test_fresh/hardhat_contracts.json");
const {getWallet, sleep, getTransactionEvent} = require("../helpers/utils");

const chainId = "80001";

async function main() {
  const creator = await getWallet("creator");
  //
  // get balance before withdraw
  //
  const TestERC20 = new ethers.Contract(
    deployConfig[chainId][0].contracts.TestErc20.address,
    deployConfig[chainId][0].contracts.TestErc20.abi,
    creator
  );
  const balanceBefore = await TestERC20.balanceOf(creator.address);

  //
  // ReactionVault.withdrawErc20Rewards
  //
  const ReactionVault = new ethers.Contract(
    deployConfig[chainId][0].contracts.ReactionVault.address,
    deployConfig[chainId][0].contracts.ReactionVault.abi,
    creator
  );
  const rewards = await ReactionVault.ownerToRewardsMapping(
    deployConfig[chainId][0].contracts.TestErc20.address,
    creator.address
  );
  // console.log(rewards);

  if (rewards.gt(ethers.constants.Zero)) {
    // withdraw
    const withdrawErc20RewardsTxn = await ReactionVault.withdrawErc20Rewards(
      deployConfig[chainId][0].contracts.TestErc20.address
    );
    const receipt = await withdrawErc20RewardsTxn.wait();
    console.log("done. transactionHash:", receipt.transactionHash);
  }

  // get balance after withdraw
  const balanceAfter = await TestERC20.balanceOf(creator.address);
  console.log({
    balanceBefore: balanceBefore.toNumber(),
    rewards: rewards.toNumber(),
    balanceAfter: balanceAfter.toNumber(),
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
