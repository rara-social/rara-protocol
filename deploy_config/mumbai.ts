import DeployConfig from "./types";

const config: DeployConfig = {
  bondingCurveA: "5000", // 0.5 * 1_000_000 => max price / 2 => 1 is max price of curve
  bondingCurveB: "10000000", // midpoint is 10m tokens sold
  bondingCurveC: "29000000000000", // Super flat curve - this is steepness param
  curatorLiabilityBasisPoints: "9000", // 90% goes to curator liability

  fxChildBridgeAddress: "0xCf73231F28B7331BBe3124B907840A94851f9f11",
  fxRootBridgeAddress: "", // Not set for mumbai L2
  fxRootCheckPointManager: "", // Not set for mumbai L2

  royaltyRegistry: "0x0a01E11887f727D1b1Cd81251eeEE9BEE4262D07", // deployed royalty registry https://royaltyregistry.xyz/lookup
  saleReferrerBasisPoints: "100", // 1% goes to the referrer on reaction sale
  spendReferrerBasisPoints: "100", // 1% of curator liability goes to the referrer
  spendTakerBasisPoints: "700", // 7% of curator liability goes to the taker

  curatorTokenContractUri: "",
  curatorTokenNftUri:
    "https://protocol-api.rara.social/internal/curatortoken/{id}",
  reactionContractUri: "",
  reactionNftUri: "https://protocol-api.rara.social/internal/reaction/{id}",

  likeTokenNftUri: "",
  likeTokenContractUri: "",

  paymentTokenAddress: "", // Empty for mumbai - we will manually deploy one to test with
  reactionPrice: "1000000", // Base units of payment token with 6 decimals
  nativeWrappedTokenAddress: "",
  freeReactionLimit: "",
};

export default config;
