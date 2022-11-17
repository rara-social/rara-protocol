import {expect} from "chai";
import {ethers, upgrades} from "hardhat";
import {deploySystem} from "../Scripts/setup";
import {TEST_LIKE_NFT_URI, ZERO_ADDRESS} from "../Scripts/constants";
import {NOT_NFT_ADMIN} from "../Scripts/errors";
import {deriveLikeTokenIndex} from "../Scripts/derivedParams";

describe("LikeTokenFactory", function () {
  it("Should get initialized", async function () {
    const [OWNER] = await ethers.getSigners();
    const {likeTokenImpl, addressManager, likeTokenFactory} =
      await deploySystem(OWNER);

    const setAddressManager = await likeTokenFactory.addressManager();
    expect(setAddressManager).to.equal(addressManager.address);

    const setTokenImpl = await likeTokenFactory.tokenImplementation();
    expect(setTokenImpl).to.equal(likeTokenImpl.address);

    const setUri = await likeTokenFactory.baseTokenUri();
    expect(setUri).to.equal(TEST_LIKE_NFT_URI);
  });

  it("Should gate issuance", async function () {
    const [OWNER] = await ethers.getSigners();
    const {likeTokenFactory, roleManager} = await deploySystem(OWNER);

    // Should fail
    await expect(
      likeTokenFactory.issueLikeToken(OWNER.address, "1", OWNER.address, "1")
    ).to.be.revertedWith(NOT_NFT_ADMIN);

    // Should succeed
    await roleManager.grantRole(
      await roleManager.REACTION_NFT_ADMIN(),
      OWNER.address,
      {gasLimit: "200000"}
    );
    await likeTokenFactory.issueLikeToken(
      OWNER.address,
      "1",
      OWNER.address,
      "1"
    );
  });

  it("Should deploy Token Contract and mint", async function () {
    const [OWNER, BOB] = await ethers.getSigners();
    const {likeTokenFactory, roleManager} = await deploySystem(OWNER);

    const CHAIN_ID = 1;
    const NFT_ADDRESS = BOB.address;
    const NFT_ID = 2;

    // Should start out with Zero address
    const tokenKey = deriveLikeTokenIndex(CHAIN_ID, NFT_ADDRESS, NFT_ID);

    let foundAddress = await likeTokenFactory.likeTokens(tokenKey);
    expect(foundAddress).to.equal(ZERO_ADDRESS);

    // Grant Role to Owner to mint
    await roleManager.grantRole(
      await roleManager.REACTION_NFT_ADMIN(),
      OWNER.address,
      {gasLimit: "200000"}
    );

    // Issue Token
    const tx = await likeTokenFactory.issueLikeToken(
      OWNER.address,
      CHAIN_ID,
      NFT_ADDRESS,
      NFT_ID
    );
    const receipt = await tx.wait();

    const deployEvent = receipt.events?.find(
      (x) => x.event === "TokenDeployed"
    );
    expect(deployEvent).to.not.be.null;

    // Verify event params
    expect(deployEvent!.args!["takerNftChainId"]).to.equal(CHAIN_ID);
    expect(deployEvent!.args!["takerNftAddress"]).to.equal(NFT_ADDRESS);
    expect(deployEvent!.args!["takerNftId"]).to.equal(NFT_ID);

    // Verify the event populated the correct address and it was stored correctly
    const deployedContract = deployEvent!.args!["deployedContract"];
    foundAddress = await likeTokenFactory.likeTokens(tokenKey);
    expect(foundAddress).to.equal(deployedContract);

    // Get an instance of the deployed token contract
    const LikeToken1155Factory = await ethers.getContractFactory(
      "LikeToken1155"
    );
    const likeToken = LikeToken1155Factory.attach(deployedContract);

    // Verify the balance of owner was minted the first token
    let balance = await likeToken.balanceOf(OWNER.address, "1");
    expect(balance).to.equal("1");

    // Verify the URI of the token was set properly
    const uri = await likeToken.uri("1");
    expect(uri).to.equal(
      TEST_LIKE_NFT_URI + String(deployedContract).toLocaleLowerCase() + "/{id}"
    );

    // Issue a token for the same taker NFT  - it should be minted and should have a incremented ID of 2
    await likeTokenFactory.issueLikeToken(
      OWNER.address,
      CHAIN_ID,
      NFT_ADDRESS,
      NFT_ID
    );
    balance = await likeToken.balanceOf(OWNER.address, "2");
    expect(balance).to.equal("1");
  });
});
