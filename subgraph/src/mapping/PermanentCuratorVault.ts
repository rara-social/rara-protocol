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

    // TODO: init
    // nftChainId: Int!
    // nftContractAddress: Bytes!
    // nftId: Int!
    // nftOwnerAddress: Bytes!
  }

  // increment share count
  takerNft.curatorShareCount = event.params.curatorSharesBought
    .toBigDecimal()
    .plus(takerNft.curatorShareCount);

  // increment balance
  takerNft.curatorShareBalance = event.params.paymentTokenPaid
    .toBigDecimal()
    .plus(takerNft.curatorShareBalance);

  // increment referrer fees balance // TODO: add to event (?)
  // takerNft.referrerFeesBalance = event.params.paymentTokenPaid
  //   .toBigDecimal()
  //   .plus(takerNft.referrerFeesBalance);

  takerNft.save();

  //
  // CuratorReaction
  //
  let curatorReactionId =
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(); // generate unique id from transaction
  let curatorReaction = new CuratorReaction(curatorReactionId);
  curatorReaction.takerNFT = takerNft.id;
  curatorReaction.sharesRecieved =
    event.params.curatorSharesBought.toBigDecimal();
  curatorReaction.curator = user.id;
  // curatorReaction.reaction = ""; // TODO: add to event
  // curatorReaction.quantity = event.params.curatorSharesBought; // TODO: add to event
  curatorReaction.save();

  //
  // CuratorPosition
  //
  let curatorPositionId = event.transaction.from + "-" + takerNft.id; // calc id from msg.sender + takerNft.id
  let curatorPosition = CuratorPosition.load(curatorPositionId);
  if (curatorPosition == null) {
    // init new position
    curatorPosition = new CuratorPosition(curatorPositionId);
    curatorPosition.shareCount = event.params.curatorSharesBought;
    curatorPosition.curator = user.id;
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
