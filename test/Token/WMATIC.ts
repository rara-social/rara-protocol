import { expect } from "chai";
import { ethers } from "hardhat";
import { deploySystem } from "../Scripts/setup";
import { ZERO_ADDRESS } from "../Scripts/constants";

describe("Wrapped Matic Token", function () {
  it("Should get deployed", async function () {
    const [OWNER] = await ethers.getSigners();
    const { wrappedMatic } = await deploySystem(OWNER);

    expect(wrappedMatic.address).to.not.equal(ZERO_ADDRESS);
  });

  it("Should wrap, transfer, and unwrap", async function () {
    const [OWNER, MINTER, BURNER] = await ethers.getSigners();
    const { wrappedMatic } = await deploySystem(OWNER);

    // Wrap
    await wrappedMatic.connect(MINTER).deposit({ value: "1000" })

    // Verify balance
    let balance = await wrappedMatic.balanceOf(MINTER.address);
    expect(balance.toString()).to.equal("1000");

    // Transfer
    await wrappedMatic.connect(MINTER).transfer(BURNER.address, "500")
    balance = await wrappedMatic.balanceOf(MINTER.address);
    expect(balance.toString()).to.equal("500");

    // Unwrap
    const originalBalance = await BURNER.getBalance()
    const tx = await wrappedMatic.connect(BURNER).withdraw("100")

    // Calc the amount of ETH used in gas for the tx
    const receipt = await tx.wait()
    const gasUsedInEth = receipt.gasUsed.mul(receipt.effectiveGasPrice)

    // Verify the new balance is the old value, plus the unwrap, minus the gas used to unwrap
    expect(await BURNER.getBalance()).to.equal(originalBalance.add("100").sub(gasUsedInEth));

  });
});
