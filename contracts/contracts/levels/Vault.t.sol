// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Test} from "forge-std/Test.sol";

import {CTFPlatform} from "../CTFPlatform.sol";
import {ICTFPlatform} from "../interfaces/ICTFPlatform.sol";
import {TestLevel} from "../mocks/TestLevel.sol";
import {VaultAttack} from "../exploits/VaultAttack.sol";
import {Vault, VaultFactory} from "./Vault.sol";

/// Test only: lets a test register any instance, to reach the `initialBalance` check.
contract VaultFactoryHarness is VaultFactory {
    constructor(address platform_) payable VaultFactory(platform_) {}

    function register(address instance, address player) external {
        playerOf[instance] = player;
    }
}

contract VaultTest is Test {
    uint256 constant GAS_LIMIT = 300_000;
    uint256 constant MAX_PLAYERS = 20;
    uint256 constant TICKET = 0.01 ether;
    uint256 constant CASH_PRIZE = 1 ether;
    uint256 constant START_DELAY = 1 hours;
    uint256 constant DURATION = 1 days;

    CTFPlatform platform;
    VaultFactory factory;
    uint256 seed;
    uint256 ctfId;
    uint256 endTime;

    address organizer = makeAddr("organizer");
    address player = makeAddr("player");
    address other = makeAddr("other");
    address stranger = makeAddr("stranger");

    function setUp() public {
        vm.warp(1_000_000);
        platform = new CTFPlatform(makeAddr("arbitrator"), 48 hours, 48 hours, 24 hours, 7 days);
        vm.deal(organizer, 100 ether);
        vm.deal(player, 10 ether);
        vm.deal(other, 10 ether);
        vm.deal(stranger, 10 ether);

        seed = new VaultFactory(address(platform)).SEED();
        factory = _deployFactory(MAX_PLAYERS * seed);
        ctfId = _createCTF(organizer, address(factory));
        vm.prank(organizer);
        factory.bind(ctfId);

        _buy(ctfId, player);
        _buy(ctfId, other);
        vm.warp(block.timestamp + START_DELAY);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    function _deployFactory(uint256 funding) internal returns (VaultFactory) {
        vm.prank(organizer);
        return new VaultFactory{value: funding}(address(platform));
    }

    function _createCTF(address by, address level) internal returns (uint256) {
        address[] memory factories = new address[](1);
        factories[0] = level;
        return _createCTF(by, factories);
    }

    function _createCTF(address by, address[] memory factories) internal returns (uint256) {
        uint256 bond = CASH_PRIZE + MAX_PLAYERS * TICKET;
        endTime = block.timestamp + START_DELAY + DURATION;
        vm.deal(by, by.balance + CASH_PRIZE + bond);
        vm.prank(by);
        return
            platform.createCTF{value: CASH_PRIZE + bond}(
                ICTFPlatform.CTFParams({
                    title: "Vault",
                    startTime: block.timestamp + START_DELAY,
                    endTime: endTime,
                    ticketPrice: TICKET,
                    maxPlayers: MAX_PLAYERS,
                    cashPrize: CASH_PRIZE,
                    organizerBond: bond
                }),
                factories
            );
    }

    function _buy(uint256 id, address who) internal {
        vm.prank(who);
        platform.buyTicket{value: TICKET}(id);
    }

    function _mockPhase(ICTFPlatform.Phase phase) internal {
        vm.mockCall(
            address(platform),
            abi.encodeWithSelector(ICTFPlatform.phaseOf.selector, ctfId),
            abi.encode(phase)
        );
    }

    function _create(address who) internal returns (Vault) {
        vm.prank(who);
        return Vault(platform.createInstance(ctfId, 0));
    }

    function _attack(Vault vault, address who, uint256 deposit) internal {
        vm.startPrank(who);
        VaultAttack attack = new VaultAttack(vault);
        attack.run{value: deposit}();
        vm.stopPrank();
    }

    // ---------------------------------------------------------------------
    // Instances and validation
    // ---------------------------------------------------------------------

    function test_CreateInstance_StartsWithSeed() public {
        Vault vault = _create(player);
        assertEq(address(vault).balance, seed);
        assertEq(vault.initialBalance(), seed);
        assertEq(factory.playerOf(address(vault)), player);
        assertEq(factory.instanceOf(player), address(vault));
        assertEq(address(factory).balance, (MAX_PLAYERS - 1) * seed);
        assertFalse(factory.validateInstance(address(vault), player));
    }

    function test_Exploit_DrainsVaultAndValidates() public {
        Vault vault = _create(player);
        uint256 before = player.balance;

        // Sends a margin above the vault balance: the excess comes back.
        _attack(vault, player, 2 * seed);

        assertEq(address(vault).balance, 0);
        assertTrue(vault.drained());
        assertEq(player.balance, before + seed); // the player keeps the loot
        assertTrue(factory.validateInstance(address(vault), player));

        vm.prank(player);
        platform.submit(ctfId, 0);
        assertTrue(platform.isSolved(ctfId, 0, player));
    }

    function test_HonestWithdrawDoesNotDrain() public {
        Vault vault = _create(player);
        vm.startPrank(player);
        vault.deposit{value: 1 ether}();
        vault.withdraw();
        vm.stopPrank();

        assertEq(address(vault).balance, seed);
        assertFalse(factory.validateInstance(address(vault), player));
    }

    function test_NeverFundedVault_IsNeverSolved() public {
        VaultFactoryHarness harness = new VaultFactoryHarness(address(platform));
        Vault empty = new Vault();
        harness.register(address(empty), player);
        // Withdrawing nothing from an empty vault sets `drained`: only the
        // `initialBalance` check keeps it unsolved.
        vm.prank(player);
        empty.withdraw();

        assertEq(empty.initialBalance(), 0);
        assertTrue(empty.drained());
        assertFalse(harness.validateInstance(address(empty), player));
    }

    function test_ForceSentWei_DoesNotUnsolveDrainedVault() public {
        Vault vault = _create(player);
        _attack(vault, player, seed);
        assertTrue(vault.drained());
        assertTrue(factory.validateInstance(address(vault), player));

        // Stands for a `selfdestruct` that force-sends wei to the drained vault.
        vm.deal(address(vault), 1);
        assertTrue(vault.drained());
        assertTrue(factory.validateInstance(address(vault), player));

        vm.prank(player);
        platform.submit(ctfId, 0);
        assertTrue(platform.isSolved(ctfId, 0, player));
    }

    function test_ForceSentWeiBeforeFirstDrain_ExploitStillWorks() public {
        Vault vault = _create(player);
        // A rival front-runs the exploit with 1 wei (selfdestruct in practice).
        vm.deal(address(vault), seed + 1);
        uint256 before = player.balance;

        _attack(vault, player, 2 * seed);

        assertEq(address(vault).balance, 0);
        assertEq(player.balance, before + seed + 1);
        assertTrue(factory.validateInstance(address(vault), player));
        vm.prank(player);
        platform.submit(ctfId, 0);
        assertTrue(platform.isSolved(ctfId, 0, player));
    }

    function test_Drained_StaysTrueAfterLaterWithdraws() public {
        Vault vault = _create(player);
        _attack(vault, player, seed);
        vm.deal(address(vault), 1);

        // A later honest round trip leaves the vault non-empty: the flag stays.
        vm.startPrank(other);
        vault.deposit{value: 1 ether}();
        vault.withdraw();
        vm.stopPrank();

        assertEq(address(vault).balance, 1);
        assertTrue(vault.drained());
        assertTrue(factory.validateInstance(address(vault), player));
    }

    function test_FreshVault_IsNotDrained() public {
        Vault vault = _create(player);
        vm.startPrank(player);
        vault.deposit{value: 1 ether}();
        vault.withdraw();
        vm.stopPrank();
        assertFalse(vault.drained());
    }

    function test_OtherPlayersInstanceDoesNotCount() public {
        Vault theirs = _create(other);
        _attack(theirs, player, seed);

        assertTrue(factory.validateInstance(address(theirs), other));
        assertFalse(factory.validateInstance(address(theirs), player));
    }

    function test_UnknownInstanceDoesNotCount() public {
        Vault foreign = new Vault{value: seed}();
        _attack(foreign, player, seed);

        assertEq(address(foreign).balance, 0);
        assertFalse(factory.validateInstance(address(foreign), player));
        assertFalse(factory.validateInstance(address(foreign), address(0)));
    }

    function test_ValidateInstance_StaysUnderGasLimit() public {
        Vault vault = _create(player);
        _attack(vault, player, seed);

        uint256 before = gasleft();
        factory.validateInstance(address(vault), player);
        assertLt(before - gasleft(), GAS_LIMIT);
    }

    // ---------------------------------------------------------------------
    // createInstance guards
    // ---------------------------------------------------------------------

    function test_RevertWhen_CallerIsNotPlatform() public {
        vm.expectRevert(VaultFactory.OnlyPlatform.selector);
        factory.createInstance(player);
    }

    function test_RevertWhen_PlayerIsZero() public {
        vm.prank(address(platform));
        vm.expectRevert(VaultFactory.ZeroAddress.selector);
        factory.createInstance(address(0));
    }

    function test_RevertWhen_PlatformIsZero() public {
        vm.expectRevert(VaultFactory.ZeroAddress.selector);
        new VaultFactory(address(0));
    }

    function test_RevertWhen_FactoryIsDry() public {
        // `bind` checks the funding and `recover` is locked during the CTF, so
        // the factory cannot run dry normally: empty it by hand.
        vm.deal(address(factory), 0);

        vm.prank(player);
        vm.expectRevert(abi.encodeWithSelector(VaultFactory.InsufficientFunds.selector, 0, seed));
        platform.createInstance(ctfId, 0);
    }

    function test_RevertWhen_NotBound() public {
        VaultFactory unbound = _deployFactory(MAX_PLAYERS * seed);
        uint256 id = _createCTF(organizer, address(unbound));
        _buy(id, player);
        vm.warp(block.timestamp + START_DELAY);

        vm.prank(player);
        vm.expectRevert(VaultFactory.NotBound.selector);
        platform.createInstance(id, 0);
    }

    function test_RevertWhen_UsedByAnotherCTF_ForNonPlayer() public {
        // A stranger lists this factory in their own CTF: their players get nothing.
        uint256 foreignId = _createCTF(stranger, address(factory));
        address sybil = makeAddr("sybil");
        vm.deal(sybil, 1 ether);
        _buy(foreignId, sybil);
        vm.warp(block.timestamp + START_DELAY);

        vm.prank(sybil);
        vm.expectRevert(abi.encodeWithSelector(VaultFactory.NotAPlayer.selector, sybil));
        platform.createInstance(foreignId, 0);
    }

    function test_RevertWhen_SecondInstanceThroughAnotherCTF() public {
        _create(player);
        uint256 foreignId = _createCTF(stranger, address(factory));
        _buy(foreignId, player);
        vm.warp(block.timestamp + START_DELAY);

        vm.prank(player);
        vm.expectRevert(abi.encodeWithSelector(VaultFactory.AlreadyHasInstance.selector, player));
        platform.createInstance(foreignId, 0);
    }

    function test_RevertWhen_BoundCTFNotRunning() public {
        // Another CTF still running while the bound one has ended.
        uint256 foreignId = _createCTF(stranger, address(factory));
        _buy(foreignId, player);
        vm.warp(platform.getCTF(ctfId).endTime);
        assertEq(uint8(platform.phaseOf(foreignId)), uint8(ICTFPlatform.Phase.Running));

        vm.prank(player);
        vm.expectRevert(VaultFactory.CTFNotRunning.selector);
        platform.createInstance(foreignId, 0);
    }

    // ---------------------------------------------------------------------
    // bind
    // ---------------------------------------------------------------------

    function test_Bind_SetsCTF() public view {
        assertTrue(factory.bound());
        assertEq(factory.ctfId(), ctfId);
        assertEq(factory.organizer(), organizer);
    }

    function test_RevertWhen_BindTwice() public {
        vm.prank(organizer);
        vm.expectRevert(VaultFactory.AlreadyBound.selector);
        factory.bind(ctfId);
    }

    function test_RevertWhen_BindByNonOrganizer() public {
        VaultFactory fresh = _deployFactory(0);
        uint256 id = _createCTF(organizer, address(fresh));
        vm.prank(stranger);
        vm.expectRevert(VaultFactory.NotOrganizer.selector);
        fresh.bind(id);
    }

    function test_RevertWhen_BindToCTFOfAnotherOrganizer() public {
        VaultFactory fresh = _deployFactory(0);
        uint256 id = _createCTF(stranger, address(fresh));
        vm.prank(organizer);
        vm.expectRevert(abi.encodeWithSelector(VaultFactory.InvalidCTF.selector, id));
        fresh.bind(id);
    }

    function test_RevertWhen_BindToCTFWithoutThisFactory() public {
        VaultFactory fresh = _deployFactory(0);
        uint256 id = _createCTF(organizer, address(new TestLevel()));
        vm.prank(organizer);
        vm.expectRevert(abi.encodeWithSelector(VaultFactory.InvalidCTF.selector, id));
        fresh.bind(id);
    }

    function test_RevertWhen_BindUnderfunded() public {
        VaultFactory fresh = _deployFactory(MAX_PLAYERS * seed - 1);
        uint256 id = _createCTF(organizer, address(fresh));
        vm.prank(organizer);
        vm.expectRevert(
            abi.encodeWithSelector(VaultFactory.InsufficientFunds.selector, MAX_PLAYERS * seed - 1, MAX_PLAYERS * seed)
        );
        fresh.bind(id);
    }

    function test_RevertWhen_BindToCTFListingFactoryTwice() public {
        VaultFactory fresh = _deployFactory(MAX_PLAYERS * seed);
        address[] memory factories = new address[](2);
        factories[0] = address(fresh);
        factories[1] = address(fresh);
        uint256 id = _createCTF(organizer, factories);
        vm.prank(organizer);
        vm.expectRevert(abi.encodeWithSelector(VaultFactory.InvalidCTF.selector, id));
        fresh.bind(id);
    }

    function test_RevertWhen_BindToUnknownCTF() public {
        VaultFactory fresh = _deployFactory(0);
        vm.prank(organizer);
        vm.expectRevert(abi.encodeWithSelector(VaultFactory.InvalidCTF.selector, 99));
        fresh.bind(99);
    }

    // ---------------------------------------------------------------------
    // recover
    // ---------------------------------------------------------------------

    function test_Recover_InContestation_PaysOrganizer() public {
        _create(player);
        vm.warp(endTime);
        assertEq(uint8(platform.phaseOf(ctfId)), uint8(ICTFPlatform.Phase.Contestation));
        uint256 remaining = address(factory).balance;
        uint256 before = organizer.balance;
        assertEq(remaining, (MAX_PLAYERS - 1) * seed);

        vm.prank(organizer);
        factory.recover();

        assertEq(organizer.balance, before + remaining);
        assertEq(address(factory).balance, 0);
    }

    function test_Recover_WhenFinalized() public {
        vm.warp(endTime + 48 hours);
        platform.finalize(ctfId);
        assertEq(uint8(platform.phaseOf(ctfId)), uint8(ICTFPlatform.Phase.Finalized));

        uint256 before = organizer.balance;
        vm.prank(organizer);
        factory.recover();
        assertEq(organizer.balance, before + MAX_PLAYERS * seed);
    }

    function test_Recover_WhenCheated() public {
        // Disputes are not implemented yet: `Cheated` is not reachable, so mock it.
        _mockPhase(ICTFPlatform.Phase.Cheated);

        uint256 before = organizer.balance;
        vm.prank(organizer);
        factory.recover();
        assertEq(organizer.balance, before + MAX_PLAYERS * seed);
    }

    function test_RevertWhen_RecoverDuringVoting() public {
        // After `endTime` but under dispute: not one of the allowed phases.
        vm.warp(endTime);
        _mockPhase(ICTFPlatform.Phase.Voting);

        vm.prank(organizer);
        vm.expectRevert(VaultFactory.CTFNotOver.selector);
        factory.recover();
    }

    function test_RevertWhen_RecoverBeforeEnd() public {
        vm.prank(organizer);
        vm.expectRevert(VaultFactory.CTFNotOver.selector);
        factory.recover();
    }

    function test_RevertWhen_RecoverBeforeStart() public {
        VaultFactory fresh = _deployFactory(MAX_PLAYERS * seed);
        uint256 id = _createCTF(organizer, address(fresh));
        vm.prank(organizer);
        fresh.bind(id);

        vm.prank(organizer);
        vm.expectRevert(VaultFactory.CTFNotOver.selector);
        fresh.recover();
    }

    function test_RevertWhen_RecoverByNonOrganizer() public {
        vm.warp(endTime);
        vm.prank(stranger);
        vm.expectRevert(VaultFactory.NotOrganizer.selector);
        factory.recover();
    }

    function test_RevertWhen_NothingToRecover() public {
        VaultFactory fresh = _deployFactory(0);
        vm.prank(organizer);
        vm.expectRevert(VaultFactory.NothingToRecover.selector);
        fresh.recover();
    }

    function test_Recover_BeforeBind_Allowed() public {
        VaultFactory fresh = _deployFactory(seed);
        uint256 before = organizer.balance;
        vm.prank(organizer);
        fresh.recover();
        assertEq(organizer.balance, before + seed);
    }

    // ---------------------------------------------------------------------
    // Attack contract
    // ---------------------------------------------------------------------

    function test_RevertWhen_AttackSendsLessThanVaultBalance() public {
        Vault vault = _create(player);
        vm.startPrank(player);
        VaultAttack attack = new VaultAttack(vault);
        vm.expectRevert(abi.encodeWithSelector(VaultAttack.WrongAmount.selector, seed - 1, seed));
        attack.run{value: seed - 1}();
        vm.stopPrank();
    }
}
