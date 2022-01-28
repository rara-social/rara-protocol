//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./IRoleManager.sol";
import "./RoleManagerStorage.sol";

/// @title RoleManager
/// @dev This contract will track the roles and permissions in the RARA protocol
contract RoleManager is IRoleManager, AccessControlUpgradeable, RoleManagerStorageV1  {
  
  function initialize(address protocolAdmin) public initializer {
    __AccessControl_init();
    _setupRole(DEFAULT_ADMIN_ROLE, protocolAdmin);
  }

  /// @dev Determines if the specified address has permission to mint Reaction NFTs
  /// @param potentialAddress Address to check
  function isReactionMinter(address potentialAddress) external view returns (bool) {
    return hasRole(REACTION_MINTER_ROLE, potentialAddress);
  }
}