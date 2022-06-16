import {BigInt, Address, log} from "@graphprotocol/graph-ts";

import {CuratorVaultToken, UserPosition} from "../../generated/schema";

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
  let curatorVaultTokenKey = event.params.curatorTokenId.toString();
  let curatorVaultToken = CuratorVaultToken.load(curatorVaultTokenKey);
  if (curatorVaultToken == null) {
    curatorVaultToken = new CuratorVaultToken(curatorVaultTokenKey);
    curatorVaultToken.curatorVaultAddress = event.address;
    curatorVaultToken.curatorTokenId = event.params.curatorTokenId;
    curatorVaultToken.nftChainId = event.params.nftChainId;
    curatorVaultToken.nftContractAddress = event.params.nftAddress;
    curatorVaultToken.nftId = event.params.nftId;
    curatorVaultToken.paymentToken = event.params.paymentToken;
    curatorVaultToken.createdAt = event.block.timestamp;
  }

  // increase current balances
  curatorVaultToken.currentTokensOutstanding =
    curatorVaultToken.currentTokensOutstanding.plus(
      event.params.curatorTokensBought
    );
  curatorVaultToken.currentDepositBalance =
    curatorVaultToken.currentDepositBalance.plus(
      event.params.paymentTokenPaid.toBigDecimal()
    );

  // increase historical totals
  curatorVaultToken.totalTokenSold = curatorVaultToken.totalTokenSold.plus(
    event.params.curatorTokensBought
  );
  curatorVaultToken.totalDeposited = curatorVaultToken.totalDeposited.plus(
    event.params.paymentTokenPaid.toBigDecimal()
  );

  curatorVaultToken.updatedAt = event.block.timestamp;
  curatorVaultToken.blockNumber = event.block.number;
  curatorVaultToken.save();
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
  let curatorVaultTokenKey = event.params.curatorTokenId.toString();
  let curatorVaultToken = CuratorVaultToken.load(curatorVaultTokenKey);
  if (curatorVaultToken == null) {
    curatorVaultToken = new CuratorVaultToken(curatorVaultTokenKey);
    curatorVaultToken.createdAt = event.block.timestamp;
  }

  // decrease current balances
  curatorVaultToken.currentTokensOutstanding =
    curatorVaultToken.currentTokensOutstanding.minus(
      event.params.curatorTokensSold
    );
  curatorVaultToken.currentDepositBalance =
    curatorVaultToken.currentDepositBalance.minus(
      event.params.paymentTokenRefunded.toBigDecimal()
    );

  curatorVaultToken.updatedAt = event.block.timestamp;
  curatorVaultToken.blockNumber = event.block.number;
  curatorVaultToken.save();

  //
  // UserPosition
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

  // decrease token balance
  userPosition.currentTokenBalance = userPosition.currentTokenBalance.minus(
    event.params.curatorTokensSold
  );

  // increase refund balance
  userPosition.totalRefunded = userPosition.totalRefunded.plus(
    event.params.paymentTokenRefunded.toBigDecimal()
  );

  userPosition.updatedAt = event.block.timestamp;
  userPosition.blockNumber = event.block.number;
  userPosition.save();
}
