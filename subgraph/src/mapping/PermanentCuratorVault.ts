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
    // takerNft.nftChainId = event.params.nftChainId;
    // takerNft.nftContractAddress = event.params.nftContractAddress;
    // takerNft.nftId = event.params.nftId;
  }

  // increment share count (BigInt)
  takerNft.curatorShareCount = takerNft.curatorShareCount.plus(
    event.params.curatorSharesBought
  );

  // increment balance (BigDecimal)
  takerNft.curatorShareBalance = takerNft.curatorShareBalance.plus(
    event.params.paymentTokenPaid.toBigDecimal()
  );

  takerNft.save();

  //
  // CuratorPosition
  //
  let curatorPositionId =
    event.transaction.from.toHexString() + "-" + takerNft.id; // calc id from msg.sender + takerNft.id
  let curatorPosition = CuratorPosition.load(curatorPositionId);
  if (curatorPosition == null) {
    // init new position
    curatorPosition = new CuratorPosition(curatorPositionId);
    curatorPosition.curator = user.id;
    // curatorPosition.isTakerShares = event.params.isTakerShares;
    curatorPosition.shareCount = event.params.curatorSharesBought;
  } else {
    // increase share count
    curatorPosition.shareCount = curatorPosition.shareCount.plus(
      event.params.curatorSharesBought
    );
  }
  curatorPosition.save();
}

export function handleCuratorSharesSold(event: CuratorSharesSold): void {
  log.log(3, "CuratorSharesSold");

  //
  // TakerNft
  //
  let takerNft = new TakerNFT(event.params.curatorShareTokenId.toHexString());

  // decrease share count
  takerNft.curatorShareCount = takerNft.curatorShareCount.minus(
    event.params.curatorSharesSold
  );

  // decrease balance
  takerNft.curatorShareBalance = takerNft.curatorShareBalance.minus(
    event.params.paymentTokenRefunded.toBigDecimal()
  );
  takerNft.save();

  //
  // CuratorPosition
  //
  let curatorPositionId =
    event.transaction.from.toHexString() + "-" + takerNft.id; // calc id from msg.sender + takerNft.id
  let curatorPosition = new CuratorPosition(curatorPositionId);

  // decrease share count
  curatorPosition.shareCount = curatorPosition.shareCount.minus(
    event.params.curatorSharesSold
  );

  curatorPosition.save();
}
