import DeployConfig from "./types";

const config: DeployConfig = {
  paymentTokenAddress: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // wrapped matic - https://polygonscan.com/address/0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270
  nativeWrappedTokenAddress: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // wrapped matic - https://polygonscan.com/address/0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270
  reactionPrice: "1000000000000000000", // Base units of payment token with 18 decimals
  freeReactionLimit: "1",

  bondingCurveA: "3000", // https://docs.google.com/spreadsheets/d/1v2bEkdPGFE-yd0oyfhluhxwykKT_C2fAczIu4brlanc/edit#gid=868493616&range=C2
  bondingCurveB: "100000", // https://docs.google.com/spreadsheets/d/1v2bEkdPGFE-yd0oyfhluhxwykKT_C2fAczIu4brlanc/edit#gid=868493616&range=C2
  bondingCurveC: "13800000000", // https://docs.google.com/spreadsheets/d/1v2bEkdPGFE-yd0oyfhluhxwykKT_C2fAczIu4brlanc/edit#gid=868493616&range=C2

  fxChildBridgeAddress: "0x8397259c983751DAf40400790063935a11afa28a",
  fxRootBridgeAddress: "", // Not set for L2
  fxRootCheckPointManager: "", // Not set for L2

  royaltyRegistry: "0x28EdFcF0Be7E86b07493466e7631a213bDe8eEF2", // deployed royalty registry https://royaltyregistry.xyz/lookup

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
  likeTokenContractUri:
    "https://protocol-api.rara.social/internal/contract/like/",
  likeTokenNftUri: "https://protocol-api.rara.social/internal/like/",
};

export default config;
