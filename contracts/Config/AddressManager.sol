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

    /// @dev Getter for the role manager address
    function getParameterManager() external view returns (IParameterManager) {
        return parameterManager;
    }

    /// @dev Setter for the role manager address
    function setParameterManager(IParameterManager _parameterManager)
        external
        onlyAdmin
    {
        require(
            address(_parameterManager) != address(0x0),
            "Invalid _parameterManager"
        );
        parameterManager = _parameterManager;
    }

    /// @dev Getter for the maker registrar address
    function getMakerRegistrar() external view returns (IMakerRegistrar) {
        return makerRegistrar;
    }

    /// @dev Setter for the maker registrar address
    function setMakerRegistrar(IMakerRegistrar _makerRegistrar)
        external
        onlyAdmin
    {
        require(
            address(_makerRegistrar) != address(0x0),
            "Invalid _makerRegistrar"
        );
        makerRegistrar = _makerRegistrar;
    }

    /// @dev Getter for the maker registrar address
    function getReactionNftContract() external view returns (IStandard1155) {
        return reactionNftContract;
    }

    /// @dev Setter for the maker registrar address
    function setReactionNftContract(IStandard1155 _reactionNftContract)
        external
        onlyAdmin
    {
        require(
            address(_reactionNftContract) != address(0x0),
            "Invalid _reactionNftContract"
        );
        reactionNftContract = _reactionNftContract;
    }
}
