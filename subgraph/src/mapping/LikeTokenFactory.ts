import {log} from "@graphprotocol/graph-ts";

import {LikeTokenContract, UserSpend} from "../../generated/schema";

import {
  TokenDeployed,
  TokenMinted,
} from "../../generated/LikeTokenFactory/LikeTokenFactory";

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
  let LikeTokenContractKey = event.params.deployedContract.toString();
  let likeTokenContract = LikeTokenContract.load(LikeTokenContractKey);
  if (likeTokenContract == null) {
    likeTokenContract = new LikeTokenContract(LikeTokenContractKey);
    likeTokenContract.takerNftChainId = event.params.takerNftChainId;
    likeTokenContract.takerNftAddress = event.params.takerNftAddress;
    likeTokenContract.takerNftId = event.params.takerNftId;
    likeTokenContract.createdAt = event.block.timestamp;
  }

  likeTokenContract.updatedAt = event.block.timestamp;
  likeTokenContract.blockNumber = event.block.number;
  likeTokenContract.save();
}

export function handleTokenMinted(event: TokenMinted): void {
  log.log(3, "TokenMinted");
  // address tokenContract,
  // uint256 tokenId

  //
  // UserSpend
  //
  // let userSpendKey =
  //   event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let userSpendKey = event.transaction.hash.toHex();
  let userSpend = UserSpend.load(userSpendKey);
  if (userSpend == null) {
    userSpend = new UserSpend(userSpendKey);
    userSpend.createdAt = event.block.timestamp;
  }

  userSpend.likeContractAddress = event.params.tokenContract;
  userSpend.likeTokenId = event.params.tokenId;

  userSpend.updatedAt = event.block.timestamp;
  userSpend.blockNumber = event.block.number;
  userSpend.save();
}
