//SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import {DataTypes} from "../WithSig/DataTypes.sol";

interface IDispatcherManager {
    /// @dev
    function addDispatcher(address _dispatcher) external;

    /// @dev
    function removeDispatcher(address _dispatcher) external;

    /// @dev
    function addDispatcherWithSig(
        DataTypes.AddDispatcherWithSigData calldata vars
    ) external;

    /// @dev
    function removeDispatcherWithSig(
        DataTypes.RemoveDispatcherWithSigData calldata vars
    ) external;

    /// @dev
    function isDispatcherFor(address _account, address _maybeDispatcher)
        external
        view
        returns (bool);
}
