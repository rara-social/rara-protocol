import DeployConfig from "./types";

const config: DeployConfig = {
  bondingCurveA: "",
  bondingCurveB: "",
  bondingCurveC: "",
  curatorLiabilityBasisPoints: "",
  fxChildBridgeAddress: "",
  fxRootBridgeAddress: "0xfe5e5D361b2ad62c541bAb87C45a0B9B018389a2", // https://docs.polygon.technology/docs/develop/l1-l2-communication/state-transfer/
  fxRootCheckPointManager: "0x86e4dc95c7fbdbf52e33d563bbdb00823894c287", // https://docs.polygon.technology/docs/develop/l1-l2-communication/state-transfer/
  paymentTokenAddress: "",
  reactionNftUri: "",
  reactionPrice: "",
  saleReferrerBasisPoints: "",
  spendReferrerBasisPoints: "",
  spendTakerBasisPoints: "",
  royaltyRegistry: "0x0385603ab55642cb4dd5de3ae9e306809991804f", //https://royaltyregistry.xyz/lookup
}

export default config;