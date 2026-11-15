// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.34;

import {CTFPlatformBase} from "./CTFPlatformBase.t.sol";
import {DryFactory, DryInstance} from "./attacks/DryFactory.sol";
import {MalformedReturnFactory} from "./attacks/MalformedReturnFactory.sol";
import {RevertingFactory} from "./attacks/RevertingFactory.sol";
import {StateWritingFactory} from "./attacks/StateWritingFactory.sol";
import {ICTFPlatform} from "./interfaces/ICTFPlatform.sol";

/// Hostile organizer factories not covered by the attack tests of #8 (issue #20,
/// docs/SECURITY.md § Factory malveillante): a factory that always reverts, one
/// that returns malformed data, one that runs out of ETH, and one that tries to
/// write during `validateInstance`.
///
/// Each test checks that only the hostile level is affected: afterwards another
/// player still submits on a sound level, and `finalize` and `withdraw` pay
/// everyone to the wei, leaving the platform empty.
contract CTFPlatformFactoriesTest is CTFPlatformBase {
    address internal alice;
    address internal bob;

    function setUp() public override {
        super.setUp();
        alice = _newPlayer("alice");
        bob = _newPlayer("bob");
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /// CTF whose levels are `hostile` followed by the sound TestLevel; alice and
    /// bob hold a ticket and the CTF is running.
    function _ctfWith(address[] memory hostile) internal returns (uint256 id, uint256 soundLevel) {
        address[] memory factories = new address[](hostile.length + 1);
        for (uint256 i = 0; i < hostile.length; ++i) {
            factories[i] = hostile[i];
        }
        soundLevel = hostile.length;
        factories[soundLevel] = address(level);

        ICTFPlatform.CTFParams memory p = _params();
        vm.prank(organizer);
        id = platform.createCTF{value: p.cashPrize + p.organizerBond}(p, factories);
        _buy(id, alice);
        _buy(id, bob);
        _toRunning(id);
    }

    function _ctfWith(address hostile) internal returns (uint256 id, uint256 soundLevel) {
        address[] memory list = new address[](1);
        list[0] = hostile;
        return _ctfWith(list);
    }

    function _expectSubmitNotSolved(uint256 id, uint256 levelIndex, address player) internal {
        vm.expectRevert(ICTFPlatform.NotSolved.selector);
        vm.prank(player);
        platform.submit(id, levelIndex);
        assertFalse(platform.isSolved(id, levelIndex, player), "not solved");
    }

    /// Bob, then alice, solve the sound level: the hostile level did not block
    /// another player, nor the attacked player on the rest of the CTF.
    function _bothSolveSound(uint256 id, uint256 soundLevel) internal {
        _solve(id, soundLevel, bob);
        vm.warp(block.timestamp + 1);
        _solve(id, soundLevel, alice);
        assertEq(platform.getPlayer(id, bob).score, 1, "bob score");
        assertEq(platform.getPlayer(id, alice).score, 1, "alice score");
    }

    /// Finalizes a CTF won by `first` then `second` and withdraws everything.
    function _finalizeAndWithdrawAll(uint256 id, address first, address second) internal {
        address[3] memory podium = platform.getPodium(id);
        assertEq(podium[0], first, "1st");
        assertEq(podium[1], second, "2nd");
        assertEq(podium[2], address(0), "no 3rd");

        _toFinalizable(id);
        platform.finalize(id);

        uint256 pot = CASH_PRIZE + 2 * TICKET;
        uint256 secondShare = (pot * 33) / 100;
        assertEq(_withdraw(first), pot - secondShare, "1st payout");
        assertEq(_withdraw(second), secondShare, "2nd payout");
        assertEq(_withdraw(organizer), BOND, "organizer bond");
        assertEq(address(platform).balance, 0, "platform empty");
    }

    // ------------------------------------------------------------------
    // 1. Factory that always reverts
    // ------------------------------------------------------------------

    /// `createInstance` reverts: nobody can play this level, the rest goes on.
    function test_RevertingFactory_OnCreate_OnlyItsLevelIsBlocked() public {
        RevertingFactory broken = new RevertingFactory(true);
        (uint256 id, uint256 sound) = _ctfWith(address(broken));

        vm.expectRevert(RevertingFactory.Broken.selector);
        vm.prank(alice);
        platform.createInstance(id, 0);
        assertEq(platform.instanceOf(id, 0, alice), address(0), "no instance");

        // Nothing to submit on the blocked level, and a retry fails the same way.
        vm.expectRevert(ICTFPlatform.NoInstance.selector);
        vm.prank(alice);
        platform.submit(id, 0);
        vm.expectRevert(RevertingFactory.Broken.selector);
        vm.prank(bob);
        platform.createInstance(id, 0);

        _bothSolveSound(id, sound);
        _finalizeAndWithdrawAll(id, bob, alice);
    }

    /// `validateInstance` reverts: the level is "not solved", the rest goes on.
    function test_RevertingFactory_OnValidate_IsNotSolved() public {
        RevertingFactory broken = new RevertingFactory(false);
        (uint256 id, uint256 sound) = _ctfWith(address(broken));

        vm.prank(alice);
        platform.createInstance(id, 0);
        _expectSubmitNotSolved(id, 0, alice);
        _expectSubmitNotSolved(id, 0, alice);
        assertEq(platform.getPlayer(id, alice).score, 0, "alice score");

        _bothSolveSound(id, sound);
        _finalizeAndWithdrawAll(id, bob, alice);
    }

    // ------------------------------------------------------------------
    // 2. Factory that returns malformed data
    // ------------------------------------------------------------------

    function _malformedPayloads() internal pure returns (bytes[] memory payloads) {
        payloads = new bytes[](6);
        payloads[0] = ""; // empty
        payloads[1] = hex"01"; // too short
        payloads[2] = _slice(abi.encode(true), 31); // 31 bytes, `true` truncated
        payloads[3] = abi.encode(uint256(2)); // 2 instead of true
        payloads[4] = abi.encode(type(uint256).max); // dirty word
        payloads[5] = abi.encode(true, uint256(0)); // too long, starts with true
    }

    function _slice(bytes memory data, uint256 length) internal pure returns (bytes memory out) {
        out = new bytes(length);
        for (uint256 i = 0; i < length; ++i) {
            out[i] = data[i];
        }
    }

    /// Every malformed answer counts as "not solved", level by level.
    function test_MalformedReturnFactory_IsNotSolved() public {
        bytes[] memory payloads = _malformedPayloads();
        address[] memory hostile = new address[](payloads.length);
        for (uint256 i = 0; i < payloads.length; ++i) {
            hostile[i] = address(new MalformedReturnFactory(payloads[i]));
        }
        (uint256 id, uint256 sound) = _ctfWith(hostile);

        for (uint256 i = 0; i < payloads.length; ++i) {
            vm.prank(alice);
            platform.createInstance(id, i);
            _expectSubmitNotSolved(id, i, alice);
        }
        assertEq(platform.getPlayer(id, alice).score, 0, "alice score");

        _bothSolveSound(id, sound);
        _finalizeAndWithdrawAll(id, bob, alice);
    }

    /// Control: the same factory answering a well-formed `true` is solved, so
    /// only the format of the answer made the test above fail.
    function test_MalformedReturnFactory_Control_EncodedTrueIsSolved() public {
        MalformedReturnFactory honest = new MalformedReturnFactory(abi.encode(true));
        (uint256 id, ) = _ctfWith(address(honest));

        vm.prank(alice);
        platform.createInstance(id, 0);
        vm.prank(alice);
        platform.submit(id, 0);
        assertTrue(platform.isSolved(id, 0, alice));
    }

    // ------------------------------------------------------------------
    // 3. Funded factory that runs dry
    // ------------------------------------------------------------------

    /// The organizer funded a single instance: the second `createInstance`
    /// reverts cleanly, records nothing, and nobody else is blocked.
    function test_DryFactory_CreateInstanceRevertsCleanly() public {
        DryFactory dry = new DryFactory();
        uint256 seed = dry.SEED();
        vm.prank(organizer);
        (bool funded, ) = address(dry).call{value: seed}("");
        assertTrue(funded, "setup: factory funded");
        (uint256 id, uint256 sound) = _ctfWith(address(dry));

        // Alice gets the only funded instance.
        vm.prank(alice);
        DryInstance aliceInst = DryInstance(platform.createInstance(id, 0));
        assertEq(address(aliceInst).balance, seed, "alice instance funded");

        // Bob hits the empty factory: clean revert with the factory's error.
        vm.expectRevert(abi.encodeWithSelector(DryFactory.InsufficientFunds.selector, 0, seed));
        vm.prank(bob);
        platform.createInstance(id, 0);
        assertEq(platform.instanceOf(id, 0, bob), address(0), "no instance for bob");
        vm.expectRevert(ICTFPlatform.NoInstance.selector);
        vm.prank(bob);
        platform.submit(id, 0);

        // Bob still plays the sound level, alice still scores on the dry one.
        _solve(id, sound, bob);
        vm.warp(block.timestamp + 1);
        vm.prank(alice);
        aliceInst.solve();
        vm.prank(alice);
        platform.submit(id, 0);

        // Once refilled, the same level works again for bob: no stuck state.
        vm.prank(organizer);
        (funded, ) = address(dry).call{value: seed}("");
        assertTrue(funded, "factory refilled");
        vm.warp(block.timestamp + 1);
        _solve(id, 0, bob);
        assertEq(platform.getPlayer(id, bob).score, 2, "bob score");

        _finalizeAndWithdrawAll(id, bob, alice);
    }

    // ------------------------------------------------------------------
    // 4. Factory that writes during validateInstance
    // ------------------------------------------------------------------

    /// Writing storage, emitting a log or sending ETH is forbidden inside the
    /// platform's `staticcall`: the validation fails and counts as "not solved".
    function test_StateWritingFactory_StaticcallFails_IsNotSolved() public {
        StateWritingFactory toStorage = new StateWritingFactory(StateWritingFactory.Write.Storage);
        StateWritingFactory toLog = new StateWritingFactory(StateWritingFactory.Write.Log);
        StateWritingFactory toValue = new StateWritingFactory{value: 1 ether}(StateWritingFactory.Write.Value);
        address[] memory hostile = new address[](3);
        hostile[0] = address(toStorage);
        hostile[1] = address(toLog);
        hostile[2] = address(toValue);
        (uint256 id, uint256 sound) = _ctfWith(hostile);

        uint256 aliceBalance = alice.balance;
        for (uint256 i = 0; i < hostile.length; ++i) {
            vm.prank(alice);
            platform.createInstance(id, i);
            _expectSubmitNotSolved(id, i, alice);
        }
        assertEq(platform.getPlayer(id, alice).score, 0, "alice score");
        assertEq(toStorage.validations(), 0, "no write went through");
        assertEq(alice.balance, aliceBalance, "no ETH sent");

        // Control: called normally, the storage-writing factory answers `true`,
        // so only the staticcall stopped it above.
        address inst = platform.instanceOf(id, 0, alice);
        assertTrue(toStorage.validateInstance(inst, alice), "true outside staticcall");
        assertEq(toStorage.validations(), 1);

        _bothSolveSound(id, sound);
        _finalizeAndWithdrawAll(id, bob, alice);
    }
}
