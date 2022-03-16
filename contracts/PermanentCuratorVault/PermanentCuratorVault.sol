//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./ICuratorVault.sol";
import "./PermanentCuratorVaultStorage.sol";
import "./Curve/BancorFormula.sol";

/// @title PermanentCuratorVault
/// @dev This contract tracks shares in a bonding curve per Taker NFT.
/// When users spend reactions against a Taker NFT, it will use the Curator Liability
/// to buy curator shares against that Taker NFT and allocate to various parties.
/// The curator shares will be priced via an increasing price curve.
/// At any point in time the owners of the curator shares can sell them back to the
/// bonding curve.
contract PermanentCuratorVault is
    BancorFormula,
    ReentrancyGuardUpgradeable,
    PermanentCuratorVaultStorageV1
{
    /// @dev Use the safe methods when interacting with transfers with outside ERC20s
    using SafeERC20Upgradeable for IERC20Upgradeable;

    /// @dev verifies that the calling address is the reaction vault
    modifier onlyCuratorVaultPurchaser() {
        require(
            addressManager.roleManager().isCuratorVaultPurchaser(msg.sender),
            "Not Admin"
        );
        _;
    }

    /// @dev Event triggered when curator shares are purchased
    event CuratorSharesBought(
        uint256 indexed curatorShareTokenId,
        uint256 nftChainId,
        address nftAddress,
        uint256 nftId,
        IERC20Upgradeable paymentToken,
        uint256 paymentTokenPaid,
        uint256 curatorSharesBought,
        bool isTakerPosition
    );

    /// @dev Event triggered when curator shares are sold
    event CuratorSharesSold(
        uint256 indexed curatorShareTokenId,
        uint256 paymentTokenRefunded,
        uint256 curatorSharesSold
    );

    /// @dev initializer to call after deployment, can only be called once
    function initialize(
        address _addressManager,
        uint32 _reserveRatio,
        IStandard1155 _curatorShares
    ) public initializer {
        __Power_init();

        // Save the address manager
        addressManager = IAddressManager(_addressManager);

        // Save the reserve ratio
        reserveRatio = _reserveRatio;

        // Save the curator share contract
        curatorShares = _curatorShares;
    }

    /// @dev get a unique token ID for a given nft address and nft ID
    function getTokenId(
        uint256 nftChainId,
        address nftAddress,
        uint256 nftId,
        IERC20Upgradeable paymentToken
    ) external pure returns (uint256) {
        return _getTokenId(nftChainId, nftAddress, nftId, paymentToken);
    }

    function _getTokenId(
        uint256 nftChainId,
        address nftAddress,
        uint256 nftId,
        IERC20Upgradeable paymentToken
    ) internal pure returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encode(nftChainId, nftAddress, nftId, paymentToken)
                )
            );
    }

    /// @dev Buy curator shares when reactions are spent.
    /// The reaction vault is the only account allowed to call this.
    /// @return Returns the amount of curator shares purchased.
    function buyCuratorShares(
        uint256 nftChainId,
        address nftAddress,
        uint256 nftId,
        IERC20Upgradeable paymentToken,
        uint256 paymentAmount,
        address mintToAddress,
        bool isTakerPosition
    ) external onlyCuratorVaultPurchaser returns (uint256) {
        // Get the curator share token ID
        uint256 curatorShareTokenId = _getTokenId(
            nftChainId,
            nftAddress,
            nftId,
            paymentToken
        );

        //
        // Pull value from ReactionVault
        //
        paymentToken.safeTransferFrom(msg.sender, address(this), paymentAmount);

        //
        // Mint CuratorVaultTokens
        //
        // Calculate how many tokens should be minted
        uint256 curatorShareAmount = calculatePurchaseReturn(
            SUPPLY_BUFFER + curatorShareSupply[curatorShareTokenId],
            RESERVE_BUFFER + reserves[curatorShareTokenId],
            reserveRatio,
            paymentAmount
        );

        // Mint tokens
        curatorShares.mint(
            mintToAddress,
            curatorShareTokenId,
            curatorShareAmount,
            new bytes(0)
        );

        //
        // Update bonding curve parameters
        //
        reserves[curatorShareTokenId] += paymentAmount;
        curatorShareSupply[curatorShareTokenId] += curatorShareAmount;

        // Emit the event
        emit CuratorSharesBought(
            curatorShareTokenId,
            nftChainId,
            nftAddress,
            nftId,
            paymentToken,
            paymentAmount,
            curatorShareAmount,
            isTakerPosition
        );

        return curatorShareAmount;
    }

    /// @dev Sell curator shares back into the bonding curve.
    /// Any holder who owns shares can sell them back
    /// @return Returns the amount of payment tokens received for the curator shares.
    function sellCuratorShares(
        uint256 nftChainId,
        address nftAddress,
        uint256 nftId,
        IERC20Upgradeable paymentToken,
        uint256 sharesToBurn,
        address refundToAddress
    ) external nonReentrant returns (uint256) {
        // Get the curator share token ID
        uint256 curatorShareTokenId = _getTokenId(
            nftChainId,
            nftAddress,
            nftId,
            paymentToken
        );

        // Calculate the amount of tokens to send back
        uint256 refundAmount = calculateSaleReturn(
            SUPPLY_BUFFER + curatorShareSupply[curatorShareTokenId],
            RESERVE_BUFFER + reserves[curatorShareTokenId],
            reserveRatio,
            sharesToBurn
        );

        //
        // Burn curator shares
        // TODO - add test to make sure this reverts if sharesToBurn is greater than user balance
        //
        curatorShares.burn(msg.sender, curatorShareTokenId, sharesToBurn);

        //
        // Return payment token
        //
        paymentToken.safeTransfer(refundToAddress, refundAmount);

        //
        // Update bonding curve parameters
        //
        reserves[curatorShareTokenId] -= refundAmount;
        curatorShareSupply[curatorShareTokenId] -= sharesToBurn;

        // Emit the event
        emit CuratorSharesSold(curatorShareTokenId, refundAmount, sharesToBurn);

        return refundAmount;
    }
}
