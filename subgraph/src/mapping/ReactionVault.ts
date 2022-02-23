import {BigInt, Address} from "@graphprotocol/graph-ts";

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
  // let sender = event.params.sender.toHex();
}

export function handleReactionsSpent(event: ReactionsSpent): void {
  // let sender = event.params.sender.toHex();
}

export function handleCreatorRewardsGranted(
  event: CreatorRewardsGranted
): void {
  // let sender = event.params.sender.toHex();
}

export function handleReferrerRewardsGranted(
  event: ReferrerRewardsGranted
): void {
  // let sender = event.params.sender.toHex();
}

export function handleTakerRewardsGranted(event: TakerRewardsGranted): void {
  // let sender = event.params.sender.toHex();
}

export function handleMakerRewardsGranted(event: MakerRewardsGranted): void {
  // let sender = event.params.sender.toHex();
}

export function handleSpenderRewardsGranted(
  event: SpenderRewardsGranted
): void {
  // let sender = event.params.sender.toHex();
}

export function handleERC20RewardsClaimed(event: ERC20RewardsClaimed): void {
  // let sender = event.params.sender.toHex();
}
