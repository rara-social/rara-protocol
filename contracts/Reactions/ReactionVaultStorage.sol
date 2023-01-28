//SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import "../Config/IAddressManager.sol";
import "./IReactionVault.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "./IReactionVault.sol";

/// @title ReactionVaultStorage
/// @dev This contract will hold all local variables for the ReactionVault Contract
/// When upgrading the protocol, inherit from this contract on the V2 version and change the
/// ReactionVault to inherit from the later version.  This ensures there are no storage layout
/// corruptions when upgrading.
contract ReactionVaultStorageV1 is IReactionVault {
    /// @dev prefix used in meta ID generation
    string public constant REACTION_META_PREFIX = "REACTION";

    /// @dev local reference to the address manager contract
    IAddressManager public addressManager;

    /// @dev tracks the accumulated token rewards for acounts that can be withdrawn
    /// ownerToRewardsMapping[token][recipient] => amountOwed
    mapping(IERC20Upgradeable => mapping(address => uint256))
        public ownerToRewardsMapping;

    /// @dev tracks the purchase details for each reaction NFT
    mapping(uint256 => IReactionVault.ReactionPriceDetails)
        public reactionPriceDetailsMapping;

    /// @dev tracks the rewards owed to an NFT owner in an 1155 token
    /// Hash(NftChainId, NftAddress, NftId, RewardTokenAddress, RewardTokenId) -> balance
    mapping(uint256 => uint256) public nftOwnerRewards;
}

contract ReactionVaultStorageV2 is ReactionVaultStorageV1 {
    // Nonce mapping for withSig methods
    mapping(address => uint256) public sigNonces;

    // Typehash for the reactWithSig method
    bytes32 internal constant REACT_WITH_SIG_TYPEHASH =
        keccak256(
            "ReactWithSig(address reactor,uint256 transformId,uint256 quantity,uint256 optionBits,uint256 takerNftChainId,address takerNftAddress,uint256 takerNftId,string ipfsMetadataHash,uint256 nonce,uint256 deadline)"
        );
}

/// On the next version of the protocol, if new variables are added, put them in the below
/// contract and use this as the inheritance chain.
/**
contract ReactionVaultStorageV3 is ReactionVaultStorageV2 {
  address newVariable;
}
 */
