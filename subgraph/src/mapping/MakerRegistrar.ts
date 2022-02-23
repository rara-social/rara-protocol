import {BigInt, Address, log} from "@graphprotocol/graph-ts";

import {
  User,
  Reaction,
  TakerNFT,
  CuratorPosition,
  CuratorReaction,
} from "../../generated/schema";

import {
  Registered,
  Deregistered,
} from "../../generated/MakerRegistrar/MakerRegistrar";

export function handleRegistered(event: Registered): void {
  // let sender = event.params.sender.toHex();
  log.log(3, "Registered");
}

export function handleDeregistered(event: Deregistered): void {
  log.log(3, "Deregistered");
}

// export function handleBurned(event: Burned): void {
//   // event params
//   let sender = event.params.sender.toHex();
//   let refund = event.params.refund.toBigDecimal();
//   let amount = event.params.amount.toBigDecimal();

//   // Update user balance
//   let user = User.load(sender);
//   user.reserveBalance = user.reserveBalance.minus(refund);
//   user.bondingCurveTokenBalance = user.bondingCurveTokenBalance.minus(amount);
//   user.save();

//   // Record withdraw
//   let withdraw = new Withdraw(event.transaction.hash.toHex());
//   withdraw.sender = sender;
//   withdraw.amount = amount;
//   withdraw.refund = refund;

//   let type = event.params.owner.toHex() === sender ? "OWNER" : "REFUND";
//   withdraw.burnType = type;

//   withdraw.save();
// }

// export function handleTransfer(event: Transfer): void {
//   // event params
//   let sender = event.params.from.toHex();
//   let recipient = event.params.to.toHex();
//   let value = event.params.value.toBigDecimal();

//   // Update user balance
//   // let user = User.load(sender);
//   // user.bondingCurveTokenBalance = user.bondingCurveTokenBalance.minus(value);
//   // user.save();

//   // TODO
//   // let owner = PriorityPricing.owner();
//   // if (sender !== '0x00' && event.params.to === owner) {
//   // }

//   // Record spends
//   let spend = new Spend(event.transaction.hash.toHex());
//   spend.from = sender;
//   spend.to = recipient;
//   spend.value = value;
//   spend.save();
// }
