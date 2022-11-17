//SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "./ILikeToken1155.sol";
import "./LikeToken1155Storage.sol";

/// @title LikeToken1155
/// @dev This contract implements the 1155 standard and tracks "Likes" in the RaRa platform.
/// When a user reacts to a target NFT, they will be issued a like token.
/// Only a single token per unique ID will ever be issued, and IDs will be incremented in an ascending counter,
///   on each mint.  Only the Like Token Factory can trigger mints.

/// These tokens are non-transferrable.
/// An owner may burn a token from their own wallet.
contract LikeToken1155 is
    ILikeToken1155,
    ERC1155Upgradeable,
    LikeToken1155StorageV1
{
    // Always minting and burning 1 token at a time
    uint8 public constant TOKEN_AMOUNT = 1;

    /// @dev initializer to call after deployment, can only be called once
    function initialize(
        string memory _uri,
        address _addressManager,
        string memory _contractUri
    ) public initializer {
        __ERC1155_init(_uri);

        addressManager = IAddressManager(_addressManager);

        contractURI = _contractUri;
    }

    /// @dev verifies that the calling account is the like token factory
    modifier onlyLikeTokenFactory() {
        require(msg.sender == addressManager.likeTokenFactory(), "Not Factory");
        _;
    }

    /// @dev restrict updates
    modifier onlyNftAdmin() {
        IRoleManager roleManager = IRoleManager(addressManager.roleManager());
        require(roleManager.isReactionNftAdmin(msg.sender), "Not NFT Admin");
        _;
    }

    /// @dev Allows reaction minter role to mint a like token
    function mint(address to) external onlyLikeTokenFactory {
        // Increment the id counter
        idCount = idCount + 1;

        // Mint the token
        _mint(to, idCount, TOKEN_AMOUNT, new bytes(0));
    }

    /// @dev Allows a like token holder to burn their own token
    function burn(uint256 id) external {
        // Burn the token (balance check will be done inside this call)
        _burn(msg.sender, id, TOKEN_AMOUNT);
    }

    /// @dev Like Tokens are non-transferrable to other accounts.
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
            "Like transfer restricted"
        );
    }

    /// @dev update contract URI
    function setContractUri(string memory _contractUri)
        external
        onlyNftAdmin
        returns (bool success)
    {
        contractURI = _contractUri;

        return true;
    }
}
