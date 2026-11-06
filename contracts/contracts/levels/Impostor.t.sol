// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Test} from "forge-std/Test.sol";

import {ImpostorAttack} from "../exploits/ImpostorAttack.sol";
import {Impostor, ImpostorFactory} from "./Impostor.sol";

contract ImpostorTest is Test {
    uint256 constant GAS_LIMIT = 300_000;

    address platform = makeAddr("platform");
    address player = makeAddr("player");
    address rival = makeAddr("rival");
    ImpostorFactory factory;

    function setUp() public {
        factory = new ImpostorFactory(platform);
    }

    function _create(address who) internal returns (Impostor) {
        vm.prank(platform);
        return Impostor(factory.createInstance(who));
    }

    /// Plays the exploit from `who`'s wallet: `tx.origin` and `msg.sender` are both `who`.
    function _exploit(Impostor instance, address who) internal {
        vm.startPrank(who, who);
        ImpostorAttack attack = new ImpostorAttack();
        attack.run(instance);
        vm.stopPrank();
    }

    function test_CreateInstance_FactoryIsInitialOwner() public {
        Impostor instance = _create(player);
        assertEq(instance.owner(), address(factory));
        assertEq(instance.player(), player);
        assertTrue(factory.isInstance(address(instance)));
        assertFalse(factory.validateInstance(address(instance), player));
    }

    function test_DirectCallFromWalletChangesNothing() public {
        Impostor instance = _create(player);
        vm.prank(player, player);
        instance.changeOwner(player);

        assertEq(instance.owner(), address(factory));
        assertFalse(factory.validateInstance(address(instance), player));
    }

    function test_Exploit_TakesOwnershipThroughContract() public {
        Impostor instance = _create(player);
        _exploit(instance, player);

        assertEq(instance.owner(), player);
        assertTrue(factory.validateInstance(address(instance), player));
    }

    function test_RivalCannotTakeInstanceBeforeExploit() public {
        Impostor instance = _create(player);
        _exploit(instance, rival);

        assertEq(instance.owner(), address(factory));
        assertFalse(factory.validateInstance(address(instance), rival));
    }

    function test_RivalCannotTakeInstanceAfterExploit() public {
        Impostor instance = _create(player);
        _exploit(instance, player);
        _exploit(instance, rival);

        // The player's solve survives the rival's attempt.
        assertEq(instance.owner(), player);
        assertTrue(factory.validateInstance(address(instance), player));
        assertFalse(factory.validateInstance(address(instance), rival));
    }

    function test_OtherPlayersInstanceDoesNotCount() public {
        Impostor theirs = _create(rival);
        _exploit(theirs, rival);

        assertTrue(factory.validateInstance(address(theirs), rival));
        assertFalse(factory.validateInstance(address(theirs), player));
    }

    function test_InstanceOwnedByPlayerButCreatedForRivalDoesNotCount() public {
        // The rival solves their instance and hands its ownership to `player`.
        Impostor theirs = _create(rival);
        vm.startPrank(rival, rival);
        new ImpostorAttack().run(theirs);
        theirs.changeOwner(player); // direct call: ignored
        vm.stopPrank();
        assertEq(theirs.owner(), rival);

        // Even if the owner were `player`, the instance is bound to `rival`.
        vm.store(address(theirs), bytes32(0), bytes32(uint256(uint160(player))));
        assertEq(theirs.owner(), player);
        assertFalse(factory.validateInstance(address(theirs), player));
    }

    function test_UnknownInstanceDoesNotCount() public {
        Impostor foreign = new Impostor(address(this), player);
        _exploit(foreign, player);

        assertEq(foreign.owner(), player);
        assertFalse(factory.validateInstance(address(foreign), player));
    }

    function test_ZeroPlayerNeverValidates() public {
        Impostor instance = _create(player);
        assertFalse(factory.validateInstance(address(instance), address(0)));
    }

    function test_RevertWhen_CallerIsNotPlatform() public {
        vm.expectRevert(ImpostorFactory.OnlyPlatform.selector);
        factory.createInstance(player);

        vm.prank(player);
        vm.expectRevert(ImpostorFactory.OnlyPlatform.selector);
        factory.createInstance(player);
    }

    function test_RevertWhen_PlayerIsZero() public {
        vm.prank(platform);
        vm.expectRevert(ImpostorFactory.ZeroAddress.selector);
        factory.createInstance(address(0));
    }

    function test_RevertWhen_PlatformIsZero() public {
        vm.expectRevert(ImpostorFactory.ZeroAddress.selector);
        new ImpostorFactory(address(0));
    }

    function test_ValidateInstance_StaysUnderGasLimit() public {
        Impostor instance = _create(player);
        _exploit(instance, player);

        uint256 before = gasleft();
        factory.validateInstance(address(instance), player);
        assertLt(before - gasleft(), GAS_LIMIT);
    }
}
