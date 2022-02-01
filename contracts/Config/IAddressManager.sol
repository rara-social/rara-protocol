//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../Permissions/IRoleManager.sol";

interface IAddressManager {
    /// @dev Getter for the role manager address
    function getRoleManager() external returns (IRoleManager);

    /// @dev Setter for the role manager address
    function setRoleManager(IRoleManager _roleManager) external;
}
