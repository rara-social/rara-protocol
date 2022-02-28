import {BigInt, Address, log, BigDecimal} from "@graphprotocol/graph-ts";

import {User, Reaction, CuratorReaction} from "../../generated/schema";

import {
  ReactionsPurchased,
  ReactionsSpent,
  CreatorRewardsGranted,
  ReferrerRewardsGranted,
  MakerRewardsGranted,
  TakerRewardsGranted,
  SpenderRewardsGranted,
  ERC20RewardsClaimed,
} from "../../generated/ReactionVault/ReactionVault";

export function handleReactionsPurchased(event: ReactionsPurchased): void {
  log.log(3, "ReactionsPurchased");

  //
  // Reaction
  //
  let reaction = Reaction.load(event.params.reactionMetaId.toHexString()); // TODO: same as source id from registrar?
  reaction.totalSold = reaction.totalSold.plus(event.params.quantity);
}

export function handleReactionsSpent(event: ReactionsSpent): void {
  log.log(3, "ReactionsSpent");

  //
  // User
  //
  let sender = event.transaction.from.toHexString();
  let user = User.load(sender);
  if (user == null) {
    user = new User(sender);
  }
  user.save();

  // takerNftAddress,
  // takerNftId,
  // reactionMetaId, *
  // reactionQuantity,
  // referrer, *
  // metaDataHash

  //
  // CuratorReaction
  //
  let curatorReactionId =
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(); // generate unique id from transaction
  let curatorReaction = new CuratorReaction(curatorReactionId);

  // reaction bought
  // curatorReaction.takerNFT = takerNft.id; // curatorShareTokenId
  // curatorReaction.sharesRecieved =
  //   event.params.curatorSharesBought.toBigDecimal();

  //
  curatorReaction.curator = user.id;
  curatorReaction.reaction = event.params.reactionMetaId.toHexString(); // need id // let reaction = new Reaction(event.params.sourceId.toHexString());
  curatorReaction.quantity = event.params.quantity; // TODO: add to event
  curatorReaction.save();
}

export function handleCreatorRewardsGranted(
  event: CreatorRewardsGranted
): void {
  log.log(3, "CreatorRewardsGranted");

  //
  // User
  //
  let creator = event.params.creator.toHexString();
  let user = User.load(creator);
  if (user == null) {
    user = new User(creator);
  }

  // increase creator rewards
  user.creatorRewardsBalance = user.creatorRewardsBalance.plus(
    event.params.amount.toBigDecimal()
  );
  user.save();

  //
  // Reaction
  //
  let reaction = Reaction.load("TODO"); // TODO: get reation id

  // increase creator fees
  reaction.creatorFeesTotal = reaction.creatorFeesTotal.minus(
    event.params.amount.toBigDecimal()
  );

  reaction.save();
}

export function handleReferrerRewardsGranted(
  event: ReferrerRewardsGranted
): void {
  log.log(3, "ReferrerRewardsGranted");

  //
  // User
  //
  let referrer = event.params.referrer.toHexString();
  let user = User.load(referrer);
  if (user == null) {
    user = new User(referrer);
  }

  // increase referrer rewards
  user.referrerRewardsBalance = user.referrerRewardsBalance.plus(
    event.params.amount.toBigDecimal()
  );
  user.save();

  //
  // Reaction
  //
  let reaction = Reaction.load("TODO"); // TODO: get reation id

  // increase referrer fees
  reaction.referrerFeesTotal = reaction.referrerFeesTotal.minus(
    event.params.amount.toBigDecimal()
  );

  reaction.save();
}

export function handleMakerRewardsGranted(event: MakerRewardsGranted): void {
  log.log(3, "MakerRewardsGranted");

  //
  // User
  //
  let maker = event.params.maker.toHexString();
  let user = User.load(maker);
  if (user == null) {
    user = new User(maker);
  }

  // increase referrer rewards
  user.makerRewardsBalance = user.makerRewardsBalance.plus(
    event.params.amount.toBigDecimal()
  );
  user.save();

  //
  // Reaction
  //
  let reaction = Reaction.load("TODO"); // TODO: get reation id

  // increase referrer fees
  reaction.makerFeesTotal = reaction.makerFeesTotal.minus(
    event.params.amount.toBigDecimal()
  );
  reaction.save();
}

// TODO: not needed
// export function handleSpenderRewardsGranted(
//   event: SpenderRewardsGranted
// ): void {
//   log.log(3, "SpenderRewardsGranted");
// }

// TODO: not needed
// export function handleTakerRewardsGranted(
//   event: TakerRewardsGranted
// ): void {
//   log.log(3, "TakerRewardsGranted");
// }

export function handleERC20RewardsClaimed(event: ERC20RewardsClaimed): void {
  log.log(3, "ERC20RewardsClaimed");

  let user = User.load(event.params.recipient.toHexString());

  // zero-out all balances
  user.creatorRewardsBalance = BigDecimal.zero();
  user.makerRewardsBalance = BigDecimal.zero();
  user.referrerRewardsBalance = BigDecimal.zero();

  user.save();
}
