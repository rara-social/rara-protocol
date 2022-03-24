import {BigInt, Address, log} from "@graphprotocol/graph-ts";

import {User, CuratorVaultToken, UserPosition} from "../../generated/schema";

import {
  CuratorTokensBought,
  CuratorTokensSold,
} from "../../generated/CuratorVault/SigmoidCuratorVault";

export function handleCuratorTokensBought(event: CuratorTokensBought): void {
  log.log(3, "CuratorTokensBought");
  // uint256 indexed curatorTokenId,
  // uint256 nftChainId,
  // address nftAddress,
  // uint256 nftId,
  // IERC20Upgradeable paymentToken,
  // uint256 paymentTokenPaid,
  // uint256 curatorTokensBought,
  // bool isTakerPosition

  //
  // CuratorVaultToken
  //

  // load CuratorVaultToken
  let curatorVaultTokenKey = event.params.curatorTokenId.toHexString();
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
    //   tokensOutstanding: BigInt
    //   currentBalance: BigDecimal
    //   tokensTotal: BigInt
    //   depositsTotal: BigDecimal
    // }
    curatorVaultToken = new CuratorVaultToken(curatorVaultTokenKey);
    // curatorVaultToken.curatorVaultAddress: Bytes! TODO
    curatorVaultToken.curatorTokenId = event.params.curatorTokenId;
    curatorVaultToken.nftChainId = event.params.nftChainId;
    curatorVaultToken.nftContractAddress = event.params.nftAddress;
    curatorVaultToken.nftId = event.params.nftId;
    curatorVaultToken.paymentToken = event.params.paymentToken;
  }

  // increase tokens
  curatorVaultToken.tokensOutstanding =
    curatorVaultToken.tokensOutstanding.plus(event.params.curatorTokensBought);

  curatorVaultToken.tokensTotal = curatorVaultToken.tokensTotal.plus(
    event.params.curatorTokensBought
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
    event.params.curatorTokenId.toHexString();
  let userPosition = UserPosition.load(userPositionKey);
  if (userPosition == null) {
    // id: ID! #msg.sender + curatorTokenId
    // user: User!
    // isTakerPostion: Boolean!
    // curatorVaultToken: CuratorVaultToken!
    // tokensAvailable: BigInt!
    // tokensTotal: BigInt
    // refundsTotal: BigDecimal
    userPosition = new UserPosition(userPositionKey);
    userPosition.user = user.id;
    userPosition.isTakerPostion = event.params.isTakerPosition;
    userPosition.curatorVaultToken = curatorVaultToken.id;
  }

  userPosition.tokensAvailable = userPosition.tokensAvailable.plus(
    event.params.curatorTokensBought
  );
  userPosition.tokensTotal = userPosition.tokensTotal.plus(
    event.params.curatorTokensBought
  );

  userPosition.save();
}

export function handleCuratorTokensSold(event: CuratorTokensSold): void {
  log.log(3, "CuratorTokensSold");
  // uint256 indexed curatorTokenId,
  // uint256 paymentTokenRefunded,
  // uint256 curatorTokensSold

  //
  // CuratorVaultToken
  //

  // load CuratorVaultToken
  let curatorVaultTokenKey = event.params.curatorTokenId.toHexString();
  let curatorVaultToken = CuratorVaultToken.load(curatorVaultTokenKey);
  if (curatorVaultToken == null) {
    curatorVaultToken = new CuratorVaultToken(curatorVaultTokenKey);
  }

  // decrease tokens
  curatorVaultToken.tokensOutstanding =
    curatorVaultToken.tokensOutstanding.minus(event.params.curatorTokensSold);

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
    event.params.curatorTokenId.toHexString();
  let userPosition = UserPosition.load(userPositionKey);
  if (userPosition == null) {
    userPosition = new UserPosition(userPositionKey);
  }

  userPosition.tokensAvailable = userPosition.tokensAvailable.minus(
    event.params.curatorTokensSold
  );

  userPosition.save();
}
