//SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.9;

import "@manifoldxyz/royalty-registry-solidity/contracts/IRoyaltyEngineV1.sol";

/// @dev Testing contract to simulate royalties - anyone can set them for all queries
contract TestRoyaltyRegistry is IRoyaltyEngineV1 {
    address payable[] public recipients;
    uint256[] public amounts;

    // IERC165
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return interfaceId == type(IERC165).interfaceId;
    }

    /**
     * Get the royalty for a given token (address, id) and value amount.  Does not cache the bps/amounts.  Caches the spec for a given token address
     *
     * @param tokenAddress - The address of the token
     * @param tokenId      - The id of the token
     * @param value        - The value you wish to get the royalty of
     *
     * returns Two arrays of equal length, royalty recipients and the corresponding amount each recipient should get
     */
    function getRoyalty(
        address tokenAddress,
        uint256 tokenId,
        uint256 value
    ) external returns (address payable[] memory, uint256[] memory) {
        return (recipients, amounts);
    }

    /**
     * View only version of getRoyalty
     *
     * @param tokenAddress - The address of the token
     * @param tokenId      - The id of the token
     * @param value        - The value you wish to get the royalty of
     *
     * returns Two arrays of equal length, royalty recipients and the corresponding amount each recipient should get
     */
    function getRoyaltyView(
        address tokenAddress,
        uint256 tokenId,
        uint256 value
    ) external view returns (address payable[] memory, uint256[] memory) {
        return (recipients, amounts);
    }

    // Setter for testing
    function setRoyalties(
        address payable[] memory _recipients,
        uint256[] memory _amounts
    ) public {
        recipients = _recipients;
        amounts = _amounts;
    }
}
