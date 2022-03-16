//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../Token/IStandard1155.sol";
import "../Config/IAddressManager.sol";
import "./SigmoidCuratorVaultStorage.sol";
import "./Curve/Sigmoid.sol";

/// @title SigmoidCuratorVault
/// @dev This contract tracks shares in a sigmoid bonding curve per Taker NFT.
/// When users spend reactions against a Taker NFT, it will use the Curator Liability
/// to buy curator shares against that Taker NFT and allocate to various parties.
/// The curator shares will be priced via the sigmoid curve.  The params that control
/// the shape of the sigmoid are set in the parameter manager.
/// At any point in time the owners of the curator shares can sell them back to the
/// bonding curve.
contract SigmoidCuratorVault is
    ReentrancyGuardUpgradeable,
    Sigmoid,
    SigmoidCuratorVaultStorageV1
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
    function initialize(address _addressManager, IStandard1155 _curatorShares)
        public
        initializer
    {
        // Save the address manager
        addressManager = IAddressManager(_addressManager);

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

        // Get curve params
        (uint256 a, uint256 b, uint256 c) = addressManager
            .parameterManager()
            .bondingCurveParams();

        // Calculate the amount of tokens that will be minted based on the price
        uint256 curatorShareAmount = calculateSharesBoughtFromPayment(
            int256(a),
            int256(b),
            int256(c),
            int256(curatorShareSupply[curatorShareTokenId]),
            int256(reserves[curatorShareTokenId]),
            int256(paymentAmount)
        );

        // Update the amounts
        reserves[curatorShareTokenId] += paymentAmount;
        curatorShareSupply[curatorShareTokenId] += curatorShareAmount;

        // Mint the tokens
        curatorShares.mint(
            mintToAddress,
            curatorShareTokenId,
            curatorShareAmount,
            new bytes(0)
        );

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
        require(sharesToBurn > 0, "Invalid 0 input");

        // Get the curator share token ID
        uint256 curatorShareTokenId = _getTokenId(
            nftChainId,
            nftAddress,
            nftId,
            paymentToken
        );

        // Burn the curator shares
        curatorShares.burn(msg.sender, curatorShareTokenId, sharesToBurn);

        // Get curve params
        (uint256 a, uint256 b, uint256 c) = addressManager
            .parameterManager()
            .bondingCurveParams();

        // Calculate the amount of tokens that will be minted based on the price
        uint256 refundAmount = calculatePaymentReturnedFromShares(
            int256(a),
            int256(b),
            int256(c),
            int256(curatorShareSupply[curatorShareTokenId]),
            int256(reserves[curatorShareTokenId]),
            int256(sharesToBurn)
        );

        // Update the amounts
        reserves[curatorShareTokenId] -= refundAmount;
        curatorShareSupply[curatorShareTokenId] -= sharesToBurn;

        // Send payment token back
        paymentToken.safeTransfer(refundToAddress, refundAmount);

        // Emit the event
        emit CuratorSharesSold(curatorShareTokenId, refundAmount, sharesToBurn);

        return refundAmount;
    }
}
