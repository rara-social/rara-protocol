import {BigInt, log} from "@graphprotocol/graph-ts";

import {Source, Transform} from "../../generated/schema";

import {
  Registered,
  Deregistered,
} from "../../generated/MakerRegistrar/MakerRegistrar";

export function handleRegistered(event: Registered): void {
  log.log(3, "handleRegistered");
  // uint256 nftChainId,
  // address indexed nftContractAddress,
  // uint256 indexed nftId,
  // address indexed nftOwnerAddress,
  // address nftCreatorAddress,
  // uint256 creatorSaleBasisPoints,
  // uint256 optionBits,
  // uint256 sourceId,
  // uint256 transformId

  //
  // Source
  //
  let sourceKey = event.params.sourceId.toHexString();
  let source = Source.load(sourceKey);
  if (source == null) {
    source = new Source(sourceKey);
    source.sourceId = event.params.sourceId;
    source.user = event.params.nftOwnerAddress.toHexString();
    source.nftChainId = event.params.nftChainId;
    source.nftContractAddress = event.params.nftContractAddress;
    source.nftId = event.params.nftId;
  }

  // these are be updated each time "registered()"" is called
  source.creatorAddress = event.params.nftCreatorAddress;
  source.creatorSaleBasisPoints = event.params.creatorSaleBasisPoints;
  source.registered = true;
  source.save();

  //
  // Transform
  //
  let transformKey = event.params.transformId.toHexString();
  let transform = Transform.load(transformKey);
  if (transform == null) {
    transform = new Transform(transformKey);
    transform.transformId = event.params.transformId;
    transform.source = event.params.sourceId.toHexString();
    transform.optionBits = event.params.optionBits;
  }
  transform.save();
}

export function handleDeregistered(event: Deregistered): void {
  log.log(3, "Deregistered");

  //
  // Source
  //
  let sourceKey = event.params.sourceId.toHexString();
  let source = Source.load(sourceKey);
  if (source == null) {
    source = new Source(sourceKey);
  }
  source.registered = false;
  source.save();
}
