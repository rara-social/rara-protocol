//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;


contract AddressManager {
    address public makerVault;

    function setMakerVault(address newMakerVault) external {
      makerVault = newMakerVault;
    }
}