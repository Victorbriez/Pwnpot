// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {IArbitrable} from "./IArbitrable.sol";

/// Interface de CTFPlatform (docs/DESIGN.md § Interface du contrat).
/// Litiges, version simplifiée : la contestation part directement à l'arbitre
/// ERC-792 (`openDispute` → `rule`). `vote` et `appeal` sont déclarées pour la
/// version complète mais ne sont pas implémentées.
interface ICTFPlatform is IArbitrable {
    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------

    /// Phase d'un CTF (docs/DESIGN.md § Cycle de vie). Calculée à partir du temps
    /// et de l'état du CTF, jamais stockée telle quelle.
    enum Phase {
        Open,
        Running,
        Contestation,
        Voting,
        AppealWindow,
        Appealed,
        Finalized,
        Cheated
    }

    /// Paramètres fournis par l'organisateur à `createCTF`.
    /// `msg.value` doit valoir exactement `cashPrize + organizerBond`.
    struct CTFParams {
        string title;
        uint256 startTime;
        uint256 endTime;
        uint256 ticketPrice;
        uint256 maxPlayers;
        uint256 cashPrize;
        uint256 organizerBond;
    }

    /// Une épreuve : sa factory et le `codehash` relevé à la création du CTF.
    struct Level {
        address factory;
        bytes32 codehash;
    }

    /// État d'un CTF.
    struct CTF {
        address organizer;
        string title;
        uint256 startTime;
        uint256 endTime;
        uint256 ticketPrice;
        uint256 maxPlayers;
        uint256 cashPrize;
        uint256 organizerBond;
        uint256 playerCount;
        bool finalized;
        bool cheated;
    }

    /// État d'un joueur dans un CTF.
    struct Player {
        bool hasTicket;
        bool refunded;
        uint256 score;
        uint256 lastSolveTime;
    }

    /// État du litige d'un CTF (un seul litige par CTF). Dans la version simplifiée,
    /// le contestataire est aussi celui qui saisit l'arbitre : `appellant`,
    /// `appealFee` et `appealedAt` sont remplis dès `openDispute`, et les voix restent à 0.
    struct Dispute {
        address contester;
        uint256 bond;
        uint256 openedAt;
        uint256 votesCheated;
        uint256 votesNotCheated;
        address appellant;
        uint256 appealFee;
        uint256 appealedAt;
        uint256 disputeID;
        bool appealed;
        bool resolved;
    }

    // ---------------------------------------------------------------------
    // Erreurs : une par refus
    // ---------------------------------------------------------------------

    // Constructeur
    error ZeroArbitrator();
    error ZeroPeriod();

    // createCTF
    error TitleTooLong();
    error StartInPast();
    error InvalidDuration();
    error InvalidMaxPlayers();
    error TicketPriceTooLow();
    error ZeroCashPrize();
    error BondTooLow(uint256 required, uint256 provided);
    error NoLevels();
    error TooManyLevels();
    error FactoryNotContract(address factory);

    // Commun
    error CTFNotFound(uint256 ctfId);
    error WrongPhase(Phase current);
    error WrongValue(uint256 expected, uint256 sent);

    // buyTicket
    error OrganizerCannotPlay();
    error AlreadyHasTicket();
    error CTFFull();

    // createInstance / submit
    error NoTicket();
    error InvalidLevel(uint256 levelIndex);
    error InstanceAlreadyCreated();
    error InvalidInstance();
    error NoInstance();
    error AlreadySolved();
    error NotSolved();

    // finalize / claimRefund / withdraw
    error ContestationNotOver(uint256 endsAt);
    error NothingToRefund();
    error NothingToWithdraw();
    error TransferFailed();

    // Litiges
    error NotImplemented();
    error ContestationOver(uint256 endedAt);
    error NotArbitrator();
    error DisputeAlreadyOpened();
    error WrongDisputeBond(uint256 expected, uint256 sent);
    error AlreadyVoted();
    error NotAppealable();
    error UnknownDispute(uint256 disputeID);
    error InvalidRuling(uint256 ruling);
    error TimeoutNotReached(uint256 at);

    // ---------------------------------------------------------------------
    // Events : un par étape, lus par le frontend
    // ---------------------------------------------------------------------

    event CTFCreated(uint256 indexed ctfId, address indexed organizer);
    event TicketBought(uint256 indexed ctfId, address indexed player);
    event InstanceCreated(uint256 indexed ctfId, uint256 levelIndex, address indexed player, address instance);
    event LevelSolved(uint256 indexed ctfId, uint256 levelIndex, address indexed player, uint256 timestamp);
    event DisputeOpened(uint256 indexed ctfId, address indexed contester);
    event Voted(uint256 indexed ctfId, address indexed voter, bool cheated);
    /// Le litige est transmis à l'arbitre (dès `openDispute` dans la version simplifiée).
    event Appealed(uint256 indexed ctfId, uint256 disputeID);
    event Ruled(uint256 indexed ctfId, bool cheated);
    event Finalized(uint256 indexed ctfId, bool cheated);
    /// Un solde interne a été crédité (part du podium, caution, cash prize, remboursement).
    event Credited(uint256 indexed ctfId, address indexed account, uint256 amount);
    /// Un joueur a récupéré son ticket (aucun gagnant, ou triche confirmée).
    event RefundClaimed(uint256 indexed ctfId, address indexed player, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    // ---------------------------------------------------------------------
    // Organisateur
    // ---------------------------------------------------------------------

    function createCTF(CTFParams calldata p, address[] calldata factories) external payable returns (uint256 ctfId);

    // ---------------------------------------------------------------------
    // Joueur
    // ---------------------------------------------------------------------

    function buyTicket(uint256 ctfId) external payable;

    function createInstance(uint256 ctfId, uint256 levelIndex) external returns (address instance);

    function submit(uint256 ctfId, uint256 levelIndex) external;

    /// Crédite le ticket de l'appelant sur son solde interne quand le CTF se
    /// termine sans gagnant (ou par une triche confirmée). Pull payment : aucune
    /// boucle sur les joueurs.
    function claimRefund(uint256 ctfId) external;

    // ---------------------------------------------------------------------
    // Temps (n'importe qui)
    // ---------------------------------------------------------------------

    function finalize(uint256 ctfId) external;

    /// L'arbitre n'a pas répondu dans `arbitratorTimeout` : n'importe qui clôt le
    /// litige. Sans vote dans la version simplifiée, le résultat est « pas de triche ».
    function applyVoteAfterTimeout(uint256 ctfId) external;

    // ---------------------------------------------------------------------
    // Litiges (`rule` vient de IArbitrable)
    // ---------------------------------------------------------------------

    /// Pendant la contestation, un détenteur de ticket conteste. `msg.value` doit
    /// valoir exactement `bond + fee` de `disputeCost`.
    function openDispute(uint256 ctfId) external payable;

    function vote(uint256 ctfId, bool cheated) external;

    function appeal(uint256 ctfId) external payable;

    // ---------------------------------------------------------------------
    // Argent
    // ---------------------------------------------------------------------

    function withdraw() external;

    // ---------------------------------------------------------------------
    // Lecture
    // ---------------------------------------------------------------------

    function ctfCount() external view returns (uint256);

    function getCTF(uint256 ctfId) external view returns (CTF memory);

    function getLevels(uint256 ctfId) external view returns (Level[] memory);

    function getPlayer(uint256 ctfId, address player) external view returns (Player memory);

    function getPodium(uint256 ctfId) external view returns (address[3] memory);

    function getDispute(uint256 ctfId) external view returns (Dispute memory);

    /// Caution de contestation et frais actuels de l'arbitre pour `openDispute`.
    function disputeCost(uint256 ctfId) external view returns (uint256 bond, uint256 fee);

    /// Total des cautions d'organisateur brûlées (triche confirmée) : bloqué à vie.
    function burned() external view returns (uint256);

    function phaseOf(uint256 ctfId) external view returns (Phase);

    function instanceOf(uint256 ctfId, uint256 levelIndex, address player) external view returns (address);

    function isSolved(uint256 ctfId, uint256 levelIndex, address player) external view returns (bool);

    function owed(address account) external view returns (uint256);

    function arbitrator() external view returns (address);

    function contestationPeriod() external view returns (uint256);

    function votingPeriod() external view returns (uint256);

    function appealPeriod() external view returns (uint256);

    function arbitratorTimeout() external view returns (uint256);
}
