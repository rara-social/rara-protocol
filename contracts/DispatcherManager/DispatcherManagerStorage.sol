//SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import "../Config/IAddressManager.sol";
import "./IDispatcherManager.sol";
import {DataTypes} from "../WithSig/DataTypes.sol";

/// @title DispatcherManagerStorage
/// @dev This contract will hold all local variables for the DispatcherManager Contract
/// When upgrading the protocol, inherit from this contract on the V2 version and change the
/// DispatcherManager to inherit from the later version.  This ensures there are no storage layout
/// corruptions when upgrading.
abstract contract DispatcherManagerStorageV1 is IDispatcherManager {
    /// @dev Input error for 0 value param
    string internal constant ZERO_INPUT = "Invalid 0 input";

    /// @dev Dispatcher management errors
    string internal constant DISPATCHER_ALREADY_ASSIGNED =
        "Dispatcher already assigned";
    string internal constant DISPATCHER_ALREADY_UNASSIGNED =
        "Dispatcher already unassigned";

    /// @dev Typehash for the addDispatcherWithSig method
    bytes32 internal constant ADD_DISPATCHER_WITH_SIG_TYPEHASH =
        keccak256(
            "AddDispatcherWithSig(address account,address dispatcher,uint256 nonce,uint256 deadline)"
        );

    /// @dev Typehash for the removedDispatcherWithSig method
    bytes32 internal constant REMOVE_DISPATCHER_WITH_SIG_TYPEHASH =
        keccak256(
            "RemoveDispatcherWithSig(address account,address dispatcher,uint256 nonce,uint256 deadline)"
        );

    /// @dev Local reference to the address manager contract
    IAddressManager public addressManager;

    /// @dev Mapping to track dispatchers assigned to an account
    mapping(address => mapping(address => bool)) public dispatchersByAccount;

    /**
     * @notice A struct containing the parameters required for the `addDispatcherWithSig()` function. Parameters are the same
     * as the regular `addDispatcher()` function, with an added EIP712Signature.
     *
     * @param account The address of the account to set the dispatcher for.
     * @param newDispatcher The new dispatcher address to add for the account.
     * @param sig The EIP712Signature struct containing the account's signature.
     */
    struct AddDispatcherWithSigData {
        address account;
        address dispatcher;
        DataTypes.EIP712Signature sig;
    }

    /**
     * @notice A struct containing the parameters required for the `removeDispatcherWithSig()` function. Parameters are the same
     * as the regular `removeDispatcher()` function, with an added EIP712Signature.
     *
     * @param account The address of the account to set the dispatcher for.
     * @param newDispatcher The new dispatcher address to add for the account.
     * @param sig The EIP712Signature struct containing the account's signature.
     */
    struct RemoveDispatcherWithSigData {
        address account;
        address dispatcher;
        DataTypes.EIP712Signature sig;
    }
}

/// On the next version of the protocol, if new variables are added, put them in the below
/// contract and use this as the inheritance chain.
/**
contract DispatcherManagerStorageV2 is DispatcherManagerStorageV1 {
  address newVariable;
}
 */
