// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.34;

import {CTFPlatform} from "./CTFPlatform.sol";
import {CTFPlatformBase} from "./CTFPlatformBase.t.sol";
import {IArbitrable} from "./interfaces/IArbitrable.sol";
import {IArbitrator} from "./interfaces/IArbitrator.sol";
import {ICTFPlatform} from "./interfaces/ICTFPlatform.sol";
import {MockArbitrator} from "./mocks/MockArbitrator.sol";

/// Litiges, version simplifiée (issues #15, #17, #18, #19) : contestation → arbitre
/// ERC-792 → décision, ou timeout de l'arbitre. Chaque issue avec litige, chaque
/// refus, et la conservation des fonds au wei près (docs/DESIGN.md § Flux d'argent).
contract CTFPlatformDisputesTest is CTFPlatformBase {
    uint256 internal constant FEE = 0.0005 ether;
    /// max(3 × 0.01 ETH, 0.001 ETH)
    uint256 internal constant DISPUTE_BOND = 3 * TICKET;
    uint256 internal constant CHEATED = 1;
    uint256 internal constant NOT_CHEATED = 2;

    MockArbitrator internal mock;
    address internal ruler = makeAddr("ruler");

    address internal alice;
    address internal bob;
    address internal carol;
    address internal dave;

    function setUp() public override {
        super.setUp();
        mock = new MockArbitrator(FEE, ruler);
        platform = new CTFPlatform(address(mock), CONTESTATION, VOTING, APPEAL, ARBITRATOR_TIMEOUT);
        alice = _newPlayer("alice");
        bob = _newPlayer("bob");
        carol = _newPlayer("carol");
        dave = _newPlayer("dave");
    }

    // ------------------------------------------------------------------
    // Raccourcis
    // ------------------------------------------------------------------

    /// CTF à 2 épreuves, 4 joueurs inscrits, en phase Running.
    function _runningCTF() internal returns (uint256 id) {
        id = _createCTF(2);
        _buy(id, alice);
        _buy(id, bob);
        _buy(id, carol);
        _buy(id, dave);
        _toRunning(id);
    }

    /// alice gagne seule, puis on passe en contestation.
    function _contestableCTF() internal returns (uint256 id) {
        id = _runningCTF();
        _solve(id, 0, alice);
        _toContestation(id);
    }

    function _open(uint256 id, address contester) internal {
        vm.prank(contester);
        platform.openDispute{value: DISPUTE_BOND + FEE}(id);
    }

    /// Lit l'identifiant avant le `prank` : un appel de lecture consommerait le `prank`.
    function _ruling(uint256 id, uint256 ruling) internal {
        uint256 disputeID = platform.getDispute(id).disputeID;
        vm.prank(ruler);
        mock.giveRuling(disputeID, ruling);
    }

    function _pot() internal pure returns (uint256) {
        return CASH_PRIZE + 4 * TICKET;
    }

    function _withdrawIfOwed(address account) internal returns (uint256) {
        if (platform.owed(account) == 0) return 0;
        return _withdraw(account);
    }

    function _phase(uint256 id) internal view returns (ICTFPlatform.Phase) {
        return platform.phaseOf(id);
    }

    function _wrongPhase(ICTFPlatform.Phase phase) internal pure returns (bytes memory) {
        return abi.encodeWithSelector(ICTFPlatform.WrongPhase.selector, phase);
    }

    // ------------------------------------------------------------------
    // Ouverture
    // ------------------------------------------------------------------

    function test_DisputeCost_IsThreeTicketsPlusArbitratorFee() public {
        uint256 id = _createCTF(1);
        (uint256 bond, uint256 fee) = platform.disputeCost(id);
        assertEq(bond, DISPUTE_BOND);
        assertEq(fee, FEE);
    }

    function test_DisputeCost_HasFloorOfOneThousandthEther() public {
        ICTFPlatform.CTFParams memory p = _params();
        p.ticketPrice = platform.MIN_TICKET_PRICE(); // 3 × 0.0001 < 0.001
        p.organizerBond = p.cashPrize + p.maxPlayers * p.ticketPrice;
        uint256 id = _createCTF(p, 1);
        (uint256 bond, ) = platform.disputeCost(id);
        assertEq(bond, platform.MIN_DISPUTE_BOND());
    }

    function test_OpenDispute_TransmitsToArbitrator() public {
        uint256 id = _contestableCTF();

        vm.expectEmit(address(platform));
        emit ICTFPlatform.DisputeOpened(id, bob);
        vm.expectEmit(address(platform));
        emit ICTFPlatform.Appealed(id, 0);
        _open(id, bob);

        ICTFPlatform.Dispute memory d = platform.getDispute(id);
        assertEq(d.contester, bob);
        assertEq(d.bond, DISPUTE_BOND);
        assertEq(d.openedAt, block.timestamp);
        assertEq(d.appellant, bob);
        assertEq(d.appealFee, FEE);
        assertEq(d.appealedAt, block.timestamp);
        assertEq(d.disputeID, 0);
        assertTrue(d.appealed);
        assertFalse(d.resolved);

        assertEq(uint256(_phase(id)), uint256(ICTFPlatform.Phase.Appealed));
        assertEq(mock.disputeCount(), 1);
        assertEq(address(mock).balance, FEE);
        (IArbitrable arbitrable, uint256 choices, , ) = mock.disputes(0);
        assertEq(address(arbitrable), address(platform));
        assertEq(choices, platform.RULING_OPTIONS());
        assertEq(platform.RULING_CHEATED(), CHEATED);
        assertEq(platform.RULING_NOT_CHEATED(), NOT_CHEATED);
    }

    function test_OpenDispute_LastSecondOfContestation() public {
        uint256 id = _contestableCTF();
        vm.warp(platform.getCTF(id).endTime + CONTESTATION - 1);
        _open(id, bob);
        assertEq(uint256(_phase(id)), uint256(ICTFPlatform.Phase.Appealed));
    }

    // ------------------------------------------------------------------
    // Issue : triche confirmée
    // ------------------------------------------------------------------

    function test_CheatingConfirmed_BondBurned_PrizeBack_TicketsRefunded() public {
        uint256 id = _contestableCTF();
        _open(id, bob);

        vm.expectEmit(address(platform));
        emit IArbitrable.Ruling(IArbitrator(address(mock)), 0, 1);
        vm.expectEmit(address(platform));
        emit ICTFPlatform.Ruled(id, true);
        vm.expectEmit(address(platform));
        emit ICTFPlatform.Finalized(id, true);
        vm.prank(ruler);
        mock.giveRuling(0, CHEATED);

        assertEq(uint256(_phase(id)), uint256(ICTFPlatform.Phase.Cheated));
        ICTFPlatform.CTF memory c = platform.getCTF(id);
        assertTrue(c.cheated);
        assertTrue(c.finalized);
        assertTrue(platform.getDispute(id).resolved);

        // Organisateur : cash prize rendu, caution brûlée (moins les frais rendus au contestataire).
        assertEq(platform.owed(organizer), CASH_PRIZE);
        assertEq(platform.burned(), BOND - FEE);
        // Contestataire : caution + frais d'arbitrage rendus.
        assertEq(platform.owed(bob), DISPUTE_BOND + FEE);
        // Le « gagnant » ne touche rien.
        assertEq(platform.owed(alice), 0);

        address[4] memory players = [alice, bob, carol, dave];
        for (uint256 i = 0; i < players.length; ++i) {
            vm.prank(players[i]);
            platform.claimRefund(id);
        }
        assertEq(_withdraw(alice), TICKET);
        assertEq(_withdraw(bob), DISPUTE_BOND + FEE + TICKET);
        assertEq(_withdraw(carol), TICKET);
        assertEq(_withdraw(dave), TICKET);
        assertEq(_withdraw(organizer), CASH_PRIZE);

        // Il ne reste que la caution brûlée, au wei près.
        assertEq(address(platform).balance, platform.burned());
    }

    function test_CheatingConfirmed_CannotFinalizeOrRuleAgain() public {
        uint256 id = _contestableCTF();
        _open(id, bob);
        _ruling(id, CHEATED);

        _toFinalizable(id);
        vm.expectRevert(_wrongPhase(ICTFPlatform.Phase.Cheated));
        platform.finalize(id);

        vm.prank(address(mock));
        vm.expectRevert(_wrongPhase(ICTFPlatform.Phase.Cheated));
        platform.rule(0, 1);
    }

    // ------------------------------------------------------------------
    // Issue : litige rejeté
    // ------------------------------------------------------------------

    function test_DisputeRejected_OrganizerTakesContesterBond_NormalPayout() public {
        uint256 id = _contestableCTF();
        _open(id, bob);

        vm.expectEmit(address(platform));
        emit ICTFPlatform.Ruled(id, false);
        vm.expectEmit(address(platform));
        emit ICTFPlatform.Finalized(id, false);
        vm.prank(ruler);
        mock.giveRuling(0, NOT_CHEATED);

        assertEq(uint256(_phase(id)), uint256(ICTFPlatform.Phase.Finalized));
        assertFalse(platform.getCTF(id).cheated);
        assertTrue(platform.getDispute(id).resolved);
        assertEq(platform.burned(), 0);

        assertEq(platform.owed(organizer), BOND + DISPUTE_BOND);
        assertEq(platform.owed(alice), _pot());
        assertEq(platform.owed(bob), 0); // frais d'arbitrage perdus

        vm.prank(bob);
        vm.expectRevert(ICTFPlatform.NothingToRefund.selector);
        platform.claimRefund(id);

        assertEq(_withdraw(alice), _pot());
        assertEq(_withdraw(organizer), BOND + DISPUTE_BOND);
        assertEq(address(platform).balance, 0);
    }

    /// Ruling 0 (l'arbitre refuse de trancher) = pas de triche.
    function test_ArbitratorRefusesToRule_TreatedAsRejected() public {
        uint256 id = _contestableCTF();
        _open(id, bob);
        _ruling(id, 0);

        assertEq(uint256(_phase(id)), uint256(ICTFPlatform.Phase.Finalized));
        assertEq(platform.owed(organizer), BOND + DISPUTE_BOND);
        assertEq(platform.owed(alice), _pot());
    }

    /// Litige rejeté sur un CTF sans gagnant : l'organisateur récupère tout, les tickets sont remboursés.
    function test_DisputeRejected_NoWinner_TicketsRefunded() public {
        uint256 id = _runningCTF();
        _toContestation(id);
        _open(id, carol);
        _ruling(id, NOT_CHEATED);

        assertEq(platform.owed(organizer), CASH_PRIZE + BOND + DISPUTE_BOND);
        address[4] memory players = [alice, bob, carol, dave];
        for (uint256 i = 0; i < players.length; ++i) {
            vm.prank(players[i]);
            platform.claimRefund(id);
            assertEq(_withdraw(players[i]), TICKET);
        }
        assertEq(_withdraw(organizer), CASH_PRIZE + BOND + DISPUTE_BOND);
        assertEq(address(platform).balance, 0);
    }

    // ------------------------------------------------------------------
    // Issue : l'arbitre ne répond pas
    // ------------------------------------------------------------------

    function test_ArbitratorTimeout_AnyoneClosesAsRejected() public {
        uint256 id = _contestableCTF();
        _open(id, bob);
        uint256 timeoutAt = block.timestamp + ARBITRATOR_TIMEOUT;

        vm.warp(timeoutAt - 1);
        vm.expectRevert(abi.encodeWithSelector(ICTFPlatform.TimeoutNotReached.selector, timeoutAt));
        platform.applyVoteAfterTimeout(id);

        vm.warp(timeoutAt);
        vm.expectEmit(address(platform));
        emit ICTFPlatform.Finalized(id, false);
        vm.prank(dave); // n'importe qui
        platform.applyVoteAfterTimeout(id);

        assertEq(uint256(_phase(id)), uint256(ICTFPlatform.Phase.Finalized));
        assertTrue(platform.getDispute(id).resolved);
        assertEq(platform.owed(organizer), BOND + DISPUTE_BOND);
        assertEq(platform.owed(alice), _pot());

        // Une décision tardive de l'arbitre est refusée : le litige est clos.
        vm.prank(ruler);
        vm.expectRevert(_wrongPhase(ICTFPlatform.Phase.Finalized));
        mock.giveRuling(0, 1);
    }

    function test_ApplyVoteAfterTimeout_RevertsWithoutDispute() public {
        uint256 id = _contestableCTF();
        vm.expectRevert(_wrongPhase(ICTFPlatform.Phase.Contestation));
        platform.applyVoteAfterTimeout(id);
    }

    // ------------------------------------------------------------------
    // Refus
    // ------------------------------------------------------------------

    function test_OpenDispute_RevertsBeforeEnd() public {
        uint256 id = _runningCTF();
        vm.expectRevert(_wrongPhase(ICTFPlatform.Phase.Running));
        _open(id, bob);
    }

    function test_OpenDispute_RevertsAfterContestation() public {
        uint256 id = _contestableCTF();
        uint256 end = platform.getCTF(id).endTime + CONTESTATION;
        vm.warp(end);
        vm.expectRevert(abi.encodeWithSelector(ICTFPlatform.ContestationOver.selector, end));
        _open(id, bob);
    }

    function test_OpenDispute_RevertsAfterFinalize() public {
        uint256 id = _contestableCTF();
        _toFinalizable(id);
        platform.finalize(id);
        vm.expectRevert(_wrongPhase(ICTFPlatform.Phase.Finalized));
        _open(id, bob);
    }

    function test_OpenDispute_RevertsWithoutTicket() public {
        uint256 id = _contestableCTF();
        address outsider = _newPlayer("outsider");
        vm.expectRevert(ICTFPlatform.NoTicket.selector);
        _open(id, outsider);

        vm.deal(organizer, 10 ether);
        vm.expectRevert(ICTFPlatform.NoTicket.selector);
        _open(id, organizer);
    }

    function test_OpenDispute_RevertsOnWrongValue() public {
        uint256 id = _contestableCTF();
        uint256 expected = DISPUTE_BOND + FEE;
        vm.startPrank(bob);
        vm.expectRevert(abi.encodeWithSelector(ICTFPlatform.WrongDisputeBond.selector, expected, DISPUTE_BOND));
        platform.openDispute{value: DISPUTE_BOND}(id);
        vm.expectRevert(abi.encodeWithSelector(ICTFPlatform.WrongDisputeBond.selector, expected, expected + 1));
        platform.openDispute{value: expected + 1}(id);
        vm.stopPrank();
    }

    function test_OpenDispute_OnlyOnePerCTF() public {
        uint256 id = _contestableCTF();
        _open(id, bob);
        vm.expectRevert(ICTFPlatform.DisputeAlreadyOpened.selector);
        _open(id, carol);
    }

    function test_OpenDispute_RevertsOnUnknownCTF() public {
        vm.expectRevert(abi.encodeWithSelector(ICTFPlatform.CTFNotFound.selector, 7));
        _open(7, bob);
    }

    function test_FinalizeAndRefund_BlockedDuringDispute() public {
        uint256 id = _contestableCTF();
        _open(id, bob);
        _toFinalizable(id);

        vm.expectRevert(_wrongPhase(ICTFPlatform.Phase.Appealed));
        platform.finalize(id);

        vm.prank(bob);
        vm.expectRevert(_wrongPhase(ICTFPlatform.Phase.Appealed));
        platform.claimRefund(id);
    }

    function test_Rule_RevertsOnInvalidRuling() public {
        uint256 id = _contestableCTF();
        _open(id, bob);
        vm.prank(address(mock));
        vm.expectRevert(abi.encodeWithSelector(ICTFPlatform.InvalidRuling.selector, 3));
        platform.rule(0, 3);
    }

    function test_Rule_RevertsWhenNotArbitrator() public {
        uint256 id = _contestableCTF();
        _open(id, bob);
        vm.prank(ruler); // le ruler passe par MockArbitrator, pas directement
        vm.expectRevert(ICTFPlatform.NotArbitrator.selector);
        platform.rule(0, 1);
    }

    // ------------------------------------------------------------------
    // Conservation des fonds
    // ------------------------------------------------------------------

    /// Quelle que soit l'issue (triche, rejet, refus de trancher, timeout) et le
    /// nombre de gagnants : une fois que chacun a tout retiré, il ne reste dans le
    /// contrat que la caution brûlée, au wei près.
    function testFuzz_Conservation_WithDispute(uint8 solvers, uint8 contesterIndex, uint8 outcome) public {
        uint256 id = _runningCTF();
        address[4] memory players = [alice, bob, carol, dave];
        for (uint256 i = 0; i < players.length; ++i) {
            if (solvers & (1 << i) != 0) _solve(id, 0, players[i]);
        }
        _toContestation(id);
        _open(id, players[contesterIndex % 4]);

        outcome = outcome % 4;
        if (outcome == 3) {
            vm.warp(block.timestamp + ARBITRATOR_TIMEOUT);
            platform.applyVoteAfterTimeout(id);
        } else {
            _ruling(id, outcome);
        }

        ICTFPlatform.CTF memory c = platform.getCTF(id);
        bool refunds = c.cheated || platform.getPodium(id)[0] == address(0);
        for (uint256 i = 0; i < players.length; ++i) {
            if (refunds) {
                vm.prank(players[i]);
                platform.claimRefund(id);
            }
            _withdrawIfOwed(players[i]);
        }
        _withdrawIfOwed(organizer);

        assertEq(address(platform).balance, platform.burned());
        assertEq(platform.burned(), outcome == 1 ? BOND - FEE : 0);
        assertEq(address(mock).balance, FEE);
    }
}
