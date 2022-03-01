import {BigInt, Address, log} from "@graphprotocol/graph-ts";

import {User, TakerNFT, CuratorPosition} from "../../generated/schema";

import {
  CuratorSharesBought,
  CuratorSharesSold,
} from "../../generated/PermanentCuratorVault/PermanentCuratorVault";

export function handleCuratorSharesBought(event: CuratorSharesBought): void {
  log.log(3, "CuratorSharesBought");

  // load user
  let sender = event.transaction.from.toHexString();
  let user = User.load(sender);
  if (user == null) {
    user = new User(sender);
  }
  user.save();

  //
  // TakerNft
  //
  let takerNft = TakerNFT.load(event.params.curatorShareTokenId.toHexString());
  if (takerNft == null) {
    takerNft = new TakerNFT(event.params.curatorShareTokenId.toHexString());
    takerNft.nftChainId = event.params.nftChainId;
    takerNft.nftContractAddress = event.params.nftContractAddress;
    takerNft.nftId = event.params.nftId;
  }

  // increment share count
  takerNft.curatorShareCount = event.params.curatorSharesBought
    .toBigDecimal()
    .plus(takerNft.curatorShareCount);

  // increment balance
  takerNft.curatorShareBalance = event.params.paymentTokenPaid
    .toBigDecimal()
    .plus(takerNft.curatorShareBalance);

  takerNft.save();

  //
  // CuratorPosition
  //
  let curatorPositionId = event.transaction.from + "-" + takerNft.id; // calc id from msg.sender + takerNft.id
  let curatorPosition = CuratorPosition.load(curatorPositionId);
  if (curatorPosition == null) {
    // init new position
    curatorPosition = new CuratorPosition(curatorPositionId);
    curatorPosition.curator = user.id;
    curatorPosition.isTakerShares = event.params.isTakerShares;
    curatorPosition.shareCount = event.params.curatorSharesBought;
  } else {
    // increase share count
    curatorPosition.shareCount = event.params.curatorSharesBought
      .toBigDecimal()
      .plus(curatorPosition.shareCount);
  }
  curatorPosition.save();
}

export function handleCuratorSharesSold(event: CuratorSharesSold): void {
  log.log(3, "CuratorSharesSold");

  //
  // TakerNft
  //
  let takerNft = TakerNFT.load(event.params.curatorShareTokenId.toHexString());

  // decrease share count
  takerNft.curatorShareCount = takerNft.curatorShareCount.minus(
    event.params.curatorSharesSold.toBigDecimal()
  );

  // decrease balance
  takerNft.curatorShareBalance = takerNft.curatorShareBalance.minus(
    event.params.paymentTokenRefunded.toBigDecimal()
  );
  takerNft.save();

  //
  // CuratorPosition
  //
  let curatorPositionId = event.transaction.from + "-" + takerNft.id; // calc id from msg.sender + takerNft.id
  let curatorPosition = CuratorPosition.load(curatorPositionId);

  // decrease share count
  curatorPosition.shareCount = event.params.curatorSharesSold.minus(
    curatorPosition.shareCount.toBigDecimal()
  );

  curatorPosition.save();
}
