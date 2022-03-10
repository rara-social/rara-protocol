import {BigInt, Address, log, BigDecimal} from "@graphprotocol/graph-ts";

import {
  User,
  Reaction,
  CuratorReaction,
  UserReaction,
} from "../../generated/schema";

import {
  ReactionsPurchased,
  ReactionsSpent,
  CreatorRewardsGranted,
  ReferrerRewardsGranted,
  MakerRewardsGranted,
  ERC20RewardsClaimed,
  TakerRewardsSold,
} from "../../generated/ReactionVault/ReactionVault";

export function handleReactionsPurchased(event: ReactionsPurchased): void {
  log.log(3, "ReactionsPurchased");

  //
  // Reaction
  //
  let reaction = Reaction.load(event.params.reactionMetaId.toHexString());
  if (reaction == null) {
    reaction = new Reaction(event.params.reactionMetaId.toHexString());
  }
  reaction.totalSold = reaction.totalSold.plus(event.params.quantity);
  reaction.save();

  //
  // User
  //
  let sender = event.transaction.from.toHexString();
  let user = User.load(sender);
  if (user == null) {
    user = new User(sender);
  }
  user.save();

  //
  // User Reaction
  //
  let userReactionId =
    event.transaction.from.toHexString() +
    "-" +
    event.params.reactionMetaId.toHexString(); // calc id from msg.sender + reactionMetaId.id

  let userReaction = UserReaction.load(sender);
  if (userReaction == null) {
    userReaction = new UserReaction(userReactionId);
    userReaction.user = user.id;
    userReaction.reaction = reaction.id;
    userReaction.quantity = event.params.quantity;
  } else {
    userReaction.quantity = userReaction.quantity.plus(event.params.quantity);
  }

  userReaction.save();
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

  //
  // User Reaction
  //
  let userReactionId =
    event.transaction.from.toHexString() +
    "-" +
    event.params.reactionMetaId.toHexString(); // calc id from msg.sender + reactionMetaId
  let userReaction = new UserReaction(userReactionId);

  // decrease quantity
  userReaction.quantity = userReaction.quantity.minus(event.params.quantity);

  userReaction.save();

  //
  // CuratorReaction
  //
  let curatorReactionId =
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(); // generate unique id from transaction
  let curatorReaction = new CuratorReaction(curatorReactionId);
  curatorReaction.reaction = event.params.reactionMetaId.toHexString();
  curatorReaction.quantity = event.params.quantity;
  curatorReaction.curator = user.id;
  curatorReaction.metadataHash = event.params.metaDataHash;

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
  let reaction = Reaction.load(event.params.registrationSourceId.toHexString());
  if (reaction == null) {
    reaction = new Reaction(event.params.registrationSourceId.toHexString());
  }
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
  let reaction = Reaction.load(event.params.registrationSourceId.toHexString());
  if (reaction == null) {
    reaction = new Reaction(event.params.registrationSourceId.toHexString());
  }

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
  let reaction = Reaction.load(event.params.registrationSourceId.toHexString());
  if (reaction == null) {
    reaction = new Reaction(event.params.registrationSourceId.toHexString());
  }

  // increase referrer fees
  reaction.makerFeesTotal = reaction.makerFeesTotal.minus(
    event.params.amount.toBigDecimal()
  );
  reaction.save();
}

export function handleERC20RewardsClaimed(event: ERC20RewardsClaimed): void {
  log.log(3, "ERC20RewardsClaimed");

  let user = User.load(event.params.recipient.toHexString());
  if (user == null) {
    user = new User(event.params.recipient.toHexString());
  }

  // zero-out all balances
  user.creatorRewardsBalance = BigDecimal.zero();
  user.makerRewardsBalance = BigDecimal.zero();
  user.referrerRewardsBalance = BigDecimal.zero();

  user.save();
}

export function handleTakerRewardsSold(event: TakerRewardsSold): void {
  log.log(3, "TakerRewardsSold");
  // address takerAddress,
  // uint256 takerNftChainId,
  // address takerNftAddress,
  // uint256 takerNftId,
  // address curatorVault,
  // uint256 curatorTokenId,
  // uint256 curatorShareAmount,
  // uint256 paymentTokensReceived

  // TODO - needed(?)
}
