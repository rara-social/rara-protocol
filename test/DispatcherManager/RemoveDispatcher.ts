import {expect} from "chai";
import {ethers} from "hardhat";
import {DISPATCHER_ALREADY_UNASSIGNED} from "../Scripts/errors";
import {deploySystem} from "../Scripts/setup";

describe("DispatcherManager RemoveDispatcher", function () {
  it("Can remove a dispatcher", async () => {
    const [OWNER, ACCOUNT, DISPATCHER] = await ethers.getSigners();
    const {dispatcherManager} = await deploySystem(OWNER);

    // Add dispatcher first to test its removal
    await dispatcherManager.connect(ACCOUNT).addDispatcher(DISPATCHER.address);

    const isDispatcherBefore = await dispatcherManager.dispatchersByAccount(
      ACCOUNT.address,
      DISPATCHER.address
    );

    // Dispatcher address is associated to start
    expect(isDispatcherBefore).eq(true);

    // Emits DispatcherAdded event
    await expect(
      dispatcherManager.connect(ACCOUNT).removeDispatcher(DISPATCHER.address)
    )
      .to.emit(dispatcherManager, "DispatcherRemoved")
      .withArgs(ACCOUNT.address, DISPATCHER.address);

    const isDispatcherAfter = await dispatcherManager.dispatchersByAccount(
      ACCOUNT.address,
      DISPATCHER.address
    );

    // Dispatcher address is unassociated in end
    expect(isDispatcherAfter).eq(false);
  });

  it("Can remove multiple dispatchers", async () => {
    const [OWNER, ACCOUNT, DISPATCHER_ONE, DISPATCHER_TWO] =
      await ethers.getSigners();
    const {dispatcherManager} = await deploySystem(OWNER);

    // Add dispatchers first to test their removal
    await dispatcherManager
      .connect(ACCOUNT)
      .addDispatcher(DISPATCHER_ONE.address);
    await dispatcherManager
      .connect(ACCOUNT)
      .addDispatcher(DISPATCHER_TWO.address);

    const isDispatcherBefore = await dispatcherManager.dispatchersByAccount(
      ACCOUNT.address,
      DISPATCHER_TWO.address
    );
    expect(isDispatcherBefore).eq(true);

    await dispatcherManager
      .connect(ACCOUNT)
      .removeDispatcher(DISPATCHER_ONE.address);
    await dispatcherManager
      .connect(ACCOUNT)
      .removeDispatcher(DISPATCHER_TWO.address);

    const isDispatcherAfter = await dispatcherManager.dispatchersByAccount(
      ACCOUNT.address,
      DISPATCHER_TWO.address
    );
    expect(isDispatcherAfter).eq(false);
  });

  it("Cannot remove an already unassigned dispatcher", async () => {
    const [OWNER, ACCOUNT, DISPATCHER] = await ethers.getSigners();
    const {dispatcherManager} = await deploySystem(OWNER);

    // Add dispatcher first to test its removal
    await dispatcherManager.connect(ACCOUNT).addDispatcher(DISPATCHER.address);

    const isDispatcherBefore = await dispatcherManager.dispatchersByAccount(
      ACCOUNT.address,
      DISPATCHER.address
    );
    expect(isDispatcherBefore).eq(true);

    await dispatcherManager
      .connect(ACCOUNT)
      .removeDispatcher(DISPATCHER.address);
    await expect(
      dispatcherManager.connect(ACCOUNT).removeDispatcher(DISPATCHER.address)
    ).to.revertedWith(DISPATCHER_ALREADY_UNASSIGNED);

    const isDispatcherAfter = await dispatcherManager.dispatchersByAccount(
      ACCOUNT.address,
      DISPATCHER.address
    );
    expect(isDispatcherAfter).eq(false);
  });
});
