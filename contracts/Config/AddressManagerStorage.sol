//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../Permissions/IRoleManager.sol";

/// @title AddressManagerStorage
/// @dev This contract will hold all local variables for the AddressManager Contract
/// When upgrading the protocol, inherit from this contract on the V2 version and change the
/// AddressManager to inherit from the later version.  This ensures there are no storage layout
/// corruptions when upgrading.
contract AddressManagerStorageV1 {
    /// @dev Local reference to the role manager contract
    IRoleManager public roleManager;
}

/// On the next version of the protocol, if new variables are added, put them in the below
/// contract and use this as the inheritance chain.
/**
contract AddressManagerStorageV2 is AddressManagerStorageV1 {
  address newVariable;
}
 */
