//SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

/// @dev Interface for the LikeTokenFactory
interface ILikeTokenFactory {
    /// @dev Issue a like token for a specific NFT
    function issueLikeToken(
        address targetAddress,
        uint256 takerNftChainId,
        address takerNftAddress,
        uint256 takerNftId
    ) external returns (address, uint256);
}
