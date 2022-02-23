import {BigInt, Address, log} from "@graphprotocol/graph-ts";

import {
  User,
  Reaction,
  TakerNFT,
  CuratorPosition,
  CuratorReaction,
} from "../../generated/schema";

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
}

export function handleReactionsSpent(event: ReactionsSpent): void {
  log.log(3, "ReactionsSpent");
}

export function handleCreatorRewardsGranted(
  event: CreatorRewardsGranted
): void {
  log.log(3, "CreatorRewardsGranted");
}

export function handleReferrerRewardsGranted(
  event: ReferrerRewardsGranted
): void {
  log.log(3, "ReferrerRewardsGranted");
}

export function handleTakerRewardsGranted(event: TakerRewardsGranted): void {
  log.log(3, "TakerRewardsGranted");
}

export function handleMakerRewardsGranted(event: MakerRewardsGranted): void {
  log.log(3, "MakerRewardsGranted");
}

export function handleSpenderRewardsGranted(
  event: SpenderRewardsGranted
): void {
  log.log(3, "SpenderRewardsGranted");
}

export function handleERC20RewardsClaimed(event: ERC20RewardsClaimed): void {
  log.log(3, "ERC20RewardsClaimed");
}
