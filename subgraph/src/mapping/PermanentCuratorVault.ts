import {BigInt, Address, log} from "@graphprotocol/graph-ts";

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
  log.log(3, "CuratorSharesBought");
}

export function handleCuratorSharesSold(event: CuratorSharesSold): void {
  log.log(3, "CuratorSharesSold");
}
