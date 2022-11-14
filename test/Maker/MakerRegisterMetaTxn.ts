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

const signer = require("../Scripts/signer");
describe("Register Meta Tx", function () {
  it("Build & Verify Txn", async function () {
    const [OWNER, ALICE, BOB] = await ethers.getSigners();
    const {makerRegistrar, testingMinimalForwarder, testingStandard721} =
      await deploySystem(OWNER);

    // Mint an NFT to Alice
    const NFT_ID = "1";
    testingStandard721.mint(ALICE.address, NFT_ID);

    // Build meta Txn
    const {request, signature} = await signer.signMetaTxRequest(
      OWNER.provider,
      testingMinimalForwarder,
      {
        from: OWNER.address,
        to: makerRegistrar.address,
        data: makerRegistrar.interface.encodeFunctionData("registerNft", [
          testingStandard721.address,
          NFT_ID,
          BOB.address,
          "0",
          "0",
          "QmV288zHttJJwPBZAW3L922dBypWqukFNWzekT6chxW4Cu",
        ]),
      }
    );

    // console.log({request, signature});
    expect(
      await testingMinimalForwarder.verify(request, signature)
    ).to.be.equal(true);

    // Error: VM Exception while processing transaction: reverted with reason string 'MinimalForwarder: signature does not match request'
    // const tx = await testingMinimalForwarder.execute(request, signature);
  });
});
