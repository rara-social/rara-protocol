import {expect} from "chai";
import {ethers} from "hardhat";
import {deploySystem} from "../Scripts/setup";
import {TEST_NFT_URI, TEST_CONTRACT_URI} from "../Scripts/constants";
import {REACTION_TRANSFER_RESTRICTED, NOT_NFT_ADMIN} from "../Scripts/errors";

describe("Reaction1155 Token", function () {
  it("Should get initialized with address manager", async function () {
    const [OWNER] = await ethers.getSigners();
    const {reactionNFT1155, addressManager} = await deploySystem(OWNER);

    // Verify the address manager and uri are set
    const setURI = await reactionNFT1155.uri(1);
    expect(setURI).to.equal(TEST_NFT_URI);

    const setAddressManager = await reactionNFT1155.addressManager();
    expect(setAddressManager).to.equal(addressManager.address);
  });

  it("Should mint tokens if authorized", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const {reactionNFT1155, roleManager} = await deploySystem(OWNER);

    // Verify Bob's non-authorized acct can't mint
    await expect(
      reactionNFT1155.connect(BOB).mint(ALICE.address, "1", "1000", [0])
    ).to.be.reverted;

    // Grant authorization to Bob
    const reactionMinterRole = await roleManager.REACTION_NFT_ADMIN();
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
    ).to.be.revertedWith(REACTION_TRANSFER_RESTRICTED);

    // Verify Bob balance
    balance = await reactionNFT1155.balanceOf(BOB.address, "1");
    expect(balance.toString()).to.equal("0");
  });

  it("Should set contractURI if authorized", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const {reactionNFT1155, roleManager} = await deploySystem(OWNER);

    // check for contractURI
    let contractURI = await reactionNFT1155.contractUri();
    expect(contractURI).to.equal(TEST_CONTRACT_URI);

    // try and set contract URI (unauthorized)
    await expect(
      reactionNFT1155.connect(BOB).setContractUri("should error")
    ).to.be.revertedWith(NOT_NFT_ADMIN);

    // Grant authorization to Bob
    const reactionMinterRole = await roleManager.REACTION_NFT_ADMIN();
    await roleManager.grantRole(reactionMinterRole, BOB.address);

    // try and set contract URI (unauth)
    await reactionNFT1155.connect(BOB).setContractUri("test string");
    contractURI = await reactionNFT1155.contractUri();
    expect(contractURI).to.equal("test string");
  });
});
