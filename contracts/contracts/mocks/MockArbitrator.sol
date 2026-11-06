// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {IArbitrable} from "../interfaces/IArbitrable.sol";
import {IArbitrator} from "../interfaces/IArbitrator.sol";

/// Arbitre ERC-792 minimal pour les tests et la démo (docs/DESIGN.md § Paramètres).
///
/// - Frais fixes (`fee`), inférieurs à 0.001 ETH, le minimum de la caution de contestation.
/// - Une seule adresse (`ruler`, fixée au déploiement) rend les décisions : c'est le
///   point de confiance assumé de la démo (« MockArbitrator contrôlé par l'équipe »).
/// - Pas d'appel de second niveau : `appeal` revert, `appealCost` est maximal.
///
/// La version complète (#16) pourra ajouter un délai, l'appel, etc.
contract MockArbitrator is IArbitrator {
    struct DisputeData {
        IArbitrable arbitrable;
        uint256 choices;
        uint256 ruling;
        DisputeStatus status;
    }

    uint256 public immutable fee;
    address public immutable ruler;

    DisputeData[] public disputes;

    error FeeTooHigh();
    error ZeroRuler();
    error WrongFee(uint256 expected, uint256 provided);
    error NotRuler();
    error UnknownDispute(uint256 disputeID);
    error AlreadySolved(uint256 disputeID);
    error InvalidRuling(uint256 ruling, uint256 choices);
    error NotAppealable();
    error NothingToWithdraw();
    error TransferFailed();

    event RulingGiven(uint256 indexed disputeID, uint256 ruling);

    constructor(uint256 fee_, address ruler_) {
        if (fee_ >= 0.001 ether) revert FeeTooHigh();
        if (ruler_ == address(0)) revert ZeroRuler();
        fee = fee_;
        ruler = ruler_;
    }

    /// Appelée par le contrat arbitrable (CTFPlatform) au moment de l'appel.
    function createDispute(uint256 choices, bytes calldata) external payable returns (uint256 disputeID) {
        if (msg.value != fee) revert WrongFee(fee, msg.value);
        disputeID = disputes.length;
        disputes.push(
            DisputeData({
                arbitrable: IArbitrable(msg.sender),
                choices: choices,
                ruling: 0,
                status: DisputeStatus.Waiting
            })
        );
        emit DisputeCreation(disputeID, IArbitrable(msg.sender));
    }

    /// Rend la décision et la transmet au contrat arbitrable (`rule`).
    /// `ruling` vaut 0 (refus de trancher) ou une option entre 1 et `choices`.
    function giveRuling(uint256 disputeID, uint256 ruling) external {
        if (msg.sender != ruler) revert NotRuler();
        DisputeData storage dispute = _dispute(disputeID);
        if (dispute.status == DisputeStatus.Solved) revert AlreadySolved(disputeID);
        if (ruling > dispute.choices) revert InvalidRuling(ruling, dispute.choices);

        // Effets avant l'appel externe.
        dispute.ruling = ruling;
        dispute.status = DisputeStatus.Solved;
        emit RulingGiven(disputeID, ruling);

        dispute.arbitrable.rule(disputeID, ruling);
    }

    /// Les frais encaissés reviennent au `ruler`.
    function withdrawFees() external {
        if (msg.sender != ruler) revert NotRuler();
        uint256 amount = address(this).balance;
        if (amount == 0) revert NothingToWithdraw();
        (bool ok, ) = ruler.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    function arbitrationCost(bytes calldata) external view returns (uint256) {
        return fee;
    }

    function appeal(uint256, bytes calldata) external payable {
        revert NotAppealable();
    }

    function appealCost(uint256, bytes calldata) external pure returns (uint256) {
        return type(uint256).max;
    }

    function appealPeriod(uint256) external pure returns (uint256 start, uint256 end) {
        return (0, 0);
    }

    function disputeStatus(uint256 disputeID) external view returns (DisputeStatus) {
        return _dispute(disputeID).status;
    }

    function currentRuling(uint256 disputeID) external view returns (uint256) {
        return _dispute(disputeID).ruling;
    }

    function disputeCount() external view returns (uint256) {
        return disputes.length;
    }

    function _dispute(uint256 disputeID) private view returns (DisputeData storage) {
        if (disputeID >= disputes.length) revert UnknownDispute(disputeID);
        return disputes[disputeID];
    }
}
