import {
  log,
  BigDecimal,
  ipfs,
  json,
  JSONValue,
  BigInt,
} from "@graphprotocol/graph-ts";

import {
  Reaction,
  UserReaction,
  UserSpend,
  CuratorVaultToken,
  UserPosition,
  UserEarning,
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
  let reaction = Reaction.load(event.params.reactionId.toString());
  if (reaction == null) {
    reaction = new Reaction(event.params.reactionId.toString());
    reaction.createdAt = event.block.timestamp;
  }

  reaction.reactionId = event.params.reactionId;
  reaction.transform = event.params.transformId.toString();
  reaction.parameterVersion = event.params.parameterVersion;
  reaction.totalSold = reaction.totalSold.plus(event.params.quantity);

  reaction.updatedAt = event.block.timestamp;
  reaction.blockNumber = event.block.number;
  reaction.save();

  //
  // User Reaction
  //
  let userReactionKey =
    event.params.reactionId.toString() +
    "-" +
    event.transaction.from.toHexString();
  let userReaction = UserReaction.load(userReactionKey);
  if (userReaction == null) {
    userReaction = new UserReaction(userReactionKey);
    userReaction.user = event.transaction.from;
    userReaction.reaction = reaction.id;
    userReaction.createdAt = event.block.timestamp;
  }
  userReaction.currentBalance = userReaction.currentBalance.plus(
    event.params.quantity
  );
  userReaction.totalPurchased = userReaction.totalPurchased.plus(
    event.params.quantity
  );

  userReaction.updatedAt = event.block.timestamp;
  userReaction.blockNumber = event.block.number;
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
  // Reaction
  //
  let reaction = Reaction.load(event.params.reactionId.toString());
  if (reaction == null) {
    reaction = new Reaction(event.params.reactionId.toString());
    reaction.reactionId = event.params.reactionId;
    reaction.createdAt = event.block.timestamp;
    reaction.updatedAt = event.block.timestamp;
    reaction.blockNumber = event.block.number;

    // these are not available for free reactions; they will be set if the reaction is ever purchased
    reaction.transform = "";
    reaction.parameterVersion = new BigInt(0);
    reaction.totalSold = new BigInt(0);

    reaction.save();
  }

  //
  // User Reaction
  //
  let userReactionKey =
    event.params.reactionId.toString() +
    "-" +
    event.transaction.from.toHexString();
  let userReaction = UserReaction.load(userReactionKey);
  if (userReaction !== null) {
    userReaction.currentBalance = userReaction.currentBalance.minus(
      event.params.quantity
    );

    userReaction.updatedAt = event.block.timestamp;
    userReaction.createdAt = event.block.timestamp;
    userReaction.blockNumber = event.block.number;
    userReaction.save();
  }

  //
  // UserSpend
  //
  let userSpendKey =
    event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let userSpend = new UserSpend(userSpendKey);
  userSpend.user = event.transaction.from;
  userSpend.reaction = event.params.reactionId.toString();
  userSpend.reactionQuantity = event.params.quantity;

  // IPFS
  userSpend.ipfsHash = event.params.ipfsMetadataHash;
  const result = ipfs.cat(event.params.ipfsMetadataHash);
  if (result) {
    const data = json.fromBytes(result).toObject();
    let comment = data.get("comment");
    if (comment) {
      userSpend.comment = comment.toString();
    }
    let tags = data.get("tags");
    if (tags) {
      let tagArray = tags.toArray();
      if (tagArray.length > 0) {
        userSpend.tags = tagArray.map<string>((item) => item.toString());
      }
    }
  }

  userSpend.curatorVaultToken = event.params.curatorTokenId.toString();
  userSpend.curatorTokensPurchased = event.params.curatorTokenAmount;

  userSpend.createdAt = event.block.timestamp;
  userSpend.updatedAt = event.block.timestamp;
  userSpend.blockNumber = event.block.number;
  userSpend.save();

  //
  // CuratorVaultToken: increase curatorVaultToken.takerTokensAvailable
  //
  let curatorVaultTokenKey = event.params.curatorTokenId.toString();
  let curatorVaultToken = CuratorVaultToken.load(curatorVaultTokenKey);
  if (curatorVaultToken == null) {
    curatorVaultToken = new CuratorVaultToken(curatorVaultTokenKey);
    curatorVaultToken.nftChainId = event.params.takerNftChainId;
    curatorVaultToken.nftContractAddress = event.params.takerNftAddress;
    curatorVaultToken.nftId = event.params.takerNftId;
    curatorVaultToken.paymentToken = event.params.paymentToken;
    curatorVaultToken.curatorVaultAddress = event.params.curatorVaultAddress;
    curatorVaultToken.curatorTokenId = event.params.curatorTokenId;
    curatorVaultToken.createdAt = event.block.timestamp;
  }
  curatorVaultToken.takerTokensBalance =
    curatorVaultToken.takerTokensBalance.plus(event.params.takerTokenAmount);

  curatorVaultToken.updatedAt = event.block.timestamp;
  curatorVaultToken.blockNumber = event.block.number;
  curatorVaultToken.save();

  //
  // UserPosition: increase userPosition.tokensAvailable & userPosition.tokensTotal
  //
  let userPositionKey =
    event.transaction.from.toHexString() +
    "-" +
    event.params.curatorTokenId.toString();
  let userPosition = UserPosition.load(userPositionKey);
  if (userPosition == null) {
    userPosition = new UserPosition(userPositionKey);
    userPosition.user = event.transaction.from;
    userPosition.curatorVaultToken = event.params.curatorTokenId.toString();
    userPosition.createdAt = event.block.timestamp;
  }
  userPosition.currentTokenBalance = userPosition.currentTokenBalance.plus(
    event.params.curatorTokenAmount
  );
  userPosition.totalTokenPurchased = userPosition.totalTokenPurchased.plus(
    event.params.curatorTokenAmount
  );

  userPosition.updatedAt = event.block.timestamp;
  userPosition.blockNumber = event.block.number;
  userPosition.save();
}

export function handleCreatorRewardsGranted(
  event: CreatorRewardsGranted
): void {
  log.log(3, "CreatorRewardsGranted");
  // address creator,
  // IERC20Upgradeable paymentToken,
  // uint256 amount,
  // uint256 reactionId

  //
  // User Earnings
  //
  let userEarningKey =
    event.params.creator.toHexString() +
    "-" +
    event.params.paymentToken.toHexString();
  let userEarning = UserEarning.load(userEarningKey);
  if (userEarning == null) {
    userEarning = new UserEarning(userEarningKey);
    userEarning.paymentToken = event.params.paymentToken;
    userEarning.user = event.params.creator;
    userEarning.createdAt = event.block.timestamp;
  }

  // increase creator rewards
  userEarning.currentCreatorRewards = userEarning.currentCreatorRewards.plus(
    event.params.amount.toBigDecimal()
  );
  userEarning.totalCreatorRewards = userEarning.totalCreatorRewards.plus(
    event.params.amount.toBigDecimal()
  );

  userEarning.updatedAt = event.block.timestamp;
  userEarning.blockNumber = event.block.number;
  userEarning.save();

  //
  // Reaction
  //
  let reaction = Reaction.load(event.params.reactionId.toString());
  if (reaction == null) {
    reaction = new Reaction(event.params.reactionId.toString());
    reaction.createdAt = event.block.timestamp;
  }
  reaction.totalCreatorFees = reaction.totalCreatorFees.plus(
    event.params.amount.toBigDecimal()
  );

  reaction.updatedAt = event.block.timestamp;
  reaction.blockNumber = event.block.number;
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
    "-" +
    event.params.paymentToken.toHexString();
  let userEarning = UserEarning.load(userEarningKey);
  if (userEarning == null) {
    userEarning = new UserEarning(userEarningKey);
    userEarning.paymentToken = event.params.paymentToken;
    userEarning.user = event.params.referrer;
    userEarning.createdAt = event.block.timestamp;
  }

  // increase creator rewards
  userEarning.currentReferrerRewards = userEarning.currentReferrerRewards.plus(
    event.params.amount.toBigDecimal()
  );
  userEarning.totalReferrerRewards = userEarning.totalReferrerRewards.plus(
    event.params.amount.toBigDecimal()
  );

  userEarning.updatedAt = event.block.timestamp;
  userEarning.blockNumber = event.block.number;
  userEarning.save();

  //
  // Reaction
  //
  let reaction = Reaction.load(event.params.reactionId.toString());
  if (reaction == null) {
    reaction = new Reaction(event.params.reactionId.toString());
    reaction.createdAt = event.block.timestamp;
  }
  reaction.totalReferrerFees = reaction.totalReferrerFees.plus(
    event.params.amount.toBigDecimal()
  );

  reaction.updatedAt = event.block.timestamp;
  reaction.blockNumber = event.block.number;
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
    event.params.maker.toHexString() +
    "-" +
    event.params.paymentToken.toHexString();
  let userEarning = UserEarning.load(userEarningKey);
  if (userEarning == null) {
    userEarning = new UserEarning(userEarningKey);
    userEarning.paymentToken = event.params.paymentToken;
    userEarning.user = event.params.maker;
    userEarning.createdAt = event.block.timestamp;
  }

  // increase creator rewards
  userEarning.currentMakerRewards = userEarning.currentMakerRewards.plus(
    event.params.amount.toBigDecimal()
  );
  userEarning.totalMakerRewards = userEarning.totalMakerRewards.plus(
    event.params.amount.toBigDecimal()
  );

  userEarning.updatedAt = event.block.timestamp;
  userEarning.blockNumber = event.block.number;
  userEarning.save();

  //
  // Reaction
  //
  let reaction = Reaction.load(event.params.reactionId.toString());
  if (reaction == null) {
    reaction = new Reaction(event.params.reactionId.toString());
    reaction.createdAt = event.block.timestamp;
  }
  reaction.totalMakerFees = reaction.totalMakerFees.plus(
    event.params.amount.toBigDecimal()
  );

  reaction.updatedAt = event.block.timestamp;
  reaction.blockNumber = event.block.number;
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
    event.params.recipient.toHexString() +
    "-" +
    event.params.token.toHexString();
  let userEarning = UserEarning.load(userEarningKey);
  if (userEarning !== null) {
    // zero-out balances
    userEarning.currentMakerRewards = BigDecimal.zero();
    userEarning.currentCreatorRewards = BigDecimal.zero();
    userEarning.currentReferrerRewards = BigDecimal.zero();

    // increase total widthrawls
    userEarning.totalRefunded = userEarning.totalRefunded.plus(
      event.params.amount.toBigDecimal()
    );

    userEarning.updatedAt = event.block.timestamp;
    userEarning.blockNumber = event.block.number;
    userEarning.save();
  }
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
  let curatorVaultTokenKey = event.params.curatorTokenId.toString();
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
    curatorVaultToken.updatedAt = event.block.timestamp;
    curatorVaultToken.blockNumber = event.block.number;
    curatorVaultToken.save();
  }
}
