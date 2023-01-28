//SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol";
import "../Permissions/IRoleManager.sol";
import "../WithSig/DataTypes.sol";
import "../WithSig/WithSigEnabled.sol";
import "./IReactionVault.sol";
import "./ReactionVaultStorage.sol";
import "../Maker/IMakerRegistrar.sol";
import "../Parameters/IParameterManager.sol";
import "../Token/IStandard1155.sol";
import "../Likes/ILikeTokenFactory.sol";
import "../Token/IWMATIC.sol";

/// @title ReactionVault
/// @dev This contract buying and spending reactions
contract ReactionVault is
    WithSigEnabled,
    IReactionVault,
    Initializable,
    ReentrancyGuardUpgradeable,
    ERC1155HolderUpgradeable,
    ReactionVaultStorageV2
{
    /// @dev Use the safe methods when interacting with transfers with outside ERC20s
    using SafeERC20Upgradeable for IWMATIC;

    /// @dev Event emitted when a reaction is purchased
    event ReactionsPurchased(
        uint256 transformId,
        uint256 quantity,
        address destinationWallet,
        address referrer,
        uint256 reactionId,
        uint256 parameterVersion
    );

    /// @dev Event emitted when reaction is spent
    event ReactionsSpent(
        uint256 takerNftChainId,
        address takerNftAddress,
        uint256 takerNftId,
        uint256 reactionId,
        address paymentToken,
        uint256 quantity,
        string ipfsMetadataHash,
        address referrer,
        address curatorVaultAddress,
        uint256 curatorTokenId,
        uint256 curatorTokenAmount,
        uint256 takerTokenAmount
    );

    /// @dev Event emitted when rewards are granted to a creator
    event CreatorRewardsGranted(
        address creator,
        IWMATIC paymentToken,
        uint256 amount,
        uint256 reactionId
    );

    /// @dev Event emitted when rewards are granted to a referrer
    event ReferrerRewardsGranted(
        address referrer,
        IWMATIC paymentToken,
        uint256 amount,
        uint256 reactionId
    );

    /// @dev Event emitted when rewards are granted to a maker
    event MakerRewardsGranted(
        address maker,
        IWMATIC paymentToken,
        uint256 amount,
        uint256 reactionId
    );

    /// @dev Event emitted when an account withdraws ERC20 rewards
    event ERC20RewardsClaimed(address token, uint256 amount, address recipient);

    /// @dev Event emitted when taker claims curator tokens
    event TakerWithdraw(
        uint256 indexed curatorTokenId,
        uint256 curatorTokensSold,
        uint256 paymentTokenTaker,
        uint256 paymentTokenCreator
    );

    /// @dev initializer to call after deployment, can only be called once
    function initialize(IAddressManager _addressManager) public initializer {
        require(address(_addressManager) != address(0x0), "Invalid 0 input");
        __ReentrancyGuard_init();
        __ERC1155Holder_init();
        addressManager = _addressManager;
    }

    /// @dev Struct to hold local vars in buyReaction()
    struct ReactionInfo {
        IMakerRegistrar makerRegistrar;
        IParameterManager parameterManager;
        uint256 sourceId;
        IMakerRegistrar.NftDetails nftDetails;
        uint256 reactionPrice;
        uint256 totalPurchasePrice;
        uint256 creatorCut;
        uint256 referrerCut;
        uint256 makerCut;
        uint256 fullMakerCut;
        uint256 curatorLiabilityCut;
        uint256 reactionId;
        uint256 parameterVersion;
    }

    /// @dev External func to allow a user to buy reaction NFTs based on a registered Maker NFT
    /// @param transformId transform to be purchased
    /// @param quantity Number of reactions to buy
    /// @param destinationWallet reactions will be minted into this wallet
    /// (allows bulk buying from other contracts since reactions are non-transferrable)
    /// @param referrer Optional param to specify an address where referrer rewards are allocated
    /// @param optionBits Optional param to specify options how the user wants transform reaction
    function buyReaction(
        uint256 transformId,
        uint256 quantity,
        address destinationWallet,
        address referrer,
        uint256 optionBits
    ) external payable nonReentrant {
        // Call internal function
        return
            _buyReaction(
                transformId,
                quantity,
                destinationWallet,
                referrer,
                optionBits
            );
    }

    /// @dev Derive the pricing parameters version
    /// E.g. if the price of a reaction changes, the paramaterVersion should be different
    function deriveParameterVersion(IParameterManager parameterManager)
        public
        returns (uint256)
    {
        // Build the parameter version from the price details
        return
            uint256(
                keccak256(
                    abi.encode(
                        parameterManager.paymentToken(),
                        parameterManager.reactionPrice(),
                        parameterManager.saleCuratorLiabilityBasisPoints()
                    )
                )
            );
    }

    /// @dev Derive the reaction ID from the parameters
    /// This unique ID will be used to track instances of reactions built from the same params
    /// E.g. if the price of a reaction changes, the reaction ID should be different
    function deriveReactionId(
        uint256 transformId,
        uint256 optionBits,
        uint256 parameterVersion
    ) public pure returns (uint256) {
        // Build and return the reaction ID
        return
            uint256(
                keccak256(
                    abi.encode(
                        REACTION_META_PREFIX,
                        parameterVersion,
                        transformId,
                        optionBits
                    )
                )
            );
    }

    /// @dev Internal buy function
    function _buyReaction(
        uint256 transformId,
        uint256 quantity,
        address destinationWallet,
        address referrer,
        uint256 optionBits
    ) internal {
        // Ensure valid quantity
        require(quantity > 0, "Invalid 0 input");

        // Create a struct to hold local vars (and prevent "stack too deep")
        ReactionInfo memory info;

        // Get the NFT Source ID from the maker registrar
        info.makerRegistrar = addressManager.makerRegistrar();
        info.sourceId = info.makerRegistrar.transformToSourceLookup(
            transformId
        );
        require(info.sourceId != 0, "Unknown NFT");

        // Verify it is registered
        info.nftDetails = info.makerRegistrar.sourceToDetailsLookup(
            info.sourceId
        );
        require(info.nftDetails.registered, "NFT not registered");

        // Calculate the funds to move into the this contract from the buyer
        info.parameterManager = addressManager.parameterManager();
        IWMATIC paymentToken = info.parameterManager.paymentToken();
        info.reactionPrice = info.parameterManager.reactionPrice();
        info.totalPurchasePrice = info.reactionPrice * quantity;

        // calc payment parameter version
        info.parameterVersion = deriveParameterVersion(info.parameterManager);

        // Build reaction ID
        info.reactionId = deriveReactionId(
            transformId,
            optionBits,
            info.parameterVersion
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
                info.reactionId
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
        info.fullMakerCut = info.makerCut;
        for (uint16 i = 0; i < info.nftDetails.creators.length; i++) {
            if (
                info.nftDetails.creators[i] != address(0x0) &&
                info.nftDetails.creatorSaleBasisPoints[i] > 0
            ) {
                // Calc the amount from the full maker cut
                info.creatorCut =
                    (info.nftDetails.creatorSaleBasisPoints[i] *
                        info.fullMakerCut) /
                    10_000;

                // Assign awards to creator
                ownerToRewardsMapping[paymentToken][
                    info.nftDetails.creators[i]
                ] += info.creatorCut;

                // emit event
                emit CreatorRewardsGranted(
                    info.nftDetails.creators[i],
                    paymentToken,
                    info.creatorCut,
                    info.reactionId
                );

                // Subtract the creator cut from the maker cut
                info.makerCut -= info.creatorCut;
            }
        }

        // Assign awards to maker
        ownerToRewardsMapping[paymentToken][info.nftDetails.owner] += info
            .makerCut;
        emit MakerRewardsGranted(
            info.nftDetails.owner,
            paymentToken,
            info.makerCut,
            info.reactionId
        );

        // Save off the details of this reaction purchase info for usage later when they are spent
        reactionPriceDetailsMapping[info.reactionId] = ReactionPriceDetails(
            paymentToken,
            info.reactionPrice,
            saleCuratorLiabilityBasisPoints
        );

        // Determine whether to purchase with ERC20 or native asset
        if (
            address(paymentToken) ==
            address(addressManager.parameterManager().nativeWrappedToken())
        ) {
            // Wrap the native currency into the wrapped ERC20
            require(msg.value == info.totalPurchasePrice, "Invalid payment");
            paymentToken.deposit{value: msg.value}();
        } else {
            // Move the ERC20 funds in as payment
            paymentToken.safeTransferFrom(
                msg.sender,
                address(this),
                info.totalPurchasePrice
            );
        }

        // Mint NFTs to destination wallet
        IStandard1155 reactionNftContract = addressManager
            .reactionNftContract();
        reactionNftContract.mint(
            destinationWallet,
            info.reactionId,
            quantity,
            new bytes(0)
        );

        // Emit event
        emit ReactionsPurchased(
            transformId,
            quantity,
            destinationWallet,
            referrer,
            info.reactionId,
            info.parameterVersion
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
        uint256 takerCuratorTokens;
        uint256 spenderCuratorTokens;
        address likeTokenFactory;
    }

    /// @dev Allows a reaction NFT owner to spend (burn) their tokens at a specific target Taker NFT.
    /// @param takerNftChainId Chain ID where the NFT lives
    /// @param takerNftAddress Target contract where the reaction is targeting
    /// @param takerNftId Target NFT ID in the contract
    /// @param reactionId Reaction to spend
    /// @param reactionQuantity How many reactions to spend
    /// @param referrer Optional address where referrer rewards are allocated
    /// @param curatorVaultOverride Optional address of non-default curator vault
    /// @param ipfsMetadataHash Optional hash of any metadata being associated with spend action
    function spendReaction(
        uint256 takerNftChainId,
        address takerNftAddress,
        uint256 takerNftId,
        uint256 reactionId,
        uint256 reactionQuantity,
        address referrer,
        address curatorVaultOverride,
        string memory ipfsMetadataHash
    ) external nonReentrant {
        // Call internal function
        return
            _spendReaction(
                takerNftChainId,
                takerNftAddress,
                takerNftId,
                reactionId,
                reactionQuantity,
                referrer,
                curatorVaultOverride,
                ipfsMetadataHash
            );
    }

    /// @dev Internal spend function
    function _spendReaction(
        uint256 takerNftChainId,
        address takerNftAddress,
        uint256 takerNftId,
        uint256 reactionId,
        uint256 reactionQuantity,
        address referrer,
        address curatorVaultOverride,
        string memory ipfsMetadataHash
    ) internal {
        // Verify quantity
        require(reactionQuantity > 0, "Invalid 0 input");

        // Create a struct to hold local vars (and prevent "stack too deep")
        SpendInfo memory info;

        //
        // Burn Reactions
        //

        // Burn reactions from sender
        info.reactionNftContract = addressManager.reactionNftContract();
        info.reactionNftContract.burn(msg.sender, reactionId, reactionQuantity);

        //
        // Calc Splits
        //

        // Look up curator vault liability details from when the reaction was purchased
        info.reactionDetails = reactionPriceDetailsMapping[reactionId];

        // Calculate the total amount of curator liability will be used to spend
        // the reactions when buying curator Tokens
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
                reactionId
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

        //
        // Setup Curator Vault
        //

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

        //
        // Buy Curator Tokens for target NFT's owner
        //

        // Approve the full amount
        info.reactionDetails.paymentToken.approve(
            address(info.curatorVault),
            info.totalCuratorLiability
        );

        // Buy Tokens for the taker and store them in this contract
        info.takerCuratorTokens = info.curatorVault.buyCuratorTokens(
            takerNftChainId,
            takerNftAddress,
            takerNftId,
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

        // Allocate rewards to be claimed by NFT Owner
        nftOwnerRewards[rewardsIndex] += info.takerCuratorTokens;

        //
        // Buy Curator Tokens for Reaction Spender
        //

        // Buy Tokens for the spender.  Tokens get sent directly to their address.
        info.spenderCuratorTokens = info.curatorVault.buyCuratorTokens(
            takerNftChainId,
            takerNftAddress,
            takerNftId,
            info.reactionDetails.paymentToken,
            info.spenderAmount,
            msg.sender,
            false
        );

        // Issue a like token for this spend if the factory is configured
        info.likeTokenFactory = addressManager.likeTokenFactory();
        if (info.likeTokenFactory != address(0x0)) {
            ILikeTokenFactory(info.likeTokenFactory).issueLikeToken(
                msg.sender,
                takerNftChainId,
                takerNftAddress,
                takerNftId
            );
        }

        // Emit the event for the overall reaction spend
        emit ReactionsSpent(
            takerNftChainId,
            takerNftAddress,
            takerNftId,
            reactionId,
            address(info.reactionDetails.paymentToken),
            reactionQuantity,
            ipfsMetadataHash,
            referrer,
            address(info.curatorVault),
            curatorTokenId,
            info.spenderCuratorTokens,
            info.takerCuratorTokens
        );
    }

    /// @dev Allows a user to react to content & receive a like token.
    /// If value is sent into this function then the user will purchase curation tokens.
    function react(
        uint256 transformId,
        uint256 quantity,
        address referrer,
        uint256 optionBits,
        uint256 takerNftChainId,
        address takerNftAddress,
        uint256 takerNftId,
        address curatorVaultOverride,
        string memory ipfsMetadataHash
    ) external payable nonReentrant {
        // calc payment parameter version
        uint256 parameterVersion = deriveParameterVersion(
            addressManager.parameterManager()
        );
        // Build reaction ID
        uint256 reactionId = deriveReactionId(
            transformId,
            optionBits,
            parameterVersion
        );

        // check for free reaction
        if (msg.value == 0) {
            _freeReaction(
                transformId,
                takerNftChainId,
                takerNftAddress,
                takerNftId,
                reactionId,
                quantity,
                ipfsMetadataHash
            );

            return;
        }

        // Buy the reactions
        _buyReaction(transformId, quantity, msg.sender, referrer, optionBits);

        // Spend it from the msg senders wallet
        _spendReaction(
            takerNftChainId,
            takerNftAddress,
            takerNftId,
            reactionId,
            quantity,
            referrer,
            curatorVaultOverride,
            ipfsMetadataHash
        );
    }

    /// @dev Allows a user to react to content & receive a like token without sending any value.
    /// This function will allow the user to record their reaction on-chain and collect a "like" token but not purchase any curator tokens.
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
                            keccak256(bytes(vars.ipfsMetadataHash)),
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
        uint256 parameterVersion = deriveParameterVersion(
            addressManager.parameterManager()
        );
        // Build reaction ID
        uint256 reactionId = deriveReactionId(
            vars.transformId,
            vars.optionBits,
            parameterVersion
        );
        // Proceed with free reaction
        _freeReactionForSpecifiedAddress(
            vars.reactor,
            vars.transformId,
            vars.takerNftChainId,
            vars.takerNftAddress,
            vars.takerNftId,
            reactionId,
            vars.quantity,
            vars.ipfsMetadataHash
        );
    }

    /// @dev Allows an account that has been allocated rewards to withdraw (Maker, creator, referrer)
    /// @param token ERC20 token that rewards are valued in
    function withdrawErc20Rewards(IWMATIC token)
        external
        nonReentrant
        returns (uint256)
    {
        // Get the amount owed
        uint256 rewardAmount = ownerToRewardsMapping[token][msg.sender];
        require(rewardAmount > 0, "Invalid 0 input");

        // Reset amount back to 0
        ownerToRewardsMapping[token][msg.sender] = 0;

        // Determine whether to send ERC20 or send native asset
        if (
            address(token) ==
            address(addressManager.parameterManager().nativeWrappedToken())
        ) {
            // Unwrap rewards into this address
            token.withdraw(rewardAmount);

            // Send MATIC to destination
            payable(msg.sender).transfer(rewardAmount);
        } else {
            // Send ERC20
            token.safeTransfer(msg.sender, rewardAmount);
        }

        // Emit event
        emit ERC20RewardsClaimed(address(token), rewardAmount, msg.sender);

        // Return amount sent
        return rewardAmount;
    }

    /// @dev Struct to hold local vars in withdrawTakerRewards()
    struct TakerWithdrawInfo {
        uint256 rewardsIndex;
        uint256 takerCuratorTokensBalance;
        uint256 sourceId;
        uint256 paymentTokensForMaker;
        uint256 fullPaymentTokensForMaker;
        uint256 creatorCut;
    }

    /// @dev Allows an NFT taker to withdraw rewards for reactions that were spent against
    /// an NFT that they own.
    /// The owner of the NFT must register the NFT into the system before they can claim the rewards.
    function withdrawTakerRewards(
        uint256 takerNftChainId,
        address takerNftAddress,
        uint256 takerNftId,
        IWMATIC paymentToken,
        address curatorVault,
        uint256 curatorTokenId,
        uint256 tokensToBurn,
        address refundToAddress
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
        info.takerCuratorTokensBalance = nftOwnerRewards[info.rewardsIndex];
        require(info.takerCuratorTokensBalance > 0, "No rewards");
        require(
            info.takerCuratorTokensBalance >= tokensToBurn,
            "Rewards balance < tokensToBurn"
        );

        // Look up the targeted NFT source ID
        info.sourceId = addressManager.makerRegistrar().deriveSourceId(
            takerNftChainId,
            takerNftAddress,
            takerNftId
        );

        // Get the details about the NFT
        IMakerRegistrar.NftDetails memory nftDetails = (
            addressManager.makerRegistrar()
        ).sourceToDetailsLookup(info.sourceId);

        // Verify it is registered and the caller is the one who registered it
        // Since NFTs may be on a different chain (L1 vs L2) we cannot directly check this
        require(nftDetails.registered, "NFT not registered");

        // This NFT could have been registered on another chain, but this assumes the
        // Taker is withdrawing rewards on the L2 with the same account/address
        require(nftDetails.owner == msg.sender, "NFT not owned");

        // Sell the curator Tokens - payment amount in native MATIC will be sent this address
        info.paymentTokensForMaker = ICuratorVault(curatorVault)
            .sellCuratorTokens(
                takerNftChainId,
                takerNftAddress,
                takerNftId,
                paymentToken,
                tokensToBurn,
                address(this)
            );

        // decrement owner rewards balance
        nftOwnerRewards[info.rewardsIndex] -= tokensToBurn;

        // If the registration included a creator cut calculate and set aside amount
        info.fullPaymentTokensForMaker = info.paymentTokensForMaker;
        for (uint16 i = 0; i < nftDetails.creators.length; i++) {
            if (
                nftDetails.creators[i] != address(0x0) &&
                nftDetails.creatorSaleBasisPoints[i] > 0
            ) {
                info.creatorCut =
                    (info.fullPaymentTokensForMaker *
                        nftDetails.creatorSaleBasisPoints[i]) /
                    10_000;

                // Allocate for the creator
                ownerToRewardsMapping[paymentToken][
                    nftDetails.creators[i]
                ] += info.creatorCut;
                emit CreatorRewardsGranted(
                    nftDetails.creators[i],
                    paymentToken,
                    info.creatorCut,
                    info.sourceId
                );

                info.paymentTokensForMaker -= info.creatorCut;

                // Wrap the MATIC to ERC20 for later withdrawal if it is native asset
                if (
                    address(paymentToken) ==
                    address(
                        addressManager.parameterManager().nativeWrappedToken()
                    )
                ) {
                    paymentToken.deposit{value: info.creatorCut}();
                }
            }
        }

        // Determine whether to send ERC20 or send native asset
        if (
            address(paymentToken) ==
            address(addressManager.parameterManager().nativeWrappedToken())
        ) {
            // Send remaining MATIC to destination - native MATIC was sent here during sellCuratorTokens() call
            payable(refundToAddress).transfer(info.paymentTokensForMaker);
        } else {
            // Send ERC20
            paymentToken.safeTransfer(
                refundToAddress,
                info.paymentTokensForMaker
            );
        }

        emit TakerWithdraw(
            curatorTokenId,
            tokensToBurn,
            info.paymentTokensForMaker,
            info.creatorCut
        );

        // Return the amount of payment tokens received
        return info.paymentTokensForMaker;
    }

    /// @dev Allows WMATIC to be unwrapped to this address
    receive() external payable {}

    /// @dev Allows the admin account to sweep any MATIC that was accidentally sent
    function sweep() external {
        require(addressManager.roleManager().isAdmin(msg.sender), "Not Admin");
        payable(msg.sender).transfer(address(this).balance);
    }

    /// @dev React to content without sending any value.
    // This function will allow the user to record their reaction on-chain and collect a "like" token but not purchase any curator tokens
    function _freeReaction(
        uint256 transformId,
        uint256 takerNftChainId,
        address takerNftAddress,
        uint256 takerNftId,
        uint256 reactionId,
        uint256 reactionQuantity,
        string memory ipfsMetadataHash
    ) internal {
        // Verify quantity
        require(
            reactionQuantity <=
                addressManager.parameterManager().freeReactionLimit(),
            "Reaction quantity above limit"
        );

        // Get the NFT Source ID from the maker registrar
        IMakerRegistrar makerRegistrar = addressManager.makerRegistrar();
        uint256 sourceId = makerRegistrar.transformToSourceLookup(transformId);
        require(sourceId != 0, "Unknown NFT");

        // Verify it is registered
        IMakerRegistrar.NftDetails memory nftDetails = makerRegistrar
            .sourceToDetailsLookup(sourceId);
        require(nftDetails.registered, "NFT not registered");

        // Issue a like token for this spend if the factory is configured
        address likeTokenFactory = addressManager.likeTokenFactory();
        if (likeTokenFactory != address(0x0)) {
            ILikeTokenFactory(likeTokenFactory).issueLikeToken(
                msg.sender,
                takerNftChainId,
                takerNftAddress,
                takerNftId
            );
        }

        uint256 curatorTokenId = uint256(
            keccak256(
                abi.encode(
                    takerNftChainId,
                    takerNftAddress,
                    takerNftId,
                    addressManager.parameterManager().paymentToken()
                )
            )
        );

        // Emit ReactionsPurchased & ReactionsSpent for consistency with paid reaction path
        emit ReactionsPurchased(
            transformId,
            reactionQuantity,
            msg.sender,
            address(0),
            reactionId,
            deriveParameterVersion(addressManager.parameterManager())
        );

        emit ReactionsSpent(
            takerNftChainId,
            takerNftAddress,
            takerNftId,
            reactionId,
            address(addressManager.parameterManager().paymentToken()),
            reactionQuantity,
            ipfsMetadataHash,
            address(0), //referrer
            address(addressManager.defaultCuratorVault()),
            curatorTokenId,
            0, // spenderCuratorTokens
            0 // takerCuratorTokens
        );
    }

    /// @dev Identical to _freeReaction() only msg.sender is replaced with the argument "reactor".
    // Reactor address is passed in as an argument in order to support gasless reactions.
    function _freeReactionForSpecifiedAddress(
        address reactor, // the specified address
        uint256 transformId,
        uint256 takerNftChainId,
        address takerNftAddress,
        uint256 takerNftId,
        uint256 reactionId,
        uint256 reactionQuantity,
        string memory ipfsMetadataHash
    ) internal {
        // Verify quantity
        require(
            reactionQuantity <=
                addressManager.parameterManager().freeReactionLimit(),
            "Reaction quantity above limit"
        );

        // Get the NFT Source ID from the maker registrar
        IMakerRegistrar makerRegistrar = addressManager.makerRegistrar();
        uint256 sourceId = makerRegistrar.transformToSourceLookup(transformId);
        require(sourceId != 0, "Unknown NFT");

        // Verify it is registered
        IMakerRegistrar.NftDetails memory nftDetails = makerRegistrar
            .sourceToDetailsLookup(sourceId);
        require(nftDetails.registered, "NFT not registered");

        // Issue a like token for this spend if the factory is configured
        address likeTokenFactory = addressManager.likeTokenFactory();
        if (likeTokenFactory != address(0x0)) {
            ILikeTokenFactory(likeTokenFactory).issueLikeToken(
                reactor,
                takerNftChainId,
                takerNftAddress,
                takerNftId
            );
        }

        uint256 curatorTokenId = uint256(
            keccak256(
                abi.encode(
                    takerNftChainId,
                    takerNftAddress,
                    takerNftId,
                    addressManager.parameterManager().paymentToken()
                )
            )
        );

        // Emit ReactionsPurchased & ReactionsSpent for consistency with paid reaction path
        emit ReactionsPurchased(
            transformId,
            reactionQuantity,
            reactor,
            address(0),
            reactionId,
            deriveParameterVersion(addressManager.parameterManager())
        );

        emit ReactionsSpent(
            takerNftChainId,
            takerNftAddress,
            takerNftId,
            reactionId,
            address(addressManager.parameterManager().paymentToken()),
            reactionQuantity,
            ipfsMetadataHash,
            address(0), //referrer
            address(addressManager.defaultCuratorVault()),
            curatorTokenId,
            0, // spenderCuratorTokens
            0 // takerCuratorTokens
        );
    }
}
