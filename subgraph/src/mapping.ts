import { BigInt, Address } from '@graphprotocol/graph-ts';
import {
  PriorityPricing,
  Minted,
  Burned,
  Transfer,
} from '../generated/PriorityPricing/PriorityPricing';
import { User, Withdraw, Spend } from '../generated/schema';

export function handleMinted(event: Minted): void {
  let sender = event.params.sender.toHex();

  let user = User.load(sender);
  if (user == null) {
    user = new User(sender);
    user.reserveBalance = event.params.deposit.toBigDecimal();
    user.bondingCurveTokenBalance = event.params.amount.toBigDecimal();
  } else {
    user.reserveBalance = event.params.deposit
      .toBigDecimal()
      .plus(user.reserveBalance);
    user.bondingCurveTokenBalance = event.params.amount
      .toBigDecimal()
      .plus(user.bondingCurveTokenBalance);
  }
  user.save();
}

export function handleBurned(event: Burned): void {
  // event params
  let sender = event.params.sender.toHex();
  let refund = event.params.refund.toBigDecimal();
  let amount = event.params.amount.toBigDecimal();

  // Update user balance
  let user = User.load(sender);
  user.reserveBalance = user.reserveBalance.minus(refund);
  user.bondingCurveTokenBalance = user.bondingCurveTokenBalance.minus(amount);
  user.save();

  // Record withdraw
  let withdraw = new Withdraw(event.transaction.hash.toHex());
  withdraw.sender = sender;
  withdraw.amount = amount;
  withdraw.refund = refund;

  let type = event.params.owner.toHex() === sender ? 'OWNER' : 'REFUND';
  withdraw.burnType = type;

  withdraw.save();
}

export function handleTransfer(event: Transfer): void {
  // event params
  let sender = event.params.from.toHex();
  let recipient = event.params.to.toHex();
  let value = event.params.value.toBigDecimal();

  // Update user balance
  // let user = User.load(sender);
  // user.bondingCurveTokenBalance = user.bondingCurveTokenBalance.minus(value);
  // user.save();

  // TODO
  // let owner = PriorityPricing.owner();
  // if (sender !== '0x00' && event.params.to === owner) {
  // }

  // Record spends
  let spend = new Spend(event.transaction.hash.toHex());
  spend.from = sender;
  spend.to = recipient;
  spend.value = value;
  spend.save();
}
