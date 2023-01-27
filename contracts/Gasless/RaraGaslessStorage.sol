//SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import {ReactionVault} from "../Reactions/ReactionVault.sol";
import {IAddressManager} from "../Config/IAddressManager.sol";

/// @title RaraGaslessStorage
/// @dev This contract will hold all local variables for the RaraGasless Contract
/// When upgrading the protocol, inherit from this contract on the latest version and change the
/// RaraGasless contract to inherit from the later version.  This ensures there are no storage layout
/// corruptions when upgrading.
abstract contract RaraGaslessStorageV1 {
    /// @dev Local reference to the reaction vault contract
    ReactionVault public reactionVault;

    /// @dev Local reference to the address manager contract
    IAddressManager public addressManager;
}

/// On the next version of the protocol, if new variables are added, put them in the below
/// contract and use this as the inheritance chain.
/**
contract RaraGaslessStorageV2 is RaraGaslessStorageV1 {
  address newVariable;
}
 */
