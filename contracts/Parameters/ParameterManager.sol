//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "./ParameterManagerStorage.sol";
import "../Config/IAddressManager.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract ParameterManager is Initializable, ParameterManagerStorageV1 {
    /// @dev Verifies with the role manager that the calling address has ADMIN role
    modifier onlyAdmin() {
        require(addressManager.roleManager().isAdmin(msg.sender), "Not Admin");
        _;
    }

    /// @dev initializer to call after deployment, can only be called once
    function initialize(IAddressManager _addressManager) public initializer {
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
        saleCuratorLiabilityBasisPoints = _saleCuratorLiabilityBasisPoints;
    }

    /// @dev Setter for the reaction price
    function setSaleCreatorBasisPoints(uint256 _saleCreatorBasisPoints)
        external
        onlyAdmin
    {
        require(_saleCreatorBasisPoints != 0, ZERO_INPUT);
        saleCreatorBasisPoints = _saleCreatorBasisPoints;
    }

    /// @dev Setter for the reaction price
    function setSaleReferrerBasisPoints(uint256 _saleReferrerBasisPoints)
        external
        onlyAdmin
    {
        require(_saleReferrerBasisPoints != 0, ZERO_INPUT);
        saleReferrerBasisPoints = _saleReferrerBasisPoints;
    }
}
