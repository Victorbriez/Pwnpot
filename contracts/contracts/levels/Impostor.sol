// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Level} from "./Level.sol";

/// Épreuve 2, Usurpateur : le contrat authentifie avec `tx.origin`.
/// VOLONTAIREMENT VULNÉRABLE. Ne pas réutiliser.
contract Impostor {
    address public owner;

    constructor(address initialOwner) {
        owner = initialOwner;
    }

    function changeOwner(address newOwner) external {
        // Vrai dès qu'un contrat sert d'intermédiaire.
        if (tx.origin != msg.sender) {
            owner = newOwner;
        }
    }
}

/// Factory de l'Usurpateur. La factory est le propriétaire de départ : le joueur
/// réussit quand il devient propriétaire de son instance.
contract ImpostorFactory is Level {
    constructor(address platform_) Level(platform_) {}

    function _deploy(address) internal override returns (address) {
        return address(new Impostor(address(this)));
    }

    function _isSolved(address instance, address player) internal view override returns (bool) {
        return Impostor(instance).owner() == player;
    }
}
