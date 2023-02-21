//SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import "./ParameterManagerStorage.sol";
import "../Config/IAddressManager.sol";
import "../Token/IWMATIC.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/// @dev Note: This contract is protected via a permissioned account set in the role manager.  Caution should
/// be used as the role owner could renounce the role leaving all future actions disabled.  Additionally,
/// if a malicious account was able to obtain the role, they could use it to set values to malicious values.
/// See the public documentation website for more details.
contract ParameterManager is Initializable, ParameterManagerStorageV3 {
    /// @dev Verifies with the role manager that the calling address has ADMIN role
    modifier onlyAdmin() {
        require(
            addressManager.roleManager().isParameterManagerAdmin(msg.sender),
            "Not Admin"
        );
        _;
    }

    /// @dev Events emitted on updates
    event PaymentTokenUpdated(IWMATIC newValue);
    event ReactionPriceUpdated(uint256 newValue);
    event SaleCuratorLiabilityBasisPointsUpdated(uint256 newValue);
    event SaleReferrerBasisPointsUpdated(uint256 newValue);
    event SpendTakerBasisPointsUpdated(uint256 newValue);
    event SpendReferrerBasisPointsUpdated(uint256 newValue);
    event ApprovedCuratorVaultsUpdated(address vault, bool approved);
    event NativeWrappedTokenUpdated(IERC20Upgradeable newValue);
    event FreeReactionLimitUpdated(uint256 reactionLimit);
    event SignatureNonceUpdated(address signer, uint256 newNonce);

    /// @dev initializer to call after deployment, can only be called once
    function initialize(IAddressManager _addressManager) public initializer {
        require(address(_addressManager) != address(0x0), ZERO_INPUT);
        addressManager = _addressManager;
    }

    /// @dev Setter for the payment token
    function setPaymentToken(IWMATIC _paymentToken) external onlyAdmin {
        require(address(_paymentToken) != address(0x0), ZERO_INPUT);
        paymentToken = _paymentToken;
        emit PaymentTokenUpdated(_paymentToken);
    }

    /// @dev Setter for the reaction price
    function setReactionPrice(uint256 _reactionPrice) external onlyAdmin {
        require(_reactionPrice != 0, ZERO_INPUT);
        reactionPrice = _reactionPrice;
        emit ReactionPriceUpdated(_reactionPrice);
    }

    /// @dev Setter for the reaction price
    function setSaleCuratorLiabilityBasisPoints(
        uint256 _saleCuratorLiabilityBasisPoints
    ) external onlyAdmin {
        require(_saleCuratorLiabilityBasisPoints != 0, ZERO_INPUT);
        require(_saleCuratorLiabilityBasisPoints <= 10_000, "Invalid bp");
        saleCuratorLiabilityBasisPoints = _saleCuratorLiabilityBasisPoints;
        emit SaleCuratorLiabilityBasisPointsUpdated(
            _saleCuratorLiabilityBasisPoints
        );
    }

    /// @dev Setter for the reaction price
    function setSaleReferrerBasisPoints(uint256 _saleReferrerBasisPoints)
        external
        onlyAdmin
    {
        require(_saleReferrerBasisPoints != 0, ZERO_INPUT);
        require(_saleReferrerBasisPoints <= 10_000, "Invalid bp");
        saleReferrerBasisPoints = _saleReferrerBasisPoints;
        emit SaleReferrerBasisPointsUpdated(_saleReferrerBasisPoints);
    }

    /// @dev Setter for the spend taker basis points
    function setSpendTakerBasisPoints(uint256 _spendTakerBasisPoints)
        external
        onlyAdmin
    {
        require(_spendTakerBasisPoints != 0, ZERO_INPUT);
        require(_spendTakerBasisPoints <= 10_000, "Invalid bp");
        spendTakerBasisPoints = _spendTakerBasisPoints;
        emit SpendTakerBasisPointsUpdated(_spendTakerBasisPoints);
    }

    /// @dev Setter for the spend referrer basis points
    function setSpendReferrerBasisPoints(uint256 _spendReferrerBasisPoints)
        external
        onlyAdmin
    {
        require(_spendReferrerBasisPoints != 0, ZERO_INPUT);
        require(_spendReferrerBasisPoints <= 10_000, "Invalid bp");
        spendReferrerBasisPoints = _spendReferrerBasisPoints;
        emit SpendReferrerBasisPointsUpdated(_spendReferrerBasisPoints);
    }

    /// @dev Setter for the list of curator vaults allowed to be used
    function setApprovedCuratorVaults(address vault, bool approved)
        external
        onlyAdmin
    {
        require(vault != address(0x0), ZERO_INPUT);
        approvedCuratorVaults[vault] = approved;
        emit ApprovedCuratorVaultsUpdated(vault, approved);
    }

    /// @dev Setter for the native wrapped ERC20 token (e.g. WMATIC)
    function setNativeWrappedToken(IERC20Upgradeable _nativeWrappedToken)
        external
        onlyAdmin
    {
        require(address(_nativeWrappedToken) != address(0x0), ZERO_INPUT);
        nativeWrappedToken = _nativeWrappedToken;
        emit NativeWrappedTokenUpdated(_nativeWrappedToken);
    }

    /// @dev Setter for the amount of reactions allowed per free reaction
    function setFreeReactionLimit(uint256 _reactionLimit) external onlyAdmin {
        require(_reactionLimit > 0, ZERO_INPUT);
        freeReactionLimit = _reactionLimit;
        emit FreeReactionLimitUpdated(_reactionLimit);
    }

    /// @dev Incrementer for an account's current EIP-712 signature nonce
    function incSigNonceFor(address signer) external returns (uint256 nonce) {
        // Returns the original nonce
        nonce = sigNonces[signer];
        uint256 incrementedNonce = nonce + 1;
        sigNonces[signer] = incrementedNonce;
        emit SignatureNonceUpdated(signer, incrementedNonce);
    }
}
