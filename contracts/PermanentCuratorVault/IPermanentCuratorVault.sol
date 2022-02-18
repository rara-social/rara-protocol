//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../Token/IStandard1155.sol";

/// @dev Interface for the curator vault
interface IPermanentCuratorVault {
    function getTokenId(address nftAddress, uint256 nftId)
        external
        returns (uint256);

    function buyCuratorShares(
        address nftAddress,
        uint256 nftId,
        uint256 paymentAmount,
        address mintToAddress
    ) external returns (uint256);

    function sellCuratorShares(
        address nftAddress,
        uint256 nftId,
        uint256 sharesToBurn
    ) external returns (uint256);

    function curatorShares() external returns (IStandard1155);
}
