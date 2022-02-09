//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../Config/IAddressManager.sol";
import "./IPermanentCuratorVault.sol";

/// @title PermanentCuratorVaultStorage
/// @dev This contract will hold all local variables for the PermanentCuratorVault Contract
/// When upgrading the protocol, inherit from this contract on the V2 version and change the
/// CuratorVault to inherit from the later version.  This ensures there are no storage layout
/// corruptions when upgrading.
contract PermanentCuratorVaultStorageV1 is IPermanentCuratorVault {
    /// @dev local reference to the address manager contract
    IAddressManager public addressManager;

    /// @dev Buffer on reserve amount so that it doesn't start with 0
    uint256 public constant RESERVE_BUFFER = 100000;

    /// @dev Buffer on supply amount so that it doesn't start with 0
    uint256 public constant SUPPLY_BUFFER = 1000000;

    /*
        reserve ratio, represented in ppm, 1-1000000
        1/3 corresponds to y= multiple * x^2
        1/2 corresponds to y= multiple * x
        2/3 corresponds to y= multiple * x^1/2
    */
    /// @dev The reserve ratio of the bonding curve => 300000 == 30%
    uint32 public reserveRatio;

    /// @dev tracks the total supply for each curator share token ID
    mapping(uint256 => uint256) public curatorShareSupply;

    /// @dev tracks the total payment amount held for each curator share token ID
    mapping(uint256 => uint256) public reserves;

    /// @dev the 1155 contract to track curator shares
    IStandard1155 public curatorShares;
}

/// On the next version of the protocol, if new variables are added, put them in the below
/// contract and use this as the inheritance chain.
/**
contract PermanentCuratorVaultStorageV2 is PermanentCuratorVaultStorageV1 {
  address newVariable;
}
 */
