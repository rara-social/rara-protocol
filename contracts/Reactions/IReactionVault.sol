//SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.9;
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

/// @dev Interface for the ReactionVault that supports buying and spending reactions
interface IReactionVault {
    struct ReactionPriceDetails {
        IERC20Upgradeable paymentToken;
        uint256 reactionPrice;
        uint256 saleCuratorLiabilityBasisPoints;
    }
}
