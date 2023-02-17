//SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import {DataTypes} from "../WithSig/DataTypes.sol";
import {WithSigEnabled} from "../WithSig/WithSigEnabled.sol";
import {IAddressManager} from "../Config/IAddressManager.sol";
import {DispatcherManagerStorageV1} from "./DispatcherManagerStorage.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract DispatcherManager is
    WithSigEnabled,
    Initializable,
    ReentrancyGuardUpgradeable,
    DispatcherManagerStorageV1
{
    /// @dev Event emitted when a dispatcher is added
    event DispatcherAdded(address account, address addedDispatcher);

    /// @dev Event emitted when a dispatcher is removed
    event DispatcherRemoved(address account, address removedDispatcher);

    /// @dev initializer to call after deployment, can only be called once
    function initialize(IAddressManager _addressManager) public initializer {
        require(address(_addressManager) != address(0x0), ZERO_INPUT);
        __ReentrancyGuard_init();
        addressManager = _addressManager;
    }

    function _addDispatcher(address _account, address _dispatcher) internal {
        require(
            dispatchersByAccount[_account][_dispatcher] == false,
            DISPATCHER_ALREADY_ASSIGNED
        );
        dispatchersByAccount[_account][_dispatcher] = true;
        emit DispatcherAdded(_account, _dispatcher);
    }

    function _removeDispatcher(address _account, address _dispatcher) internal {
        require(
            dispatchersByAccount[_account][_dispatcher] == true,
            DISPATCHER_ALREADY_UNASSIGNED
        );
        dispatchersByAccount[_account][_dispatcher] = false;
        emit DispatcherRemoved(_account, _dispatcher);
    }

    function callerIsAccountHolderOrDispatcher(address _account)
        external
        view
        returns (bool)
    {
        return (_account == msg.sender || // is account holder
            dispatchersByAccount[_account][msg.sender]); // is account dispatcher
    }

    function addDispatcher(address _dispatcher) external nonReentrant {
        _addDispatcher(msg.sender, _dispatcher);
    }

    function removeDispatcher(address _dispatcher) external nonReentrant {
        _removeDispatcher(msg.sender, _dispatcher);
    }

    function addDispatcherWithSig(
        DataTypes.AddDispatcherWithSigData calldata vars
    ) external nonReentrant {
        unchecked {
            _validateRecoveredAddress(
                _calculateDigest(
                    keccak256(
                        abi.encode(
                            ADD_DISPATCHER_WITH_SIG_TYPEHASH,
                            vars.account,
                            vars.dispatcher,
                            addressManager.parameterManager().incSigNonceFor(
                                vars.account
                            ),
                            vars.sig.deadline
                        )
                    )
                ),
                vars.account,
                vars.sig
            );
        }
        // Proceed with adding the dispatcher
        _addDispatcher(vars.account, vars.dispatcher);
    }

    function removeDispatcherWithSig(
        DataTypes.RemoveDispatcherWithSigData calldata vars
    ) external nonReentrant {
        unchecked {
            _validateRecoveredAddress(
                _calculateDigest(
                    keccak256(
                        abi.encode(
                            REMOVE_DISPATCHER_WITH_SIG_TYPEHASH,
                            vars.account,
                            vars.dispatcher,
                            addressManager.parameterManager().incSigNonceFor(
                                vars.account
                            ),
                            vars.sig.deadline
                        )
                    )
                ),
                vars.account,
                vars.sig
            );
        }
        // Proceed with removing the dispatcher
        _removeDispatcher(vars.account, vars.dispatcher);
    }
}
