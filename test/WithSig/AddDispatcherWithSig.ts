import {expect} from "chai";
import {ethers} from "hardhat";
import {getAddDispatcherWithSigParts} from "../helpers/utils";
import {MAX_UINT256} from "../Scripts/constants";
import {deploySystem} from "../Scripts/setup";

describe("DispatcherManager AddDispatcherWithSig", function () {
  it("Can add a dispatcher", async () => {
    const [OWNER, ACCOUNT, DISPATCHER] = await ethers.getSigners();
    const {dispatcherManager, parameterManager} = await deploySystem(OWNER);

    const isDispatcherBefore = await dispatcherManager.dispatchersByAccount(
      ACCOUNT.address,
      DISPATCHER.address
    );

    // Dispatcher address is unassociated to start
    expect(isDispatcherBefore).eq(false);

    // Sig retrieval vars
    const signer = ACCOUNT;
    const verifyingContract = dispatcherManager.address;
    // Args for addDispatcherWithSig
    const account = ACCOUNT.address;
    const dispatcher = DISPATCHER.address;

    // Sig validation vars
    const nonce = (await parameterManager.sigNonces(signer.address)).toNumber();
    const deadline = MAX_UINT256;

    const signature = await getAddDispatcherWithSigParts(
      signer,
      verifyingContract,
      account,
      dispatcher,
      nonce,
      deadline
    );

    // Emits DispatcherAdded event
    await expect(
      dispatcherManager.connect(ACCOUNT).addDispatcherWithSig({
        account,
        dispatcher,
        sig: {
          v: signature.v,
          r: signature.r,
          s: signature.s,
          deadline: MAX_UINT256,
        },
      })
    )
      .to.emit(dispatcherManager, "DispatcherAdded")
      .withArgs(ACCOUNT.address, DISPATCHER.address);

    const isDispatcherAfter = await dispatcherManager.dispatchersByAccount(
      ACCOUNT.address,
      DISPATCHER.address
    );

    // Dispatcher address is associated in end
    expect(isDispatcherAfter).eq(true);
  });
});
