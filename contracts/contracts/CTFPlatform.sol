// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {ICTFPlatform} from "./interfaces/ICTFPlatform.sol";
import {ILevel} from "./interfaces/ILevel.sol";

/// Plateforme de CTF smart contracts payants (docs/DESIGN.md).
///
/// - Pas d'owner, pas de proxy, pas de pause : aucune fonction admin.
/// - Pull payment : chaque issue crédite `owed`, seul `withdraw` envoie de l'ETH.
/// - Comptabilité interne uniquement, jamais `address(this).balance`.
/// - Les factories sont du code tiers non fiable : `nonReentrant` partout,
///   validation en `staticcall` avec une limite de gaz et décodage défensif.
///
/// Les litiges (vote, appel, arbitre) ne sont pas encore implémentés :
/// leurs fonctions revert `NotImplemented`.
contract CTFPlatform is ICTFPlatform, ReentrancyGuard {
    // ---------------------------------------------------------------------
    // Constantes (docs/DESIGN.md § Paramètres)
    // ---------------------------------------------------------------------

    uint256 public constant MIN_TICKET_PRICE = 0.0001 ether;
    uint256 public constant MAX_PLAYERS = 200;
    uint256 public constant MIN_DURATION = 1 hours;
    uint256 public constant MAX_DURATION = 30 days;
    uint256 public constant MAX_LEVELS = 10;
    /// Longueur maximale du titre, en octets.
    uint256 public constant MAX_TITLE_LENGTH = 100;
    /// Gaz maximal donné à `validateInstance`.
    uint256 public constant VALIDATION_GAS = 300_000;

    /// Parts du podium, en pourcentage. Le 1er prend le reste.
    uint256 private constant SECOND_OF_THREE = 30;
    uint256 private constant THIRD_OF_THREE = 10;
    uint256 private constant SECOND_OF_TWO = 33;

    // ---------------------------------------------------------------------
    // Réglages fixés au déploiement
    // ---------------------------------------------------------------------

    address public immutable arbitrator;
    uint256 public immutable contestationPeriod;
    uint256 public immutable votingPeriod;
    uint256 public immutable appealPeriod;
    uint256 public immutable arbitratorTimeout;

    // ---------------------------------------------------------------------
    // État
    // ---------------------------------------------------------------------

    uint256 public ctfCount;

    /// Soldes internes retirables avec `withdraw`.
    mapping(address account => uint256 amount) public owed;

    mapping(uint256 ctfId => CTF) private _ctfs;
    mapping(uint256 ctfId => Level[]) private _levels;
    mapping(uint256 ctfId => mapping(address player => Player)) private _players;
    /// Top 3, tenu à jour à chaque `submit`. `address(0)` = place vide.
    mapping(uint256 ctfId => address[3]) private _podium;
    mapping(uint256 ctfId => mapping(uint256 levelIndex => mapping(address player => address))) private _instances;
    mapping(uint256 ctfId => mapping(uint256 levelIndex => mapping(address player => bool))) private _solved;
    mapping(uint256 ctfId => Dispute) private _disputes;

    constructor(
        address arbitrator_,
        uint256 contestationPeriod_,
        uint256 votingPeriod_,
        uint256 appealPeriod_,
        uint256 arbitratorTimeout_
    ) {
        if (arbitrator_ == address(0)) revert ZeroArbitrator();
        if (contestationPeriod_ == 0 || votingPeriod_ == 0 || appealPeriod_ == 0 || arbitratorTimeout_ == 0) {
            revert ZeroPeriod();
        }
        arbitrator = arbitrator_;
        contestationPeriod = contestationPeriod_;
        votingPeriod = votingPeriod_;
        appealPeriod = appealPeriod_;
        arbitratorTimeout = arbitratorTimeout_;
    }

    // ---------------------------------------------------------------------
    // Organisateur
    // ---------------------------------------------------------------------

    /// Publie un CTF. `msg.value` = cash prize + caution.
    function createCTF(
        CTFParams calldata p,
        address[] calldata factories
    ) external payable nonReentrant returns (uint256 ctfId) {
        if (bytes(p.title).length > MAX_TITLE_LENGTH) revert TitleTooLong();
        if (p.startTime < block.timestamp) revert StartInPast();
        if (p.endTime <= p.startTime) revert InvalidDuration();
        uint256 duration = p.endTime - p.startTime;
        if (duration < MIN_DURATION || duration > MAX_DURATION) revert InvalidDuration();
        if (p.maxPlayers == 0 || p.maxPlayers > MAX_PLAYERS) revert InvalidMaxPlayers();
        if (p.ticketPrice < MIN_TICKET_PRICE) revert TicketPriceTooLow();
        if (p.cashPrize == 0) revert ZeroCashPrize();
        uint256 requiredBond = p.cashPrize + p.maxPlayers * p.ticketPrice;
        if (p.organizerBond < requiredBond) revert BondTooLow(requiredBond, p.organizerBond);
        uint256 expected = p.cashPrize + p.organizerBond;
        if (msg.value != expected) revert WrongValue(expected, msg.value);
        if (factories.length == 0) revert NoLevels();
        if (factories.length > MAX_LEVELS) revert TooManyLevels();

        ctfId = ctfCount++;

        Level[] storage levels = _levels[ctfId];
        for (uint256 i = 0; i < factories.length; ++i) {
            address factory = factories[i];
            if (factory.code.length == 0) revert FactoryNotContract(factory);
            levels.push(Level({factory: factory, codehash: factory.codehash}));
        }

        _ctfs[ctfId] = CTF({
            organizer: msg.sender,
            title: p.title,
            startTime: p.startTime,
            endTime: p.endTime,
            ticketPrice: p.ticketPrice,
            maxPlayers: p.maxPlayers,
            cashPrize: p.cashPrize,
            organizerBond: p.organizerBond,
            playerCount: 0,
            finalized: false,
            cheated: false
        });

        emit CTFCreated(ctfId, msg.sender);
    }

    // ---------------------------------------------------------------------
    // Joueur
    // ---------------------------------------------------------------------

    /// Un seul ticket par adresse, jusqu'à `maxPlayers`, avant `endTime`.
    /// L'organisateur ne peut pas jouer à son propre CTF.
    function buyTicket(uint256 ctfId) external payable nonReentrant {
        CTF storage c = _ctf(ctfId);
        Phase phase = _phase(c);
        if (phase != Phase.Open && phase != Phase.Running) revert WrongPhase(phase);
        if (msg.sender == c.organizer) revert OrganizerCannotPlay();
        Player storage player = _players[ctfId][msg.sender];
        if (player.hasTicket) revert AlreadyHasTicket();
        if (c.playerCount >= c.maxPlayers) revert CTFFull();
        if (msg.value != c.ticketPrice) revert WrongValue(c.ticketPrice, msg.value);

        player.hasTicket = true;
        c.playerCount += 1;

        emit TicketBought(ctfId, msg.sender);
    }

    /// Déploie l'instance de l'appelant pour l'épreuve `levelIndex`, via la factory.
    /// Une seule instance par joueur et par épreuve.
    function createInstance(uint256 ctfId, uint256 levelIndex) external nonReentrant returns (address instance) {
        CTF storage c = _ctf(ctfId);
        Phase phase = _phase(c);
        if (phase != Phase.Running) revert WrongPhase(phase);
        if (!_players[ctfId][msg.sender].hasTicket) revert NoTicket();
        Level[] storage levels = _levels[ctfId];
        if (levelIndex >= levels.length) revert InvalidLevel(levelIndex);
        if (_instances[ctfId][levelIndex][msg.sender] != address(0)) revert InstanceAlreadyCreated();

        // L'adresse n'est connue qu'après l'appel : la réentrance est bloquée
        // par `nonReentrant`, présent sur toutes les fonctions qui modifient l'état.
        instance = ILevel(levels[levelIndex].factory).createInstance(msg.sender);
        if (instance == address(0)) revert InvalidInstance();

        _instances[ctfId][levelIndex][msg.sender] = instance;

        emit InstanceCreated(ctfId, levelIndex, msg.sender, instance);
    }

    /// Fait valider l'instance de l'appelant (et seulement la sienne).
    /// 1 point par épreuve, horodaté ; le top 3 est mis à jour.
    function submit(uint256 ctfId, uint256 levelIndex) external nonReentrant {
        CTF storage c = _ctf(ctfId);
        Phase phase = _phase(c);
        if (phase != Phase.Running) revert WrongPhase(phase);
        Player storage player = _players[ctfId][msg.sender];
        if (!player.hasTicket) revert NoTicket();
        Level[] storage levels = _levels[ctfId];
        if (levelIndex >= levels.length) revert InvalidLevel(levelIndex);
        address instance = _instances[ctfId][levelIndex][msg.sender];
        if (instance == address(0)) revert NoInstance();
        if (_solved[ctfId][levelIndex][msg.sender]) revert AlreadySolved();
        if (!_validate(levels[levelIndex].factory, instance, msg.sender)) revert NotSolved();

        _solved[ctfId][levelIndex][msg.sender] = true;
        player.score += 1;
        player.lastSolveTime = block.timestamp;
        _updatePodium(ctfId, msg.sender);

        emit LevelSolved(ctfId, levelIndex, msg.sender, block.timestamp);
    }

    /// Crédite le ticket de l'appelant si le CTF s'est terminé sans gagnant.
    function claimRefund(uint256 ctfId) external nonReentrant {
        CTF storage c = _ctf(ctfId);
        if (!c.finalized) revert WrongPhase(_phase(c));
        if (!c.cheated && _podium[ctfId][0] != address(0)) revert NothingToRefund();
        Player storage player = _players[ctfId][msg.sender];
        if (!player.hasTicket || player.refunded) revert NothingToRefund();

        player.refunded = true;
        _credit(ctfId, msg.sender, c.ticketPrice);

        emit RefundClaimed(ctfId, msg.sender, c.ticketPrice);
    }

    // ---------------------------------------------------------------------
    // Temps (n'importe qui)
    // ---------------------------------------------------------------------

    /// Clôt le CTF après la fenêtre de contestation et crédite chacun.
    /// Aucune boucle sur les joueurs : seuls le podium et l'organisateur sont crédités ici.
    function finalize(uint256 ctfId) external nonReentrant {
        CTF storage c = _ctf(ctfId);
        Phase phase = _phase(c);
        if (phase != Phase.Contestation) revert WrongPhase(phase);
        uint256 contestationEnd = c.endTime + contestationPeriod;
        if (block.timestamp < contestationEnd) revert ContestationNotOver(contestationEnd);

        c.finalized = true;

        address[3] storage podium = _podium[ctfId];
        if (podium[0] == address(0)) {
            // Aucun gagnant : l'organisateur récupère cash prize + caution,
            // chaque joueur récupère son ticket avec `claimRefund`.
            _credit(ctfId, c.organizer, c.cashPrize + c.organizerBond);
        } else {
            _credit(ctfId, c.organizer, c.organizerBond);
            uint256 pot = c.cashPrize + c.playerCount * c.ticketPrice;
            uint256 second;
            uint256 third;
            if (podium[2] != address(0)) {
                second = (pot * SECOND_OF_THREE) / 100;
                third = (pot * THIRD_OF_THREE) / 100;
                _credit(ctfId, podium[2], third);
            } else if (podium[1] != address(0)) {
                second = (pot * SECOND_OF_TWO) / 100;
            }
            if (second != 0) _credit(ctfId, podium[1], second);
            // Le 1er prend le reste, arrondis compris : aucun wei bloqué.
            _credit(ctfId, podium[0], pot - second - third);
        }

        emit Finalized(ctfId, false);
    }

    function applyVoteAfterTimeout(uint256) external pure {
        revert NotImplemented();
    }

    // ---------------------------------------------------------------------
    // Litiges (plus tard)
    // ---------------------------------------------------------------------

    function openDispute(uint256) external payable {
        revert NotImplemented();
    }

    function vote(uint256, bool) external pure {
        revert NotImplemented();
    }

    function appeal(uint256) external payable {
        revert NotImplemented();
    }

    /// Appelée par l'arbitre ERC-792 uniquement.
    function rule(uint256, uint256) external view {
        if (msg.sender != arbitrator) revert NotArbitrator();
        revert NotImplemented();
    }

    // ---------------------------------------------------------------------
    // Argent
    // ---------------------------------------------------------------------

    /// Pull payment : envoie tout le solde interne de l'appelant.
    function withdraw() external nonReentrant {
        uint256 amount = owed[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        owed[msg.sender] = 0;
        emit Withdrawn(msg.sender, amount);

        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    // ---------------------------------------------------------------------
    // Lecture
    // ---------------------------------------------------------------------

    function getCTF(uint256 ctfId) external view returns (CTF memory) {
        return _ctf(ctfId);
    }

    function getLevels(uint256 ctfId) external view returns (Level[] memory) {
        _ctf(ctfId);
        return _levels[ctfId];
    }

    function getPlayer(uint256 ctfId, address player) external view returns (Player memory) {
        _ctf(ctfId);
        return _players[ctfId][player];
    }

    function getPodium(uint256 ctfId) external view returns (address[3] memory) {
        _ctf(ctfId);
        return _podium[ctfId];
    }

    function getDispute(uint256 ctfId) external view returns (Dispute memory) {
        _ctf(ctfId);
        return _disputes[ctfId];
    }

    function phaseOf(uint256 ctfId) external view returns (Phase) {
        return _phase(_ctf(ctfId));
    }

    function instanceOf(uint256 ctfId, uint256 levelIndex, address player) external view returns (address) {
        return _instances[ctfId][levelIndex][player];
    }

    function isSolved(uint256 ctfId, uint256 levelIndex, address player) external view returns (bool) {
        return _solved[ctfId][levelIndex][player];
    }

    // ---------------------------------------------------------------------
    // Interne
    // ---------------------------------------------------------------------

    function _ctf(uint256 ctfId) private view returns (CTF storage) {
        if (ctfId >= ctfCount) revert CTFNotFound(ctfId);
        return _ctfs[ctfId];
    }

    function _phase(CTF storage c) private view returns (Phase) {
        if (c.cheated) return Phase.Cheated;
        if (c.finalized) return Phase.Finalized;
        if (block.timestamp < c.startTime) return Phase.Open;
        if (block.timestamp < c.endTime) return Phase.Running;
        return Phase.Contestation;
    }

    function _credit(uint256 ctfId, address account, uint256 amount) private {
        if (amount == 0) return;
        owed[account] += amount;
        emit Credited(ctfId, account, amount);
    }

    /// Appelle `validateInstance` en `staticcall` avec `VALIDATION_GAS`.
    /// Seul un retour de exactement 32 octets valant 1 (`true`) compte comme résolu :
    /// revert, données vides, trop longues ou autre valeur = non résolu.
    /// Au plus 32 octets sont copiés, ce qui neutralise un retour géant.
    function _validate(address factory, address instance, address player) private view returns (bool) {
        bytes memory data = abi.encodeCall(ILevel.validateInstance, (instance, player));
        bool success;
        uint256 size;
        uint256 word;
        assembly ("memory-safe") {
            success := staticcall(VALIDATION_GAS, factory, add(data, 0x20), mload(data), 0, 0)
            size := returndatasize()
            if eq(size, 0x20) {
                returndatacopy(0, 0, 0x20)
                word := mload(0)
            }
        }
        return success && size == 32 && word == 1;
    }

    /// `a` est strictement devant `b` : plus de points, ou autant de points
    /// et une dernière réussite plus tôt. À égalité parfaite, `b` garde sa place.
    function _isBetter(uint256 ctfId, address a, address b) private view returns (bool) {
        Player storage pa = _players[ctfId][a];
        Player storage pb = _players[ctfId][b];
        if (pa.score != pb.score) return pa.score > pb.score;
        return pa.lastSolveTime < pb.lastSolveTime;
    }

    /// Replace `player` dans le top 3 après un gain de point. Coût constant.
    /// Un score ne fait que monter : le joueur ne peut que remonter au classement.
    function _updatePodium(uint256 ctfId, address player) private {
        address[3] storage podium = _podium[ctfId];

        uint256 current = 3;
        for (uint256 i = 0; i < 3; ++i) {
            if (podium[i] == player) {
                current = i;
                break;
            }
        }

        // Première place (au-dessus de sa place actuelle) libre ou moins bien classée.
        uint256 target = current;
        for (uint256 i = 0; i < current; ++i) {
            if (podium[i] == address(0) || _isBetter(ctfId, player, podium[i])) {
                target = i;
                break;
            }
        }
        if (target == current) return;

        // Décale d'un cran vers le bas ceux qui étaient entre `target` et sa place
        // (le 3e sort du podium si le joueur n'y était pas).
        uint256 last = current == 3 ? 2 : current;
        for (uint256 j = last; j > target; --j) {
            podium[j] = podium[j - 1];
        }
        podium[target] = player;
    }
}
