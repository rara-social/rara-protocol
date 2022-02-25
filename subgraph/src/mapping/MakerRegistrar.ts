import {BigInt, Address, log} from "@graphprotocol/graph-ts";

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
  let sender = event.params.ownerAddress.toHexString(); //TODO: make sure this is same user from L1 and L2
  let user = User.load(sender);
  if (user == null) {
    user = new User(sender);
  }
  user.save();

  //
  // Reaction(metaId)
  //
  let reaction = new Reaction(event.params.sourceId.toHexString());
  reaction.metaId = event.params.metaId.toHexString();
  reaction.makerUser = user.id;
  reaction.nftChainId = event.params.chainId;
  reaction.nftContractAddress = event.params.nftContractAddress;
  reaction.nftId = event.params.nftId;
  reaction.nftOwnerAddress = event.params.ownerAddress; // TODO: align names
  reaction.nftCreatorAddress = event.params.creatorAddress; // TODO: align names
  // reaction.reactionPrice = event.params.creatorAddress; // TODO: add to event
  reaction.registered = true;

  reaction.save();
}

export function handleDeregistered(event: Deregistered): void {
  log.log(3, "Deregistered");

  //
  // Reaction: mark 'registered' as false
  //
  let reaction = Reaction.load(event.params.sourceId.toHexString());
  reaction.registered = false;
  reaction.save();
}
