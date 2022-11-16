// load env
require("dotenv").config();
const ethers = require("ethers");
const deployConfig = require("../../../deploy_v2/hardhat_contracts.json");

const chainId = "80001";

async function main() {
  // create provider
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.DATA_TESTING_RPC
  );

  // create wallet & connect provider
  let wallet = new ethers.Wallet(process.env.DEPLOY_PRIVATE_KEY);
  wallet = wallet.connect(provider);
  console.log({wallet: wallet.address});

  //
  // Grant Role
  //
  // const RoleManager = new ethers.Contract(
  //   deployConfig[chainId][0].contracts.RoleManager.address,
  //   deployConfig[chainId][0].contracts.RoleManager.abi,
  //   wallet
  // );
  // const role = await RoleManager.PARAMETER_MANAGER_ADMIN();
  // await RoleManager.grantRole(role, wallet.address);
  // console.log("role set");

  //
  // Set Parameters
  //
  const ParameterManager = new ethers.Contract(
    deployConfig[chainId][0].contracts.ParameterManager.address,
    deployConfig[chainId][0].contracts.ParameterManager.abi,
    wallet
  );

  // // update params
  let reactionPrice = await ParameterManager.reactionPrice();
  // let paymentToken = await ParameterManager.paymentToken();
  // let nativeWrappedToken = await ParameterManager.nativeWrappedToken();
  // const freeReactionLimit = await ParameterManager.freeReactionLimit();

  // // check owner
  // console.log({
  //   reactionPrice: reactionPrice.toNumber(),
  //   paymentToken,
  //   nativeWrappedToken,
  //   freeReactionLimit: freeReactionLimit.toNumber(),
  // });

  // const tx = await ParameterManager.setNativeWrappedToken(
  //   "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"
  // );
  // await tx.wait();

  // const tx2 = await ParameterManager.setPaymentToken(
  //   "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"
  // );
  // await tx2.wait();

  const newPrice = ethers.utils.parseEther("1.0");
  const tx3 = await ParameterManager.setReactionPrice(newPrice);
  await tx3.wait();

  // nativeWrappedToken = await ParameterManager.nativeWrappedToken();
  // paymentToken = await ParameterManager.paymentToken();
  reactionPrice = await ParameterManager.reactionPrice();
  console.log({
    reactionPrice: reactionPrice.toString(),
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
