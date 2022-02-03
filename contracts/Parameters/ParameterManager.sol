//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "./IParameterManager.sol";
import "./ParameterManagerStorage.sol";
import "../Config/IAddressManager.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract ParameterManager is
    IParameterManager,
    Initializable,
    ParameterManagerStorageV1
{
    /// @dev Verifies with the role manager that the calling address has ADMIN role
    modifier onlyAdmin() {
        require(
            addressManager.getRoleManager().isAdmin(msg.sender),
            "Not Admin"
        );
        _;
    }

    /// @dev initializer to call after deployment, can only be called once
    function initialize(IAddressManager _addressManager) public initializer {
        addressManager = _addressManager;
    }

    /// @dev Getter for the payment token
    function getPaymentToken() external view returns (IERC20Upgradeable) {
        return paymentToken;
    }

    /// @dev Setter for the payment token
    function setPaymentToken(IERC20Upgradeable _paymentToken)
        external
        onlyAdmin
    {
        require(
            address(_paymentToken) != address(0x0),
            "Invalid _paymentToken"
        );
        paymentToken = _paymentToken;
    }

    /// @dev Getter for the reaction price
    function getReactionPrice() external view returns (uint256) {
        return reactionPrice;
    }

    /// @dev Setter for the reaction price
    function setReactionPrice(uint256 _reactionPrice) external onlyAdmin {
        require(_reactionPrice != 0, "Invalid _reactionPrice");
        reactionPrice = _reactionPrice;
    }

    /// @dev Getter for the reaction price
    function getSaleCuratorLiabilityBasisPoints()
        external
        view
        returns (uint256)
    {
        return saleCuratorLiabilityBasisPoints;
    }

    /// @dev Setter for the reaction price
    function setSaleCuratorLiabilityBasisPoints(
        uint256 _saleCuratorLiabilityBasisPoints
    ) external onlyAdmin {
        require(
            _saleCuratorLiabilityBasisPoints != 0,
            "Invalid _saleCuratorLiabilityBasisPoints"
        );
        saleCuratorLiabilityBasisPoints = _saleCuratorLiabilityBasisPoints;
    }

    /// @dev Getter for the reaction price
    function getSaleCreatorBasisPoints() external view returns (uint256) {
        return saleCreatorBasisPoints;
    }

    /// @dev Setter for the reaction price
    function setSaleCreatorBasisPoints(uint256 _saleCreatorBasisPoints)
        external
        onlyAdmin
    {
        require(
            _saleCreatorBasisPoints != 0,
            "Invalid _saleCreatorBasisPoints"
        );
        saleCreatorBasisPoints = _saleCreatorBasisPoints;
    }

    /// @dev Getter for the reaction price
    function getSaleReferrerBasisPoints() external view returns (uint256) {
        return saleReferrerBasisPoints;
    }

    /// @dev Setter for the reaction price
    function setSaleReferrerBasisPoints(uint256 _saleReferrerBasisPoints)
        external
        onlyAdmin
    {
        require(
            _saleReferrerBasisPoints != 0,
            "Invalid _saleReferrerBasisPoints"
        );
        saleReferrerBasisPoints = _saleReferrerBasisPoints;
    }
}
