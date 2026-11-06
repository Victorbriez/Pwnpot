// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {IArbitrator} from "./IArbitrator.sol";

/// Contrat arbitrable ERC-792 (https://github.com/ethereum/EIPs/issues/792).
/// Déclaré seulement : `CTFPlatform` l'implémente pour recevoir la décision d'appel.
interface IArbitrable {
    /// La décision `_ruling` a été rendue par `_arbitrator` pour le litige `_disputeID`.
    event Ruling(IArbitrator indexed _arbitrator, uint256 indexed _disputeID, uint256 _ruling);

    /// Appelée par l'arbitre uniquement, pour rendre sa décision.
    function rule(uint256 _disputeID, uint256 _ruling) external;
}
