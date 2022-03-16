import {BigInt, Address, log} from "@graphprotocol/graph-ts";

import {User, CuratorVaultToken, UserPosition} from "../../generated/schema";

import {
  CuratorSharesBought,
  CuratorSharesSold,
} from "../../generated/PermanentCuratorVault/PermanentCuratorVault";

export function handleCuratorSharesBought(event: CuratorSharesBought): void {
  log.log(3, "CuratorSharesBought");
  // uint256 indexed curatorShareTokenId,
  // uint256 nftChainId,
  // address nftAddress,
  // uint256 nftId,
  // IERC20Upgradeable paymentToken,
  // uint256 paymentTokenPaid,
  // uint256 curatorSharesBought,
  // bool isTakerPosition

  //
  // CuratorVaultToken
  //

  // load CuratorVaultToken
  let curatorVaultTokenKey = event.params.curatorShareTokenId.toHexString();
  let curatorVaultToken = CuratorVaultToken.load(curatorVaultTokenKey);
  if (curatorVaultToken == null) {
    // type CuratorVaultToken @entity {
    //   id: ID! #curatorTokenId
    //   curatorVaultAddress: Bytes!
    //   curatorTokenId: BigInt!
    //   nftChainId: BigInt!
    //   nftContractAddress: Bytes!
    //   nftId: BigInt!
    //   paymentToken: Bytes!
    //   sharesOutstanding: BigInt
    //   currentBalance: BigDecimal
    //   sharesTotal: BigInt
    //   depositsTotal: BigDecimal
    // }
    curatorVaultToken = new CuratorVaultToken(curatorVaultTokenKey);
    // curatorVaultToken.curatorVaultAddress: Bytes! TODO
    curatorVaultToken.curatorTokenId = event.params.curatorShareTokenId;
    curatorVaultToken.nftChainId = event.params.nftChainId;
    curatorVaultToken.nftContractAddress = event.params.nftAddress;
    curatorVaultToken.nftId = event.params.nftId;
    curatorVaultToken.paymentToken = event.params.paymentToken;
  }

  // increase shares
  curatorVaultToken.sharesOutstanding =
    curatorVaultToken.sharesOutstanding.plus(event.params.curatorSharesBought);

  curatorVaultToken.sharesTotal = curatorVaultToken.sharesTotal.plus(
    event.params.curatorSharesBought
  );

  // increase balance
  curatorVaultToken.currentBalance = curatorVaultToken.currentBalance.plus(
    event.params.paymentTokenPaid.toBigDecimal()
  );
  curatorVaultToken.depositsTotal = curatorVaultToken.depositsTotal.plus(
    event.params.paymentTokenPaid.toBigDecimal()
  );

  curatorVaultToken.save();

  //
  // UserPosition
  //
  let sender = event.transaction.from.toHexString();
  let user = User.load(sender);
  if (user == null) {
    user = new User(sender);
  }
  user.save();

  // load user
  let userPositionKey =
    event.transaction.from.toHexString() +
    event.params.curatorShareTokenId.toHexString();
  let userPosition = UserPosition.load(userPositionKey);
  if (userPosition == null) {
    // id: ID! #msg.sender + curatorTokenId
    // user: User!
    // isTakerPostion: Boolean!
    // curatorVaultToken: CuratorVaultToken!
    // sharesAvailable: BigInt!
    // sharesTotal: BigInt
    // refundsTotal: BigDecimal
    userPosition = new UserPosition(userPositionKey);
    userPosition.user = user.id;
    userPosition.isTakerPostion = event.params.isTakerPosition;
    userPosition.curatorVaultToken = curatorVaultToken.id;
  }

  userPosition.sharesAvailable = userPosition.sharesAvailable.plus(
    event.params.curatorSharesBought
  );
  userPosition.sharesTotal = userPosition.sharesTotal.plus(
    event.params.curatorSharesBought
  );

  userPosition.save();
}

export function handleCuratorSharesSold(event: CuratorSharesSold): void {
  log.log(3, "CuratorSharesSold");
  // uint256 indexed curatorShareTokenId,
  // uint256 paymentTokenRefunded,
  // uint256 curatorSharesSold

  //
  // CuratorVaultToken
  //

  // load CuratorVaultToken
  let curatorVaultTokenKey = event.params.curatorShareTokenId.toHexString();
  let curatorVaultToken = CuratorVaultToken.load(curatorVaultTokenKey);
  if (curatorVaultToken == null) {
    curatorVaultToken = new CuratorVaultToken(curatorVaultTokenKey);
  }

  // decrease shares
  curatorVaultToken.sharesOutstanding =
    curatorVaultToken.sharesOutstanding.minus(event.params.curatorSharesSold);

  // decrease balance
  curatorVaultToken.currentBalance = curatorVaultToken.currentBalance.minus(
    event.params.paymentTokenRefunded.toBigDecimal()
  );

  curatorVaultToken.save();

  //
  // UserPosition
  //

  // load user
  let userPositionKey =
    event.transaction.from.toHexString() +
    event.params.curatorShareTokenId.toHexString();
  let userPosition = UserPosition.load(userPositionKey);
  if (userPosition == null) {
    userPosition = new UserPosition(userPositionKey);
  }

  userPosition.sharesAvailable = userPosition.sharesAvailable.minus(
    event.params.curatorSharesSold
  );

  userPosition.save();
}
