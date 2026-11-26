// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.34;

import {Test} from "forge-std/Test.sol";

import {CTFPlatform} from "./CTFPlatform.sol";
import {ICTFPlatform} from "./interfaces/ICTFPlatform.sol";
import {MockArbitrator} from "./mocks/MockArbitrator.sol";
import {TestInstance, TestLevel} from "./mocks/TestLevel.sol";

/// Enchaîne des actions aléatoires sur CTFPlatform, comme le feraient des
/// joueurs, des organisateurs et l'arbitre (issue #31). Chaque action est
/// tentée telle quelle : si le contrat la refuse, rien n'est compté. Les
/// variables `ghost*` suivent ce qui entre et sort, pour que les invariants
/// puissent tout recompter.
contract CTFPlatformHandler is Test {
    uint256 internal constant ACTORS = 5;
    uint256 internal constant MAX_CTFS = 4;
    uint256 internal constant TICKET = 0.01 ether;
    uint256 internal constant PRIZE = 0.1 ether;
    uint256 internal constant MAX_PLAYERS = 4;
    uint256 internal constant BOND = PRIZE + MAX_PLAYERS * TICKET;
    /// Deux épreuves : le classement peut se réordonner (scores 1 et 2).
    uint256 internal constant LEVELS = 2;

    CTFPlatform public immutable platform;
    MockArbitrator public immutable arbitrator;
    TestLevel public immutable level;
    address public immutable ruler;
    address public immutable deployer;

    address[ACTORS] internal _actors;
    uint256[] internal _ctfIds;

    /// ETH envoyé à la plateforme (CTF, tickets, cautions et frais de contestation).
    uint256 public ghostDeposited;
    /// ETH sorti par `withdraw`.
    uint256 public ghostWithdrawn;
    /// Frais d'arbitrage transmis à l'arbitre par `openDispute`.
    uint256 public ghostFeesOut;
    /// Tickets remboursés par `claimRefund`, par CTF.
    mapping(uint256 ctfId => uint256 amount) public ghostRefunded;

    /// Un CTF finalisé a été réglé une seconde fois.
    bool public ghostResettled;
    /// Quelqu'un d'autre que l'arbitre (déployeur compris) a réussi à trancher.
    bool public ghostStrangerRuled;
    /// `withdraw` a versé autre chose que `owed`, ou ne l'a pas remis à zéro.
    bool public ghostWithdrawMismatch;

    /// Issue relevée la première fois qu'un CTF est vu finalisé.
    mapping(uint256 ctfId => bool) public seenFinal;
    mapping(uint256 ctfId => bool) public finalCheated;
    mapping(uint256 ctfId => address) public finalFirst;

    constructor(CTFPlatform platform_, MockArbitrator arbitrator_, TestLevel level_, address ruler_, address deployer_) {
        platform = platform_;
        arbitrator = arbitrator_;
        level = level_;
        ruler = ruler_;
        deployer = deployer_;
        for (uint256 i = 0; i < ACTORS; ++i) {
            _actors[i] = makeAddr(string.concat("actor", vm.toString(i)));
            vm.deal(_actors[i], 100 ether);
        }
    }

    // ------------------------------------------------------------------
    // Lecture, pour les invariants
    // ------------------------------------------------------------------

    function actorCount() external pure returns (uint256) {
        return ACTORS;
    }

    function levelCount() external pure returns (uint256) {
        return LEVELS;
    }

    function actor(uint256 i) external view returns (address) {
        return _actors[i];
    }

    function ctfCount() external view returns (uint256) {
        return _ctfIds.length;
    }

    function ctfId(uint256 i) external view returns (uint256) {
        return _ctfIds[i];
    }

    // ------------------------------------------------------------------
    // Actions
    // ------------------------------------------------------------------

    function createCTF(uint256 actorSeed, uint256 startDelay, uint256 duration) external {
        if (_ctfIds.length >= MAX_CTFS) return;
        startDelay = bound(startDelay, 0, 30 minutes);
        duration = bound(duration, 1 hours, 2 hours);
        ICTFPlatform.CTFParams memory p = ICTFPlatform.CTFParams({
            title: "Invariant",
            startTime: block.timestamp + startDelay,
            endTime: block.timestamp + startDelay + duration,
            ticketPrice: TICKET,
            maxPlayers: MAX_PLAYERS,
            cashPrize: PRIZE,
            organizerBond: BOND
        });
        address[] memory factories = new address[](LEVELS);
        for (uint256 i = 0; i < LEVELS; ++i) factories[i] = address(level);

        vm.prank(_actor(actorSeed));
        uint256 id = platform.createCTF{value: PRIZE + BOND}(p, factories);
        _ctfIds.push(id);
        ghostDeposited += PRIZE + BOND;
    }

    function buyTicket(uint256 ctfSeed, uint256 actorSeed) external {
        (bool ok, uint256 id) = _ctf(ctfSeed);
        if (!ok) return;
        vm.prank(_newcomer(id, actorSeed));
        try platform.buyTicket{value: TICKET}(id) {
            ghostDeposited += TICKET;
        } catch {}
        _observe();
    }

    function createInstance(uint256 ctfSeed, uint256 actorSeed, uint256 levelSeed) external {
        (bool ok, uint256 id) = _ctf(ctfSeed);
        if (!ok) return;
        vm.prank(_holder(id, actorSeed));
        try platform.createInstance(id, levelSeed % LEVELS) {} catch {}
    }

    /// Un détenteur de ticket joue : il crée son instance au besoin, l'exploite
    /// ou non selon `exploit`, puis la soumet.
    function submit(uint256 ctfSeed, uint256 actorSeed, uint256 levelSeed, bool exploit) external {
        (bool ok, uint256 id) = _ctf(ctfSeed);
        if (!ok) return;
        uint256 lvl = levelSeed % LEVELS;
        address player = _holder(id, actorSeed);
        address instance = platform.instanceOf(id, lvl, player);
        if (instance == address(0)) {
            vm.prank(player);
            try platform.createInstance(id, lvl) returns (address created) {
                instance = created;
            } catch {}
        }
        if (instance != address(0) && exploit) {
            vm.prank(player);
            TestInstance(instance).solve();
        }
        vm.prank(player);
        try platform.submit(id, lvl) {} catch {}
    }

    /// Tous les détenteurs de ticket jouent la même épreuve : chacun l'exploite
    /// (ou non, un sur deux selon `skipMask`) puis la soumet. Rend courants les
    /// CTF à 2 ou 3 gagnants, et donc tout le partage du podium.
    function everyonePlays(uint256 ctfSeed, uint256 levelSeed, uint8 skipMask) external {
        (bool ok, uint256 id) = _ctf(ctfSeed);
        if (!ok) return;
        uint256 lvl = levelSeed % LEVELS;
        for (uint256 i = 0; i < ACTORS; ++i) {
            address player = _actors[i];
            if (!platform.getPlayer(id, player).hasTicket) continue;
            address instance = platform.instanceOf(id, lvl, player);
            if (instance == address(0)) {
                vm.prank(player);
                try platform.createInstance(id, lvl) returns (address created) {
                    instance = created;
                } catch {
                    continue;
                }
            }
            if ((skipMask >> i) & 1 == 0) {
                vm.prank(player);
                TestInstance(instance).solve();
            }
            vm.prank(player);
            try platform.submit(id, lvl) {} catch {}
        }
    }

    function warp(uint256 seconds_) external {
        vm.warp(block.timestamp + bound(seconds_, 1, 2 hours));
        _observe();
    }

    function finalize(uint256 ctfSeed) external {
        (bool ok, uint256 id) = _ctf(ctfSeed);
        if (!ok) return;
        bool before = platform.getCTF(id).finalized;
        try platform.finalize(id) {
            if (before) ghostResettled = true;
        } catch {}
        _observe();
    }

    function openDispute(uint256 ctfSeed, uint256 actorSeed) external {
        (bool ok, uint256 id) = _ctf(ctfSeed);
        if (!ok) return;
        (uint256 bond, uint256 fee) = platform.disputeCost(id);
        vm.prank(_holder(id, actorSeed));
        try platform.openDispute{value: bond + fee}(id) {
            ghostDeposited += bond + fee;
            ghostFeesOut += fee;
        } catch {}
        _observe();
    }

    /// L'arbitre tranche : 0 (refus), 1 (triche) ou 2 (pas de triche).
    function giveRuling(uint256 ctfSeed, uint256 ruling) external {
        (bool ok, uint256 id) = _ctf(ctfSeed);
        if (!ok) return;
        ICTFPlatform.Dispute memory d = platform.getDispute(id);
        if (d.contester == address(0)) return;
        bool before = platform.getCTF(id).finalized;
        vm.prank(ruler);
        try arbitrator.giveRuling(d.disputeID, bound(ruling, 0, 2)) {
            if (before) ghostResettled = true;
        } catch {}
        _observe();
    }

    function applyTimeout(uint256 ctfSeed) external {
        (bool ok, uint256 id) = _ctf(ctfSeed);
        if (!ok) return;
        bool before = platform.getCTF(id).finalized;
        try platform.applyVoteAfterTimeout(id) {
            if (before) ghostResettled = true;
        } catch {}
        _observe();
    }

    function claimRefund(uint256 ctfSeed, uint256 actorSeed) external {
        (bool ok, uint256 id) = _ctf(ctfSeed);
        if (!ok) return;
        vm.prank(_holder(id, actorSeed));
        try platform.claimRefund(id) {
            ghostRefunded[id] += TICKET;
        } catch {}
    }

    function withdraw(uint256 actorSeed) external {
        address account = _creditor(actorSeed);
        uint256 owedBefore = platform.owed(account);
        uint256 balanceBefore = account.balance;
        vm.prank(account);
        try platform.withdraw() {
            uint256 received = account.balance - balanceBefore;
            ghostWithdrawn += received;
            if (received != owedBefore || platform.owed(account) != 0) ghostWithdrawMismatch = true;
        } catch {}
    }

    /// Un joueur, ou le déployeur, essaie de trancher à la place de l'arbitre.
    function strangerRules(uint256 who, uint256 disputeID, uint256 ruling) external {
        address stranger = bound(who, 0, ACTORS) == ACTORS ? deployer : _actor(who);
        vm.prank(stranger);
        try platform.rule(bound(disputeID, 0, 5), bound(ruling, 0, 2)) {
            ghostStrangerRuled = true;
        } catch {}
    }

    // ------------------------------------------------------------------
    // Interne
    // ------------------------------------------------------------------

    function _actor(uint256 seed) internal view returns (address) {
        return _actors[seed % ACTORS];
    }

    /// Un joueur qui a un ticket dans ce CTF (à partir de `seed`), sinon n'importe qui.
    function _holder(uint256 id, uint256 seed) internal view returns (address) {
        for (uint256 i = 0; i < ACTORS; ++i) {
            address a = _actors[(seed + i) % ACTORS];
            if (platform.getPlayer(id, a).hasTicket) return a;
        }
        return _actor(seed);
    }

    /// Un joueur sans ticket qui n'organise pas ce CTF (à partir de `seed`), sinon n'importe qui.
    function _newcomer(uint256 id, uint256 seed) internal view returns (address) {
        address organizer = platform.getCTF(id).organizer;
        for (uint256 i = 0; i < ACTORS; ++i) {
            address a = _actors[(seed + i) % ACTORS];
            if (a != organizer && !platform.getPlayer(id, a).hasTicket) return a;
        }
        return _actor(seed);
    }

    /// Un compte à qui la plateforme doit de l'argent (à partir de `seed`), sinon n'importe qui.
    function _creditor(uint256 seed) internal view returns (address) {
        for (uint256 i = 0; i < ACTORS; ++i) {
            address a = _actors[(seed + i) % ACTORS];
            if (platform.owed(a) > 0) return a;
        }
        return _actor(seed);
    }

    function _ctf(uint256 seed) internal view returns (bool, uint256) {
        if (_ctfIds.length == 0) return (false, 0);
        return (true, _ctfIds[seed % _ctfIds.length]);
    }

    /// Relève l'issue d'un CTF la première fois qu'il est vu finalisé.
    function _observe() internal {
        for (uint256 i = 0; i < _ctfIds.length; ++i) {
            uint256 id = _ctfIds[i];
            if (seenFinal[id]) continue;
            ICTFPlatform.CTF memory c = platform.getCTF(id);
            if (!c.finalized) continue;
            seenFinal[id] = true;
            finalCheated[id] = c.cheated;
            finalFirst[id] = platform.getPodium(id)[0];
        }
    }
}

/// Les 6 invariants de docs/SECURITY.md § Invariants, vérifiés après chaque
/// suite d'actions du handler. Profil par défaut : quelques centaines de
/// suites ; `--test-profile invariants` : 10 000 suites (issue #31).
contract CTFPlatformInvariantsTest is Test {
    uint256 internal constant ARBITRATION_FEE = 0.0005 ether;

    CTFPlatform internal platform;
    MockArbitrator internal arbitrator;
    TestLevel internal level;
    CTFPlatformHandler internal handler;
    address internal ruler = makeAddr("ruler");

    function setUp() public {
        vm.warp(1_000_000);
        arbitrator = new MockArbitrator(ARBITRATION_FEE, ruler);
        level = new TestLevel();
        // Durées courtes : une suite d'actions atteint toutes les phases.
        platform = new CTFPlatform(address(arbitrator), 1 hours, 1 hours, 1 hours, 2 hours);
        handler = new CTFPlatformHandler(platform, arbitrator, level, ruler, address(this));
        targetContract(address(handler));
    }

    /// Fonds encore dus par un CTF : tout tant qu'il n'est pas réglé, puis les
    /// tickets pas encore réclamés s'il se termine sans gagnant ou par une triche.
    function _held(uint256 id) internal view returns (uint256) {
        ICTFPlatform.CTF memory c = platform.getCTF(id);
        uint256 tickets = c.playerCount * c.ticketPrice;
        if (!c.finalized) {
            ICTFPlatform.Dispute memory d = platform.getDispute(id);
            return c.cashPrize + c.organizerBond + tickets + (d.contester != address(0) ? d.bond : 0);
        }
        bool refunds = c.cheated || platform.getPodium(id)[0] == address(0);
        return refunds ? tickets - handler.ghostRefunded(id) : 0;
    }

    function _owedToActors() internal view returns (uint256 total) {
        for (uint256 i = 0; i < handler.actorCount(); ++i) {
            total += platform.owed(handler.actor(i));
        }
    }

    function _heldByCtfs() internal view returns (uint256 total) {
        for (uint256 i = 0; i < handler.ctfCount(); ++i) {
            total += _held(handler.ctfId(i));
        }
    }

    /// 1. Solvabilité : le contrat détient au moins tout ce qu'il doit.
    function invariant_1_Solvency() public view {
        assertGe(address(platform).balance, _owedToActors() + _heldByCtfs(), "solvabilite");
    }

    /// 2. Conservation, au wei près : ce qui est entré est encore dans le
    /// contrat (dû, bloqué ou brûlé), retiré, ou parti chez l'arbitre en frais.
    function invariant_2_Conservation() public view {
        assertEq(
            address(platform).balance,
            _owedToActors() + _heldByCtfs() + platform.burned(),
            "solde = du + bloque + brule"
        );
        assertEq(
            handler.ghostDeposited(),
            address(platform).balance + handler.ghostWithdrawn() + handler.ghostFeesOut(),
            "entre = present + retire + frais"
        );
    }

    /// 3. Une seule issue : un CTF finalisé ne change plus, et n'est réglé qu'une fois.
    function invariant_3_SingleOutcome() public view {
        assertFalse(handler.ghostResettled(), "CTF regle deux fois");
        for (uint256 i = 0; i < handler.ctfCount(); ++i) {
            uint256 id = handler.ctfId(i);
            if (!handler.seenFinal(id)) continue;
            ICTFPlatform.CTF memory c = platform.getCTF(id);
            assertTrue(c.finalized, "toujours finalise");
            assertEq(c.cheated, handler.finalCheated(id), "issue inchangee");
            assertEq(platform.getPodium(id)[0], handler.finalFirst(id), "podium inchange");
        }
    }

    /// 4. Pas de réussite sans exploit : une épreuve validée correspond à une
    /// instance réellement résolue, par son propre joueur.
    function invariant_4_NoSolveWithoutExploit() public view {
        for (uint256 i = 0; i < handler.ctfCount(); ++i) {
            uint256 id = handler.ctfId(i);
            for (uint256 j = 0; j < handler.actorCount(); ++j) {
                address player = handler.actor(j);
                uint256 solved;
                for (uint256 lvl = 0; lvl < handler.levelCount(); ++lvl) {
                    if (!platform.isSolved(id, lvl, player)) continue;
                    ++solved;
                    TestInstance instance = TestInstance(platform.instanceOf(id, lvl, player));
                    assertTrue(instance.solved(), "valide sans exploit");
                    assertEq(instance.player(), player, "instance d'un autre");
                }
                assertEq(platform.getPlayer(id, player).score, solved, "score = epreuves validees");
            }
        }
    }

    /// 5. Pas d'admin : seul l'arbitre tranche, l'arbitre ne change jamais, et
    /// le déployeur n'a aucun solde.
    function invariant_5_NoAdmin() public view {
        assertFalse(handler.ghostStrangerRuled(), "quelqu'un d'autre a tranche");
        assertEq(platform.arbitrator(), address(arbitrator), "arbitre change");
        assertEq(platform.owed(address(this)), 0, "le deployeur a un solde");
    }

    /// 6. Retrait borné : `withdraw` verse exactement `owed` et le remet à zéro.
    function invariant_6_BoundedWithdraw() public view {
        assertFalse(handler.ghostWithdrawMismatch(), "retrait different du du");
    }
}
