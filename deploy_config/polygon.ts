import DeployConfig from "./types";

const config: DeployConfig = {
  bondingCurveA: "5000", // 0.5 * 1_000_000 => max price / 2 => 1 is max price of curve
  bondingCurveB: "10000000", // midpoint is 10m tokens sold
  bondingCurveC: "29000000000000", // Super flat curve - this is steepness param
  curatorLiabilityBasisPoints: "9500", // 95% goes to curator liability
  curatorTokenNftUri:
    "https://protocol-api.rara.social/internal/curatortoken/{id}",
  curatorTokenContractUri:
    "https://protocol-api.rara.social/internal/contract/curatortoken",
  fxChildBridgeAddress: "0x8397259c983751DAf40400790063935a11afa28a", // https://docs.polygon.technology/docs/develop/l1-l2-communication/state-transfer/
  fxRootBridgeAddress: "", // Not set for L2
  fxRootCheckPointManager: "", // Not set for L2
  paymentTokenAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC on polygon
  nativeWrappedTokenAddress: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
  reactionNftUri: "https://protocol-api.rara.social/internal/reaction/{id}",
  reactionContractUri:
    "https://protocol-api.rara.social/internal/contract/reaction",
  reactionPrice: "1000000", // Base units of payment token with 6 decimals
  royaltyRegistry: "0x28EdFcF0Be7E86b07493466e7631a213bDe8eEF2", // deployed royalty registry https://royaltyregistry.xyz/lookup
  saleReferrerBasisPoints: "50", // 0.5% goes to the referrer on reaction sale
  spendReferrerBasisPoints: "55", // 0.55% of curator liability goes to the referrer - this is higher because it is a fraction of a fraction
  spendTakerBasisPoints: "525", // 5.25% of curator liability goes to the taker - this is higher because it is a fraction of a fraction
  freeReactionLimit: 1, // Amount of free reactions per transaction
  likeTokenNftUri: "",
};

export default config;
