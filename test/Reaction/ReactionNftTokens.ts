import { expect } from "chai";
import { ethers } from "hardhat";
import { deploySystem } from "../Scripts/deploy";
import { TEST_NFT_URI } from "../Scripts/constants";
import { REACTION_TRANSER_RESTRICTED } from "../Scripts/errors";

describe("Reaction1155 Token", function () {
  it("Should get initialized with address manager", async function () {
    const [OWNER] = await ethers.getSigners();
    const { reactionNFT1155, addressManager } = await deploySystem(OWNER);

    // Verify the address manager and uri are set
    const setURI = await reactionNFT1155.uri(1);
    expect(setURI).to.equal(TEST_NFT_URI);

    const setAddrssManager = await reactionNFT1155.addressManager();
    expect(setAddrssManager).to.equal(addressManager.address);
  });

  it("Should mint tokens if authorized", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const { reactionNFT1155, roleManager } = await deploySystem(OWNER);

    // Verify Bob's non-authorized acct can't mint
    await expect(
      reactionNFT1155.connect(BOB).mint(ALICE.address, "1", "1000", [0])
    ).to.be.reverted;

    // Grant authorization to Bob
    const reactionMinterRole = await roleManager.REACTION_MINTER_ROLE();
    roleManager.grantRole(reactionMinterRole, BOB.address);

    // Mint again
    reactionNFT1155.connect(BOB).mint(ALICE.address, "1", "1000", [0]);

    // Verify balance
    let balance = await reactionNFT1155.balanceOf(ALICE.address, "1");
    expect(balance.toString()).to.equal("1000");

    // Verify transfer is restricted
    await expect(
      reactionNFT1155
        .connect(ALICE)
        .safeTransferFrom(ALICE.address, BOB.address, "1", "250", [0])
    ).to.be.revertedWith(REACTION_TRANSER_RESTRICTED);

    // Verify Bob balance
    balance = await reactionNFT1155.balanceOf(BOB.address, "1");
    expect(balance.toString()).to.equal("0");
  });
});
