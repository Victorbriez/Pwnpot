// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {ILevel} from "../interfaces/ILevel.sol";

/// Instance minimale pour les tests : le joueur la « résout » en appelant `solve`.
/// TEST UNIQUEMENT, ne pas déployer.
contract TestInstance {
    address public immutable player;
    bool public solved;

    constructor(address player_) {
        player = player_;
    }

    function solve() external {
        if (msg.sender != player) revert();
        solved = true;
    }
}

/// Factory minimale pour tester CTFPlatform sans dépendre des vraies épreuves (#7).
/// TEST UNIQUEMENT, ne pas déployer.
contract TestLevel is ILevel {
    function createInstance(address player) external returns (address) {
        return address(new TestInstance(player));
    }

    function validateInstance(address instance, address player) external view returns (bool) {
        TestInstance inst = TestInstance(instance);
        return inst.player() == player && inst.solved();
    }
}
