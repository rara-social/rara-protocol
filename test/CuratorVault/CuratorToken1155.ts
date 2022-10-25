import {expect} from "chai";
import {ethers} from "hardhat";
import {deploySystem} from "../Scripts/setup";
import {TEST_CONTRACT_URI} from "../Scripts/constants";
import {NOT_ADMIN} from "../Scripts/errors";

describe("CuratorTokens", function () {
  it("Should get initialized with address manager", async function () {
    const [OWNER] = await ethers.getSigners();
    const {curatorToken, addressManager} = await deploySystem(OWNER);

    // Verify the address manager was set
    const currentAddressManager = await curatorToken.addressManager();
    expect(currentAddressManager).to.equal(addressManager.address);
  });

  it("Should only allow curator vault admin to mint or burn", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const {curatorToken, roleManager} = await deploySystem(OWNER);

    // Verify mint fails
    await expect(
      curatorToken.mint(ALICE.address, "1", "1", [0])
    ).to.be.revertedWith(NOT_ADMIN);

    // Set the owner as the curator token admin to test it succeeding
    await roleManager.grantRole(
      await roleManager.CURATOR_TOKEN_ADMIN(),
      OWNER.address
    );

    // Should succeed now
    await curatorToken.mint(ALICE.address, "1", "1", [0]);

    // Bob should not be allowed to burn
    await expect(
      curatorToken.connect(BOB).mint(ALICE.address, "1", "1", [0])
    ).to.be.revertedWith(NOT_ADMIN);

    // Should succeed
    await curatorToken.burn(ALICE.address, "1", "1");
  });

  it("Should set contractURI if authorized", async function () {
    const [OWNER, BOB] = await ethers.getSigners();
    const {curatorToken, roleManager} = await deploySystem(OWNER);

    // check for contractURI
    let contractURI = await curatorToken.contractUri();
    expect(contractURI).to.equal(TEST_CONTRACT_URI);

    // try and set contract URI (unauthorized)
    await expect(
      curatorToken.connect(BOB).setContractUri("should error")
    ).to.be.revertedWith(NOT_ADMIN);

    // Grant authorization to Bob
    const reactionMinterRole = await roleManager.CURATOR_TOKEN_ADMIN();
    await roleManager.grantRole(reactionMinterRole, BOB.address);

    // try and set contract URI (unauth)
    await curatorToken.connect(BOB).setContractUri("test string");
    contractURI = await curatorToken.contractUri();
    expect(contractURI).to.equal("test string");
  });
});
