//SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;
import "../Token/IWMATIC.sol";

/// @dev Interface for the ReactionVault that supports buying and spending reactions
interface IReactionVault {
    struct ReactionPriceDetails {
        IWMATIC paymentToken;
        uint256 reactionPrice;
        uint256 saleCuratorLiabilityBasisPoints;
    }
}
