// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.34;

import {CTFPlatformBase} from "./CTFPlatformBase.t.sol";
import {ICTFPlatform} from "./interfaces/ICTFPlatform.sol";
import {TestInstance} from "./mocks/TestLevel.sol";

/// Parcours nominal : création, tickets, instances, réussites, finalisation, retraits.
contract CTFPlatformTest is CTFPlatformBase {
    function test_Constructor_StoresImmutables() public view {
        assertEq(platform.arbitrator(), arbitrator);
        assertEq(platform.contestationPeriod(), CONTESTATION);
        assertEq(platform.votingPeriod(), VOTING);
        assertEq(platform.appealPeriod(), APPEAL);
        assertEq(platform.arbitratorTimeout(), ARBITRATOR_TIMEOUT);
    }

    function test_CreateCTF_StoresParamsAndCodehash() public {
        vm.expectEmit(address(platform));
        emit ICTFPlatform.CTFCreated(0, organizer);
        uint256 id = _createCTF(2);

        assertEq(id, 0);
        assertEq(platform.ctfCount(), 1);
        ICTFPlatform.CTF memory c = platform.getCTF(id);
        assertEq(c.organizer, organizer);
        assertEq(c.title, "Test CTF");
        assertEq(c.cashPrize, CASH_PRIZE);
        assertEq(c.organizerBond, BOND);
        assertEq(c.maxPlayers, MAX_PLAYERS);
        assertEq(c.ticketPrice, TICKET);
        assertEq(address(platform).balance, CASH_PRIZE + BOND);

        ICTFPlatform.Level[] memory levels = platform.getLevels(id);
        assertEq(levels.length, 2);
        assertEq(levels[0].factory, address(level));
        assertEq(levels[0].codehash, address(level).codehash);
        assertEq(uint8(platform.phaseOf(id)), uint8(ICTFPlatform.Phase.Open));
    }

    function test_HappyPath_ThreeWinners() public {
        uint256 id = _createCTF(2);
        address alice = _newPlayer("alice");
        address bob = _newPlayer("bob");
        address carol = _newPlayer("carol");
        address dave = _newPlayer("dave");

        vm.expectEmit(address(platform));
        emit ICTFPlatform.TicketBought(id, alice);
        _buy(id, alice);
        _buy(id, bob);
        _toRunning(id);
        assertEq(uint8(platform.phaseOf(id)), uint8(ICTFPlatform.Phase.Running));
        _buy(id, carol);
        _buy(id, dave);
        assertEq(platform.getCTF(id).playerCount, 4);

        // carol résout une épreuve en premier, puis alice deux, puis bob une.
        _solve(id, 0, carol);
        vm.warp(block.timestamp + 10);

        vm.prank(alice);
        TestInstance inst = TestInstance(platform.createInstance(id, 0));
        assertEq(platform.instanceOf(id, 0, alice), address(inst));
        vm.prank(alice);
        inst.solve();
        vm.expectEmit(address(platform));
        emit ICTFPlatform.LevelSolved(id, 0, alice, block.timestamp);
        vm.prank(alice);
        platform.submit(id, 0);
        assertTrue(platform.isSolved(id, 0, alice));

        vm.warp(block.timestamp + 10);
        _solve(id, 1, alice);
        vm.warp(block.timestamp + 10);
        _solve(id, 0, bob);
        // dave ne résout rien.
        _instance(id, 0, dave);

        address[3] memory podium = platform.getPodium(id);
        assertEq(podium[0], alice); // 2 points
        assertEq(podium[1], carol); // 1 point, le plus tôt
        assertEq(podium[2], bob); // 1 point, plus tard
        assertEq(platform.getPlayer(id, alice).score, 2);

        _toContestation(id);
        assertEq(uint8(platform.phaseOf(id)), uint8(ICTFPlatform.Phase.Contestation));
        _toFinalizable(id);
        vm.expectEmit(address(platform));
        emit ICTFPlatform.Finalized(id, false);
        platform.finalize(id);
        assertEq(uint8(platform.phaseOf(id)), uint8(ICTFPlatform.Phase.Finalized));

        uint256 pot = CASH_PRIZE + 4 * TICKET;
        uint256 second = (pot * 30) / 100;
        uint256 third = (pot * 10) / 100;
        assertEq(platform.owed(alice), pot - second - third);
        assertEq(platform.owed(carol), second);
        assertEq(platform.owed(bob), third);
        assertEq(platform.owed(dave), 0);
        assertEq(platform.owed(organizer), BOND);

        vm.expectEmit(address(platform));
        emit ICTFPlatform.Withdrawn(alice, pot - second - third);
        assertEq(_withdraw(alice), pot - second - third);
        assertEq(_withdraw(carol), second);
        assertEq(_withdraw(bob), third);
        assertEq(_withdraw(organizer), BOND);
        assertEq(platform.owed(alice), 0);
        assertEq(address(platform).balance, 0);
    }

    function test_HappyPath_NoWinner_RefundsEveryone() public {
        uint256 id = _createCTF(1);
        address alice = _newPlayer("alice");
        address bob = _newPlayer("bob");
        _buy(id, alice);
        _buy(id, bob);
        _toFinalizable(id);
        platform.finalize(id);

        assertEq(platform.owed(organizer), CASH_PRIZE + BOND);
        vm.expectEmit(address(platform));
        emit ICTFPlatform.RefundClaimed(id, alice, TICKET);
        vm.prank(alice);
        platform.claimRefund(id);
        vm.prank(bob);
        platform.claimRefund(id);

        assertEq(_withdraw(alice), TICKET);
        assertEq(_withdraw(bob), TICKET);
        assertEq(_withdraw(organizer), CASH_PRIZE + BOND);
        assertEq(address(platform).balance, 0);
    }
}
