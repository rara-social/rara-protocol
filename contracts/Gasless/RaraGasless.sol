//SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import {DataTypes} from "./DataTypes.sol";
import {ReactionVault} from "../Reactions/ReactionVault.sol";
import {IAddressManager} from "../Config/IAddressManager.sol";

contract RaraGasless {
    string public constant NAME = "RaraGasless";
    bytes32 internal constant EIP712_REVISION_HASH = keccak256("1");
    bytes32 internal constant EIP712_DOMAIN_TYPEHASH =
        keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );
    // TODO: Should this exist separately in an abstract storage contract?
    bytes32 internal constant REACT_WITH_SIG_TYPEHASH =
        keccak256(
            "ReactWithSig(address reactor,uint256 transformId,uint256 quantity,uint256 optionBits,uint256 takerNftChainId,address takerNftAddress,uint256 takerNftId,string ipfsMetadataHash)"
        );

    // Signature Errors
    error SignatureInvalid();
    error SignatureExpired();
    error OnlySupportsFreeReaction();

    ReactionVault public immutable VAULT;
    IAddressManager public immutable ADDRESS_MANAGER;

    mapping(address => uint256) public sigNonces;

    constructor(ReactionVault vault, IAddressManager addressManager) {
        VAULT = vault;
        ADDRESS_MANAGER = addressManager;
    }

    /**
     * @dev Allows a user to react to content & receive a like token without sending any value.
     * This function will allow the user to record their reaction on-chain and collect a "like" token but not purchase any curator tokens.
     */
    function reactWithSig(DataTypes.ReactWithSigData calldata vars) external {
        unchecked {
            _validateRecoveredAddress(
                _calculateDigest(
                    keccak256(
                        abi.encode(
                            REACT_WITH_SIG_TYPEHASH,
                            vars.reactor,
                            vars.transformId,
                            vars.quantity,
                            vars.optionBits,
                            vars.takerNftChainId,
                            vars.takerNftAddress,
                            vars.takerNftId,
                            vars.ipfsMetadataHash,
                            sigNonces[vars.reactor]++,
                            vars.sig.deadline
                        )
                    )
                ),
                vars.reactor,
                vars.sig
            );
        }

        // calc payment parameter version
        uint256 parameterVersion = VAULT.deriveParameterVersion(
            ADDRESS_MANAGER.parameterManager()
        );
        // Build reaction ID
        uint256 reactionId = VAULT.deriveReactionId(
            vars.transformId,
            vars.optionBits,
            parameterVersion
        );

        // TODO: Call external free reaction
        return;
        // VAULT._freeReaction(
        //     vars.transformId,
        //     vars.takerNftChainId,
        //     vars.takerNftAddress,
        //     vars.takerNftId,
        //     reactionId,
        //     vars.quantity,
        //     vars.ipfsMetadataHash
        // );
    }

    /**
     * @dev Wrapper for ecrecover to reduce code size, used in meta-tx specific functions.
     */
    function _validateRecoveredAddress(
        bytes32 digest,
        address expectedAddress,
        DataTypes.EIP712Signature memory sig
    ) internal view {
        if (sig.deadline < block.timestamp) revert SignatureExpired();
        address recoveredAddress = ecrecover(digest, sig.v, sig.r, sig.s);
        if (
            recoveredAddress == address(0) ||
            recoveredAddress != expectedAddress
        ) revert SignatureInvalid();
    }

    /**
     * @dev Calculates EIP712 DOMAIN_SEPARATOR based on the current contract and chain ID.
     */
    function _calculateDomainSeparator() internal view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    EIP712_DOMAIN_TYPEHASH,
                    keccak256(bytes(NAME)),
                    EIP712_REVISION_HASH,
                    block.chainid,
                    address(this)
                )
            );
    }

    /**
     * @dev Calculates EIP712 digest based on the current DOMAIN_SEPARATOR.
     *
     * @param hashedMessage The message hash from which the digest should be calculated.
     *
     * @return bytes32 A 32-byte output representing the EIP712 digest.
     */
    function _calculateDigest(bytes32 hashedMessage)
        internal
        view
        returns (bytes32)
    {
        bytes32 digest;
        unchecked {
            digest = keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    _calculateDomainSeparator(),
                    hashedMessage
                )
            );
        }
        return digest;
    }
}
