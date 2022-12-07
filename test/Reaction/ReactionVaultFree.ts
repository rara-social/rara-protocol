import {expect} from "chai";
import {BigNumber} from "ethers";
import {ethers, upgrades} from "hardhat";
import {ZERO_ADDRESS} from "../Scripts/constants";
import {deploySystem, TEST_REACTION_PRICE} from "../Scripts/setup";
import {deriveTransformId} from "../Scripts/derivedParams";
import {
  NFT_NOT_REGISTERED,
  UNKNOWN_NFT,
  REACTION_QUANTITY_TOO_HIGH,
} from "../Scripts/errors";

describe("ReactionVault Free Reaction", function () {
  it("Should reject unknown transform", async function () {
    const [OWNER] = await ethers.getSigners();
    const {reactionVault} = await deploySystem(OWNER);

    // Trying to buy a reaction for a unknown NFT should fail
    await expect(
      reactionVault.react(
        123456, // uint256 transformId,
        1, // uint256 quantity,
        ZERO_ADDRESS, // address ,
        0, // uint256 optionBits,
        0, // uint256 takerNftChainId,
        ZERO_ADDRESS, // address takerNftAddress,
        0, // uint256 takerNftId,
        ZERO_ADDRESS, // address curatorVaultOverride,
        "ipfsMetadataHash" // string memory
      )
    ).to.revertedWith(UNKNOWN_NFT);
  });

  it("Should reject unregistered transform", async function () {
    const [OWNER, ALICE] = await ethers.getSigners();
    const {reactionVault, testingStandard1155, makerRegistrar, roleManager} =
      await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Now register and unregister an NFT and get the Meta ID
    // Mint an NFT to Alice
    const NFT_ID = "1";
    testingStandard1155.mint(ALICE.address, NFT_ID, "1", [0]);

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        NFT_ID,
        ZERO_ADDRESS,
        "0",
        "0",
        ""
      );

    const NFT_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      testingStandard1155.address,
      NFT_ID
    );

    // Encode the params and hash it to get the meta URI
    const TRANSFORM_ID = deriveTransformId(NFT_SOURCE_ID, BigNumber.from(0));

    // Unregister it
    await makerRegistrar
      .connect(ALICE)
      .deregisterNft(testingStandard1155.address, NFT_ID);

    // verify unregistered transform
    await expect(
      reactionVault.react(
        TRANSFORM_ID, // uint256 transformId,
        1, // uint256 quantity,
        ZERO_ADDRESS, // address ,
        0, // uint256 optionBits,
        chainId, // uint256 takerNftChainId,
        testingStandard1155.address, // address takerNftAddress,
        NFT_ID, // uint256 takerNftId,
        ZERO_ADDRESS, // address curatorVaultOverride,
        "ipfsMetadataHash" // string memory
      )
    ).to.revertedWith(NFT_NOT_REGISTERED);
  });

  it("Should issue a like token", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const {reactionVault, testingStandard1155, makerRegistrar, roleManager} =
      await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Mint an NFT to Alice
    const NFT_ID = "1";
    testingStandard1155.mint(ALICE.address, NFT_ID, "1", [0]);

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        NFT_ID,
        ZERO_ADDRESS,
        "0",
        "0",
        ""
      );

    const NFT_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      testingStandard1155.address,
      NFT_ID
    );

    // Encode the params and hash it to get the meta URI
    const TRANSFORM_ID = deriveTransformId(NFT_SOURCE_ID, BigNumber.from(0));

    // Reacting for free with a registered reaction should succeed
    const tx = await reactionVault.connect(BOB).react(
      TRANSFORM_ID, // uint256 transformId,
      1, // uint256 quantity,
      ZERO_ADDRESS, // address ,
      0, // uint256 optionBits,
      chainId, // uint256 takerNftChainId,
      testingStandard1155.address, // address takerNftAddress,
      NFT_ID, // uint256 takerNftId,
      ZERO_ADDRESS, // address curatorVaultOverride,
      "ipfsMetadataHash" // string memory
    );
    const receipt = await tx.wait();

    // check deployed like contract for balance
    // const LikeToken1155Factory = await ethers.getContractFactory(
    //   "LikeToken1155"
    // );
    // const likeToken = LikeToken1155Factory.attach(
    //   "0x74fcA3bE84BBd0bAE9C973Ca2d16821FEa867fE8" // deployed like contract address is consistent in testing, grab from events
    // );
    // const tokenBalance = await likeToken.balanceOf(BOB.address, "1");
    // expect(tokenBalance).to.equal(1);
  });

  it("Should issue a like token for free and paid reactions", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const {reactionVault, testingStandard1155, makerRegistrar, roleManager} =
      await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Mint an NFT to Alice
    const NFT_ID = "1";
    testingStandard1155.mint(ALICE.address, NFT_ID, "1", [0]);

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        NFT_ID,
        ZERO_ADDRESS,
        "0",
        "0",
        ""
      );

    const NFT_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      testingStandard1155.address,
      NFT_ID
    );

    // Encode the params and hash it to get the meta URI
    const TRANSFORM_ID = deriveTransformId(NFT_SOURCE_ID, BigNumber.from(0));

    // Reacting for free with a registered reaction should succeed
    const tx = await reactionVault.connect(BOB).react(
      TRANSFORM_ID, // uint256 transformId,
      1, // uint256 quantity,
      ZERO_ADDRESS, // address ,
      0, // uint256 optionBits,
      chainId, // uint256 takerNftChainId,
      testingStandard1155.address, // address takerNftAddress,
      NFT_ID, // uint256 takerNftId,
      ZERO_ADDRESS, // address curatorVaultOverride,
      "ipfsMetadataHash" // string memory
    );
    const receipt = await tx.wait();

    // check deployed like contract for balance
    // const LikeToken1155Factory = await ethers.getContractFactory(
    //   "LikeToken1155"
    // );
    // const likeToken = LikeToken1155Factory.attach(
    //   "0xdE1FB1BE65a44C73761ebDABb10c4b101bc819c7" // deployed like contract address is consistent in testing, grab from events
    // );
    // const tokenBalance = await likeToken.balanceOf(BOB.address, "1");
    // expect(tokenBalance).to.equal(1);

    // Reacting for money
    const tx2 = await reactionVault.connect(ALICE).react(
      TRANSFORM_ID, // uint256 transformId,
      1, // uint256 quantity,
      ZERO_ADDRESS, // address ,
      0, // uint256 optionBits,
      chainId, // uint256 takerNftChainId,
      testingStandard1155.address, // address takerNftAddress,
      NFT_ID, // uint256 takerNftId,
      ZERO_ADDRESS, // address curatorVaultOverride,
      "ipfsMetadataHash", // string memory
      {value: TEST_REACTION_PRICE}
    );
    const receipt2 = await tx.wait();

    // check balance of token 2
    // const tokenBalance2 = await likeToken.balanceOf(ALICE.address, "2");
    // expect(tokenBalance2).to.equal(1);

    // Reacting for free with a registered reaction should succeed
    const tx3 = await reactionVault.connect(BOB).react(
      TRANSFORM_ID, // uint256 transformId,
      1, // uint256 quantity,
      ZERO_ADDRESS, // address ,
      0, // uint256 optionBits,
      chainId, // uint256 takerNftChainId,
      testingStandard1155.address, // address takerNftAddress,
      NFT_ID, // uint256 takerNftId,
      ZERO_ADDRESS, // address curatorVaultOverride,
      "ipfsMetadataHash" // string memory
    );
    const receipt3 = await tx.wait();

    // check deployed like contract for balance
    // const tokenBalance3 = await likeToken.balanceOf(BOB.address, "3");
    // expect(tokenBalance3).to.equal(1);
  });

  it("Should prevent spending more reactions than freeReactionLimit param", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const {reactionVault, testingStandard1155, makerRegistrar, roleManager} =
      await deploySystem(OWNER);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    // Mint an NFT to Alice
    const NFT_ID = "1";
    testingStandard1155.mint(ALICE.address, NFT_ID, "1", [0]);

    // Register it
    await makerRegistrar
      .connect(ALICE)
      .registerNft(
        testingStandard1155.address,
        NFT_ID,
        ZERO_ADDRESS,
        "0",
        "0",
        ""
      );

    // Encode the params and hash it to get the meta URI
    const NFT_SOURCE_ID = await makerRegistrar.deriveSourceId(
      chainId,
      testingStandard1155.address,
      NFT_ID
    );
    const TRANSFORM_ID = deriveTransformId(NFT_SOURCE_ID, BigNumber.from(0));

    // Send two reactions => should reject
    const tx = await expect(
      reactionVault.connect(BOB).react(
        TRANSFORM_ID, // uint256 transformId,
        2, // uint256 quantity,
        ZERO_ADDRESS, // address ,
        0, // uint256 optionBits,
        chainId, // uint256 takerNftChainId,
        testingStandard1155.address, // address takerNftAddress,
        NFT_ID, // uint256 takerNftId,
        ZERO_ADDRESS, // address curatorVaultOverride,
        "ipfsMetadataHash" // string memory
      )
    ).to.revertedWith(REACTION_QUANTITY_TOO_HIGH);
  });
});
