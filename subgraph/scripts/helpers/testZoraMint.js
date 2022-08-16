const ethers = require("ethers");
require("dotenv").config();

const {Zora, constructBidShares, constructMediaData} = require("@zoralabs/zdk");

const mediaUri = "ipfs://QmPL2kaQcTvyjSxxVZVFoiakRUJAuqSQ4UF4PMXcAiZg9J";
const metadataUri = "ipfs://QmRcDomphARdg4nKiCFEARdHuFV7mHj9gFeMhcStfpjTXb";
const contentHash =
  "0x70f7f897ddd16f1242426ad02fc096062e7ce589b72529e432e6ca6be02583ba";
const metadataHash =
  "0x003268297460ff30955993b0577145ce708ddc0fe3431d8bc1476d5f0d750c66";
const creatorCut = 15;

const chainId = 137; // matic

async function main() {
  // - constructMediaData - https://docs.zora.co/docs/developer-tools/zdk/utility#constructmediadata
  const mediaObject = constructMediaData(
    mediaUri,
    metadataUri,
    contentHash,
    metadataHash
  );

  // construct bidShares
  const bidShares = constructBidShares(creatorCut, 98 - creatorCut, 2);

  // setup wallet
  const provider = new ethers.providers.JsonRpcProvider(process.env.MATIC_RPC);
  let mnemonic = process.env.FOX_NUMONIC;
  let mnemonicWallet = ethers.Wallet.fromMnemonic(mnemonic);
  let minter = new ethers.Wallet(mnemonicWallet.privateKey, provider);

  // setup zora
  const zora = new Zora(minter, chainId || 1);

  // mint txn - https://docs.zora.co/docs/developer-tools/zdk/zora-nfts#mint
  console.log("minting...");
  const mintTxn = await zora.mint(mediaObject, bidShares);
  const receipt = await mintTxn.wait();

  console.log({receipt});

  // parse receipt event
  const transferEvent = receipt?.events?.filter(
    (event) => event.event === "Transfer"
  )[0];
  if (!transferEvent) {
    throw new Error("Transfer event missing");
  }
  const {address, args} = transferEvent;
  if (!args) {
    throw new Error("Transfer event missing arguments");
  }
  const tokenIDHex = args[2];
  const token = {
    contractAddress: address,
    tokenId: tokenIDHex.toString(),
    chainId,
  };

  // console.log({token, address: minter.address});
  console.log({minter: minter.address, token});
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
