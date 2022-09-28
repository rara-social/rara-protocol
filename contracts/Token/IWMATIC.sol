//SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

/// @dev Interface for interacting with the wrapped matic token contract
interface IWMATIC is IERC20Upgradeable {
    // Send MATIC directly to contract
    receive() external payable;

    // Call deposit directly
    function deposit() external payable;

    // Withdraw wrapped tokens into MATIC
    function withdraw(uint256 wad) external;
}
