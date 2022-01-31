//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./IRoleManager.sol";
import "./RoleManagerStorage.sol";

/// @title RoleManager
/// @dev This contract will track the roles and permissions in the RARA protocol
contract RoleManager is
    IRoleManager,
    AccessControlUpgradeable,
    RoleManagerStorageV1
{
    /// @dev initializer to call after deployment, can only be called once
    function initialize(address protocolAdmin) public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, protocolAdmin);
    }

    /// @dev Determines if the specified address is the owner account
    /// @param potentialAddress Address to check
    function isAdmin(address potentialAddress) external view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, potentialAddress);
    }

    /// @dev Determines if the specified address has permission to mint Reaction NFTs
    /// @param potentialAddress Address to check
    function isReactionMinter(address potentialAddress)
        external
        view
        returns (bool)
    {
        return hasRole(REACTION_MINTER_ROLE, potentialAddress);
    }

    /// @dev Determines if the specified address has permission to burn Reaction NFTs
    /// @param potentialAddress Address to check
    function isReactionBurner(address potentialAddress)
        external
        view
        returns (bool)
    {
        return hasRole(REACTION_BURNER_ROLE, potentialAddress);
    }
}
