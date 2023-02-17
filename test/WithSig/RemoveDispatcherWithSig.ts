import {expect} from "chai";
import {ethers} from "hardhat";
import {getRemoveDispatcherWithSigParts} from "../helpers/utils";
import {MAX_UINT256} from "../Scripts/constants";
import {deploySystem} from "../Scripts/setup";

describe("DispatcherManager RemoveDispatcherWithSig", function () {
  it("Can remove a dispatcher", async () => {
    const [OWNER, ACCOUNT, DISPATCHER] = await ethers.getSigners();
    const {dispatcherManager, parameterManager} = await deploySystem(OWNER);

    // Add dispatcher first to test its removal
    await dispatcherManager.connect(ACCOUNT).addDispatcher(DISPATCHER.address);

    const isDispatcherBefore = await dispatcherManager.dispatchersByAccount(
      ACCOUNT.address,
      DISPATCHER.address
    );

    // Dispatcher address is unassociated to start
    expect(isDispatcherBefore).eq(true);

    // Sig retrieval vars
    const signer = ACCOUNT;
    const verifyingContract = dispatcherManager.address;
    // Args for addDispatcherWithSig
    const account = ACCOUNT.address;
    const dispatcher = DISPATCHER.address;

    // Sig validation vars
    const nonce = (await parameterManager.sigNonces(signer.address)).toNumber();
    const deadline = MAX_UINT256;

    const signature = await getRemoveDispatcherWithSigParts(
      signer,
      verifyingContract,
      account,
      dispatcher,
      nonce,
      deadline
    );

    // Emits DispatcherRemoved event
    await expect(
      dispatcherManager.connect(ACCOUNT).removeDispatcherWithSig({
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
      .to.emit(dispatcherManager, "DispatcherRemoved")
      .withArgs(ACCOUNT.address, DISPATCHER.address);

    const isDispatcherAfter = await dispatcherManager.dispatchersByAccount(
      ACCOUNT.address,
      DISPATCHER.address
    );

    // Dispatcher address is associated in end
    expect(isDispatcherAfter).eq(false);
  });
});
