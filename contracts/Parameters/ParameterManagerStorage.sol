//SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import "../Config/IAddressManager.sol";
import "./IParameterManager.sol";
import "../Token/IWMATIC.sol";

/// @title ParameterManagerStorage
/// @dev This contract will hold all local variables for the ParameterManager Contract
/// When upgrading the protocol, inherit from this contract on the V2 version and change the
/// ParameterManager to inherit from the later version.  This ensures there are no storage layout
/// corruptions when upgrading.
abstract contract ParameterManagerStorageV1 is IParameterManager {
    /// @dev Input error for 0 value param
    string internal constant ZERO_INPUT = "Invalid 0 input";

    /// @dev local reference to the address manager contract
    IAddressManager public addressManager;

    /// @dev The payment token used to buy reactions
    IWMATIC public paymentToken;

    /// @dev The amount each reaction costs in paymentToken
    uint256 public reactionPrice;

    /// @dev Basis points for the curator liability during a reaction sale
    /// Basis points are percentage divided by 100 (e.g. 100 Basis Points is 1%)
    uint256 public saleCuratorLiabilityBasisPoints;

    /// @dev Basis points for the referrer during a reaction sale
    /// Basis points are percentage divided by 100 (e.g. 100 Basis Points is 1%)
    uint256 public saleReferrerBasisPoints;

    /// @dev Basis points for the taker NFT owner.
    /// This is the percentage of the Curator Liability being assigned to the taker
    /// Basis points are percentage divided by 100 (e.g. 100 Basis Points is 1%)
    uint256 public spendTakerBasisPoints;

    /// @dev Basis points for the spend referrer.
    /// This is the percentage of the Curator Liability being assigned to the referrer
    /// Basis points are percentage divided by 100 (e.g. 100 Basis Points is 1%)
    uint256 public spendReferrerBasisPoints;

    /// @dev Mapping of the approved curator vaults (other than the default)
    /// If set to true then it is allowed to be used.
    mapping(address => bool) public approvedCuratorVaults;
}

abstract contract ParameterManagerStorageV2 is ParameterManagerStorageV1 {
    /// @dev address of the blockchain's wrapped token, eg, WMATIC
    /// This allows the contracts to distinguish between payments in WMATIC vs, eg, USDC
    IERC20Upgradeable public nativeWrappedToken;

    /// @dev Amount of reactions (quantity) allowed when reacting for free
    /// If set to true then it is allowed to be used.
    uint256 public freeReactionLimit;
}

/// On the next version of the protocol, if new variables are added, put them in the below
/// contract and use this as the inheritance chain.
/**
contract ParameterManagerStorageV3 is ParameterManagerStorageV2 {
  address newVariable;
}
 */
