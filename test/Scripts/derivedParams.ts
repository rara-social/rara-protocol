import { BigNumber, ethers } from "ethers";

export const deriveMakerNftMetaId = (
  nftSourceId: BigNumber,
  reactionOptionBits: BigNumber
) => {
  // Encode the params and hash it to get the meta URI
  const encodedParams = ethers.utils.defaultAbiCoder.encode(
    ["string", "uint256", "uint256"],
    ["MAKER", nftSourceId, reactionOptionBits]
  );
  return ethers.utils.keccak256(encodedParams);
};

export const deriveReactionParameterVersion = (
  paymentTokenAddress: String,
  reactionPrice: BigNumber,
  curatorLiabilityBp: BigNumber
) => {
  // Encode the params and hash it 
  const encodedParams = ethers.utils.defaultAbiCoder.encode(
    ["address", "uint256", "uint256"],
    [paymentTokenAddress, reactionPrice, curatorLiabilityBp]
  );
  return ethers.utils.keccak256(encodedParams);
};

export const deriveReactionNftMetaId = (
  parameterVersion: BigNumber,
  makerNftMetaId: BigNumber,
  reactionOptionBits: BigNumber
) => {
  // Encode the params and hash it to get the meta URI
  const encodedParams = ethers.utils.defaultAbiCoder.encode(
    ["string", "uint256", "uint256", "uint256"],
    ["REACTION", parameterVersion, makerNftMetaId, reactionOptionBits]
  );
  return ethers.utils.keccak256(encodedParams);
};
