//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "../Permissions/IRoleManager.sol";
import "./IMakerVault.sol";
import "./MakerVaultStorage.sol";

/// @title MakerVault
/// @dev This contract tracks registered NFTs.  Owners of an NFT can register
/// and de-register any NFTs owned in their wallet.
/// Also, for the mappings, it is assumed the protocol will always look up the current owner of
/// an NFT when running logic (which is why the owner address is not stored).  If desired, an
/// off-chain indexer like The Graph can index registration addresses to NFTs.
contract MakerVault is IMakerVault, Initializable, MakerVaultStorageV1 {
    /// @dev Event triggered when an NFT is registered in the system
    event Registered(
        address indexed nftContractAddress,
        uint256 indexed nftID,
        address indexed ownerAddress,
        address creatorAddress,
        uint256 optionBits,
        uint256 sourceId,
        uint256 metaId
    );

    /// @dev initializer to call after deployment, can only be called once
    function initialize(IAddressManager _addressManager) public initializer {
        addressManager = _addressManager;
    }

    /// @dev Allows a NFT owner to register the NFT in the protocol.
    /// Owner registering must own the NFT in the wallet calling function.
    function registerNFT(
        address nftContractAddress,
        uint256 nftID,
        address creatorAddress,
        uint256 optionBits
    ) external {
        // Verify ownership
        // TODO: support ERC721 + other custom contracts
        uint256 balance = IERC1155Upgradeable(nftContractAddress).balanceOf(
            msg.sender,
            nftID
        );
        require(balance > 0, "NFT not owned");

        // TODO: Block registration of a RaRa reaction NFT once Reaction Vault is built out

        // Look up the source ID
        uint256 currentSourceId = nftToSourceLookup[nftContractAddress][nftID];

        // Check to see if the source ID is already set for this NFT
        if (currentSourceId > 0) {
            // If it is already in the system, verify it is not currently registered
            NftDetails memory currentDetails = sourceToDetailsLookup[
                currentSourceId
            ];
            require(!currentDetails.registered, "Already registered");
        } else {
            // If not already in the system, increment the source ID to use
            currentSourceId = ++sourceCount;
        }

        // Generate Meta ID
        uint256 metaId = uint256(
            keccak256(abi.encode(META_PREFIX, currentSourceId, optionBits))
        );

        // Register in mappings
        nftToSourceLookup[nftContractAddress][nftID] = currentSourceId;
        metaToSourceLookup[metaId] = currentSourceId;
        sourceToDetailsLookup[currentSourceId] = NftDetails(
            true,
            msg.sender,
            creatorAddress
        );

        // Emit event
        emit Registered(
            nftContractAddress,
            nftID,
            msg.sender,
            creatorAddress,
            optionBits,
            currentSourceId,
            metaId
        );
    }
}
