import {BigInt, log} from "@graphprotocol/graph-ts";

import {User, Source, Transform} from "../../generated/schema";

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
  // User
  //
  let sender = event.params.nftOwnerAddress.toHexString();
  let user = User.load(sender);
  if (user == null) {
    user = new User(sender);
  }
  user.save();

  //
  // Source
  //
  let sourceKey = event.params.sourceId.toHexString();
  let source = Source.load(sourceKey);
  if (source == null) {
    source = new Source(sourceKey);
    source.sourceId = event.params.sourceId;
    source.nftChainId = event.params.nftChainId;
    source.nftContractAddress = event.params.nftContractAddress;
    source.nftId = event.params.nftId;
    source.nftOwnerAddress = event.params.nftOwnerAddress;
    source.registered = true;
    source.user = user.id;
  }

  // these are be updated each time "registered()"" is called
  source.nftCreatorAddress = event.params.nftCreatorAddress;
  source.creatorSaleBasisPoints = event.params.creatorSaleBasisPoints;

  source.save();

  //
  // Transform
  //
  let transformKey = event.params.transformId.toHexString();
  let transform = Transform.load(transformKey);
  if (transform == null) {
    transform = new Transform(transformKey);
    transform.transformId = event.params.transformId;
    transform.optionBits = event.params.optionBits;
    transform.source = source.id;
    transform.totalSold = BigInt.zero();
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
