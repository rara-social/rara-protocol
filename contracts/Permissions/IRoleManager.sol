//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

interface IRoleManager {
    /// @dev Determines if the specified address has permission to mint Reaction NFTs
    /// @param potentialAddress Address to check
    function isReactionMinter(address potentialAddress)
        external
        view
        returns (bool);

    /// @dev Determines if the specified address has permission to burn Reaction NFTs
    /// @param potentialAddress Address to check
    function isReactionBurner(address potentialAddress)
        external
        view
        returns (bool);

    /// @dev Determines if the specified address is an admin account
    /// @param potentialAddress Address to check
    function isAdmin(address potentialAddress) external view returns (bool);
}
