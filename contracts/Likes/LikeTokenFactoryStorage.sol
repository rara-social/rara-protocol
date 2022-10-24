//SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import "../Config/IAddressManager.sol";
import "./Token/ILikeToken1155.sol";

/// @title LikeTokenFactoryStorageV1
/// @dev This contract will hold all local variables for the LikeTokenFactory Contract
/// When upgrading the protocol, inherit from this contract on the V2 version and change the
/// LikeTokenFactory to inherit from the later version.  This ensures there are no storage layout
/// corruptions when upgrading.
contract LikeTokenFactoryStorageV1 {
    /// @dev local storage of the address manager
    IAddressManager public addressManager;

    /// @dev mapping for deployed like token contracts - key is hash of NFT details
    mapping(uint256 => ILikeToken1155) public likeTokens;

    /// @dev the implementation address of the token contract
    address public tokenImplementation;

    /// @dev the base string for the token URIs that will be set on the like tokens
    /// The base token uri should be set to a format similar to "https://www.rara.social/tokens"
    /// When a like token is created, it will append the token contract "address" and "{id}" so the final
    /// uri on an individual token will look like:
    ///   "https://www.rara.social/tokens/E5BA5c73378BC8Da94738CB04490680ae3eab88C/{id}"
    string public baseTokenUri;
}

/// On the next version of the protocol, if new variables are added, put them in the below
/// contract and use this as the inheritance chain.
/**
contract LikeTokenFactoryStorageV2 is LikeTokenFactoryStorageV1 {
  address newVariable;
}
 */
