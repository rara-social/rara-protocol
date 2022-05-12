const ethers = require("ethers");

// get public key from a private key (***dont commit the private key***)
const privateKey = "";
async function main() {
  const wallet = new ethers.Wallet(privateKey);
  console.log("address:", wallet.address);
  // console.log("mnemonic:", wallet.mnemonic.phrase);
  // console.log("privateKey:", wallet.privateKey);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
