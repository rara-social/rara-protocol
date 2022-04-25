//SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.9;

import "./ParameterManagerStorage.sol";
import "../Config/IAddressManager.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract ParameterManager is Initializable, ParameterManagerStorageV1 {
    /// @dev Verifies with the role manager that the calling address has ADMIN role
    modifier onlyAdmin() {
        require(
            addressManager.roleManager().isParameterManagerAdmin(msg.sender),
            "Not Admin"
        );
        _;
    }

    /// @dev initializer to call after deployment, can only be called once
    function initialize(IAddressManager _addressManager) public initializer {
        require(address(_addressManager) != address(0x0), ZERO_INPUT);
        addressManager = _addressManager;
    }

    /// @dev Setter for the payment token
    function setPaymentToken(IERC20Upgradeable _paymentToken)
        external
        onlyAdmin
    {
        require(address(_paymentToken) != address(0x0), ZERO_INPUT);
        paymentToken = _paymentToken;
    }

    /// @dev Setter for the reaction price
    function setReactionPrice(uint256 _reactionPrice) external onlyAdmin {
        require(_reactionPrice != 0, ZERO_INPUT);
        reactionPrice = _reactionPrice;
    }

    /// @dev Setter for the reaction price
    function setSaleCuratorLiabilityBasisPoints(
        uint256 _saleCuratorLiabilityBasisPoints
    ) external onlyAdmin {
        require(_saleCuratorLiabilityBasisPoints != 0, ZERO_INPUT);
        require(_saleCuratorLiabilityBasisPoints <= 10_000, "Invalid bp");
        saleCuratorLiabilityBasisPoints = _saleCuratorLiabilityBasisPoints;
    }

    /// @dev Setter for the reaction price
    function setSaleReferrerBasisPoints(uint256 _saleReferrerBasisPoints)
        external
        onlyAdmin
    {
        require(_saleReferrerBasisPoints != 0, ZERO_INPUT);
        require(_saleReferrerBasisPoints <= 10_000, "Invalid bp");
        saleReferrerBasisPoints = _saleReferrerBasisPoints;
    }

    /// @dev Setter for the spend taker basis points
    function setSpendTakerBasisPoints(uint256 _spendTakerBasisPoints)
        external
        onlyAdmin
    {
        require(_spendTakerBasisPoints != 0, ZERO_INPUT);
        require(_spendTakerBasisPoints <= 10_000, "Invalid bp");
        spendTakerBasisPoints = _spendTakerBasisPoints;
    }

    /// @dev Setter for the spend referrer basis points
    function setSpendReferrerBasisPoints(uint256 _spendReferrerBasisPoints)
        external
        onlyAdmin
    {
        require(_spendReferrerBasisPoints != 0, ZERO_INPUT);
        require(_spendReferrerBasisPoints <= 10_000, "Invalid bp");
        spendReferrerBasisPoints = _spendReferrerBasisPoints;
    }

    /// @dev Setter for the list of curator vaults allowed to be used
    function setApprovedCuratorVaults(address vault, bool approved)
        external
        onlyAdmin
    {
        require(vault != address(0x0), ZERO_INPUT);
        approvedCuratorVaults[vault] = approved;
    }

    // @dev Setter for curator vault bonding curve params
    function setBondingCurveParams(
        uint256 a,
        uint256 b,
        uint256 c
    ) external onlyAdmin {
        require(a > 0 && b > 0 && c > 0, ZERO_INPUT);
        require(
            a <= uint256(type(int256).max) &&
                b <= uint256(type(int256).max) &&
                c <= uint256(type(int256).max),
            "Out of bounds"
        );
        bondingCurveParams = SigmoidCurveParameters(a, b, c);
    }
}
