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
        uint256 nftCreatorSaleBasisPoints,
        uint256 registrationSourceId,
        uint256 registrationMetaId,
        uint256 registrationOptionBits
    );

    /// @dev Event triggered when an NFT is deregistered from the system
    event Deregistered(
        uint256 nftChainId,
        address indexed nftContractAddress,
        uint256 indexed nftId,
        address indexed nftOwnerAddress,
        uint256 registrationMetaId
    );

    /// @dev initializer to call after deployment, can only be called once
    function initialize(IAddressManager _addressManager) public initializer {
        addressManager = _addressManager;
    }

    function nftToSourceLookup(
        uint256 chainId,
        address nftContractAddress,
        uint256 nftId
    ) external pure returns (uint256) {
        return _nftToSourceLookup(chainId, nftContractAddress, nftId);
    }

    function _nftToSourceLookup(
        uint256 chainId,
        address nftContractAddress,
        uint256 nftId
    ) internal pure returns (uint256) {
        return
            uint256(keccak256(abi.encode(chainId, nftContractAddress, nftId)));
    }

    /// @dev For the specified NFT, verify it is owned by the potential owner
    /// @param nftContractAddress - Address of NFT to be registered
    /// @param nftId - ID of NFT to be registered
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
    /// @param nftContractAddress - Address of NFT to be registered
    /// @param nftId - ID of NFT to be registered
    /// @param nftCreatorAddress - (optional) Address of the creator to give creatorSaleBasisPoints cut of Maker rewards
    /// @param creatorSaleBasisPoints (optional) Basis points for the creator during a reaction sale
    ///        This is the percentage of the Maker rewards to give to the Creator
    ///        Basis points are percentage divided by 100 (e.g. 100 Basis Points is 1%)
    /// @param optionBits - (optional) Params to allow owner to specify options or transformations
    ///        performed during registration
    function registerNft(
        address nftContractAddress,
        uint256 nftId,
        address nftCreatorAddress,
        uint256 creatorSaleBasisPoints,
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
            nftCreatorAddress,
            creatorSaleBasisPoints,
            optionBits
        );
    }

    function registerNftFromBridge(
        address owner,
        uint256 chainId,
        address nftContractAddress,
        uint256 nftId,
        address creatorAddress,
        uint256 creatorSaleBasisPoints,
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
            creatorSaleBasisPoints,
            optionBits
        );
    }

    /// @dev Register an NFT from an owner
    /// @param nftChainId - Chain where NFT lives
    /// @param nftContractAddress - Address of NFT to be registered
    /// @param nftId - ID of NFT to be registered
    /// @param nftOwnerAddress - The current owner of the NFT - should be verified before calling
    /// @param nftCreatorAddress - (optional) Address of the creator to give creatorSaleBasisPoints cut of Maker rewards
    /// @param creatorSaleBasisPoints (optional) Basis points for the creator during a reaction sale
    ///        This is the percentage of the Maker rewards to give to the Creator
    ///        Basis points are percentage divided by 100 (e.g. 100 Basis Points is 1%)
    /// @param optionBits - (optional) Params to allow owner to specify options or transformations
    ///        performed during registration
    function _registerForOwner(
        uint256 nftChainId,
        address nftContractAddress,
        uint256 nftId,
        address nftOwnerAddress,
        address nftCreatorAddress,
        uint256 creatorSaleBasisPoints,
        uint256 optionBits
    ) internal {
        // TODO: ? Block registration of a RaRa reaction NFT once Reaction Vault is built out

        // Look up the source ID
        uint256 currentSourceId = _nftToSourceLookup(
            nftChainId,
            nftContractAddress,
            nftId
        );

        // If it is already in the system, verify it is not currently registered
        NftDetails memory currentDetails = sourceToDetailsLookup[
            currentSourceId
        ];
        require(!currentDetails.registered, "Already registered");

        // Generate Meta ID
        uint256 metaId = uint256(
            keccak256(
                abi.encode(MAKER_META_PREFIX, currentSourceId, optionBits)
            )
        );

        // Verify that creatorSaleBasisPoints is within bounds (can't allow more than 100%)
        require(creatorSaleBasisPoints <= 10_000, "Invalid creator bp");

        // Register in mappings
        metaToSourceLookup[metaId] = currentSourceId;
        sourceToDetailsLookup[currentSourceId] = NftDetails(
            true,
            nftOwnerAddress,
            nftCreatorAddress,
            metaId,
            creatorSaleBasisPoints
        );

        // Emit event
        emit Registered(
            nftChainId,
            nftContractAddress,
            nftId,
            nftOwnerAddress,
            nftCreatorAddress,
            creatorSaleBasisPoints,
            currentSourceId,
            metaId,
            optionBits
        );
    }

    /// @dev Allow an NFT owner to deregister and remove capability for reactions to be sold.
    /// Caller must currently own the NFT being deregistered
    /// @param nftContractAddress - Address of NFT to be registered
    /// @param nftId - ID of NFT to be registered
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
        uint256 sourceId = _nftToSourceLookup(
            nftChainId,
            nftContractAddress,
            nftId
        );

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
            sourceId
        );
    }
}
