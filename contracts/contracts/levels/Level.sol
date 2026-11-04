// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {ILevel} from "../interfaces/ILevel.sol";

/// Base commune des factories : seule la plateforme crée des instances, et
/// chaque instance n'est validable que pour le joueur pour qui elle a été créée.
abstract contract Level is ILevel {
    /// Seule adresse autorisée à créer des instances (CTFPlatform, ou un compte de test).
    address public immutable platform;

    /// Joueur pour qui chaque instance a été créée.
    mapping(address instance => address player) public playerOf;

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

        // Le déploiement n'appelle que du code de cette épreuve, jamais l'appelant.
        instance = _deploy(player);
        playerOf[instance] = player;
        emit InstanceCreated(player, instance);
    }

    function validateInstance(address instance, address player) external view returns (bool) {
        // L'instance d'un autre joueur, ou une adresse inconnue, ne valide jamais rien.
        if (player == address(0) || playerOf[instance] != player) return false;
        return _isSolved(instance, player);
    }

    /// Déploie l'instance vulnérable de `player`.
    function _deploy(address player) internal virtual returns (address instance);

    /// Lit l'état de `instance` et dit si l'exploit a réussi.
    function _isSolved(address instance, address player) internal view virtual returns (bool);
}
