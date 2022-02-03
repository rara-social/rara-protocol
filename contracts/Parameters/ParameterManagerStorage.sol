//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../Config/IAddressManager.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

/// @title ParameterManagerStorage
/// @dev This contract will hold all local variables for the ParameterManager Contract
/// When upgrading the protocol, inherit from this contract on the V2 version and change the
/// ParameterManager to inherit from the later version.  This ensures there are no storage layout
/// corruptions when upgrading.
contract ParameterManagerStorageV1 {
    /// @dev local reference to the address manager contract
    IAddressManager public addressManager;

    /// @dev The payment token used to buy reactions
    IERC20Upgradeable public paymentToken;

    /// @dev The amoun each reaction costs in paymentToken
    uint256 public reactionPrice;

    uint256 public saleCuratorLiabilityBasisPoints;
    uint256 public saleCreatorBasisPoints;
    uint256 public saleReferrerBasisPoints;
}

/// On the next version of the protocol, if new variables are added, put them in the below
/// contract and use this as the inheritance chain.
/**
contract ParameterManagerStorageV2 is ParameterManagerStorageV1 {
  address newVariable;
}
 */
