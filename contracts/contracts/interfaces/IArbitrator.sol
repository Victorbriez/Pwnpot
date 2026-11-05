// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {IArbitrable} from "./IArbitrable.sol";

/// Arbitre ERC-792 (https://github.com/ethereum/EIPs/issues/792), tel que
/// défini par Kleros. Déclaré seulement : `MockArbitrator` l'implémentera.
interface IArbitrator {
    enum DisputeStatus {
        Waiting,
        Appealable,
        Solved
    }

    /// Un litige a été créé par `_arbitrable`.
    event DisputeCreation(uint256 indexed _disputeID, IArbitrable indexed _arbitrable);

    /// La décision du litige `_disputeID` peut faire l'objet d'un appel.
    event AppealPossible(uint256 indexed _disputeID, IArbitrable indexed _arbitrable);

    /// Un appel a été formé sur le litige `_disputeID`.
    event AppealDecision(uint256 indexed _disputeID, IArbitrable indexed _arbitrable);

    /// Crée un litige à `_choices` options. Le coût est payé en `msg.value`.
    function createDispute(uint256 _choices, bytes calldata _extraData) external payable returns (uint256 disputeID);

    /// Coût de création d'un litige.
    function arbitrationCost(bytes calldata _extraData) external view returns (uint256 cost);

    /// Fait appel de la décision du litige `_disputeID`.
    function appeal(uint256 _disputeID, bytes calldata _extraData) external payable;

    /// Coût d'un appel sur le litige `_disputeID`.
    function appealCost(uint256 _disputeID, bytes calldata _extraData) external view returns (uint256 cost);

    /// Fenêtre pendant laquelle un appel est possible.
    function appealPeriod(uint256 _disputeID) external view returns (uint256 start, uint256 end);

    /// État du litige `_disputeID`.
    function disputeStatus(uint256 _disputeID) external view returns (DisputeStatus status);

    /// Décision actuelle (0 = refus de trancher).
    function currentRuling(uint256 _disputeID) external view returns (uint256 ruling);
}
