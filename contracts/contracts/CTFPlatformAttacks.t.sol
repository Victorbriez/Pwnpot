// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.34;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {CTFPlatformBase} from "./CTFPlatformBase.t.sol";
import {GasBombFactory} from "./attacks/GasBombFactory.sol";
import {MaliciousFactory} from "./attacks/MaliciousFactory.sol";
import {MaliciousReceiver} from "./attacks/MaliciousReceiver.sol";
import {ICTFPlatform} from "./interfaces/ICTFPlatform.sol";
import {TestInstance} from "./mocks/TestLevel.sol";

/// Attacks through third-party code (issue #8, docs/FAILURES.md § La faille la
/// plus pertinente, docs/SECURITY.md § Factory malveillante): a factory that
/// re-enters the platform, a receiver that re-enters `withdraw`, and a factory
/// whose validation burns all its gas.
contract CTFPlatformAttacksTest is CTFPlatformBase {
    address internal alice;
    address internal bob;

    function setUp() public override {
        super.setUp();
        alice = _newPlayer("alice");
        bob = _newPlayer("bob");
        vm.deal(address(this), 100 ether);
    }

    function _createCTFWith(ICTFPlatform.CTFParams memory p, address[] memory factories) internal returns (uint256) {
        vm.prank(organizer);
        return platform.createCTF{value: p.cashPrize + p.organizerBond}(p, factories);
    }

    function _one(address a) internal pure returns (address[] memory list) {
        list = new address[](1);
        list[0] = a;
    }

    function _two(address a, address b) internal pure returns (address[] memory list) {
        list = new address[](2);
        list[0] = a;
        list[1] = b;
    }

    // ------------------------------------------------------------------
    // 1. MaliciousFactory: reentrancy from createInstance
    // ------------------------------------------------------------------

    /// The factory holds a ticket and a solved, unsubmitted instance on level 0,
    /// then tries to submit it from inside alice's `createInstance` on level 1.
    function test_MaliciousFactory_SubmitFromCreateInstance_Reverts() public {
        MaliciousFactory factory = new MaliciousFactory(platform);
        uint256 id = _createCTFWith(_params(), _two(address(level), address(factory)));
        factory.buyTicket{value: TICKET}(id);
        _buy(id, alice);
        _toRunning(id);

        TestInstance own = TestInstance(factory.createOwnInstance(id, 0));
        factory.exec(address(own), abi.encodeCall(TestInstance.solve, ()));
        assertTrue(own.solved(), "setup: factory instance solved");
        factory.arm(MaliciousFactory.Mode.Submit, id, 0);

        uint256 platformBefore = address(platform).balance;

        vm.expectRevert(ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        vm.prank(alice);
        platform.createInstance(id, 1);

        assertEq(platform.instanceOf(id, 1, alice), address(0), "no instance for alice");
        assertFalse(platform.isSolved(id, 0, address(factory)), "factory did not score");
        assertEq(platform.getPlayer(id, address(factory)).score, 0);
        assertEq(platform.getPodium(id)[0], address(0), "podium untouched");
        assertEq(address(platform).balance, platformBefore, "platform balance");

        // Control: outside the callback the same submit is valid, so only the
        // reentrancy guard stopped it above.
        factory.arm(MaliciousFactory.Mode.None, 0, 0);
        factory.exec(address(platform), abi.encodeCall(ICTFPlatform.submit, (id, 0)));
        assertTrue(platform.isSolved(id, 0, address(factory)));
    }

    /// The factory is owed cash prize + bond as the organizer of a finalized CTF,
    /// then tries to withdraw it from inside alice's `createInstance`.
    function test_MaliciousFactory_WithdrawFromCreateInstance_Reverts() public {
        MaliciousFactory factory = new MaliciousFactory(platform);
        uint256 first = factory.createCTF{value: CASH_PRIZE + BOND}(_params(), _one(address(level)));
        _toFinalizable(first);
        platform.finalize(first);
        uint256 factoryOwed = platform.owed(address(factory));
        assertEq(factoryOwed, CASH_PRIZE + BOND, "setup: factory is owed");

        uint256 id = _createCTFWith(_params(), _one(address(factory)));
        _buy(id, alice);
        _toRunning(id);
        factory.arm(MaliciousFactory.Mode.Withdraw, id, 0);

        uint256 platformBefore = address(platform).balance;

        vm.expectRevert(ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        vm.prank(alice);
        platform.createInstance(id, 0);

        assertEq(platform.instanceOf(id, 0, alice), address(0), "no instance for alice");
        assertEq(platform.owed(address(factory)), factoryOwed, "factory owed unchanged");
        assertEq(address(factory).balance, 0, "factory got nothing");
        assertEq(address(platform).balance, platformBefore, "platform balance");

        // Control: outside the callback the same withdraw pays out normally.
        factory.arm(MaliciousFactory.Mode.None, 0, 0);
        factory.exec(address(platform), abi.encodeCall(ICTFPlatform.withdraw, ()));
        assertEq(address(factory).balance, factoryOwed);
        assertEq(address(platform).balance, platformBefore - factoryOwed);
    }

    // ------------------------------------------------------------------
    // 2. MaliciousReceiver: reentrancy from receive() during withdraw
    // ------------------------------------------------------------------

    /// Small CTF that ends with no winner: the receiver and bob hold a ticket,
    /// the receiver claims its refund (owed = TICKET), bob does not claim yet.
    /// The platform then holds 6 tickets' worth: organizer cash prize + bond
    /// (owed), bob's ticket (not claimed) and the receiver's ticket (owed).
    function _receiverOwedRefund(bool catchReentry) internal returns (MaliciousReceiver receiver, uint256 id) {
        receiver = new MaliciousReceiver(platform, catchReentry);
        ICTFPlatform.CTFParams memory p = _params();
        p.maxPlayers = 2;
        p.cashPrize = TICKET;
        p.organizerBond = TICKET + 2 * TICKET;
        id = _createCTFWith(p, _one(address(level)));

        receiver.buyTicket{value: TICKET}(id);
        _buy(id, bob);
        _toFinalizable(id);
        platform.finalize(id);
        receiver.claimRefund(id);

        assertEq(platform.owed(address(receiver)), TICKET, "setup: receiver owed");
        assertEq(platform.owed(organizer), 4 * TICKET, "setup: organizer owed");
        assertEq(platform.owed(bob), 0, "setup: bob has not claimed");
        assertEq(address(platform).balance, 6 * TICKET, "setup: platform balance");
        assertEq(address(receiver).balance, 0, "setup: receiver balance");
    }

    /// The reentrant withdraw is not caught: the whole payment reverts and not
    /// a single wei moves. This proves the outcome, not its cause: a strict
    /// revert hides the inner error, so the catching test below is the one
    /// that proves the reentrancy guard rejects the reentry.
    function test_MaliciousReceiver_Strict_RevertsAndNothingMoves() public {
        (MaliciousReceiver receiver, ) = _receiverOwedRefund(false);

        vm.expectRevert(ICTFPlatform.TransferFailed.selector);
        receiver.withdraw();

        assertEq(address(platform).balance, 6 * TICKET, "platform balance");
        assertEq(address(receiver).balance, 0, "receiver balance");
        assertEq(platform.owed(address(receiver)), TICKET, "receiver owed");
        assertEq(platform.owed(organizer), 4 * TICKET, "organizer owed");
    }

    /// The reentrant withdraw is caught: it is rejected by the reentrancy guard,
    /// the receiver gets exactly its ticket, and everyone else is still paid.
    function test_MaliciousReceiver_Catching_GetsExactlyItsTicket() public {
        (MaliciousReceiver receiver, uint256 id) = _receiverOwedRefund(true);

        receiver.withdraw();

        assertEq(receiver.attempts(), 1, "one reentry attempt");
        assertEq(
            receiver.firstReentryError(),
            abi.encodeWithSelector(ReentrancyGuard.ReentrancyGuardReentrantCall.selector),
            "reentry rejected by the guard"
        );
        assertEq(address(receiver).balance, TICKET, "receiver balance");
        assertEq(address(platform).balance, 5 * TICKET, "platform balance");
        assertEq(platform.owed(address(receiver)), 0, "receiver owed");
        assertEq(platform.owed(organizer), 4 * TICKET, "organizer owed");

        // Bob and the organizer are still paid in full, nothing is left behind.
        vm.prank(bob);
        platform.claimRefund(id);
        assertEq(_withdraw(bob), TICKET, "bob refund");
        assertEq(_withdraw(organizer), 4 * TICKET, "organizer payout");
        assertEq(address(platform).balance, 0, "platform empty");
        assertEq(address(receiver).balance, TICKET, "receiver balance after all");
    }

    // ------------------------------------------------------------------
    // 3. GasBombFactory: validateInstance burns all its gas
    // ------------------------------------------------------------------

    function test_GasBombFactory_SubmitIsNotSolved_PlatformKeepsWorking() public {
        GasBombFactory bomb = new GasBombFactory();
        uint256 id = _createCTFWith(_params(), _two(address(bomb), address(level)));
        _buy(id, alice);
        _buy(id, bob);
        _toRunning(id);

        vm.prank(alice);
        platform.createInstance(id, 0);

        // Explicit budget: without the platform's cap the bomb would eat it all.
        uint256 gasBefore = gasleft();
        vm.prank(alice);
        (bool ok, bytes memory ret) = address(platform).call{gas: 5_000_000}(
            abi.encodeCall(ICTFPlatform.submit, (id, 0))
        );
        uint256 gasUsed = gasBefore - gasleft();

        assertFalse(ok, "submit reverted");
        assertEq(ret, abi.encodeWithSelector(ICTFPlatform.NotSolved.selector), "NotSolved");
        assertLt(gasUsed, platform.VALIDATION_GAS() + 100_000, "validation capped");
        assertFalse(platform.isSolved(id, 0, alice));
        assertEq(platform.getPlayer(id, alice).score, 0);

        // A retry on the bomb level fails the same way, with no corrupted state.
        vm.prank(alice);
        (ok, ret) = address(platform).call{gas: 5_000_000}(abi.encodeCall(ICTFPlatform.submit, (id, 0)));
        assertFalse(ok, "retry reverted");
        assertEq(ret, abi.encodeWithSelector(ICTFPlatform.NotSolved.selector), "retry NotSolved");

        // Another player submits on the other level, and alice is not stuck.
        _solve(id, 1, bob);
        vm.warp(block.timestamp + 1);
        _solve(id, 1, alice);
        address[3] memory podium = platform.getPodium(id);
        assertEq(podium[0], bob);
        assertEq(podium[1], alice);

        // Finalization and withdrawals still work, to the wei.
        _toFinalizable(id);
        platform.finalize(id);
        uint256 pot = CASH_PRIZE + 2 * TICKET;
        uint256 second = (pot * 33) / 100;
        assertEq(_withdraw(bob), pot - second, "bob payout");
        assertEq(_withdraw(alice), second, "alice payout");
        assertEq(_withdraw(organizer), BOND, "organizer bond");
        assertEq(address(platform).balance, 0, "platform empty");
    }
}
