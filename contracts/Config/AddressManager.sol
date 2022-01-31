//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "./IAddressManager.sol";
import "./AddressManagerStorage.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract AddressManager is
    IAddressManager,
    Initializable,
    AddressManagerStorageV1
{
    /// @dev Verifies with the role manager that the calling address has ADMIN role
    modifier onlyAdmin() {
        require(roleManager.isAdmin(msg.sender), "Not Admin");
        _;
    }

    /// @dev initializer to call after deployment, can only be called once
    function initialize(IRoleManager _roleManager) public initializer {
        require(address(_roleManager) != address(0x0), "Invalid _roleManager");
        roleManager = _roleManager;
    }

    /// @dev Getter for the role manager address
    function getRoleManager() external view returns (IRoleManager) {
        return roleManager;
    }

    /// @dev Setter for the role manager address
    function setRoleManager(IRoleManager _roleManager) external onlyAdmin {
        require(address(_roleManager) != address(0x0), "Invalid _roleManager");
        roleManager = _roleManager;
    }
}
