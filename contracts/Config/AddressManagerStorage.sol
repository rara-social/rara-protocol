//SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import "../Permissions/IRoleManager.sol";
import "../Parameters/IParameterManager.sol";
import "../Maker/IMakerRegistrar.sol";
import "../Token/IStandard1155.sol";
import "../DispatcherManager/IDispatcherManager.sol";
import "./IAddressManager.sol";

/// @title AddressManagerStorage
/// @dev This contract will hold all local variables for the AddressManager Contract
/// When upgrading the protocol, inherit from this contract on the V2 version and change the
/// AddressManager to inherit from the later version.  This ensures there are no storage layout
/// corruptions when upgrading.
abstract contract AddressManagerStorageV1 is IAddressManager {
    /// @dev Input error for 0 value param
    string internal constant ZERO_INPUT = "Invalid 0 input";

    /// @dev Local reference to the role manager contract
    IRoleManager public roleManager;

    /// @dev Local reference to the payment manager contract
    IParameterManager public parameterManager;

    /// @dev Local reference to the maker registrar contract
    IMakerRegistrar public makerRegistrar;

    /// @dev Local reference to the reaction NFT contract
    IStandard1155 public reactionNftContract;

    /// @dev Local reference to the default curator vault
    ICuratorVault public defaultCuratorVault;

    /// @dev Local reference to the L2 bridge registrar
    address public childRegistrar;

    /// @dev Address of the Royalty Registry contract
    address public royaltyRegistry;
}

/// On the next version of the protocol, if new variables are added, put them in the below
/// contract and use this as the inheritance chain.
abstract contract AddressManagerStorageV2 is AddressManagerStorageV1 {
    /// @dev Address of the Like Token Factory
    address public likeTokenFactory;
}

abstract contract AddressManagerStorageV3 is AddressManagerStorageV2 {
    /// @dev Local reference to the dispatcher manager
    IDispatcherManager public dispatcherManager;
}

/// On the next version of the protocol, if new variables are added, put them in the below
/// contract and use this as the inheritance chain.
/**
contract AddressManagerStorageV4 is AddressManagerStorageV3 {
  address newVariable;
}
 */
