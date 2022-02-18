//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../../Token/Standard1155.sol";

/// @title ReactionNft1155
/// @dev This contract will be used to track Reaction NFTs in the protocol.
/// Only the NFT Minter role can mint tokens
/// Only the NFT Burner role can burn tokens
contract ReactionNft1155 is Standard1155 {
    /// @dev verifies that the calling account has a role to enable minting tokens
    modifier onlyMinter() {
        IRoleManager roleManager = IRoleManager(addressManager.roleManager());
        require(roleManager.isReactionMinter(msg.sender), "Not Minter");
        _;
    }

    /// @dev verifies that the calling account has a role to enable burning tokens
    modifier onlyBurner() {
        IRoleManager roleManager = IRoleManager(addressManager.roleManager());
        require(roleManager.isReactionBurner(msg.sender), "Not Burner");
        _;
    }

    /// @dev Allows reaction minter role to mint tokens
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external onlyMinter {
        _mint(to, id, amount, data);
    }

    /// @dev Allows reaction burner role to burn tokens
    function burn(
        address from,
        uint256 id,
        uint256 amount
    ) external onlyBurner {
        _burn(from, id, amount);
    }

    // TODO: Block transfer from and transfer to
}
