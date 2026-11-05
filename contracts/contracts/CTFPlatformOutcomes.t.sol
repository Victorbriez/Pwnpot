// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.34;

import {CTFPlatformBase} from "./CTFPlatformBase.t.sol";
import {ICTFPlatform} from "./interfaces/ICTFPlatform.sol";

/// Issues sans litige (podium à 1, 2 et 3 gagnants, égalités, aucun gagnant)
/// et conservation des fonds au wei près (issue #9, SECURITY.md § Invariants).
contract CTFPlatformOutcomesTest is CTFPlatformBase {
    address internal alice;
    address internal bob;
    address internal carol;
    address internal dave;

    function setUp() public override {
        super.setUp();
        alice = _newPlayer("alice");
        bob = _newPlayer("bob");
        carol = _newPlayer("carol");
        dave = _newPlayer("dave");
    }

    /// CTF à 2 épreuves avec alice, bob, carol et dave inscrits, en phase Running.
    function _runningCTF() internal returns (uint256 id) {
        id = _createCTF(2);
        _buy(id, alice);
        _buy(id, bob);
        _buy(id, carol);
        _buy(id, dave);
        _toRunning(id);
    }

    function _pot() internal pure returns (uint256) {
        return CASH_PRIZE + 4 * TICKET;
    }

    function _assertPodium(uint256 id, address first, address second, address third) internal view {
        address[3] memory podium = platform.getPodium(id);
        assertEq(podium[0], first, "1er");
        assertEq(podium[1], second, "2e");
        assertEq(podium[2], third, "3e");
    }

    // ------------------------------------------------------------------
    // Podium
    // ------------------------------------------------------------------

    function test_OneWinner_TakesEverything() public {
        uint256 id = _runningCTF();
        _solve(id, 0, alice);
        _toFinalizable(id);
        platform.finalize(id);

        _assertPodium(id, alice, address(0), address(0));
        assertEq(platform.owed(alice), _pot());
        assertEq(platform.owed(organizer), BOND);
        assertEq(platform.owed(bob), 0);
    }

    function test_TwoWinners_SixtySevenThirtyThree() public {
        uint256 id = _runningCTF();
        _solve(id, 0, alice);
        vm.warp(block.timestamp + 1);
        _solve(id, 0, bob);
        _toFinalizable(id);
        platform.finalize(id);

        _assertPodium(id, alice, bob, address(0));
        uint256 second = (_pot() * 33) / 100;
        assertEq(platform.owed(bob), second);
        assertEq(platform.owed(alice), _pot() - second);
        // 1,04 ETH : 0,6968 / 0,3432
        assertEq(platform.owed(alice), 0.6968 ether);
        assertEq(platform.owed(bob), 0.3432 ether);
        assertEq(platform.owed(organizer), BOND);
    }

    function test_ThreeWinners_SixtyThirtyTen() public {
        uint256 id = _runningCTF();
        _solve(id, 0, alice);
        vm.warp(block.timestamp + 1);
        _solve(id, 0, bob);
        vm.warp(block.timestamp + 1);
        _solve(id, 0, carol);
        _toFinalizable(id);
        platform.finalize(id);

        _assertPodium(id, alice, bob, carol);
        assertEq(platform.owed(alice), 0.624 ether);
        assertEq(platform.owed(bob), 0.312 ether);
        assertEq(platform.owed(carol), 0.104 ether);
        assertEq(platform.owed(organizer), BOND);
    }

    /// Plus de 3 réussites : seuls les 3 premiers sont payés, le 4e rien.
    function test_FourthPlace_GetsNothing() public {
        uint256 id = _runningCTF();
        _solve(id, 0, alice);
        vm.warp(block.timestamp + 1);
        _solve(id, 0, bob);
        vm.warp(block.timestamp + 1);
        _solve(id, 0, carol);
        vm.warp(block.timestamp + 1);
        _solve(id, 0, dave);
        _assertPodium(id, alice, bob, carol);
        _toFinalizable(id);
        platform.finalize(id);
        assertEq(platform.owed(dave), 0);
    }

    // ------------------------------------------------------------------
    // Classement et égalités
    // ------------------------------------------------------------------

    /// À égalité de points, la dernière réussite la plus tôt passe devant,
    /// même si l'autre joueur avait marqué son premier point avant.
    function test_Tie_EarlierLastSolveWins() public {
        uint256 id = _runningCTF();
        _solve(id, 0, alice); // t
        vm.warp(block.timestamp + 10);
        _solve(id, 0, bob); // t + 10
        _assertPodium(id, alice, bob, address(0));
        vm.warp(block.timestamp + 10);
        _solve(id, 1, bob); // t + 20 : bob 2 points
        _assertPodium(id, bob, alice, address(0));
        vm.warp(block.timestamp + 10);
        _solve(id, 1, alice); // t + 30 : alice 2 points, mais plus tard
        _assertPodium(id, bob, alice, address(0));

        _toFinalizable(id);
        platform.finalize(id);
        uint256 second = (_pot() * 33) / 100;
        assertEq(platform.owed(bob), _pot() - second);
        assertEq(platform.owed(alice), second);
    }

    /// Même bloc, même score : le premier enregistré garde sa place.
    function test_Tie_SameBlock_FirstRecordedKeepsPlace() public {
        uint256 id = _runningCTF();
        _solve(id, 0, bob);
        _solve(id, 0, alice);
        _solve(id, 0, carol);
        _assertPodium(id, bob, alice, carol);
        assertEq(platform.getPlayer(id, bob).lastSolveTime, platform.getPlayer(id, alice).lastSolveTime);
    }

    /// Un joueur hors podium qui marque un point de plus remonte et pousse le 3e dehors.
    function test_Ranking_OutsiderClimbsToFirst() public {
        uint256 id = _runningCTF();
        _solve(id, 0, alice);
        _solve(id, 0, bob);
        _solve(id, 0, carol);
        vm.warp(block.timestamp + 1);
        _solve(id, 0, dave);
        _assertPodium(id, alice, bob, carol);
        vm.warp(block.timestamp + 1);
        _solve(id, 1, dave);
        _assertPodium(id, dave, alice, bob);
        vm.warp(block.timestamp + 1);
        _solve(id, 1, carol);
        _assertPodium(id, dave, carol, alice);
    }

    // ------------------------------------------------------------------
    // Aucun gagnant
    // ------------------------------------------------------------------

    function test_NoWinner_TicketsRefunded_OrganizerGetsPrizeAndBond() public {
        uint256 id = _runningCTF();
        _instance(id, 0, alice); // une instance, mais pas d'exploit
        _toFinalizable(id);
        platform.finalize(id);

        _assertPodium(id, address(0), address(0), address(0));
        assertEq(platform.owed(organizer), CASH_PRIZE + BOND);

        address[4] memory players = [alice, bob, carol, dave];
        for (uint256 i = 0; i < players.length; ++i) {
            vm.prank(players[i]);
            platform.claimRefund(id);
            assertEq(_withdraw(players[i]), TICKET);
        }
        assertEq(_withdraw(organizer), CASH_PRIZE + BOND);
        assertEq(address(platform).balance, 0);
    }

    // ------------------------------------------------------------------
    // Conservation des fonds
    // ------------------------------------------------------------------

    /// Montants indivisibles : cash prize + tickets ne tombe pas juste sur 60/30/10.
    /// Le 1er absorbe les arrondis et aucun wei ne reste bloqué.
    function test_Conservation_IndivisibleAmounts_ThreeWinners() public {
        ICTFPlatform.CTFParams memory p = _params();
        p.cashPrize = 1 ether + 7;
        p.ticketPrice = 0.0001 ether + 3;
        p.maxPlayers = 3;
        p.organizerBond = p.cashPrize + 3 * p.ticketPrice + 11;
        uint256 id = _createCTF(p, 1);
        _buy(id, alice);
        _buy(id, bob);
        _buy(id, carol);
        _toRunning(id);
        _solve(id, 0, alice);
        _solve(id, 0, bob);
        _solve(id, 0, carol);
        _toFinalizable(id);
        platform.finalize(id);

        uint256 pot = p.cashPrize + 3 * p.ticketPrice;
        assertTrue(pot % 100 != 0, "le montant doit etre indivisible");
        uint256 second = (pot * 30) / 100;
        uint256 third = (pot * 10) / 100;
        uint256 first = pot - second - third;
        assertEq(platform.owed(alice), first);
        assertEq(platform.owed(bob), second);
        assertEq(platform.owed(carol), third);
        // Le 1er a bien reçu l'arrondi : plus que 60 % arrondi vers le bas.
        assertGt(first, (pot * 60) / 100);

        uint256 deposited = p.cashPrize + p.organizerBond + 3 * p.ticketPrice;
        uint256 credited = platform.owed(alice) +
            platform.owed(bob) +
            platform.owed(carol) +
            platform.owed(organizer);
        assertEq(credited, deposited);

        uint256 withdrawn = _withdraw(alice) + _withdraw(bob) + _withdraw(carol) + _withdraw(organizer);
        assertEq(withdrawn, deposited);
        assertEq(address(platform).balance, 0);
    }

    function test_Conservation_IndivisibleAmounts_TwoWinners() public {
        ICTFPlatform.CTFParams memory p = _params();
        p.cashPrize = 1 ether + 1;
        p.ticketPrice = 0.0001 ether + 1;
        p.maxPlayers = 2;
        p.organizerBond = p.cashPrize + 2 * p.ticketPrice;
        uint256 id = _createCTF(p, 1);
        _buy(id, alice);
        _buy(id, bob);
        _toRunning(id);
        _solve(id, 0, alice);
        _solve(id, 0, bob);
        _toFinalizable(id);
        platform.finalize(id);

        uint256 pot = p.cashPrize + 2 * p.ticketPrice;
        assertEq(platform.owed(alice) + platform.owed(bob), pot);
        assertEq(platform.owed(bob), (pot * 33) / 100);
        uint256 withdrawn = _withdraw(alice) + _withdraw(bob) + _withdraw(organizer);
        assertEq(withdrawn, p.cashPrize + p.organizerBond + 2 * p.ticketPrice);
        assertEq(address(platform).balance, 0);
    }

    /// Fuzz : quels que soient les montants, le nombre de joueurs et de gagnants,
    /// cash prize + tickets + caution = somme des crédits, au wei près, et tout
    /// est retirable.
    function testFuzz_Conservation(
        uint256 cashPrize,
        uint256 ticketPrice,
        uint256 extraBond,
        uint8 playersSeed,
        uint8 winnersSeed
    ) public {
        ICTFPlatform.CTFParams memory p = _params();
        p.cashPrize = bound(cashPrize, 1, 100 ether);
        p.ticketPrice = bound(ticketPrice, 0.0001 ether, 1 ether);
        uint256 playerCount = bound(playersSeed, 1, 8);
        uint256 winnerCount = bound(winnersSeed, 0, playerCount);
        p.maxPlayers = playerCount;
        p.organizerBond = p.cashPrize + playerCount * p.ticketPrice + bound(extraBond, 0, 1 ether);
        uint256 id = _createCTF(p, 1);

        address[] memory players = new address[](playerCount);
        for (uint256 i = 0; i < playerCount; ++i) {
            players[i] = _newPlayer(string.concat("player", vm.toString(i)));
            _buy(id, players[i]);
        }
        _toRunning(id);
        for (uint256 i = 0; i < winnerCount; ++i) {
            _solve(id, 0, players[i]);
            vm.warp(block.timestamp + 1);
        }
        _toFinalizable(id);
        platform.finalize(id);

        if (winnerCount == 0) {
            for (uint256 i = 0; i < playerCount; ++i) {
                vm.prank(players[i]);
                platform.claimRefund(id);
            }
        }

        uint256 deposited = p.cashPrize + p.organizerBond + playerCount * p.ticketPrice;
        uint256 credited = platform.owed(organizer);
        for (uint256 i = 0; i < playerCount; ++i) {
            credited += platform.owed(players[i]);
        }
        assertEq(credited, deposited);

        uint256 withdrawn = _withdraw(organizer);
        for (uint256 i = 0; i < playerCount; ++i) {
            if (platform.owed(players[i]) != 0) withdrawn += _withdraw(players[i]);
        }
        assertEq(withdrawn, deposited);
        assertEq(address(platform).balance, 0);
    }
}
