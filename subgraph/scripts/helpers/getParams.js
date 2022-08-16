const ethers = require("ethers");
require("dotenv").config();

const deployConfig = require("../../../deploy_data/hardhat_contracts.json");
const {getWallet, chainId} = require("../helpers/utils");

const userAddress = "0x135C21b2DA426760718E39DA954974c4572AE9f6";
const amount = 1000;

async function main() {
  const deployer = await getWallet("deployer");

  const ParameterManager = new ethers.Contract(
    deployConfig[chainId][0].contracts.ParameterManager.address,
    deployConfig[chainId][0].contracts.ParameterManager.abi,
    deployer
  );

  console.log("getting params...");

  // test
  // console.log("updating");
  // await ParameterManager.setSaleReferrerBasisPoints(50);
  // await ParameterManager.setSaleCuratorLiabilityBasisPoints(9500);
  // await ParameterManager.setSpendReferrerBasisPoints(55);
  // await ParameterManager.setSpendTakerBasisPoints(525);
  // const txnReceipt = await ParameterManager.setSaleReferrerBasisPoints(50);
  // const done = await txnReceipt.wait();

  const saleReferrerBasisPoints =
    await ParameterManager.saleReferrerBasisPoints();
  const saleCuratorLiabilityBasisPoints =
    await ParameterManager.saleCuratorLiabilityBasisPoints();
  const spendReferrerBasisPoints =
    await ParameterManager.spendReferrerBasisPoints();
  const spendTakerBasisPoints = await ParameterManager.spendTakerBasisPoints();
  const reactionPrice = await ParameterManager.reactionPrice();
  const paymentToken = await ParameterManager.paymentToken();

  console.log({
    chainId,
    saleReferrerBasisPoints: saleReferrerBasisPoints.toNumber(),
    saleCuratorLiabilityBasisPoints: saleCuratorLiabilityBasisPoints.toNumber(),
    spendReferrerBasisPoints: spendReferrerBasisPoints.toNumber(),
    spendTakerBasisPoints: spendTakerBasisPoints.toNumber(),
    reactionPrice: reactionPrice.toNumber(),
    paymentToken: paymentToken,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// const RoleManager = new ethers.Contract(
//   deployConfig[chainId][0].contracts.RoleManager.address,
//   deployConfig[chainId][0].contracts.RoleManager.abi,
//   deployer
// );

// const roleTXN = await RoleManager.grantRole(
//   await RoleManager.PARAMETER_MANAGER_ADMIN(),
//   deployer.address,
//   {gasLimit: "200000"}
// );
// const roleReceipt = await roleTXN.wait();
// console.log(
//   "Granted PARAMETER_MANAGER_ADMIN to " + deployer.address,
//   roleReceipt.transactionHash
// );

// const admin = await RoleManager.isAdmin(deployer.address);
// const isAddressManagerAdmin = await RoleManager.isAddressManagerAdmin(
//   deployer.address
// );
// const isParameterManagerAdmin = await RoleManager.isParameterManagerAdmin(
//   deployer.address
// );
// const isReactionNftAdmin = await RoleManager.isReactionNftAdmin(
//   deployer.address
// );
// const isCuratorTokenAdmin = await RoleManager.isCuratorTokenAdmin(
//   deployer.address
// );

// console.log({
//   isAdmin: admin,
//   isAddressManagerAdmin,
//   isParameterManagerAdmin: isParameterManagerAdmin,
//   isReactionNftAdmin: isReactionNftAdmin,
//   isCuratorTokenAdmin,
// });
