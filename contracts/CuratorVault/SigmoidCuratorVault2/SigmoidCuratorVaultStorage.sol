//SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import "../../Config/IAddressManager.sol";
import "./ICuratorVault2.sol";

/// @title SigmoidCuratorVaultStorage
/// @dev This contract will hold all local variables for the SigmoidCuratorVault Contract
/// When upgrading the protocol, inherit from this contract on the V2 version and change the
/// CuratorVault to inherit from the later version.  This ensures there are no storage layout
/// corruptions when upgrading.
abstract contract SigmoidCuratorVaultStorageV1 is ICuratorVault2 {
    /// @dev Input error for 0 value param
    string internal constant ZERO_INPUT = "Invalid 0 input";

    /// @dev local reference to the address manager contract
    IAddressManager public addressManager;

    /// @dev tracks the total supply for each curator Token token ID
    mapping(uint256 => uint256) public curatorTokenSupply;

    /// @dev tracks the total payment amount held for each curator Token token ID
    mapping(uint256 => uint256) public reserves;

    /// @dev the 1155 contract to track curator Tokens
    IStandard1155 public curatorTokens;

    /// @dev Curve parameters
    uint256 public a;
    uint256 public b;
    uint256 public c;
}

/// On the next version of the protocol, if new variables are added, put them in the below
/// contract and use this as the inheritance chain.
/**
contract SigmoidCuratorVaultStorageV2 is SigmoidCuratorVaultStorageV1 {
  address newVariable;
}
 */
