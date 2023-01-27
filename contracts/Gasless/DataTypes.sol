//SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

/// @title DataTypes
/// @dev A standard library of data types used throughout the Rara Protocol
library DataTypes {
    /// @notice A struct containing the necessary information to reconstruct an EIP-712 typed data signature.
    /// @param v The signature's recovery parameter.
    /// @param r The signature's r parameter.
    /// @param s The signature's s parameter
    /// @param deadline The signature's deadline
    struct EIP712Signature {
        uint8 v;
        bytes32 r;
        bytes32 s;
        uint256 deadline;
    }

    /// @notice A struct containing the parameters required for the `reactWithSig()` function.
    ///         Parameters are almost the same as the regular `react()` function, with the reactor's (signer) address and an EIP712Signature added.
    /// @param reactor The reactor which is the message signer.
    /// @param transformId Internal id used to derive the reaction token id.
    /// @param quantity How many reactions to spend.
    /// @param optionBits Optional param to specify options how the user wants transform reaction
    /// @param takerNftChainId Chain ID where the NFT lives
    /// @param takerNftAddress Target contract where the reaction is targeting
    /// @param takerNftId Target NFT ID in the contract
    /// @param ipfsMetadataHash Optional hash of any metadata being associated with spend action
    /// @param sig The EIP712Signature struct containing the follower's signature.
    struct ReactWithSigData {
        address reactor;
        uint256 transformId;
        uint256 quantity;
        uint256 optionBits;
        uint256 takerNftChainId;
        address takerNftAddress;
        uint256 takerNftId;
        string ipfsMetadataHash;
        EIP712Signature sig;
    }
}
