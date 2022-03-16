//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../Token/IStandard1155.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

/// @dev Interface for the curator vault
interface ICuratorVault {
    function getTokenId(
        uint256 nftChainId,
        address nftAddress,
        uint256 nftId,
        IERC20Upgradeable paymentToken
    ) external returns (uint256);

    function buyCuratorShares(
        uint256 nftChainId,
        address nftAddress,
        uint256 nftId,
        IERC20Upgradeable paymentToken,
        uint256 paymentAmount,
        address mintToAddress,
        bool isTakerPosition
    ) external returns (uint256);

    function sellCuratorShares(
        uint256 nftChainId,
        address nftAddress,
        uint256 nftId,
        IERC20Upgradeable paymentToken,
        uint256 sharesToBurn,
        address refundToAddress
    ) external returns (uint256);

    function curatorShares() external returns (IStandard1155);
}
