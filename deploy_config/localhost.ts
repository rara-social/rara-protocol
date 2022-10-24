import DeployConfig from "./types";

const config: DeployConfig = {
  bondingCurveA: "5000", // 0.5 * 1_000_000 => max price / 2 => 1 is max price of curve
  bondingCurveB: "10000000", // midpoint is 10m tokens sold
  bondingCurveC: "29000000000000", // Super flat curve - this is steepness param
  curatorLiabilityBasisPoints: "9000", // 90% goes to curator liability
  curatorTokenNftUri:
    "https://protocol-api.rara.social/internal/curatortoken/{id}",
  curatorTokenContractUri:
    "https://protocol-api.rara.social/internal/contract/curatortoken",
  fxChildBridgeAddress: "0xCf73231F28B7331BBe3124B907840A94851f9f11",
  fxRootBridgeAddress: "", // Not set for L2
  fxRootCheckPointManager: "", // Not set for L2
  paymentTokenAddress: "", // Empty for mumbai - we will manually deploy one to test with
  reactionNftUri: "https://protocol-api.rara.social/internal/reaction/{id}",
  reactionContractUri:
    "https://protocol-api.rara.social/internal/contract/reaction",
  reactionPrice: "1000000", // Base units of payment token with 6 decimals
  saleReferrerBasisPoints: "100", // 1% goes to the referrer on reaction sale
  spendReferrerBasisPoints: "100", // 1% of curator liability goes to the referrer
  spendTakerBasisPoints: "700", // 7% of curator liability goes to the taker
  royaltyRegistry: "0x0000000000000000000000000000000000000000", // Not set
};

export default config;
