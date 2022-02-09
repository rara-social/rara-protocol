//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../../Token/Standard1155.sol";

/// @title CuratorShares1155
/// @dev This contract will be used to track Curator Share ownership
/// Only the Curator Vault can mint or burn shares
contract CuratorShares1155 is Standard1155 {
    /// @dev verifies that the calling account is the curator vault
    modifier onlyCuratorVault() {
        require(
            address(addressManager.defaultCuratorVault()) == msg.sender,
            "Not CuratorVault"
        );
        _;
    }

    /// @dev Allows reaction minter role to mint tokens
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external onlyCuratorVault {
        _mint(to, id, amount, data);
    }

    /// @dev Allows reaction burner role to burn tokens
    function burn(
        address from,
        uint256 id,
        uint256 amount
    ) external onlyCuratorVault {
        _burn(from, id, amount);
    }
}
