//SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.9;

import "./FxBaseChildTunnel.sol";
import "../Config/IAddressManager.sol";

/// @dev This contract lives on the L2 and receives messages from the L1 to register and unregister
/// NFTs on the L1 chain.
/// This is not an upgradeable contract and should not be used with a proxy.
contract ChildRegistrar is FxBaseChildTunnel {
    bytes32 public constant REGISTER = keccak256("REGISTER");
    bytes32 public constant DE_REGISTER = keccak256("DE_REGISTER");

    /// @dev local reference to the address manager contract
    IAddressManager public addressManager;

    /// @dev the address that deployed this contract is the only one that can update the fxRootTunnel
    address public deployer;

    /// @param _fxChild - This is the contract deployed on the L2 that will be sending messages here.
    /// This is a well known deployed contract that Matic has set up.
    /// @param _addressManager - This is the address manager on the protocol
    /// @dev After deployment you must call setFxRootTunnel() with the RootRegistrar Address on the L1.
    constructor(address _fxChild, IAddressManager _addressManager)
        FxBaseChildTunnel(_fxChild)
    {
        addressManager = _addressManager;
        deployer = msg.sender;
    }

    /// @dev Set fxRootTunnel if not set already
    /// Only the deploying account can update this
    /// Overrides the function in the base contract
    function setFxRootTunnel(address _fxRootTunnel) external override {
        require(deployer == msg.sender, "Only deployer");
        require(fxRootTunnel == address(0x0), "Already set");
        fxRootTunnel = _fxRootTunnel;
    }

    /// @dev The base contract ensures that the incoming message is from the contract _fxChild passed in the constructor.
    /// The validateSender() makes sure that the contract on the root chain is the one relaying the message.
    /// The root contract should have been set via setFxRootTunnel() after deployment
    function _processMessageFromRoot(
        uint256, /* stateId */
        address sender,
        bytes memory data
    ) internal override validateSender(sender) {
        // decode incoming data
        (bytes32 syncType, bytes memory syncData) = abi.decode(
            data,
            (bytes32, bytes)
        );

        if (syncType == REGISTER) {
            _registerNft(syncData);
        } else if (syncType == DE_REGISTER) {
            _deRegisterNft(syncData);
        } else {
            revert("ERR MSG");
        }
    }

    /// @dev Handler for messages coming from the L1 when an owner wants to register
    function _registerNft(bytes memory syncData) internal {
        // Decode the params from the data
        (
            address owner,
            uint256 chainId,
            address nftContractAddress,
            uint256 nftId,
            address[] memory creatorAddresses,
            uint256[] memory creatorSaleBasisPoints,
            uint256 optionBits,
            string memory ipfsMetadataHash
        ) = abi.decode(
                syncData,
                (
                    address,
                    uint256,
                    address,
                    uint256,
                    address[],
                    uint256[],
                    uint256,
                    string
                )
            );

        // Call the registrar and register the NFT
        addressManager.makerRegistrar().registerNftFromBridge(
            owner,
            chainId,
            nftContractAddress,
            nftId,
            creatorAddresses,
            creatorSaleBasisPoints,
            optionBits,
            ipfsMetadataHash
        );
    }

    /// @dev Handler for messages coming from the L1 when an owner wants to de-register
    function _deRegisterNft(bytes memory syncData) internal {
        // Decode the params from the data
        (
            address owner,
            uint256 chainId,
            address nftContractAddress,
            uint256 nftId
        ) = abi.decode(syncData, (address, uint256, address, uint256));

        addressManager.makerRegistrar().deRegisterNftFromBridge(
            owner,
            chainId,
            nftContractAddress,
            nftId
        );
    }
}
