const ethers = require("ethers");
require("dotenv").config();

const deployConfig = require("../../../deploy_data/hardhat_contracts.json");
const {getWallet, chainId} = require("../helpers/utils");

const contractAddress = "0x82a505f671b9a8eea3684976e076901c02e32a32";

async function main() {
  const reactor = await getWallet("reactor");

  const TestERC1155 = new ethers.Contract(
    contractAddress,
    deployConfig[chainId][0].contracts.CuratorToken1155.abi,
    reactor
  );

  console.log("get tokenURI...");
  const URI = await TestERC1155.uri(1);
  const contractUri = await TestERC1155.contractURI();

  console.log({URI, contractUri});
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
