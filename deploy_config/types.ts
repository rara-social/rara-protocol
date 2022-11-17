type DeployConfig = {
  bondingCurveA: string;
  bondingCurveB: string;
  bondingCurveC: string;
  curatorLiabilityBasisPoints: string;
  curatorTokenNftUri: string;
  fxChildBridgeAddress: string;
  fxRootBridgeAddress: string;
  fxRootCheckPointManager: string;
  paymentTokenAddress: string;
  reactionNftUri: string;
  reactionPrice: string;
  royaltyRegistry: string;
  saleReferrerBasisPoints: string;
  spendReferrerBasisPoints: string;
  spendTakerBasisPoints: string;
  curatorTokenContractUri: string;
  likeTokenNftUri: string;
  likeTokenContractUri: string;
  reactionContractUri: string;
  nativeWrappedTokenAddress: string;
  freeReactionLimit: string;
};

export default DeployConfig;
