//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

/// @dev Interface for the maker vault that supports registering and de-registering NFTs
interface IMakerVault {
    /// @dev struct for storing details about a registered NFT
    struct NftDetails {
        bool registered;
        address owner;
        address creator;
    }
}
