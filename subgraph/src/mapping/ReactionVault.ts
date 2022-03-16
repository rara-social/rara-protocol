import {BigInt, Address, log, BigDecimal} from "@graphprotocol/graph-ts";

import {
  User,
  UserEarnings,
  Transform,
  Reaction,
  UserReaction,
  UserSpend,
} from "../../generated/schema";

import {
  ReactionsPurchased,
  ReactionsSpent,
  CreatorRewardsGranted,
  ReferrerRewardsGranted,
  MakerRewardsGranted,
  ERC20RewardsClaimed,
} from "../../generated/ReactionVault/ReactionVault";

export function handleReactionsPurchased(event: ReactionsPurchased): void {
  log.log(3, "ReactionsPurchased");
  // uint256 transformId,
  // uint256 quantity,
  // address destinationWallet,
  // address referrer,
  // uint256 reactionId,
  // uint256 parameterVersion

  //
  // Reaction
  //
  let reaction = Reaction.load(event.params.reactionId.toHexString());
  if (reaction == null) {
    // type Reaction @entity {
    //   id: ID! #reactionId
    //   transform: Transform!
    //   parameterVersion: BigInt!
    //   totalSold: BigInt!
    //   referrerFeesTotal: BigDecimal!
    //   creatorFeesTotal: BigDecimal!
    //   makerFeesTotal: BigDecimal!
    // }
    reaction = new Reaction(event.params.reactionId.toHexString());
    reaction.transform = event.params.transformId.toHexString();
    reaction.parameterVersion = event.params.parameterVersion;
  }
  reaction.totalSold = reaction.totalSold.plus(event.params.quantity);
  reaction.save();

  //
  // User Reaction
  //
  let userReactionKey =
    event.params.reactionId.toHexString() +
    "-" +
    event.transaction.from.toHexString();
  let userReaction = UserReaction.load(userReactionKey);
  if (userReaction == null) {
    // id: ID! #reactionId + msg.sender
    // user: User!
    // reaction: Reaction!
    // quantityPurchased: BigInt!
    // quantityAvailable: BigInt!
    userReaction = new UserReaction(userReactionKey);
    userReaction.user = event.transaction.from.toHexString();
    userReaction.reaction = reaction.id;
  }

  userReaction.quantityPurchased = userReaction.quantityPurchased.plus(
    event.params.quantity
  );
  userReaction.quantityAvailable = userReaction.quantityAvailable.plus(
    event.params.quantity
  );

  userReaction.save();
}

export function handleReactionsSpent(event: ReactionsSpent): void {
  log.log(3, "ReactionsSpent");
  //  uint256 takerNftChainId,
  // address takerNftAddress,
  // uint256 takerNftId,
  // uint256 reactionId,
  // uint256 quantity,
  // address referrer,
  // uint256 ipfsMetadataHash,
  // uint256 curatorTokenId,
  // uint256 curatorShareAmount

  //
  // User Reaction
  //
  let userReactionKey =
    event.params.reactionId.toHexString() +
    "-" +
    event.transaction.from.toHexString();
  let userReaction = UserReaction.load(userReactionKey);
  if (userReaction == null) {
    userReaction = new UserReaction(userReactionKey);
  }
  userReaction.quantityAvailable = userReaction.quantityAvailable.minus(
    event.params.quantity
  );

  userReaction.save();

  //
  // UserSpend
  //
  let userSpendKey =
    event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let userSpend = new UserSpend(userSpendKey);
  userSpend.user = event.transaction.from.toHexString();
  userSpend.reaction = event.params.reactionId.toHexString();
  userSpend.quantity = event.params.quantity;
  userSpend.ipfsMetadataHash = event.params.ipfsMetadataHash;
  userSpend.curatorVault = event.params.curatorTokenId.toHexString();
  userSpend.sharesPurchased = event.params.curatorShareAmount;
  userSpend.save();
}

export function handleCreatorRewardsGranted(
  event: CreatorRewardsGranted
): void {
  log.log(3, "CreatorRewardsGranted");
  // address referrer,
  // IERC20Upgradeable paymentToken,
  // uint256 amount,
  // uint256 reactionId

  //
  // User Earnings
  //
  let userEarningKey =
    event.params.creator.toHexString() +
    event.params.paymentToken.toHexString();
  let userEarning = UserEarnings.load(userEarningKey);
  if (userEarning == null) {
    // type UserEarnings @entity {
    //   id: ID! #publicAddress
    //   paymentToken: Bytes!
    //   makerRewardsBalance: BigDecimal!
    //   creatorRewardsBalance: BigDecimal!
    //   referrerRewardsBalance: BigDecimal!
    //   makerRewardsTotal: BigDecimal!
    //   creatorRewardsTotal: BigDecimal!
    //   referrerRewardsTotal: BigDecimal!
    //   withdrawTotal: BigDecimal
    // }
    userEarning = new UserEarnings(userEarningKey);
    userEarning.paymentToken = event.params.paymentToken;
  }

  // increase creator rewards
  userEarning.creatorRewardsBalance = userEarning.creatorRewardsBalance.plus(
    event.params.amount.toBigDecimal()
  );
  userEarning.creatorRewardsTotal = userEarning.creatorRewardsTotal.plus(
    event.params.amount.toBigDecimal()
  );

  userEarning.save();

  //
  // Reaction
  //
  let reaction = Reaction.load(event.params.reactionId.toHexString());
  if (reaction == null) {
    reaction = new Reaction(event.params.reactionId.toHexString());
  }
  reaction.creatorFeesTotal = reaction.creatorFeesTotal.plus(
    event.params.amount.toBigDecimal()
  );

  reaction.save();
}

export function handleReferrerRewardsGranted(
  event: ReferrerRewardsGranted
): void {
  log.log(3, "ReferrerRewardsGranted");
  // address referrer,
  // IERC20Upgradeable paymentToken,
  // uint256 amount,
  // uint256 reactionId

  //
  // User Earnings
  //
  let userEarningKey =
    event.params.referrer.toHexString() +
    event.params.paymentToken.toHexString();
  let userEarning = UserEarnings.load(userEarningKey);
  if (userEarning == null) {
    // type UserEarnings @entity {
    //   id: ID! #publicAddress
    //   paymentToken: Bytes!
    //   makerRewardsBalance: BigDecimal!
    //   creatorRewardsBalance: BigDecimal!
    //   referrerRewardsBalance: BigDecimal!
    //   makerRewardsTotal: BigDecimal!
    //   creatorRewardsTotal: BigDecimal!
    //   referrerRewardsTotal: BigDecimal!
    //   withdrawTotal: BigDecimal
    // }
    userEarning = new UserEarnings(userEarningKey);
    userEarning.paymentToken = event.params.paymentToken;
  }

  // increase creator rewards
  userEarning.referrerRewardsBalance = userEarning.referrerRewardsBalance.plus(
    event.params.amount.toBigDecimal()
  );
  userEarning.referrerRewardsTotal = userEarning.referrerRewardsTotal.plus(
    event.params.amount.toBigDecimal()
  );

  userEarning.save();

  //
  // Reaction
  //
  let reaction = Reaction.load(event.params.reactionId.toHexString());
  if (reaction == null) {
    reaction = new Reaction(event.params.reactionId.toHexString());
  }
  reaction.referrerFeesTotal = reaction.referrerFeesTotal.plus(
    event.params.amount.toBigDecimal()
  );

  reaction.save();
}

export function handleMakerRewardsGranted(event: MakerRewardsGranted): void {
  log.log(3, "MakerRewardsGranted");
  // address maker,
  // IERC20Upgradeable paymentToken,
  // uint256 amount,
  // uint256 reactionId

  //
  // User Earnings
  //
  let userEarningKey =
    event.params.maker.toHexString() + event.params.paymentToken.toHexString();
  let userEarning = UserEarnings.load(userEarningKey);
  if (userEarning == null) {
    // type UserEarnings @entity {
    //   id: ID! #publicAddress
    //   paymentToken: Bytes!
    //   makerRewardsBalance: BigDecimal!
    //   creatorRewardsBalance: BigDecimal!
    //   referrerRewardsBalance: BigDecimal!
    //   makerRewardsTotal: BigDecimal!
    //   creatorRewardsTotal: BigDecimal!
    //   referrerRewardsTotal: BigDecimal!
    //   withdrawTotal: BigDecimal
    // }
    userEarning = new UserEarnings(userEarningKey);
    userEarning.paymentToken = event.params.paymentToken;
  }

  // increase creator rewards
  userEarning.makerRewardsBalance = userEarning.makerRewardsBalance.plus(
    event.params.amount.toBigDecimal()
  );
  userEarning.makerRewardsTotal = userEarning.makerRewardsTotal.plus(
    event.params.amount.toBigDecimal()
  );

  userEarning.save();

  //
  // Reaction
  //
  let reaction = Reaction.load(event.params.reactionId.toHexString());
  if (reaction == null) {
    reaction = new Reaction(event.params.reactionId.toHexString());
  }
  reaction.makerFeesTotal = reaction.makerFeesTotal.plus(
    event.params.amount.toBigDecimal()
  );

  reaction.save();
}

export function handleERC20RewardsClaimed(event: ERC20RewardsClaimed): void {
  log.log(3, "ERC20RewardsClaimed");
  // address token,
  // uint256 amount,
  // address recipient

  //
  // User Earnings
  //
  let userEarningKey =
    event.params.recipient.toHexString() + event.params.token.toHexString();
  let userEarning = UserEarnings.load(userEarningKey);
  if (userEarning == null) {
    userEarning = new UserEarnings(userEarningKey);
  }

  // zero-out balances
  userEarning.creatorRewardsBalance = BigDecimal.zero();
  userEarning.makerRewardsBalance = BigDecimal.zero();
  userEarning.referrerRewardsBalance = BigDecimal.zero();

  // increase total widthrawls
  userEarning.withdrawTotal = userEarning.withdrawTotal.plus(
    event.params.amount.toBigDecimal()
  );

  userEarning.save();
}
