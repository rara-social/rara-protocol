//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../Permissions/IRoleManager.sol";
import "./IReactionVault.sol";
import "./ReactionVaultStorage.sol";
import "../Maker/IMakerRegistrar.sol";
import "../Parameters/IParameterManager.sol";
import "../Token/IStandard1155.sol";

/// @title ReactionVault
/// @dev This contract buying and spending reactions
contract ReactionVault is
    IReactionVault,
    Initializable,
    ReentrancyGuardUpgradeable,
    ReactionVaultStorageV1
{
    /// @dev Use the safe methods when interacting with transfers with outside ERC20s
    using SafeERC20Upgradeable for IERC20Upgradeable;

    /// @dev Event emitted when a reaction is purchased
    event ReactionsPurchased(
        uint256 makerNftMetaId,
        uint256 quantity,
        address destinationWallet,
        address referrer,
        uint256 reactionMetaId
    );

    event CreatorRewardsGranted(
        address creator,
        IERC20Upgradeable paymentToken,
        uint256 amount
    );

    event ReferrerRewardsGranted(
        address referrer,
        IERC20Upgradeable paymentToken,
        uint256 amount
    );

    event MakerRewardsGranted(
        address referrer,
        IERC20Upgradeable paymentToken,
        uint256 amount
    );

    /// @dev initializer to call after deployment, can only be called once
    function initialize(IAddressManager _addressManager) public initializer {
        __ReentrancyGuard_init();
        addressManager = _addressManager;
    }

    struct ReactionInfo {
        IMakerRegistrar makerRegistrar;
        IParameterManager parameterManager;
        uint256 sourceId;
        bool registered;
        address owner;
        address creator;
        uint256 reactionPrice;
        uint256 totalPurchasePrice;
        uint256 creatorCut;
        uint256 referrerCut;
        uint256 makerCut;
        uint256 curatorLiabilityCut;
        uint256 parameterVersion;
        uint256 reactionMetaId;
    }

    function buyReaction(
        uint256 makerNftMetaId,
        uint256 quantity,
        address destinationWallet,
        address referrer,
        uint256 optionBits
    ) external nonReentrant {
        // Create a struct to hold local vars (and prevent "stack too deep")
        ReactionInfo memory info;

        // Verify the NFT is registered
        info.makerRegistrar = addressManager.makerRegistrar();
        info.sourceId = info.makerRegistrar.metaToSourceLookup(makerNftMetaId);
        (info.registered, info.owner, info.creator) = info
            .makerRegistrar
            .sourceToDetailsLookup(info.sourceId);
        require(info.registered, "NFT not registered");

        // Move the funds into the this contract from the buyer
        info.parameterManager = addressManager.parameterManager();
        IERC20Upgradeable paymentToken = info.parameterManager.paymentToken();
        info.reactionPrice = info.parameterManager.reactionPrice();
        info.totalPurchasePrice = info.reactionPrice * quantity;
        paymentToken.safeTransferFrom(
            msg.sender,
            address(this),
            info.totalPurchasePrice
        );

        // Assign funds to different stakeholders
        // First, allocate to creator, if set
        info.creatorCut = 0;
        if (info.creator != address(0x0)) {
            // Calc the amount
            info.creatorCut =
                (info.parameterManager.saleCreatorBasisPoints() *
                    info.totalPurchasePrice) /
                10_000;

            // Assign awards to creator
            ownerToRewardsMapping[paymentToken][info.creator] += info
                .creatorCut;
            emit CreatorRewardsGranted(
                info.creator,
                paymentToken,
                info.creatorCut
            );
        }

        // Next, allocate to referrer, if set
        info.referrerCut = 0;
        if (referrer != address(0x0)) {
            // Calc the amount
            info.referrerCut =
                (info.parameterManager.saleReferrerBasisPoints() *
                    info.totalPurchasePrice) /
                10_000;

            // Assign awards to referrer
            ownerToRewardsMapping[paymentToken][referrer] += info.referrerCut;
            emit ReferrerRewardsGranted(
                referrer,
                paymentToken,
                info.referrerCut
            );
        }

        // Next, allocate the amount to the curator liability
        uint256 saleCuratorLiabilityBasisPoints = info
            .parameterManager
            .saleCuratorLiabilityBasisPoints();
        info.curatorLiabilityCut =
            (saleCuratorLiabilityBasisPoints * info.totalPurchasePrice) /
            10_000;

        // Next, to the maker by subtracting the other amounts from the total
        info.makerCut =
            info.totalPurchasePrice -
            info.creatorCut -
            info.referrerCut -
            info.curatorLiabilityCut;

        // Assign awards to maker
        ownerToRewardsMapping[paymentToken][info.owner] += info.makerCut;
        emit MakerRewardsGranted(referrer, paymentToken, info.makerCut);

        // Build the parameter version from the price details
        info.parameterVersion = uint256(
            keccak256(
                abi.encode(
                    paymentToken,
                    info.reactionPrice,
                    saleCuratorLiabilityBasisPoints
                )
            )
        );

        // Build reaction meta ID
        info.reactionMetaId = uint256(
            keccak256(
                abi.encode(
                    REACTION_META_PREFIX,
                    info.parameterVersion,
                    makerNftMetaId,
                    optionBits
                )
            )
        );

        // Save off the details of this reaction purchase info for usage later when they are spent
        reactionPriceDetailsMapping[info.reactionMetaId] = ReactionPriceDetails(
            paymentToken,
            info.reactionPrice,
            saleCuratorLiabilityBasisPoints
        );

        // Mint NFTs to destination wallet
        IStandard1155 reactionNftContract = addressManager
            .reactionNftContract();
        reactionNftContract.mint(
            destinationWallet,
            info.reactionMetaId,
            quantity,
            new bytes(0)
        );

        // Emit event
        emit ReactionsPurchased(
            makerNftMetaId,
            quantity,
            destinationWallet,
            referrer,
            info.reactionMetaId
        );
    }
}
