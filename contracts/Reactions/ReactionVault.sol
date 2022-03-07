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

    /// @dev Event emitted when reaction is spent
    event ReactionsSpent(
        uint256 takerNftChainId,
        address takerNftAddress,
        uint256 takerNftId,
        uint256 reactionMetaId,
        uint256 quantity,
        address referrer,
        uint256 metaDataHash
    );

    /// @dev Event emitted when rewards are granted to a creator
    event CreatorRewardsGranted(
        address creator,
        IERC20Upgradeable paymentToken,
        uint256 amount,
        uint256 reactionMetaId
    );

    /// @dev Event emitted when rewards are granted to a referrer
    event ReferrerRewardsGranted(
        address referrer,
        IERC20Upgradeable paymentToken,
        uint256 amount,
        uint256 reactionMetaId
    );

    /// @dev Event emitted when rewards are granted to a maker
    event MakerRewardsGranted(
        address maker,
        IERC20Upgradeable paymentToken,
        uint256 amount,
        uint256 reactionMetaId
    );

    /// @dev Event emitted when a taker redeems curator shares
    event TakerRewardsSold(
        address takerAddress,
        uint256 takerNftChainId,
        address takerNftAddress,
        uint256 takerNftId,
        address curatorVault,
        uint256 curatorTokenId,
        uint256 curatorShareAmount,
        uint256 paymentTokensReceived
    );

    /// @dev Event emitted when an account withdraws ERC20 rewards
    event ERC20RewardsClaimed(address token, uint256 amount, address recipient);

    /// @dev initializer to call after deployment, can only be called once
    function initialize(IAddressManager _addressManager) public initializer {
        __ReentrancyGuard_init();
        __ERC1155Holder_init();
        addressManager = _addressManager;
    }

    /// @dev Struct to hold local vars in buyReaction()
    struct ReactionInfo {
        IMakerRegistrar makerRegistrar;
        IParameterManager parameterManager;
        uint256 sourceId;
        bool registered;
        address owner;
        address creator;
        uint256 creatorSaleBasisPoints;
        uint256 reactionPrice;
        uint256 totalPurchasePrice;
        uint256 creatorCut;
        uint256 referrerCut;
        uint256 makerCut;
        uint256 curatorLiabilityCut;
        uint256 reactionMetaId;
    }

    /// @dev External func to allow a user to buy reaction NFTs based on a registered Maker NFT
    /// @param makerNftMetaId Meta ID for the Maker NFT that reaction is based on
    /// @param quantity How many reactions to buy
    /// @param destinationWallet Where the reactions should end up
    /// (allows bulk buying from other contracts since reactions are non-transferrable)
    /// @param referrer Optional param to specify an address where referrer rewards are allocated
    /// @param optionBits Optional params to specify options how the user wants transform reaction
    function buyReaction(
        uint256 makerNftMetaId,
        uint256 quantity,
        address destinationWallet,
        address referrer,
        uint256 optionBits
    ) external nonReentrant {
        // Call internal function
        return
            _buyReaction(
                makerNftMetaId,
                quantity,
                destinationWallet,
                referrer,
                optionBits
            );
    }

    /// @dev Derive the reaction meta ID from the parameters
    /// This unique ID will be used to track instances of reactions built from the same params
    /// E.g. if the price of a reaction changes, the meta ID should be different
    function deriveReactionMetaId(
        IParameterManager parameterManager,
        uint256 makerNftMetaId,
        uint256 optionBits
    ) public returns (uint256) {
        // Build the parameter version from the price details
        uint256 parameterVersion = uint256(
            keccak256(
                abi.encode(
                    parameterManager.paymentToken(),
                    parameterManager.reactionPrice(),
                    parameterManager.saleCuratorLiabilityBasisPoints()
                )
            )
        );

        // Build and return the reaction meta ID
        return
            uint256(
                keccak256(
                    abi.encode(
                        REACTION_META_PREFIX,
                        parameterVersion,
                        makerNftMetaId,
                        optionBits
                    )
                )
            );
    }

    /// @dev Internal buy function
    function _buyReaction(
        uint256 makerNftMetaId,
        uint256 quantity,
        address destinationWallet,
        address referrer,
        uint256 optionBits
    ) internal {
        // Create a struct to hold local vars (and prevent "stack too deep")
        ReactionInfo memory info;

        // Get the NFT Source ID from the maker registrar
        info.makerRegistrar = addressManager.makerRegistrar();
        info.sourceId = info.makerRegistrar.metaToSourceLookup(makerNftMetaId);
        require(info.sourceId != 0, "Unknown NFT");

        // Verify it is registered
        (
            info.registered,
            info.owner,
            info.creator,
            info.creatorSaleBasisPoints,
            info.reactionMetaId
        ) = info.makerRegistrar.sourceToDetailsLookup(info.sourceId);
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
        // First, allocate to referrer, if set
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
                info.referrerCut,
                makerNftMetaId
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
            info.referrerCut -
            info.curatorLiabilityCut;

        // Next, subtract the Creator cut from the Maker cut if it is set
        info.creatorCut = 0;
        if (info.creator != address(0x0) && info.creatorSaleBasisPoints > 0) {
            // Calc the amount
            info.creatorCut =
                (info.creatorSaleBasisPoints * info.makerCut) /
                10_000;

            // Assign awards to creator
            ownerToRewardsMapping[paymentToken][info.creator] += info
                .creatorCut;
            emit CreatorRewardsGranted(
                info.creator,
                paymentToken,
                info.creatorCut
            );

            // Subtract the creator cut from the maker cut
            info.makerCut -= info.creatorCut;
        }

        // Assign awards to maker
        ownerToRewardsMapping[paymentToken][info.owner] += info.makerCut;
        emit MakerRewardsGranted(
            info.owner,
            paymentToken,
            info.makerCut,
            makerNftMetaId
        );

        // Build reaction meta ID
        info.reactionMetaId = deriveReactionMetaId(
            info.parameterManager,
            makerNftMetaId,
            optionBits
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

    /// @dev Struct to hold local vars in spendReaction()
    struct SpendInfo {
        IStandard1155 reactionNftContract;
        ReactionPriceDetails reactionDetails;
        uint256 totalCuratorLiability;
        uint256 referrerCut;
        uint256 takerAmount;
        uint256 spenderAmount;
        ICuratorVault curatorVault;
        uint256 takerCuratorShares;
        uint256 spenderCuratorShares;
    }

    /// @dev Allows a reaction NFT owner to spend (burn) their tokens at a specific target Taker NFT.
    /// @param takerNftChainId Chain ID where the NFT lives
    /// @param takerNftAddress Target contract where the reaction is targeting
    /// @param takerNftId Target NFT ID in the contract
    /// @param reactionMetaId Reaction to spend
    /// @param reactionQuantity How many reactions to spend
    /// @param referrer Optional address where referrer rewards are allocated
    /// @param curatorVaultOverride Optional address of non-default curator vault
    /// @param metaDataHash Optional hash of any metadata being associated with spend action
    function spendReaction(
        uint256 takerNftChainId,
        address takerNftAddress,
        uint256 takerNftId,
        uint256 reactionMetaId,
        uint256 reactionQuantity,
        address referrer,
        address curatorVaultOverride,
        uint256 metaDataHash
    ) external nonReentrant {
        // Call internal function
        return
            _spendReaction(
                takerNftChainId,
                takerNftAddress,
                takerNftId,
                reactionMetaId,
                reactionQuantity,
                referrer,
                curatorVaultOverride,
                metaDataHash
            );
    }

    /// @dev Internal spend function
    function _spendReaction(
        uint256 takerNftChainId,
        address takerNftAddress,
        uint256 takerNftId,
        uint256 reactionMetaId,
        uint256 reactionQuantity,
        address referrer,
        address curatorVaultOverride,
        uint256 metaDataHash
    ) internal {
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
                info.referrerCut,
                reactionMetaId
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
            info.curatorVault = ICuratorVault(curatorVaultOverride);
        }

        // Get the token ID for this taker
        uint256 curatorTokenId = info.curatorVault.getTokenId(
            takerNftChainId,
            takerNftAddress,
            takerNftId,
            info.reactionDetails.paymentToken
        );

        // Approve the full amount
        info.reactionDetails.paymentToken.approve(
            address(info.curatorVault),
            info.totalCuratorLiability
        );

        // Buy shares for the taker and store them in this contract
        info.takerCuratorShares = info.curatorVault.buyCuratorShares(
            takerNftChainId,
            takerNftAddress,
            takerNftId,
            reactionMetaId,
            info.reactionDetails.paymentToken,
            info.takerAmount,
            address(this),
            true
        );

        // Build a hash of the rewards params
        uint256 rewardsIndex = uint256(
            keccak256(
                abi.encode(
                    takerNftChainId,
                    takerNftAddress,
                    takerNftId,
                    address(info.curatorVault),
                    curatorTokenId
                )
            )
        );

        // Allocate rewards for the future NFT Owner
        nftOwnerRewards[rewardsIndex] += info.takerCuratorShares;

        // Buy shares for the spender.  Shares get sent directly to their address.
        info.spenderCuratorShares = info.curatorVault.buyCuratorShares(
            takerNftChainId,
            takerNftAddress,
            takerNftId,
            reactionMetaId,
            info.reactionDetails.paymentToken,
            info.spenderAmount,
            msg.sender,
            false
        );

        // Emit the event for the overall reaction spend
        emit ReactionsSpent(
            takerNftChainId,
            takerNftAddress,
            takerNftId,
            reactionMetaId,
            reactionQuantity,
            referrer,
            metaDataHash
        );
    }

    /// @dev Allows a user to buy and spend a reaction in 1 transaction instead of first buying and then spending
    /// in 2 separate transactions
    function buyAndSpendReaction(
        uint256 makerNftMetaId,
        uint256 quantity,
        address referrer,
        uint256 optionBits,
        uint256 takerNftChainId,
        address takerNftAddress,
        uint256 takerNftId,
        address curatorVaultOverride,
        uint256 metaDataHash
    ) external nonReentrant {
        // Buy the reactions
        _buyReaction(
            makerNftMetaId,
            quantity,
            msg.sender,
            referrer,
            optionBits
        );

        // Calculate the reaction meta ID for the reactions purchased
        uint256 reactionMetaId = deriveReactionMetaId(
            addressManager.parameterManager(),
            makerNftMetaId,
            optionBits
        );

        // Spend it from the msg senders wallet
        _spendReaction(
            takerNftChainId,
            takerNftAddress,
            takerNftId,
            reactionMetaId,
            quantity,
            referrer,
            curatorVaultOverride,
            metaDataHash
        );
    }

    /// @dev Allows an account that has been allocated rewards to withdraw (Maker, creator, referrer)
    /// @param token ERC20 token that rewards are valued in
    function withdrawErc20Rewards(IERC20Upgradeable token)
        external
        nonReentrant
        returns (uint256)
    {
        // Get the amount owed
        uint256 rewardAmount = ownerToRewardsMapping[token][msg.sender];
        require(rewardAmount > 0, "Invalid 0 input");

        // Reset amount back to 0
        ownerToRewardsMapping[token][msg.sender] = 0;

        // Send tokens
        token.safeTransfer(msg.sender, rewardAmount);

        // Emit event
        emit ERC20RewardsClaimed(address(token), rewardAmount, msg.sender);

        // Return amount sent
        return rewardAmount;
    }

    /// @dev Struct to hold local vars in withdrawTakerRewards()
    struct TakerWithdrawInfo {
        uint256 rewardsIndex;
        uint256 takerCuratorSharesBalance;
        uint256 sourceId;
        uint256 paymentTokensForMaker;
        uint256 creatorCut;
    }

    /// @dev Allows an NFT taker to withdraw rewards for reactions that were spent against
    /// an NFT that they own.
    /// The owner of the NFT must register the NFT into the system before they can claim the rewards.
    function withdrawTakerRewards(
        uint256 takerNftChainId,
        address takerNftAddress,
        uint256 takerNftId,
        IERC20Upgradeable paymentToken,
        address curatorVault,
        uint256 curatorTokenId
    ) external nonReentrant returns (uint256) {
        // Create a struct to hold local vars (and prevent "stack too deep")
        TakerWithdrawInfo memory info;

        // Build a hash of the rewards params
        info.rewardsIndex = uint256(
            keccak256(
                abi.encode(
                    takerNftChainId,
                    takerNftAddress,
                    takerNftId,
                    curatorVault,
                    curatorTokenId
                )
            )
        );

        // Verify the balance
        info.takerCuratorSharesBalance = nftOwnerRewards[info.rewardsIndex];
        require(info.takerCuratorSharesBalance > 0, "No rewards");

        // Look up the targeted NFT source ID
        info.sourceId = addressManager.makerRegistrar().nftToSourceLookup(
            takerNftChainId,
            takerNftAddress,
            takerNftId
        );

        // Get the details about the NFT
        (
            bool registered,
            address owner,
            address creator,
            uint256 creatorSaleBasisPoints,
            uint256 registrationMetaId
        ) = (addressManager.makerRegistrar()).sourceToDetailsLookup(
                info.sourceId
            );

        // Verify it is registered and the caller is the one who registered it
        // Since NFTs may be on a different chain (L1 vs L2) we cannot directly check this
        require(registered, "NFT not registered");

        // This NFT could have been registered on another chain, but this assumes the
        // Taker is withdrawing rewards on the L2 with the same account/address
        require(owner == msg.sender, "NFT not owned");

        // Sell the curator shares - payment tokens will be sent this address
        info.paymentTokensForMaker = ICuratorVault(curatorVault)
            .sellCuratorShares(
                takerNftChainId,
                takerNftAddress,
                takerNftId,
                paymentToken,
                info.takerCuratorSharesBalance,
                address(this)
            );

        // If the registration included a creator cut calculate and set aside amount
        if (creator != address(0x0) && creatorSaleBasisPoints > 0) {
            info.creatorCut =
                (info.paymentTokensForMaker * creatorSaleBasisPoints) /
                10_000;

            // Allocate for the creator
            ownerToRewardsMapping[paymentToken][creator] += info.creatorCut;
            emit CreatorRewardsGranted(creator, paymentToken, info.creatorCut);

            info.paymentTokensForMaker -= info.creatorCut;
        }

        // Transfer the remaining amount to the caller (Maker)
        paymentToken.safeTransfer(msg.sender, info.paymentTokensForMaker);

        // Emit the event
        emit TakerRewardsSold(
            msg.sender,
            takerNftChainId,
            takerNftAddress,
            takerNftId,
            curatorVault,
            curatorTokenId,
            info.takerCuratorSharesBalance,
            info.paymentTokensForMaker
        );

        // Return the amount of payment tokens received
        return info.paymentTokensForMaker;
    }
}
