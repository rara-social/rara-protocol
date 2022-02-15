//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol";
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
    ERC1155HolderUpgradeable,
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

    event ReactionsSpent(
        address takerNftAddress,
        uint256 takerNftId,
        uint256 reactionMetaId,
        uint256 quantity,
        address referrer
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
        address maker,
        IERC20Upgradeable paymentToken,
        uint256 amount
    );

    event TakerRewardsGranted(
        address takerNftAddress,
        uint256 takerNftId,
        address curatorVault,
        uint256 curatorTokenId,
        uint256 curatorShareAmount
    );

    event SpenderRewardsGranted(
        address takerNftAddress,
        uint256 takerNftId,
        address curatorVault,
        uint256 curatorTokenId,
        uint256 curatorShareAmount
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

        // Get the NFT Source ID from the maker registrar
        info.makerRegistrar = addressManager.makerRegistrar();
        info.sourceId = info.makerRegistrar.metaToSourceLookup(makerNftMetaId);
        require(info.sourceId != 0, "Unknown NFT");

        // Verify it is registered
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
        emit MakerRewardsGranted(info.owner, paymentToken, info.makerCut);

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

    struct SpendInfo {
        IStandard1155 reactionNftContract;
        ReactionPriceDetails reactionDetails;
        uint256 totalCuratorLiability;
        uint256 referrerCut;
        uint256 takerAmount;
        uint256 spenderAmount;
        IPermanentCuratorVault curatorVault;
        uint256 takerCuratorShares;
        uint256 spenderCuratorShares;
        address spenderRewardsDestination;
    }

    /// @dev Spend a reaction targeted at a specified taker NFT
    function spendReaction(
        address takerNftAddress,
        uint256 takerNftId,
        uint256 reactionMetaId,
        uint256 reactionQuantity,
        address referrer,
        address curatorVaultOverride,
        address spenderRewardsDestOverride
    ) external nonReentrant {
        // Verify quantity
        require(reactionQuantity > 0, "Invalid 0 input");

        // Create a struct to hold local vars (and prevent "stack too deep")
        SpendInfo memory info;

        // Burn reactions from sender
        info.reactionNftContract = addressManager.reactionNftContract();
        info.reactionNftContract.burn(
            msg.sender,
            reactionMetaId,
            reactionQuantity
        );

        // Look up curator vault liability details from when the reaction was purchased
        info.reactionDetails = reactionPriceDetailsMapping[reactionMetaId];

        // Calculate the total amount of curator liability will be used to spend
        // the reactions when buying curator shares
        info.totalCuratorLiability =
            (info.reactionDetails.reactionPrice *
                info.reactionDetails.saleCuratorLiabilityBasisPoints *
                reactionQuantity) /
            10_000;

        // If there is a referrer on the spend, subtract the amount and assign it
        if (referrer != address(0)) {
            // Calc the amount
            info.referrerCut =
                (addressManager.parameterManager().spendReferrerBasisPoints() *
                    info.totalCuratorLiability) /
                10_000;

            // Assign awards to referrer
            ownerToRewardsMapping[info.reactionDetails.paymentToken][
                referrer
            ] += info.referrerCut;
            emit ReferrerRewardsGranted(
                referrer,
                info.reactionDetails.paymentToken,
                info.referrerCut
            );

            // Subtract the referrer cut from the total being used going forward
            info.totalCuratorLiability -= info.referrerCut;
        }

        // Calc the amount of curator liability being used for the taker
        info.takerAmount =
            (info.totalCuratorLiability *
                addressManager.parameterManager().spendTakerBasisPoints()) /
            10_000;

        // The remaining amount goes to the spender
        info.spenderAmount = info.totalCuratorLiability - info.takerAmount;

        // Get the default curator vault
        info.curatorVault = addressManager.defaultCuratorVault();

        // If a custom Curator Vault was passed in, verify it and use it instead
        if (curatorVaultOverride != address(0)) {
            require(
                addressManager.parameterManager().approvedCuratorVaults(
                    curatorVaultOverride
                ),
                "Err CuratorVault"
            );
            info.curatorVault = IPermanentCuratorVault(curatorVaultOverride);
        }

        // Get the token ID for this taker
        uint256 curatorTokenId = info.curatorVault.getTokenId(
            takerNftAddress,
            takerNftId
        );

        // Approve the full amount
        info.reactionDetails.paymentToken.approve(
            address(info.curatorVault),
            info.totalCuratorLiability
        );

        // Buy shares for the taker and store them in this contract
        info.takerCuratorShares = info.curatorVault.buyCuratorShares(
            takerNftAddress,
            takerNftId,
            info.takerAmount,
            address(this)
        );

        // Allocate rewards for the future NFT Owner
        nftOwnerRewards[takerNftAddress][takerNftId][
            address(info.curatorVault.curatorShares())
        ][curatorTokenId] += info.takerCuratorShares;

        // Emit event
        emit TakerRewardsGranted(
            takerNftAddress,
            takerNftId,
            address(info.curatorVault),
            curatorTokenId,
            info.takerCuratorShares
        );

        // Override the target of where spender curator shares will end up, if set
        info.spenderRewardsDestination = spenderRewardsDestOverride ==
            address(0x0)
            ? msg.sender
            : spenderRewardsDestOverride;

        // Buy shares for the spender.  Shares get sent directly to their address.
        info.spenderCuratorShares = info.curatorVault.buyCuratorShares(
            takerNftAddress,
            takerNftId,
            info.spenderAmount,
            info.spenderRewardsDestination
        );

        // Emit event for spender rewards
        emit SpenderRewardsGranted(
            takerNftAddress,
            takerNftId,
            address(info.curatorVault),
            curatorTokenId,
            info.spenderCuratorShares
        );

        // Emit the event for the overall reaction spend
        emit ReactionsSpent(
            takerNftAddress,
            takerNftId,
            reactionMetaId,
            reactionQuantity,
            referrer
        );
    }
}
