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
/// and deregister any NFTs owned in their wallet.
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

    /// @dev Event triggered when an NFT is deregistered from the system
    event Deregistered(
        address indexed nftContractAddress,
        uint256 indexed nftID,
        address indexed ownerAddress,
        uint256 sourceId
    );

    /// @dev initializer to call after deployment, can only be called once
    function initialize(IAddressManager _addressManager) public initializer {
        addressManager = _addressManager;
    }

    /// @dev For the specified NFT, verify it is owned by the potential owner
    function verifyOwnership(
        address nftContractAddress,
        uint256 nftID,
        address potentialOwner
    ) public view returns (bool) {
        // TODO: support ERC721 + other custom contracts
        uint256 balance = IERC1155Upgradeable(nftContractAddress).balanceOf(
            potentialOwner,
            nftID
        );

        return balance > 0;
    }

    /// @dev Allows a NFT owner to register the NFT in the protocol so that reactions can be sold.
    /// Owner registering must own the NFT in the wallet calling function.
    function registerNFT(
        address nftContractAddress,
        uint256 nftID,
        address creatorAddress,
        uint256 optionBits
    ) external {
        // Verify ownership
        require(
            verifyOwnership(nftContractAddress, nftID, msg.sender),
            "NFT not owned"
        );

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

    /// @dev Allow an NFT owner to deregister and remove capability for reactions to be sold.
    /// Caller must currently own the NFT being deregistered
    function deregisterNFT(address nftContractAddress, uint256 nftID) external {
        // Verify ownership
        require(
            verifyOwnership(nftContractAddress, nftID, msg.sender),
            "NFT not owned"
        );

        // Look up source ID and verify it is valid
        uint256 sourceId = nftToSourceLookup[nftContractAddress][nftID];
        require(sourceId > 0, "NFT not found");

        // Verify it is registered
        NftDetails storage details = sourceToDetailsLookup[sourceId];
        require(details.registered, "NFT not registered");

        // Update the param
        details.registered = false;

        emit Deregistered(nftContractAddress, nftID, msg.sender, sourceId);
    }
}
