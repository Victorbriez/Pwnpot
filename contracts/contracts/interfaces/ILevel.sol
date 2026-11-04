// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

/// Interface d'une épreuve Pwnpot (docs/CHALLENGES.md).
interface ILevel {
    /// Déploie une instance vulnérable pour `player`. Appelée par CTFPlatform uniquement.
    function createInstance(address player) external returns (address instance);

    /// Vrai si `instance` a été exploitée. Doit être `view` :
    /// CTFPlatform l'appelle en staticcall avec une limite de gaz.
    function validateInstance(address instance, address player) external view returns (bool);
}
