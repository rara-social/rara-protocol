//SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

/// @dev Interface for interacting with the wrapped matic token contract
interface IWMATIC {
    // Send MATIC directly to contract
    receive() external payable;

    // Call deposit directly
    function deposit() external payable;

    // Withdraw wrapped tokens into MATIC
    function withdraw(uint256 wad) external;

    // Approve another address to move tokens - ERC20
    function approve(address guy, uint256 wad) external returns (bool);

    // Transfer tokens to an address - ERC20
    function transfer(address dst, uint256 wad) external returns (bool);

    // Transfer tokens from a source address to destination address - ERC20
    function transferFrom(
        address src,
        address dst,
        uint256 wad
    ) external returns (bool);
}
