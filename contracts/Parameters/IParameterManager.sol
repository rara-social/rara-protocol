//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../Permissions/IRoleManager.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

interface IParameterManager {
    /// @dev Getter for the payment token
    function getPaymentToken() external returns (IERC20Upgradeable);

    /// @dev Setter for the payment token
    function setPaymentToken(IERC20Upgradeable _paymentToken) external;

    /// @dev Getter for the reaction price
    function getReactionPrice() external returns (uint256);

    /// @dev Setter for the reaction price
    function setReactionPrice(uint256 _reactionPrice) external;

    /// @dev Getter for the cut of purchase price going to the curator liability
    function getSaleCuratorLiabilityBasisPoints() external returns (uint256);

    /// @dev Setter for the cut of purchase price going to the curator liability
    function setSaleCuratorLiabilityBasisPoints(
        uint256 _saleCuratorLiabilityBasisPoints
    ) external;

    /// @dev Getter for the cut of purchase price going to the creator
    function getSaleCreatorBasisPoints() external returns (uint256);

    /// @dev Setter for the cut of purchase price going to the creator
    function setSaleCreatorBasisPoints(uint256 _saleCreatorBasisPoints)
        external;

    /// @dev Getter for the cut of purchase price going to the referrer
    function getSaleReferrerBasisPoints() external returns (uint256);

    /// @dev Setter for the cut of purchase price going to the referrer
    function setSaleReferrerBasisPoints(uint256 _saleReferrerBasisPoints)
        external;
}
