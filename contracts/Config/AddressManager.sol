//SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import "./AddressManagerStorage.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/// @dev Note: This contract is protected via a permissioned account set in the role manager.  Caution should
/// be used as the role owner could renounce the role leaving all future actions disabled.  Additionally,
/// if a malicious account was able to obtain the role, they could use it to set values to malicious addresses.
/// See the public documentation website for more details.
contract AddressManager is Initializable, AddressManagerStorageV2 {
    /// @dev Verifies with the role manager that the calling address has ADMIN role
    modifier onlyAdmin() {
        require(roleManager.isAddressManagerAdmin(msg.sender), "Not Admin");
        _;
    }

    /// @dev Events emitted on updates
    event RoleManagerAddressUpdated(address newAddress);
    event ParameterManagerAddressUpdated(address newAddress);
    event MakerRegistrarAddressUpdated(address newAddress);
    event ReactionNftContractAddressUpdated(address newAddress);
    event DefaultCuratorVaultAddressUpdated(address newAddress);
    event ChildRegistrarAddressUpdated(address newAddress);
    event RoyaltyRegistryAddressUpdated(address newAddress);
    event LikeTokenFactoryAddressUpdated(address newAddress);

    /// @dev initializer to call after deployment, can only be called once
    function initialize(IRoleManager _roleManager) public initializer {
        require(address(_roleManager) != address(0x0), ZERO_INPUT);
        roleManager = _roleManager;
    }

    /// @dev Setter for the role manager address
    function setRoleManager(IRoleManager _roleManager) external onlyAdmin {
        // Sanity check
        require(address(_roleManager) != address(0x0), ZERO_INPUT);

        // If the role manager address gets corrupted then this contract is DOA
        // since no future updates can be performed via permission checks.
        // Ensure the target address is valid and configured by requiring the current admin
        // making this call is an admin on the new contract
        require(_roleManager.isAdmin(msg.sender), "RM invalid");

        roleManager = _roleManager;
        emit RoleManagerAddressUpdated(address(_roleManager));
    }

    /// @dev Setter for the role manager address
    function setParameterManager(IParameterManager _parameterManager)
        external
        onlyAdmin
    {
        require(address(_parameterManager) != address(0x0), ZERO_INPUT);
        parameterManager = _parameterManager;
        emit ParameterManagerAddressUpdated(address(_parameterManager));
    }

    /// @dev Setter for the maker registrar address
    function setMakerRegistrar(IMakerRegistrar _makerRegistrar)
        external
        onlyAdmin
    {
        require(address(_makerRegistrar) != address(0x0), ZERO_INPUT);
        makerRegistrar = _makerRegistrar;
        emit MakerRegistrarAddressUpdated(address(_makerRegistrar));
    }

    /// @dev Setter for the maker registrar address
    function setReactionNftContract(IStandard1155 _reactionNftContract)
        external
        onlyAdmin
    {
        require(address(_reactionNftContract) != address(0x0), ZERO_INPUT);
        reactionNftContract = _reactionNftContract;
        emit ReactionNftContractAddressUpdated(address(_reactionNftContract));
    }

    /// @dev Setter for the default curator vault address
    function setDefaultCuratorVault(ICuratorVault _defaultCuratorVault)
        external
        onlyAdmin
    {
        require(address(_defaultCuratorVault) != address(0x0), ZERO_INPUT);
        defaultCuratorVault = _defaultCuratorVault;
        emit DefaultCuratorVaultAddressUpdated(address(_defaultCuratorVault));
    }

    /// @dev Setter for the L2 bridge registrar
    function setChildRegistrar(address _childRegistrar) external onlyAdmin {
        require(address(_childRegistrar) != address(0x0), ZERO_INPUT);
        childRegistrar = _childRegistrar;
        emit ChildRegistrarAddressUpdated(address(_childRegistrar));
    }

    /// @dev Setter for the address of the royalty registry
    function setRoyaltyRegistry(address _royaltyRegistry) external onlyAdmin {
        // We DO allow the royalty registry to be set to 0x0 as this disables the lookup
        royaltyRegistry = _royaltyRegistry;
        emit RoyaltyRegistryAddressUpdated(royaltyRegistry);
    }

    /// @dev Setter for the address of the Like Token Factory
    function setLikeTokenFactory(address _likeTokenFactory) external onlyAdmin {
        // We DO allow the Like Token Factory to be set to 0x0 as this disables the functionality
        likeTokenFactory = _likeTokenFactory;
        emit LikeTokenFactoryAddressUpdated(royaltyRegistry);
    }
}
