import {expect} from "chai";
import {ethers, upgrades} from "hardhat";
import {deploySystem} from "../Scripts/setup";
import {
  TEST_NFT_URI,
  TEST_CONTRACT_URI,
  TEST_LIKE_NFT_URI,
} from "../Scripts/constants";
import {
  LIKE_TRANSFER_RESTRICTED,
  NO_TOKENS_TO_BURN,
  REACTION_TRANSFER_RESTRICTED,
} from "../Scripts/errors";

describe("LikeToken1155", function () {
  it("Should get initialized with address manager", async function () {
    const [OWNER] = await ethers.getSigners();
    const {addressManager} = await deploySystem(OWNER);

    const LikeToken1155Factory = await ethers.getContractFactory(
      "LikeToken1155"
    );
    const deployedTest1155 = await upgrades.deployProxy(LikeToken1155Factory, [
      TEST_NFT_URI,
      addressManager.address,
      TEST_LIKE_NFT_URI + "/contract/0X",
    ]);
    const likeToken = LikeToken1155Factory.attach(deployedTest1155.address);

    // Verify the address manager and uri are set
    const setURI = await likeToken.uri(1);
    expect(setURI).to.equal(TEST_NFT_URI);

    const setAddressManager = await likeToken.addressManager();
    expect(setAddressManager).to.equal(addressManager.address);
  });

  it("Should mint tokens if authorized", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const {addressManager} = await deploySystem(OWNER);

    const LikeToken1155Factory = await ethers.getContractFactory(
      "LikeToken1155"
    );
    const deployedTest1155 = await upgrades.deployProxy(LikeToken1155Factory, [
      TEST_NFT_URI,
      addressManager.address,
      TEST_LIKE_NFT_URI + "/contract/0X",
    ]);
    const likeToken = LikeToken1155Factory.attach(deployedTest1155.address);

    // Verify Bob's non-authorized acct can't mint
    await expect(likeToken.connect(BOB).mint(ALICE.address)).to.be.reverted;

    // Grant authorization to Bob by setting him as the factory
    await addressManager.setLikeTokenFactory(BOB.address);

    // Mint again
    await likeToken.connect(BOB).mint(ALICE.address);

    // Verify balance
    let balance = await likeToken.balanceOf(ALICE.address, "1");
    expect(balance.toString()).to.equal("1");

    // Verify Bob balance
    balance = await likeToken.balanceOf(BOB.address, "1");
    expect(balance.toString()).to.equal("0");
  });

  it("Should increment token IDs", async function () {
    const [OWNER, ALICE, BOB, CAROL] = await ethers.getSigners();
    const {addressManager} = await deploySystem(OWNER);
    const LikeToken1155Factory = await ethers.getContractFactory(
      "LikeToken1155"
    );
    const deployedTest1155 = await upgrades.deployProxy(LikeToken1155Factory, [
      TEST_NFT_URI,
      addressManager.address,
      TEST_LIKE_NFT_URI + "/contract/0X",
    ]);
    const likeToken = LikeToken1155Factory.attach(deployedTest1155.address);

    // Grant authorization to Bob by setting him as the factory
    await addressManager.setLikeTokenFactory(BOB.address);

    // Mint 1
    await likeToken.connect(BOB).mint(ALICE.address);
    let balance = await likeToken.balanceOf(ALICE.address, "1");
    expect(balance.toString()).to.equal("1");

    // Mint 2
    await likeToken.connect(BOB).mint(ALICE.address);
    balance = await likeToken.balanceOf(ALICE.address, "2");
    expect(balance.toString()).to.equal("1");

    // Mint 3
    await likeToken.connect(BOB).mint(CAROL.address);
    balance = await likeToken.balanceOf(CAROL.address, "3");
    expect(balance.toString()).to.equal("1");
  });

  it("Should burn owned tokens", async function () {
    const [OWNER, ALICE, BOB, CAROL] = await ethers.getSigners();
    const {addressManager} = await deploySystem(OWNER);
    const LikeToken1155Factory = await ethers.getContractFactory(
      "LikeToken1155"
    );
    const deployedTest1155 = await upgrades.deployProxy(LikeToken1155Factory, [
      TEST_NFT_URI,
      addressManager.address,
      TEST_LIKE_NFT_URI + "/contract/0X",
    ]);
    const likeToken = LikeToken1155Factory.attach(deployedTest1155.address);

    // Grant authorization to Bob by setting him as the factory
    await addressManager.setLikeTokenFactory(BOB.address);

    // Mint 1
    await likeToken.connect(BOB).mint(ALICE.address);
    let balance = await likeToken.balanceOf(ALICE.address, "1");
    expect(balance.toString()).to.equal("1");

    // Carol should not be able to burn the token she doesn't own
    await expect(likeToken.connect(CAROL).burn("1")).to.be.revertedWith(
      NO_TOKENS_TO_BURN
    );

    // Allow Alice to burn her own token
    await likeToken.connect(ALICE).burn("1");
    balance = await likeToken.balanceOf(ALICE.address, "1");
    expect(balance.toString()).to.equal("0");

    // Second time should fail
    await expect(likeToken.connect(ALICE).burn("1")).to.be.revertedWith(
      NO_TOKENS_TO_BURN
    );
  });

  it("Should prevent transfer", async function () {
    const [OWNER, ALICE, BOB, CAROL] = await ethers.getSigners();
    const {addressManager} = await deploySystem(OWNER);
    const LikeToken1155Factory = await ethers.getContractFactory(
      "LikeToken1155"
    );
    const deployedTest1155 = await upgrades.deployProxy(LikeToken1155Factory, [
      TEST_NFT_URI,
      addressManager.address,
      TEST_LIKE_NFT_URI + "/contract/0X",
    ]);
    const likeToken = LikeToken1155Factory.attach(deployedTest1155.address);

    // Verify transfer is restricted
    await expect(
      likeToken
        .connect(ALICE)
        .safeTransferFrom(ALICE.address, BOB.address, "1", "1", [0])
    ).to.be.revertedWith(LIKE_TRANSFER_RESTRICTED);
  });

  it("Should have contractUri set", async function () {
    const [OWNER, ALICE, BOB, CAROL] = await ethers.getSigners();
    const {addressManager} = await deploySystem(OWNER);
    const LikeToken1155Factory = await ethers.getContractFactory(
      "LikeToken1155"
    );
    const deployedTest1155 = await upgrades.deployProxy(LikeToken1155Factory, [
      TEST_NFT_URI,
      addressManager.address,
      TEST_LIKE_NFT_URI + "contract/0X",
    ]);
    const likeToken = LikeToken1155Factory.attach(deployedTest1155.address);

    // check for contractURI
    let contractURI = await likeToken.contractURI();
    expect(contractURI).to.equal(TEST_LIKE_NFT_URI + "contract/0X");
  });
});
