import DeployConfig from "./types";

const config: DeployConfig = {
  bondingCurveA: "",
  bondingCurveB: "",
  bondingCurveC: "",
  curatorLiabilityBasisPoints: "",
  curatorTokenContractUri: "",
  curatorTokenNftUri: "",
  fxChildBridgeAddress: "",
  fxRootBridgeAddress: "0x3d1d3E34f7fB6D26245E6640E1c50710eFFf15bA",
  fxRootCheckPointManager: "0x2890bA17EfE978480615e330ecB65333b880928e",
  paymentTokenAddress: "",
  nativeWrappedTokenAddress: "",
  reactionNftUri: "",
  reactionContractUri: "",
  reactionPrice: "",
  saleReferrerBasisPoints: "",
  spendReferrerBasisPoints: "",
  spendTakerBasisPoints: "",
  royaltyRegistry: "0x0000000000000000000000000000000000000000", // Not available on Goerli
  freeReactionLimit: 1, // Amount of free reactions per transaction
  likeTokenNftUri: "",
};

export default config;
