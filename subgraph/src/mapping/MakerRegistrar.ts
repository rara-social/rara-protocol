import {BigInt, BigDecimal, log} from "@graphprotocol/graph-ts";

import {User, Reaction} from "../../generated/schema";

import {
  Registered,
  Deregistered,
} from "../../generated/MakerRegistrar/MakerRegistrar";

export function handleRegistered(event: Registered): void {
  log.log(3, "handleRegistered");

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
  // Reaction(metaId)
  //
  let reaction = new Reaction(event.params.registrationSourceId.toHexString());
  reaction.registrationMetaId = event.params.registrationSourceId.toHexString();
  reaction.registrationSourceId = event.params.registrationSourceId;
  reaction.makerUser = user.id;
  reaction.nftChainId = event.params.nftChainId;
  reaction.nftContractAddress = event.params.nftContractAddress;
  reaction.nftId = event.params.nftId;
  reaction.nftOwnerAddress = event.params.nftOwnerAddress;
  reaction.nftCreatorAddress = event.params.nftCreatorAddress;
  reaction.totalSold = BigInt.zero();
  reaction.makerFeesTotal = BigDecimal.zero();
  reaction.creatorFeesTotal = BigDecimal.zero();
  reaction.referrerFeesTotal = BigDecimal.zero();
  reaction.registered = true;

  reaction.save();
}

export function handleDeregistered(event: Deregistered): void {
  log.log(3, "Deregistered");

  //
  // Reaction: mark 'registered' as false
  //
  let reaction = new Reaction(event.params.registrationSourceId.toHexString());
  reaction.registered = false;
  reaction.save();
}
