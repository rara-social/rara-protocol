//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../Config/IAddressManager.sol";
import "./IMakerVault.sol";

/// @title MakerVaultStorage
/// @dev This contract will hold all local variables for the MakerVault Contract
/// When upgrading the protocol, inherit from this contract on the V2 version and change the
/// MakerVault to inherit from the later version.  This ensures there are no storage layout
/// corruptions when upgrading.
contract MakerVaultStorageV1 {
    /// @dev local reference to the address manager contract
    IAddressManager public addressManager;

    /// @dev prefix used in meta ID generation
    string public constant META_PREFIX = "MAKER";

    /// @dev An incrementing unique number assigned to each NFT that is registered.
    /// De-registering and re-registering should use the existing source ID
    uint256 public sourceCount;

    /// @dev Mapping to look up source ID from NFT address and ID
    mapping(address => mapping(uint256 => uint256)) public nftToSourceLookup;

    /// @dev Mapping to look up source ID from meta ID key
    mapping(uint256 => uint256) public metaToSourceLookup;

    /// @dev Mapping to look up nft details from source ID
    mapping(uint256 => IMakerVault.NftDetails) public sourceToDetailsLookup;
}

/// On the next version of the protocol, if new variables are added, put them in the below
/// contract and use this as the inheritance chain.
/**
contract MakerVaultStorageV2 is MakerVaultStorageV1 {
  address newVariable;
}
 */
