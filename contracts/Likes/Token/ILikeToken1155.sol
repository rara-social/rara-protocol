//SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

/// @dev Interface for the LikeToken1155 toke contract.
interface ILikeToken1155 {
    /// @dev initialize the state
    function initialize(string memory _uri, address _addressManager) external;

    /// @dev Allows a priviledged account to mint a token to the specified address
    function mint(address to) external;

    /// @dev Allows the owner to burn a token to from their address
    function burn(uint256 id) external;
}
