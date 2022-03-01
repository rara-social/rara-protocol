//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "../Permissions/IRoleManager.sol";
import "./IMakerRegistrar.sol";
import "./MakerRegistrarStorage.sol";
import "./NftOwnership.sol";

/// @title MakerRegistrar
/// @dev This contract tracks registered NFTs.  Owners of an NFT can register
/// and deregister any NFTs owned in their wallet.
/// Also, for the mappings, it is assumed the protocol will always look up the current owner of
/// an NFT when running logic (which is why the owner address is not stored).  If desired, an
/// off-chain indexer like The Graph can index registration addresses to NFTs.
contract MakerRegistrar is Initializable, MakerRegistrarStorageV1 {
    /// @dev Event triggered when an NFT is registered in the system
    event Registered(
        uint256 nftChainId,
        address indexed nftContractAddress,
        uint256 indexed nftId,
        address indexed nftOwnerAddress,
        address nftCreatorAddress,
        uint256 reactionSourceId,
        uint256 reactionMetaId,
        uint256 reactionOptionBits
    );

    /// @dev Event triggered when an NFT is deregistered from the system
    event Deregistered(
        uint256 nftChainId,
        address indexed nftContractAddress,
        uint256 indexed nftId,
        address indexed nftOwnerAddress,
        uint256 reactionMetaId
    );

    /// @dev initializer to call after deployment, can only be called once
    function initialize(IAddressManager _addressManager) public initializer {
        addressManager = _addressManager;
    }

    /// @dev For the specified NFT, verify it is owned by the potential owner
    function verifyOwnership(
        address nftContractAddress,
        uint256 nftId,
        address potentialOwner
    ) public view returns (bool) {
        return
            NftOwnership._verifyOwnership(
                nftContractAddress,
                nftId,
                potentialOwner
            );
    }

    /// @dev Allows a NFT owner to register the NFT in the protocol so that reactions can be sold.
    /// Owner registering must own the NFT in the wallet calling function.
    function registerNft(
        address nftContractAddress,
        uint256 nftId,
        address creatorAddress,
        uint256 optionBits
    ) external {
        // Verify ownership
        require(
            verifyOwnership(nftContractAddress, nftId, msg.sender),
            "NFT not owned"
        );

        _registerForOwner(
            block.chainid, // Use current chain ID
            nftContractAddress,
            nftId,
            msg.sender,
            creatorAddress,
            optionBits
        );
    }

    function registerNftFromBridge(
        address owner,
        uint256 chainId,
        address nftContractAddress,
        uint256 nftId,
        address creatorAddress,
        uint256 optionBits
    ) external {
        // Verify caller is Child Registrar from the bridge
        require(msg.sender == addressManager.childRegistrar(), "Not Bridge");

        _registerForOwner(
            chainId,
            nftContractAddress,
            nftId,
            owner,
            creatorAddress,
            optionBits
        );
    }

    function _registerForOwner(
        uint256 nftChainId,
        address nftContractAddress,
        uint256 nftId,
        address nftOwnerAddress,
        address nftCreatorAddress,
        uint256 optionBits
    ) internal {
        // TODO: Block registration of a RaRa reaction NFT once Reaction Vault is built out

        // Look up the source ID
        uint256 currentSourceId = nftToSourceLookup[nftChainId][
            nftContractAddress
        ][nftId];

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
            keccak256(
                abi.encode(MAKER_META_PREFIX, currentSourceId, optionBits)
            )
        );

        // Register in mappings
        nftToSourceLookup[nftChainId][nftContractAddress][
            nftId
        ] = currentSourceId;
        metaToSourceLookup[metaId] = currentSourceId;
        sourceToDetailsLookup[currentSourceId] = NftDetails(
            true,
            nftOwnerAddress,
            nftCreatorAddress,
            metaId
        );

        // Emit event
        emit Registered(
            nftChainId,
            nftContractAddress,
            nftId,
            nftOwnerAddress,
            nftCreatorAddress,
            currentSourceId,
            metaId,
            optionBits
        );
    }

    /// @dev Allow an NFT owner to deregister and remove capability for reactions to be sold.
    /// Caller must currently own the NFT being deregistered
    function deregisterNft(address nftContractAddress, uint256 nftId) external {
        // Verify ownership
        require(
            verifyOwnership(nftContractAddress, nftId, msg.sender),
            "NFT not owned"
        );

        _deregisterNftForOwner(
            block.chainid,
            nftContractAddress,
            nftId,
            msg.sender
        );
    }

    function deRegisterNftFromBridge(
        address owner,
        uint256 chainId,
        address nftContractAddress,
        uint256 nftId
    ) external {
        // Verify caller is Child Registrar from the bridge
        require(msg.sender == addressManager.childRegistrar(), "Not Bridge");

        _deregisterNftForOwner(chainId, nftContractAddress, nftId, owner);
    }

    function _deregisterNftForOwner(
        uint256 nftChainId,
        address nftContractAddress,
        uint256 nftId,
        address nftOwnerAddress
    ) internal {
        // Look up source ID and verify it is valid
        uint256 sourceId = nftToSourceLookup[nftChainId][nftContractAddress][
            nftId
        ];
        require(sourceId > 0, "NFT not found");

        // Verify it is registered
        NftDetails storage details = sourceToDetailsLookup[sourceId];
        require(details.registered, "NFT not registered");

        // Update the param
        details.registered = false;

        emit Deregistered(
            nftChainId,
            nftContractAddress,
            nftId,
            nftOwnerAddress,
            details.reactionMetaId
        );
    }
}
