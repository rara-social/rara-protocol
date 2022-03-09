import DeployConfig from "./types";

const config: DeployConfig = {
  reactionNftUri: "https://rara.social/test-nfts/{id}.json",
  bondingCurveReserve: "400000",
  fxChildBridgeAddress: "0xCf73231F28B7331BBe3124B907840A94851f9f11",
  reactionPrice: "10000000000000000", // Base units of payment token
  curatorLiabilityBasisPoints: "5000", // 50% goes to curator liability
  saleReferrerBasisPoints: "100",// 1% goes to the referrer on reaction sale
  spendTakerBasisPoints: "5000", // 50% of curator liability goes to the taker
  spendReferrerBasisPoints: "100", // 1% of curator liability goes to the referrer
  paymentTokenAddress: "" // Empty for local hardhat - will be deployed in scripts
}

export default config;