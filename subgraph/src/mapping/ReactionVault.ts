import {BigInt, Address, log, BigDecimal} from "@graphprotocol/graph-ts";

import {
  Reaction,
  UserReaction,
  UserSpend,
  CuratorVaultToken,
  UserPosition,
  UserEarnings,
} from "../../generated/schema";

import {
  ReactionsPurchased,
  ReactionsSpent,
  CreatorRewardsGranted,
  ReferrerRewardsGranted,
  MakerRewardsGranted,
  ERC20RewardsClaimed,
  TakerWithdraw,
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
    reaction = new Reaction(event.params.reactionId.toHexString());

    // 0?
    reaction.reactionId = event.params.reactionId;

    // null...
    // let transformKey = event.params.transformId.toHexString();
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
    userReaction = new UserReaction(userReactionKey);
    userReaction.user = event.transaction.from;
    userReaction.reaction = reaction.id;
  }
  userReaction.currentBalance = userReaction.currentBalance.plus(
    event.params.quantity
  );
  userReaction.totalPurchased = userReaction.totalPurchased.plus(
    event.params.quantity
  );
  userReaction.save();
}

export function handleReactionsSpent(event: ReactionsSpent): void {
  log.log(3, "ReactionsSpent");
  // uint256 takerNftChainId,
  // address takerNftAddress,
  // uint256 takerNftId,
  // uint256 reactionId,
  // address paymentToken,
  // uint256 quantity,
  // uint256 ipfsMetadataHash,
  // address referrer,
  // address curatorVaultAddress,
  // uint256 curatorTokenId,
  // uint256 curatorTokenAmount,
  // uint256 takerTokenAmount

  //
  // User Reaction
  //
  let userReactionKey =
    event.params.reactionId.toHexString() +
    "-" +
    event.transaction.from.toHexString();
  let userReaction = UserReaction.load(userReactionKey);
  if (userReaction !== null) {
    userReaction.currentBalance = userReaction.currentBalance.minus(
      event.params.quantity
    );
    userReaction.save();
  }

  //
  // UserSpend
  //
  let userSpendKey =
    event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let userSpend = new UserSpend(userSpendKey);
  userSpend.user = event.transaction.from;
  userSpend.reaction = event.params.reactionId.toHexString();
  userSpend.reactionQuantity = event.params.quantity;
  userSpend.reactionIpfsHash = event.params.ipfsMetadataHash;
  userSpend.curatorVaultToken = event.params.curatorTokenId.toHexString();
  userSpend.curatorTokensPurchased = event.params.curatorTokenAmount;
  userSpend.save();

  //
  // CuratorVaultToken: increase curatorVaultToken.takerTokensAvailable
  //
  let curatorVaultTokenKey = event.params.curatorTokenId.toHexString();
  let curatorVaultToken = CuratorVaultToken.load(curatorVaultTokenKey);
  if (curatorVaultToken == null) {
    curatorVaultToken = new CuratorVaultToken(curatorVaultTokenKey);
    curatorVaultToken.nftChainId = event.params.takerNftChainId;
    curatorVaultToken.nftContractAddress = event.params.takerNftAddress;
    curatorVaultToken.nftId = event.params.takerNftId;
    curatorVaultToken.paymentToken = event.params.paymentToken;
    curatorVaultToken.curatorVaultAddress = event.params.curatorVaultAddress;
    curatorVaultToken.curatorTokenId = event.params.curatorTokenId;
  }
  curatorVaultToken.takerTokensBalance =
    curatorVaultToken.takerTokensBalance.plus(event.params.takerTokenAmount);
  curatorVaultToken.save();

  //
  // UserPosition: increase userPosition.tokensAvailable & userPosition.tokensTotal
  //
  let userPositionKey =
    event.transaction.from.toHexString() +
    "-" +
    event.params.curatorTokenId.toHexString();
  let userPosition = UserPosition.load(userPositionKey);
  if (userPosition == null) {
    userPosition = new UserPosition(userPositionKey);
    userPosition.user = event.transaction.from;
    userPosition.curatorVaultToken = event.params.curatorTokenId.toHexString();
  }
  userPosition.currentTokenBalance = userPosition.currentTokenBalance.plus(
    event.params.curatorTokenAmount
  );
  userPosition.totalTokenPurchased = userPosition.totalTokenPurchased.plus(
    event.params.curatorTokenAmount
  );
  userPosition.save();
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
    userEarning = new UserEarnings(userEarningKey);
    userEarning.paymentToken = event.params.paymentToken;
  }

  // increase creator rewards
  userEarning.currentCreatorRewards = userEarning.currentCreatorRewards.plus(
    event.params.amount.toBigDecimal()
  );
  userEarning.totalCreatorRewards = userEarning.totalCreatorRewards.plus(
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
  reaction.totalCreatorFees = reaction.totalCreatorFees.plus(
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
  userEarning.currentReferrerRewards = userEarning.currentReferrerRewards.plus(
    event.params.amount.toBigDecimal()
  );
  userEarning.totalReferrerRewards = userEarning.totalReferrerRewards.plus(
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
  reaction.totalReferrerFees = reaction.totalReferrerFees.plus(
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
  userEarning.currentMakerRewards = userEarning.currentMakerRewards.plus(
    event.params.amount.toBigDecimal()
  );
  userEarning.totalMakerRewards = userEarning.totalMakerRewards.plus(
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
  reaction.totalMakerFees = reaction.totalMakerFees.plus(
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
  userEarning.currentMakerRewards = BigDecimal.zero();
  userEarning.currentCreatorRewards = BigDecimal.zero();
  userEarning.currentReferrerRewards = BigDecimal.zero();

  // increase total widthrawls
  userEarning.totalRefunded = userEarning.totalRefunded.plus(
    event.params.amount.toBigDecimal()
  );

  userEarning.save();
}

export function handleTakerWithdraw(event: TakerWithdraw): void {
  log.log(3, "TakerWithdraw");
  // uint256 indexed curatorTokenId,
  // uint256 curatorTokensSold,
  // uint256 paymentTokenTaker,
  // uint256 paymentTokenCreator

  //
  // CuratorVaultToken: increase curatorVaultToken.takerTokensAvailable
  //
  let curatorVaultTokenKey = event.params.curatorTokenId.toHexString();
  let curatorVaultToken = CuratorVaultToken.load(curatorVaultTokenKey);
  if (curatorVaultToken !== null) {
    curatorVaultToken.takerTokensBalance =
      curatorVaultToken.takerTokensBalance.minus(
        event.params.curatorTokensSold
      );
    curatorVaultToken.takerRefunded = curatorVaultToken.takerRefunded.plus(
      event.params.paymentTokenTaker
    );
    curatorVaultToken.takerCreatorRefunded =
      curatorVaultToken.takerCreatorRefunded.plus(
        event.params.paymentTokenTaker
      );

    curatorVaultToken.save();
  }
}
