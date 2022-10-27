//SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import "../../Token/Standard1155.sol";

/// @title ReactionNft1155
/// @dev This contract will be used to track Reaction NFTs in the protocol.
/// Only the NFT Minter role can mint tokens
/// Only the NFT Burner role can burn tokens
/// Note: This contract is protected via a permissioned account set in the role manager.  Caution should
/// be used as the role owner could renounce the role leaving all future actions disabled.  Additionally,
/// if a malicious account was able to obtain the role, they could use it to mint or burn reactions.
/// See the public documentation website for more details.
contract ReactionNft1155 is Standard1155 {
    /// @dev verifies that the calling account has a role to enable minting tokens
    modifier onlyNftAdmin() {
        IRoleManager roleManager = IRoleManager(addressManager.roleManager());
        require(roleManager.isReactionNftAdmin(msg.sender), "Not NFT Admin");
        _;
    }

    /// @dev Allows reaction minter role to mint tokens
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external onlyNftAdmin {
        _mint(to, id, amount, data);
    }

    /// @dev Allows reaction burner role to burn tokens
    function burn(
        address from,
        uint256 id,
        uint256 amount
    ) external onlyNftAdmin {
        _burn(from, id, amount);
    }

    /// @dev Reaction NFTs are non-transferrable to other accounts.
    /// They are only allowed to be bought or spent.
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155Upgradeable) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        // Only allow minting or burning.  Mints have "from address" of 0x0 and burns have "to address" of 0x0.
        require(
            from == address(0x0) || to == address(0x0),
            "Reaction transfer restricted"
        );
    }

    function setContractUri(string memory _contractUri)
        external
        onlyNftAdmin
        returns (bool success)
    {
        contractURI = _contractUri;

        return true;
    }
}
