import DeployConfig from "./types";

const config: DeployConfig = {
  bondingCurveA: "5000", // 0.5 * 1_000_000 => max price / 2 => 1 is max price of curve
  bondingCurveB: "10000000", // midpoint is 10m tokens sold
  bondingCurveC: "29000000000000", // Super flat curve - this is steepness param
  curatorLiabilityBasisPoints: "9000", // 90% goes to curator liability
  curatorTokenNftUri: "https://protocol-api.rara.social/internal/curatortoken/{id}",
  fxChildBridgeAddress: "0x8397259c983751DAf40400790063935a11afa28a", // https://docs.polygon.technology/docs/develop/l1-l2-communication/state-transfer/
  fxRootBridgeAddress: "", // Not set for L2
  fxRootCheckPointManager: "", // Not set for L2
  paymentTokenAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC on polygon
  reactionNftUri: "https://protocol-api.rara.social/internal/reaction/{id}",
  reactionPrice: "1000000", // Base units of payment token with 6 decimals
  royaltyRegistry: "0x28EdFcF0Be7E86b07493466e7631a213bDe8eEF2", // deployed royalty registry https://royaltyregistry.xyz/lookup
  saleReferrerBasisPoints: "100",// 1% goes to the referrer on reaction sale
  spendReferrerBasisPoints: "100", // 1% of curator liability goes to the referrer
  spendTakerBasisPoints: "700", // 7% of curator liability goes to the taker
}

export default config;