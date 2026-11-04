// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Test} from "forge-std/Test.sol";

import {ImpostorAttack} from "../exploits/ImpostorAttack.sol";
import {Impostor, ImpostorFactory} from "./Impostor.sol";
import {Level} from "./Level.sol";

contract ImpostorTest is Test {
    uint256 constant GAS_LIMIT = 300_000;

    address platform = makeAddr("platform");
    address player = makeAddr("player");
    address other = makeAddr("other");
    ImpostorFactory factory;

    function setUp() public {
        factory = new ImpostorFactory(platform);
    }

    function _create(address who) internal returns (Impostor) {
        vm.prank(platform);
        return Impostor(factory.createInstance(who));
    }

    /// Joue l'exploit depuis le wallet de `who` : `tx.origin` et `msg.sender` valent `who`.
    function _exploit(Impostor instance, address who) internal {
        vm.startPrank(who, who);
        ImpostorAttack attack = new ImpostorAttack();
        attack.run(instance);
        vm.stopPrank();
    }

    function test_CreateInstance_FactoryIsInitialOwner() public {
        Impostor instance = _create(player);
        assertEq(instance.owner(), address(factory));
        assertEq(factory.playerOf(address(instance)), player);
        assertFalse(factory.validateInstance(address(instance), player));
    }

    function test_DirectCallFromWalletFails() public {
        Impostor instance = _create(player);
        vm.prank(player, player);
        instance.changeOwner(player);

        assertEq(instance.owner(), address(factory));
        assertFalse(factory.validateInstance(address(instance), player));
    }

    function test_Exploit_TakesOwnership() public {
        Impostor instance = _create(player);
        _exploit(instance, player);

        assertEq(instance.owner(), player);
        assertTrue(factory.validateInstance(address(instance), player));
    }

    function test_OwnershipOfAnotherInstanceDoesNotCount() public {
        Impostor instance = _create(player);
        // `other` s'empare de l'instance de `player` : ça ne valide rien pour personne.
        _exploit(instance, other);

        assertEq(instance.owner(), other);
        assertFalse(factory.validateInstance(address(instance), player));
        assertFalse(factory.validateInstance(address(instance), other));
    }

    function test_RevertWhen_CallerIsNotPlatform() public {
        vm.expectRevert(Level.OnlyPlatform.selector);
        factory.createInstance(player);
    }

    function test_RevertWhen_PlatformIsZero() public {
        vm.expectRevert(Level.ZeroAddress.selector);
        new ImpostorFactory(address(0));
    }

    function test_ValidateInstance_StaysUnderGasLimit() public {
        Impostor instance = _create(player);
        uint256 before = gasleft();
        factory.validateInstance(address(instance), player);
        assertLt(before - gasleft(), GAS_LIMIT);
    }
}
