import DeployConfig from "./types";

const config: DeployConfig = {
  reactionNftUri: "https://rara.social/mumbai-nfts/{id}.json",
  fxChildBridgeAddress: "0xCf73231F28B7331BBe3124B907840A94851f9f11",
  reactionPrice: "1000000", // Base units of payment token with 6 decimals
  curatorLiabilityBasisPoints: "9000", // 90% goes to curator liability
  saleReferrerBasisPoints: "100",// 1% goes to the referrer on reaction sale
  spendTakerBasisPoints: "700", // 7% of curator liability goes to the taker
  spendReferrerBasisPoints: "100", // 1% of curator liability goes to the referrer
  paymentTokenAddress: "", // Empty for mumbai - we will manually deploy one to test with
  bondingCurveA: "5000", // 0.5 * 1_000_000 => max price / 2 => 1 is max price of curve
  bondingCurveB: "10000000", // midpoint is 10m tokens sold
  bondingCurveC: "29000000000000", // Super flat curve - this is steepness param
  fxRootBridgeAddress: "", // Not set for mumbai L2
  fxRootCheckPointManager: "", // Not set for mumbai L2
}

export default config;