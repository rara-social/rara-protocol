import "@nomiclabs/hardhat-ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import hre from "hardhat";
import {BigNumberish, Bytes, utils} from "ethers";

export const HARDHAT_CHAINID = 31337;
export const SIG_DOMAIN_NAME = "Rara Protocol";

const buildReactWithSigParams = (
  verifyingContract: string,
  reactor: string,
  transformId: BigNumberish,
  quantity: BigNumberish,
  optionBits: BigNumberish,
  takerNftChainId: BigNumberish,
  takerNftAddress: string,
  takerNftId: BigNumberish,
  ipfsMetadataHash: string,
  nonce: number,
  deadline: string
) => ({
  types: {
    ReactWithSig: [
      // Function ABI parts
      {name: "reactor", type: "address"},
      {name: "transformId", type: "uint256"},
      {name: "quantity", type: "uint256"},
      {name: "optionBits", type: "uint256"},
      {name: "takerNftChainId", type: "uint256"},
      {name: "takerNftAddress", type: "address"},
      {name: "takerNftId", type: "uint256"},
      {name: "ipfsMetadataHash", type: "string"},
      // Sig ABI parts
      {name: "nonce", type: "uint256"},
      {name: "deadline", type: "uint256"},
    ],
  },
  domain: domain(verifyingContract),
  value: {
    reactor: reactor,
    transformId: transformId,
    quantity: quantity,
    optionBits: optionBits,
    takerNftChainId: takerNftChainId,
    takerNftAddress: takerNftAddress,
    takerNftId: takerNftId,
    ipfsMetadataHash: ipfsMetadataHash,
    nonce: nonce,
    deadline: deadline,
  },
});

export async function getReactWithSigParts(
  // signer
  signer: SignerWithAddress,
  // builder args
  verifyingContract: string,
  reactor: string,
  transformId: BigNumberish,
  quantity: BigNumberish,
  optionBits: BigNumberish,
  takerNftChainId: BigNumberish,
  takerNftAddress: string,
  takerNftId: BigNumberish,
  ipfsMetadataHash: string,
  nonce: number,
  deadline: string
): Promise<{v: number; r: string; s: string}> {
  const msgParams = buildReactWithSigParams(
    verifyingContract,
    reactor,
    transformId,
    quantity,
    optionBits,
    takerNftChainId,
    takerNftAddress,
    takerNftId,
    ipfsMetadataHash,
    nonce,
    deadline
  );
  return await getSig(signer, msgParams);
}

async function getSig(
  signer: SignerWithAddress,
  msgParams: {
    domain: any;
    types: any;
    value: any;
  }
): Promise<{v: number; r: string; s: string}> {
  const sig = await signer._signTypedData(
    msgParams.domain,
    msgParams.types,
    msgParams.value
  );
  return utils.splitSignature(sig);
}

export function getChainId(): number {
  return hre.network.config.chainId || HARDHAT_CHAINID;
}

function domain(verifyingContract: string): {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
} {
  return {
    name: SIG_DOMAIN_NAME,
    version: "1",
    chainId: getChainId(),
    verifyingContract: verifyingContract,
  };
}
