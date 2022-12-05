import {log} from "@graphprotocol/graph-ts";

import {LikeTokenContract} from "../../generated/schema";

import {TokenDeployed} from "../../generated/LikeTokenFactory/LikeTokenFactory";

export function handleTokenDeployed(event: TokenDeployed): void {
  log.log(3, "TokenDeployed");
  // uint256 takerNftChainId,
  // address takerNftAddress,
  // uint256 takerNftId,
  // address deployedContract

  //
  // LikeTokenContract
  //
  // load LikeTokenContract
  let LikeTokenContractKey = event.params.deployedContract.toHexString();
  let likeTokenContract = LikeTokenContract.load(LikeTokenContractKey);
  if (likeTokenContract == null) {
    likeTokenContract = new LikeTokenContract(LikeTokenContractKey);
    likeTokenContract.takerNftChainId = event.params.takerNftChainId;
    likeTokenContract.takerNftAddress = event.params.takerNftAddress;
    likeTokenContract.takerNftId = event.params.takerNftId;
    likeTokenContract.deployedContract = event.params.deployedContract;
    likeTokenContract.createdAt = event.block.timestamp;
  }

  likeTokenContract.updatedAt = event.block.timestamp;
  likeTokenContract.blockNumber = event.block.number;
  likeTokenContract.save();
}
