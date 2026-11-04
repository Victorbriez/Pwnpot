// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Level} from "./Level.sol";

/// Épreuve 3, Coffre-fort à code : `private` n'empêche pas de lire le storage.
/// VOLONTAIREMENT VULNÉRABLE. Ne pas réutiliser.
contract CodeSafe {
    bool public locked = true; // slot 0
    bytes32 private password; // slot 1 : lisible avec eth_getStorageAt

    constructor(bytes32 password_) {
        password = password_;
    }

    function unlock(bytes32 attempt) external {
        if (attempt == password) locked = false;
    }
}

/// Factory du Coffre-fort à code. Chaque instance a son propre mot de passe :
/// copier celui d'une autre instance ne sert à rien.
contract CodeSafeFactory is Level {
    uint256 private _nonce;

    constructor(address platform_) Level(platform_) {}

    function _deploy(address player) internal override returns (address) {
        // Pseudo-aléatoire suffit : le secret n'a pas à être imprévisible, il est lisible de toute façon.
        bytes32 secret = keccak256(
            abi.encode(player, block.prevrandao, block.timestamp, address(this), _nonce++)
        );
        return address(new CodeSafe(secret));
    }

    function _isSolved(address instance, address) internal view override returns (bool) {
        return !CodeSafe(instance).locked();
    }
}
