// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {ILevel} from "../interfaces/ILevel.sol";

/// Level 2, Impostor: checking `tx.origin` instead of `msg.sender` lets any
/// intermediate contract through.
/// INTENTIONALLY VULNERABLE. Do not reuse.
contract Impostor {
    /// Player this instance was created for. Only their transactions can take it over,
    /// so rivals cannot overwrite the owner of someone else's instance.
    address public immutable player;
    address public owner;

    constructor(address initialOwner, address player_) {
        owner = initialOwner;
        player = player_;
    }

    function changeOwner(address newOwner) external {
        // The flaw: `tx.origin != msg.sender` is true as soon as a contract sits
        // between the player's wallet and this call.
        if (tx.origin == player && tx.origin != msg.sender) {
            owner = newOwner;
        }
    }
}

/// Factory for the Impostor level. The factory is the initial owner of every
/// instance: the player solves the level by becoming the owner of their own instance.
contract ImpostorFactory is ILevel {
    /// Only address allowed to create instances (CTFPlatform).
    address public immutable platform;

    /// Instances deployed by this factory. The player is stored in the instance itself.
    mapping(address instance => bool) public isInstance;

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

        // Only deploys code from this file; never calls back into the caller.
        // The factory owns the instance and has no function to transfer it,
        // so a fresh instance never validates.
        instance = address(new Impostor(address(this), player));
        isInstance[instance] = true;
        emit InstanceCreated(player, instance);
    }

    function validateInstance(address instance, address player) external view returns (bool) {
        // An address not deployed by this factory never validates, so its code is trusted below.
        if (player == address(0) || !isInstance[instance]) return false;
        Impostor impostor = Impostor(instance);
        // Another player's instance never counts.
        return impostor.player() == player && impostor.owner() == player;
    }
}
