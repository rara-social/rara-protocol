type DeployConfig = {
  bondingCurveA: string;
  bondingCurveB: string;
  bondingCurveC: string;
  curatorLiabilityBasisPoints: string;
  curatorTokenNftUri: string;
  curatorTokenContractUri: string;
  fxChildBridgeAddress: string;
  fxRootBridgeAddress: string;
  fxRootCheckPointManager: string;
  paymentTokenAddress: string;
  nativeWrappedTokenAddress: string;
  reactionNftUri: string;
  reactionContractUri: string;
  reactionPrice: string;
  royaltyRegistry: string;
  saleReferrerBasisPoints: string;
  spendReferrerBasisPoints: string;
  spendTakerBasisPoints: string;
  freeReactionLimit: number;
};

export default DeployConfig;
