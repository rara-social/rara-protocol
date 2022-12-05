//SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import "./ILikeTokenFactory.sol";
import "./LikeTokenFactoryStorage.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

/// @title LikeTokenFactory
/// @dev This contract is responsible for issuing like tokens for a target NFT.
/// It will keep track of like token contracts for each NFT.  When a new Like Token
/// is issued, it will check to see if it already has deployed a like token contract
/// and if not, deploy a new proxy contract for that token.
contract LikeTokenFactory is
    Initializable,
    ILikeTokenFactory,
    LikeTokenFactoryStorageV1
{
    /// @dev emitted when new like token contract is created
    event TokenDeployed(
        uint256 takerNftChainId,
        address takerNftAddress,
        uint256 takerNftId,
        address deployedContract
    );

    /// @dev verifies that the calling account has a role to enable minting tokens
    modifier onlyReactionNftAdmin() {
        IRoleManager roleManager = IRoleManager(addressManager.roleManager());
        require(roleManager.isReactionNftAdmin(msg.sender), "Not NFT Admin");
        _;
    }

    /// @dev initializer to call after deployment, can only be called once
    function initialize(
        IAddressManager _addressManager,
        address _tokenImplementation,
        string calldata _baseTokenUri
    ) public initializer {
        require(address(_addressManager) != address(0x0), "Invalid 0 input");
        addressManager = _addressManager;

        require(
            address(_tokenImplementation) != address(0x0),
            "Invalid 0 input"
        );
        tokenImplementation = _tokenImplementation;

        baseTokenUri = _baseTokenUri;
    }

    /// @dev issue like token to target address
    function issueLikeToken(
        address targetAddress,
        uint256 takerNftChainId,
        address takerNftAddress,
        uint256 takerNftId
    ) public onlyReactionNftAdmin returns (address, uint256) {
        // Get the key from the taker nft details
        uint256 tokenIndex = uint256(
            keccak256(abi.encode(takerNftChainId, takerNftAddress, takerNftId))
        );

        // Check if it exists
        ILikeToken1155 targetContract = likeTokens[tokenIndex];

        // If it doesn't exist, then create it
        if (address(targetContract) == address(0x0)) {
            // Deploy it
            address newlyDeployed = ClonesUpgradeable.clone(
                tokenImplementation
            );

            // Initialize it
            ILikeToken1155(newlyDeployed).initialize(
                // The URI is a concat of the base URI + addr + "/{id}
                string(
                    abi.encodePacked(
                        baseTokenUri,
                        StringsUpgradeable.toHexString(
                            uint256(uint160(newlyDeployed)),
                            20
                        ),
                        "/{id}"
                    )
                ),
                address(addressManager),
                string(
                    abi.encodePacked(
                        string.concat(bytes(baseTokenUri), "/contract/"),
                        StringsUpgradeable.toHexString(
                            uint256(uint160(newlyDeployed)),
                            20
                        )
                    )
                )
            );

            // Save it to the mapping
            likeTokens[tokenIndex] = ILikeToken1155(newlyDeployed);

            // Set the address
            targetContract = ILikeToken1155(newlyDeployed);

            // Emit event
            emit TokenDeployed(
                takerNftChainId,
                takerNftAddress,
                takerNftId,
                newlyDeployed
            );
        }

        // Mint the token
        uint256 tokenId = targetContract.mint(targetAddress);
        return (targetAddress, tokenId);
    }
}
