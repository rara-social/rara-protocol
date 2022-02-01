//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

/// @title RoleManagerStorage
/// @dev This contract will hold all local variables for the RoleManager Contract
/// When upgrading the protocol, inherit from this contract on the V2 version and change the
/// StorageManager to inherit from the later version.  This ensures there are no storage layout
/// corruptions when upgrading.
contract RoleManagerStorageV1 {
    /// @dev role for granting capability to mint reactions
    bytes32 public constant REACTION_MINTER_ROLE =
        keccak256("REACTION_MINTER_ROLE");

    /// @dev role for granting capability to burn reactions
    bytes32 public constant REACTION_BURNER_ROLE =
        keccak256("REACTION_BURNER_ROLE");
}

/// On the next version of the protocol, if new variables are added, put them in the below
/// contract and use this as the inheritance chain.
/**
contract RoleManagerStorageV2 is RoleManagerStorageV1 {
  address newVariable;
}
 */
