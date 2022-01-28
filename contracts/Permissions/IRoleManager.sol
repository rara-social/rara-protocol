//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

interface IRoleManager  {
  
  /// @dev Determines if the specified address has permission to mint Reaction NFTs
  /// @param potentialAddress Address to check
  function isReactionMinter(address potentialAddress) external view returns (bool);
}