// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Test} from "forge-std/Test.sol";

import {CodeSafe, CodeSafeFactory} from "./CodeSafe.sol";
import {Level} from "./Level.sol";

contract CodeSafeTest is Test {
    uint256 constant GAS_LIMIT = 300_000;
    bytes32 constant PASSWORD_SLOT = bytes32(uint256(1));

    address platform = makeAddr("platform");
    address player = makeAddr("player");
    address other = makeAddr("other");
    CodeSafeFactory factory;

    function setUp() public {
        factory = new CodeSafeFactory(platform);
    }

    function _create(address who) internal returns (CodeSafe) {
        vm.prank(platform);
        return CodeSafe(factory.createInstance(who));
    }

    function _password(CodeSafe safe) internal view returns (bytes32) {
        return vm.load(address(safe), PASSWORD_SLOT);
    }

    function test_CreateInstance_StartsLocked() public {
        CodeSafe safe = _create(player);
        assertTrue(safe.locked());
        assertEq(factory.playerOf(address(safe)), player);
        assertFalse(factory.validateInstance(address(safe), player));
    }

    function test_StorageLayout_PasswordInSlotOne() public {
        CodeSafe safe = _create(player);
        // Slot 0 : `locked`, slot 1 : `password`, comme l'annonce l'énoncé.
        assertEq(vm.load(address(safe), bytes32(0)), bytes32(uint256(1)));
        assertNotEq(_password(safe), bytes32(0));
    }

    function test_Exploit_UnlocksWithPasswordReadFromStorage() public {
        CodeSafe safe = _create(player);
        vm.prank(player);
        safe.unlock(_password(safe));

        assertFalse(safe.locked());
        assertTrue(factory.validateInstance(address(safe), player));
    }

    function testFuzz_WrongPasswordStaysLocked(bytes32 attempt) public {
        CodeSafe safe = _create(player);
        vm.assume(attempt != _password(safe));
        vm.prank(player);
        safe.unlock(attempt);

        assertTrue(safe.locked());
        assertFalse(factory.validateInstance(address(safe), player));
    }

    function test_PasswordsDifferPerInstance() public {
        CodeSafe first = _create(player);
        CodeSafe second = _create(player);
        CodeSafe theirs = _create(other);

        assertNotEq(_password(first), _password(second));
        assertNotEq(_password(first), _password(theirs));
    }

    function test_CopiedPasswordDoesNotUnlock() public {
        CodeSafe mine = _create(player);
        CodeSafe theirs = _create(other);
        vm.prank(player);
        mine.unlock(_password(theirs));

        assertTrue(mine.locked());
    }

    function test_OtherPlayersInstanceDoesNotCount() public {
        CodeSafe theirs = _create(other);
        vm.prank(player);
        theirs.unlock(_password(theirs));

        assertTrue(factory.validateInstance(address(theirs), other));
        assertFalse(factory.validateInstance(address(theirs), player));
    }

    function test_RevertWhen_CallerIsNotPlatform() public {
        vm.expectRevert(Level.OnlyPlatform.selector);
        factory.createInstance(player);
    }

    function test_ValidateInstance_StaysUnderGasLimit() public {
        CodeSafe safe = _create(player);
        uint256 before = gasleft();
        factory.validateInstance(address(safe), player);
        assertLt(before - gasleft(), GAS_LIMIT);
    }
}
