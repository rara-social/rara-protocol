import DeployConfig from "./types";

const config: DeployConfig = {
  bondingCurveA: "5000", // 0.5 * 1_000_000 => max price / 2 => 1 is max price of curve
  bondingCurveB: "10000000", // midpoint is 10m tokens sold
  bondingCurveC: "29000000000000", // Super flat curve - this is steepness param

  fxChildBridgeAddress: "0xCf73231F28B7331BBe3124B907840A94851f9f11",
  fxRootBridgeAddress: "", // Not set for mumbai L2
  fxRootCheckPointManager: "", // Not set for mumbai L2

  royaltyRegistry: "0x0a01E11887f727D1b1Cd81251eeEE9BEE4262D07", // deployed royalty registry https://royaltyregistry.xyz/lookup

  curatorLiabilityBasisPoints: "9500", // 95% goes to curator liability
  saleReferrerBasisPoints: "50", // 0.5% goes to the referrer on reaction sale
  spendReferrerBasisPoints: "55", // 0.55% of curator liability goes to the referrer - this is higher because it is a fraction of a fraction
  spendTakerBasisPoints: "525", // 5.25% of curator liability goes to the taker - this is higher because it is a fraction of a fraction

  curatorTokenContractUri:
    "https://protocol-api.rara.social/contract/curatortoken",
  curatorTokenNftUri:
    "https://protocol-api.rara.social/internal/curatortoken/{id}",
  reactionContractUri: "https://protocol-api.rara.social/contract/reaction",
  reactionNftUri: "https://protocol-api.rara.social/internal/reaction/{id}",
  likeTokenContractUri: "https://protocol-api.rara.social/contract/like",
  likeTokenNftUri: "https://protocol-api.rara.social/internal/like/{id}",

  paymentTokenAddress: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
  nativeWrappedTokenAddress: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
  reactionPrice: "1000000000000000000", // Base units of payment token with 6 decimals
  freeReactionLimit: "1",
};

export default config;
