import { expect } from "chai";
import { ethers } from "hardhat";
import { deploySystem } from "../Scripts/deploy";
import { TEST_NFT_URI } from "../Scripts/constants";

describe("Standard1155 Token", function () {
  it("Should get initialized with address manager", async function () {
    const [OWNER] = await ethers.getSigners();
    const { testingStandard1155, addressManager } = await deploySystem(OWNER);

    // Verify the address manager and uri are set
    const setURI = await testingStandard1155.uri(1);
    expect(setURI).to.equal(TEST_NFT_URI);

    const setAddrssManager = await testingStandard1155.addressManager();
    expect(setAddrssManager).to.equal(addressManager.address);
  });

  it("Should mint tokens if authorized", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const { testingStandard1155 } = await deploySystem(OWNER);

    // Mint
    testingStandard1155.connect(BOB).mint(ALICE.address, "1", "1000", [0]);

    // Verify balance
    let balance = await testingStandard1155.balanceOf(ALICE.address, "1");
    expect(balance.toString()).to.equal("1000");

    // Verify transfer
    await testingStandard1155
      .connect(ALICE)
      .safeTransferFrom(ALICE.address, BOB.address, "1", "250", [0]);

    // Verify Bob balance
    balance = await testingStandard1155.balanceOf(BOB.address, "1");
    expect(balance.toString()).to.equal("250");
  });
});
