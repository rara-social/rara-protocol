// load env
require("dotenv").config();
const ethers = require("ethers");
const deployConfig = require("../../../deploy_data/hardhat_contracts.json");

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
  const RoleManager = new ethers.Contract(
    deployConfig[chainId][0].contracts.RoleManager.address,
    deployConfig[chainId][0].contracts.RoleManager.abi,
    wallet
  );
  const role = await RoleManager.PARAMETER_MANAGER_ADMIN();
  await RoleManager.grantRole(role, wallet.address);
  console.log("role set");

  //
  // Set Parameters
  //
  const ParameterManager = new ethers.Contract(
    deployConfig[chainId][0].contracts.ParameterManager.address,
    deployConfig[chainId][0].contracts.ParameterManager.abi,
    wallet
  );

  // update params
  await ParameterManager.setSaleReferrerBasisPoints(50); //50
  await ParameterManager.setSaleCuratorLiabilityBasisPoints(9500); //9500
  await ParameterManager.setSpendReferrerBasisPoints(55); //55
  await ParameterManager.setSpendTakerBasisPoints(525); //525

  const reactionPrice = await ParameterManager.reactionPrice();
  const saleCuratorLiabilityBasisPoints =
    await ParameterManager.saleCuratorLiabilityBasisPoints();
  const saleReferrerBasisPoints =
    await ParameterManager.saleReferrerBasisPoints();
  const spendTakerBasisPoints = await ParameterManager.spendTakerBasisPoints();
  const spendReferrerBasisPoints =
    await ParameterManager.spendReferrerBasisPoints();

  // check owner
  console.log({
    reactionPrice: reactionPrice.toNumber(),
    saleCuratorLiabilityBasisPoints: saleCuratorLiabilityBasisPoints.toNumber(),
    saleReferrerBasisPoints: saleReferrerBasisPoints.toNumber(),
    spendTakerBasisPoints: spendTakerBasisPoints.toNumber(),
    spendReferrerBasisPoints: spendReferrerBasisPoints.toNumber(),
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
