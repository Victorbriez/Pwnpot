// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {ILevel} from "../interfaces/ILevel.sol";

/// Level 3, Code Safe: `private` does not hide storage from anyone querying a node.
/// INTENTIONALLY VULNERABLE. Do not reuse.
contract CodeSafe {
    bool public locked = true; // slot 0
    bytes32 private password; // slot 1: readable with eth_getStorageAt

    constructor(bytes32 password_) {
        password = password_;
    }

    function unlock(bytes32 attempt) external {
        if (attempt == password) locked = false;
    }
}

/// Factory for the Code Safe level. Each instance gets its own password,
/// so copying the password of another instance is useless.
contract CodeSafeFactory is ILevel {
    /// Only address allowed to create instances (CTFPlatform).
    address public immutable platform;

    /// Player each instance was created for.
    mapping(address instance => address player) public playerOf;

    /// Instance counter, mixed into the password so two instances never share one.
    uint256 private _nonce;

    event InstanceCreated(address indexed player, address indexed instance);

    error OnlyPlatform();
    error ZeroAddress();

    constructor(address platform_) {
        if (platform_ == address(0)) revert ZeroAddress();
        platform = platform_;
    }

    function createInstance(address player) external returns (address instance) {
        if (msg.sender != platform) revert OnlyPlatform();
        if (player == address(0)) revert ZeroAddress();

        // Pseudo-random is enough: the secret does not need to be unpredictable,
        // it is readable from storage anyway. That is the vulnerability.
        bytes32 password = keccak256(
            abi.encode(player, blockhash(block.number - 1), address(this), _nonce++)
        );

        // Only deploys code from this file; never calls back into the caller.
        instance = address(new CodeSafe(password));
        playerOf[instance] = player;
        emit InstanceCreated(player, instance);
    }

    function validateInstance(address instance, address player) external view returns (bool) {
        // Another player's instance, or an unknown address, never validates.
        if (player == address(0) || playerOf[instance] != player) return false;
        return !CodeSafe(instance).locked();
    }
}
