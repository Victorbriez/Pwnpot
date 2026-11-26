// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {ILevel} from "../interfaces/ILevel.sol";

/// Test only: instance funded by DryFactory, solved by its player. Never deploy it.
contract DryInstance {
    address public immutable player;
    bool public solved;

    constructor(address player_) payable {
        player = player_;
    }

    function solve() external {
        if (msg.sender != player) revert();
        solved = true;
    }
}

/// Test only: a funded level factory (like VaultFactory) that seeds every
/// instance with `SEED` wei, and runs dry when the organizer did not send
/// enough. Never deploy it.
contract DryFactory is ILevel {
    uint256 public constant SEED = 0.001 ether;

    error InsufficientFunds(uint256 available, uint256 needed);

    /// The organizer tops the factory up here.
    receive() external payable {}

    function createInstance(address player) external returns (address) {
        if (address(this).balance < SEED) revert InsufficientFunds(address(this).balance, SEED);
        return address(new DryInstance{value: SEED}(player));
    }

    function validateInstance(address instance, address player) external view returns (bool) {
        DryInstance inst = DryInstance(instance);
        return inst.player() == player && inst.solved();
    }
}
