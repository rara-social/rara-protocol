import {BigInt, Address} from "@graphprotocol/graph-ts";

import {
  User,
  Reaction,
  TakerNFT,
  CuratorPosition,
  CuratorReaction,
} from "../../generated/schema";

import {
  CuratorSharesBought,
  CuratorSharesSold,
} from "../../generated/PermanentCuratorVault/PermanentCuratorVault";

export function handleCuratorSharesBought(event: CuratorSharesBought): void {
  // let sender = event.params.sender.toHex();
}

export function handleCuratorSharesSold(event: CuratorSharesSold): void {
  // let sender = event.params.sender.toHex();
}
