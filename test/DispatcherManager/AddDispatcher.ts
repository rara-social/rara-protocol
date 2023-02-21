import {expect} from "chai";
import {ethers} from "hardhat";
import {DISPATCHER_ALREADY_ASSIGNED} from "../Scripts/errors";
import {deploySystem} from "../Scripts/setup";

describe("DispatcherManager AddDispatcher", function () {
  it("Can add a dispatcher", async () => {
    const [OWNER, ACCOUNT, DISPATCHER] = await ethers.getSigners();
    const {dispatcherManager} = await deploySystem(OWNER);

    const isDispatcherBefore = await dispatcherManager.dispatchersByAccount(
      ACCOUNT.address,
      DISPATCHER.address
    );

    // Dispatcher address is unassociated to start
    expect(isDispatcherBefore).eq(false);

    // Emits DispatcherAdded event
    await expect(
      dispatcherManager.connect(ACCOUNT).addDispatcher(DISPATCHER.address)
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

  it("Can add multiple dispatchers", async () => {
    const [OWNER, ACCOUNT, DISPATCHER_ONE, DISPATCHER_TWO] =
      await ethers.getSigners();
    const {dispatcherManager} = await deploySystem(OWNER);

    const isDispatcherBefore = await dispatcherManager.dispatchersByAccount(
      ACCOUNT.address,
      DISPATCHER_TWO.address
    );
    expect(isDispatcherBefore).eq(false);

    await dispatcherManager
      .connect(ACCOUNT)
      .addDispatcher(DISPATCHER_ONE.address);
    await dispatcherManager
      .connect(ACCOUNT)
      .addDispatcher(DISPATCHER_TWO.address);

    const isDispatcherAfter = await dispatcherManager.dispatchersByAccount(
      ACCOUNT.address,
      DISPATCHER_TWO.address
    );
    expect(isDispatcherAfter).eq(true);
  });

  it("Cannot add an already assigned dispatcher", async () => {
    const [OWNER, ACCOUNT, DISPATCHER] = await ethers.getSigners();
    const {dispatcherManager} = await deploySystem(OWNER);

    const isDispatcherBefore = await dispatcherManager.dispatchersByAccount(
      ACCOUNT.address,
      DISPATCHER.address
    );

    expect(isDispatcherBefore).eq(false);

    await dispatcherManager.connect(ACCOUNT).addDispatcher(DISPATCHER.address);
    await expect(
      dispatcherManager.connect(ACCOUNT).addDispatcher(DISPATCHER.address)
    ).to.revertedWith(DISPATCHER_ALREADY_ASSIGNED);

    const isDispatcherAfter = await dispatcherManager.dispatchersByAccount(
      ACCOUNT.address,
      DISPATCHER.address
    );
    expect(isDispatcherAfter).eq(true);
  });
});
