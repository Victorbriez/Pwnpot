// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Test} from "forge-std/Test.sol";

import {VaultAttack} from "../exploits/VaultAttack.sol";
import {Level} from "./Level.sol";
import {Vault, VaultFactory} from "./Vault.sol";

contract VaultTest is Test {
    uint256 constant SEED = 0.0001 ether;
    uint256 constant GAS_LIMIT = 300_000;

    address platform = makeAddr("platform");
    address player = makeAddr("player");
    address other = makeAddr("other");
    VaultFactory factory;

    function setUp() public {
        factory = new VaultFactory(platform, SEED);
        vm.deal(address(this), 1 ether);
        (bool ok, ) = address(factory).call{value: SEED * 10}("");
        require(ok);
    }

    function _create(address who) internal returns (Vault) {
        vm.prank(platform);
        return Vault(payable(factory.createInstance(who)));
    }

    function _exploit(Vault vault, address who) internal {
        uint256 amount = address(vault).balance;
        vm.deal(who, amount);
        vm.startPrank(who);
        VaultAttack attack = new VaultAttack(vault);
        attack.run{value: amount}();
        vm.stopPrank();
    }

    function test_CreateInstance_SeedsTheVault() public {
        Vault vault = _create(player);
        assertEq(address(vault).balance, SEED);
        assertEq(factory.playerOf(address(vault)), player);
        assertEq(address(factory).balance, SEED * 9);
    }

    function test_NotSolvedBeforeExploit() public {
        Vault vault = _create(player);
        assertFalse(factory.validateInstance(address(vault), player));
    }

    function test_Exploit_DrainsTheVault() public {
        Vault vault = _create(player);
        _exploit(vault, player);

        assertEq(address(vault).balance, 0);
        // Le joueur récupère sa mise plus le solde de départ.
        assertEq(player.balance, SEED * 2);
        assertTrue(factory.validateInstance(address(vault), player));
    }

    function testFuzz_Exploit_WorksWithForcedEth(uint96 extra) public {
        Vault vault = _create(player);
        // ETH forcé dans le coffre (selfdestruct, envoi direct) : l'attaque s'adapte.
        vm.deal(address(vault), SEED + uint256(extra));
        _exploit(vault, player);

        assertEq(address(vault).balance, 0);
        assertTrue(factory.validateInstance(address(vault), player));
    }

    function test_HonestWithdrawDoesNotSolve() public {
        Vault vault = _create(player);
        vm.deal(player, 1 ether);
        vm.startPrank(player);
        vault.deposit{value: 0.5 ether}();
        vault.withdraw();
        vm.stopPrank();

        assertEq(address(vault).balance, SEED);
        assertFalse(factory.validateInstance(address(vault), player));
    }

    function test_OtherPlayersInstanceDoesNotCount() public {
        Vault vault = _create(player);
        _exploit(vault, other);

        assertTrue(factory.validateInstance(address(vault), player));
        assertFalse(factory.validateInstance(address(vault), other));
    }

    function test_UnknownInstanceDoesNotCount() public {
        // Une adresse vide a un solde nul, mais n'a jamais été créée par la factory.
        assertFalse(factory.validateInstance(makeAddr("empty"), player));
    }

    function test_RevertWhen_CallerIsNotPlatform() public {
        vm.expectRevert(Level.OnlyPlatform.selector);
        factory.createInstance(player);
    }

    function test_RevertWhen_PlayerIsZero() public {
        vm.prank(platform);
        vm.expectRevert(Level.ZeroAddress.selector);
        factory.createInstance(address(0));
    }

    function test_RevertWhen_FactoryIsNotFunded() public {
        VaultFactory empty = new VaultFactory(platform, SEED);
        vm.prank(platform);
        vm.expectRevert(abi.encodeWithSelector(VaultFactory.InsufficientFunds.selector, 0, SEED));
        empty.createInstance(player);
    }

    function test_RevertWhen_SeedIsZero() public {
        vm.expectRevert(VaultFactory.ZeroSeed.selector);
        new VaultFactory(platform, 0);
    }

    function test_RevertWhen_AttackSendsWrongAmount() public {
        Vault vault = _create(player);
        vm.deal(player, 1 ether);
        vm.startPrank(player);
        VaultAttack attack = new VaultAttack(vault);
        vm.expectRevert(abi.encodeWithSelector(VaultAttack.WrongAmount.selector, 1, SEED));
        attack.run{value: 1}();
        vm.stopPrank();
    }

    function test_ValidateInstance_StaysUnderGasLimit() public {
        Vault vault = _create(player);
        uint256 before = gasleft();
        factory.validateInstance(address(vault), player);
        assertLt(before - gasleft(), GAS_LIMIT);
    }
}
