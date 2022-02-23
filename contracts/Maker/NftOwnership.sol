//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";

/// @dev This is a library for other contracts to use that need to verify ownership of an NFT.
/// Since this only has internal functions, it will be inlined into the calling contract at
/// compile time and does not need to be separately deployed on chain.
library NftOwnership {
    /// @dev For the specified NFT, verify it is owned by the potential owner
    function _verifyOwnership(
        address nftContractAddress,
        uint256 nftId,
        address potentialOwner
    ) internal view returns (bool) {
        // TODO: support ERC721 + other custom contracts
        uint256 balance = IERC1155Upgradeable(nftContractAddress).balanceOf(
            potentialOwner,
            nftId
        );

        return balance > 0;
    }
}
