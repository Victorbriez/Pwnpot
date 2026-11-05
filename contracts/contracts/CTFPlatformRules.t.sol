// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.34;

import {CTFPlatform} from "./CTFPlatform.sol";
import {CTFPlatformBase} from "./CTFPlatformBase.t.sol";
import {ICTFPlatform} from "./interfaces/ICTFPlatform.sol";
import {ILevel} from "./interfaces/ILevel.sol";
import {TestInstance} from "./mocks/TestLevel.sol";

/// Factory qui renvoie l'adresse nulle : `createInstance` doit la refuser.
contract ZeroInstanceLevel is ILevel {
    function createInstance(address) external pure returns (address) {
        return address(0);
    }

    function validateInstance(address, address) external pure returns (bool) {
        return true;
    }
}

/// Bénéficiaire qui refuse l'ETH : son `withdraw` doit revert sans rien perdre.
contract RejectingReceiver {
    function buy(CTFPlatform platform, uint256 ctfId) external payable {
        platform.buyTicket{value: msg.value}(ctfId);
    }

    function instance(CTFPlatform platform, uint256 ctfId) external returns (address) {
        return platform.createInstance(ctfId, 0);
    }

    function solve(TestInstance inst) external {
        inst.solve();
    }

    function submit(CTFPlatform platform, uint256 ctfId) external {
        platform.submit(ctfId, 0);
    }

    function withdraw(CTFPlatform platform) external {
        platform.withdraw();
    }
}

/// Un test de refus par règle : chaque custom error levée par CTFPlatform
/// est déclenchée au moins une fois (issue #9).
contract CTFPlatformRulesTest is CTFPlatformBase {
    address internal alice;
    address internal bob;

    function setUp() public override {
        super.setUp();
        alice = _newPlayer("alice");
        bob = _newPlayer("bob");
    }

    // ------------------------------------------------------------------
    // Constructeur
    // ------------------------------------------------------------------

    function test_Constructor_RevertsOnZeroArbitrator() public {
        vm.expectRevert(ICTFPlatform.ZeroArbitrator.selector);
        new CTFPlatform(address(0), CONTESTATION, VOTING, APPEAL, ARBITRATOR_TIMEOUT);
    }

    function test_Constructor_RevertsOnZeroPeriod() public {
        vm.expectRevert(ICTFPlatform.ZeroPeriod.selector);
        new CTFPlatform(arbitrator, 0, VOTING, APPEAL, ARBITRATOR_TIMEOUT);
        vm.expectRevert(ICTFPlatform.ZeroPeriod.selector);
        new CTFPlatform(arbitrator, CONTESTATION, 0, APPEAL, ARBITRATOR_TIMEOUT);
        vm.expectRevert(ICTFPlatform.ZeroPeriod.selector);
        new CTFPlatform(arbitrator, CONTESTATION, VOTING, 0, ARBITRATOR_TIMEOUT);
        vm.expectRevert(ICTFPlatform.ZeroPeriod.selector);
        new CTFPlatform(arbitrator, CONTESTATION, VOTING, APPEAL, 0);
    }

    // ------------------------------------------------------------------
    // createCTF : bornes
    // ------------------------------------------------------------------

    function _expectCreateRevert(ICTFPlatform.CTFParams memory p, bytes memory err) internal {
        address[] memory factories = _factories(1);
        vm.prank(organizer);
        vm.expectRevert(err);
        platform.createCTF{value: p.cashPrize + p.organizerBond}(p, factories);
    }

    function test_CreateCTF_RevertsWhenStartInPast() public {
        ICTFPlatform.CTFParams memory p = _params();
        p.startTime = block.timestamp - 1;
        _expectCreateRevert(p, abi.encodeWithSelector(ICTFPlatform.StartInPast.selector));
    }

    function test_CreateCTF_RevertsWhenEndBeforeStart() public {
        ICTFPlatform.CTFParams memory p = _params();
        p.endTime = p.startTime;
        _expectCreateRevert(p, abi.encodeWithSelector(ICTFPlatform.InvalidDuration.selector));
    }

    function test_CreateCTF_RevertsWhenShorterThanOneHour() public {
        ICTFPlatform.CTFParams memory p = _params();
        p.endTime = p.startTime + 1 hours - 1;
        _expectCreateRevert(p, abi.encodeWithSelector(ICTFPlatform.InvalidDuration.selector));
    }

    function test_CreateCTF_RevertsWhenLongerThanThirtyDays() public {
        ICTFPlatform.CTFParams memory p = _params();
        p.endTime = p.startTime + 30 days + 1;
        _expectCreateRevert(p, abi.encodeWithSelector(ICTFPlatform.InvalidDuration.selector));
    }

    function test_CreateCTF_AcceptsDurationBounds() public {
        ICTFPlatform.CTFParams memory p = _params();
        p.endTime = p.startTime + 1 hours;
        _createCTF(p, 1);
        p.endTime = p.startTime + 30 days;
        _createCTF(p, 1);
        assertEq(platform.ctfCount(), 2);
    }

    function test_CreateCTF_RevertsWhenZeroMaxPlayers() public {
        ICTFPlatform.CTFParams memory p = _params();
        p.maxPlayers = 0;
        _expectCreateRevert(p, abi.encodeWithSelector(ICTFPlatform.InvalidMaxPlayers.selector));
    }

    function test_CreateCTF_RevertsWhenTooManyMaxPlayers() public {
        ICTFPlatform.CTFParams memory p = _params();
        p.maxPlayers = 201;
        p.organizerBond = p.cashPrize + 201 * p.ticketPrice;
        _expectCreateRevert(p, abi.encodeWithSelector(ICTFPlatform.InvalidMaxPlayers.selector));
    }

    function test_CreateCTF_AcceptsTwoHundredPlayers() public {
        ICTFPlatform.CTFParams memory p = _params();
        p.maxPlayers = 200;
        p.organizerBond = p.cashPrize + 200 * p.ticketPrice;
        _createCTF(p, 1);
    }

    function test_CreateCTF_RevertsWhenTicketBelowMinimum() public {
        ICTFPlatform.CTFParams memory p = _params();
        p.ticketPrice = 0.0001 ether - 1;
        _expectCreateRevert(p, abi.encodeWithSelector(ICTFPlatform.TicketPriceTooLow.selector));
    }

    function test_CreateCTF_AcceptsMinimumTicket() public {
        ICTFPlatform.CTFParams memory p = _params();
        p.ticketPrice = 0.0001 ether;
        _createCTF(p, 1);
    }

    function test_CreateCTF_RevertsWhenZeroCashPrize() public {
        ICTFPlatform.CTFParams memory p = _params();
        p.cashPrize = 0;
        _expectCreateRevert(p, abi.encodeWithSelector(ICTFPlatform.ZeroCashPrize.selector));
    }

    function test_CreateCTF_RevertsWhenBondTooLow() public {
        ICTFPlatform.CTFParams memory p = _params();
        p.organizerBond = BOND - 1;
        _expectCreateRevert(p, abi.encodeWithSelector(ICTFPlatform.BondTooLow.selector, BOND, BOND - 1));
    }

    function test_CreateCTF_AcceptsExactBond() public {
        // Exemple de DESIGN.md : 1 ETH, 20 joueurs, ticket à 0.01 ETH → 1,2 ETH.
        assertEq(BOND, 1.2 ether);
        _createCTF(_params(), 1);
    }

    function test_CreateCTF_RevertsOnWrongValue() public {
        ICTFPlatform.CTFParams memory p = _params();
        address[] memory factories = _factories(1);
        vm.prank(organizer);
        vm.expectRevert(abi.encodeWithSelector(ICTFPlatform.WrongValue.selector, CASH_PRIZE + BOND, CASH_PRIZE));
        platform.createCTF{value: CASH_PRIZE}(p, factories);
    }

    function test_CreateCTF_RevertsWithoutLevels() public {
        ICTFPlatform.CTFParams memory p = _params();
        vm.prank(organizer);
        vm.expectRevert(ICTFPlatform.NoLevels.selector);
        platform.createCTF{value: CASH_PRIZE + BOND}(p, new address[](0));
    }

    function test_CreateCTF_RevertsWhenFactoryIsNotAContract() public {
        ICTFPlatform.CTFParams memory p = _params();
        address[] memory factories = new address[](2);
        factories[0] = address(level);
        factories[1] = bob;
        vm.prank(organizer);
        vm.expectRevert(abi.encodeWithSelector(ICTFPlatform.FactoryNotContract.selector, bob));
        platform.createCTF{value: CASH_PRIZE + BOND}(p, factories);
    }

    // ------------------------------------------------------------------
    // CTF inconnu
    // ------------------------------------------------------------------

    function test_RevertsOnUnknownCTF() public {
        vm.expectRevert(abi.encodeWithSelector(ICTFPlatform.CTFNotFound.selector, 0));
        platform.getCTF(0);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(ICTFPlatform.CTFNotFound.selector, 7));
        platform.buyTicket{value: TICKET}(7);
        vm.expectRevert(abi.encodeWithSelector(ICTFPlatform.CTFNotFound.selector, 7));
        platform.finalize(7);
    }

    // ------------------------------------------------------------------
    // buyTicket
    // ------------------------------------------------------------------

    function test_BuyTicket_RevertsOnDuplicate() public {
        uint256 id = _createCTF(1);
        _buy(id, alice);
        vm.prank(alice);
        vm.expectRevert(ICTFPlatform.AlreadyHasTicket.selector);
        platform.buyTicket{value: TICKET}(id);
    }

    function test_BuyTicket_RevertsOnWrongPrice() public {
        uint256 id = _createCTF(1);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(ICTFPlatform.WrongValue.selector, TICKET, TICKET - 1));
        platform.buyTicket{value: TICKET - 1}(id);
    }

    function test_BuyTicket_RevertsWhenFull() public {
        ICTFPlatform.CTFParams memory p = _params();
        p.maxPlayers = 1;
        p.organizerBond = p.cashPrize + p.ticketPrice;
        uint256 id = _createCTF(p, 1);
        _buy(id, alice);
        vm.prank(bob);
        vm.expectRevert(ICTFPlatform.CTFFull.selector);
        platform.buyTicket{value: TICKET}(id);
    }

    function test_BuyTicket_AllowedWhileRunning() public {
        uint256 id = _createCTF(1);
        _toRunning(id);
        _buy(id, alice);
        assertTrue(platform.getPlayer(id, alice).hasTicket);
    }

    function test_BuyTicket_RevertsAfterEnd() public {
        uint256 id = _createCTF(1);
        _toContestation(id);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(ICTFPlatform.WrongPhase.selector, ICTFPlatform.Phase.Contestation));
        platform.buyTicket{value: TICKET}(id);
    }

    // ------------------------------------------------------------------
    // createInstance
    // ------------------------------------------------------------------

    function test_CreateInstance_RevertsBeforeStart() public {
        uint256 id = _createCTF(1);
        _buy(id, alice);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(ICTFPlatform.WrongPhase.selector, ICTFPlatform.Phase.Open));
        platform.createInstance(id, 0);
    }

    function test_CreateInstance_RevertsAfterEnd() public {
        uint256 id = _createCTF(1);
        _buy(id, alice);
        _toContestation(id);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(ICTFPlatform.WrongPhase.selector, ICTFPlatform.Phase.Contestation));
        platform.createInstance(id, 0);
    }

    function test_CreateInstance_RevertsWithoutTicket() public {
        uint256 id = _createCTF(1);
        _toRunning(id);
        vm.prank(alice);
        vm.expectRevert(ICTFPlatform.NoTicket.selector);
        platform.createInstance(id, 0);
    }

    function test_CreateInstance_RevertsOnUnknownLevel() public {
        uint256 id = _createCTF(2);
        _buy(id, alice);
        _toRunning(id);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(ICTFPlatform.InvalidLevel.selector, 2));
        platform.createInstance(id, 2);
    }

    function test_CreateInstance_RevertsOnSecondInstance() public {
        uint256 id = _createCTF(1);
        _buy(id, alice);
        _toRunning(id);
        _instance(id, 0, alice);
        vm.prank(alice);
        vm.expectRevert(ICTFPlatform.InstanceAlreadyCreated.selector);
        platform.createInstance(id, 0);
    }

    function test_CreateInstance_RevertsWhenFactoryReturnsZero() public {
        ICTFPlatform.CTFParams memory p = _params();
        address[] memory factories = new address[](1);
        factories[0] = address(new ZeroInstanceLevel());
        vm.prank(organizer);
        uint256 id = platform.createCTF{value: CASH_PRIZE + BOND}(p, factories);
        _buy(id, alice);
        _toRunning(id);
        vm.prank(alice);
        vm.expectRevert(ICTFPlatform.InvalidInstance.selector);
        platform.createInstance(id, 0);
    }

    // ------------------------------------------------------------------
    // submit
    // ------------------------------------------------------------------

    function test_Submit_RevertsWithoutExploit() public {
        uint256 id = _createCTF(1);
        _buy(id, alice);
        _toRunning(id);
        _instance(id, 0, alice);
        vm.prank(alice);
        vm.expectRevert(ICTFPlatform.NotSolved.selector);
        platform.submit(id, 0);
        assertEq(platform.getPlayer(id, alice).score, 0);
    }

    function test_Submit_RevertsWithoutTicket() public {
        uint256 id = _createCTF(1);
        _toRunning(id);
        vm.prank(alice);
        vm.expectRevert(ICTFPlatform.NoTicket.selector);
        platform.submit(id, 0);
    }

    function test_Submit_RevertsWithoutInstance() public {
        uint256 id = _createCTF(1);
        _buy(id, alice);
        _toRunning(id);
        vm.prank(alice);
        vm.expectRevert(ICTFPlatform.NoInstance.selector);
        platform.submit(id, 0);
    }

    function test_Submit_RevertsOnUnknownLevel() public {
        uint256 id = _createCTF(1);
        _buy(id, alice);
        _toRunning(id);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(ICTFPlatform.InvalidLevel.selector, 1));
        platform.submit(id, 1);
    }

    function test_Submit_RevertsWhenAlreadySolved() public {
        uint256 id = _createCTF(1);
        _buy(id, alice);
        _toRunning(id);
        _solve(id, 0, alice);
        vm.prank(alice);
        vm.expectRevert(ICTFPlatform.AlreadySolved.selector);
        platform.submit(id, 0);
        assertEq(platform.getPlayer(id, alice).score, 1);
    }

    function test_Submit_RevertsAfterEnd() public {
        uint256 id = _createCTF(1);
        _buy(id, alice);
        _toRunning(id);
        TestInstance inst = _instance(id, 0, alice);
        vm.prank(alice);
        inst.solve();
        _toContestation(id);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(ICTFPlatform.WrongPhase.selector, ICTFPlatform.Phase.Contestation));
        platform.submit(id, 0);
    }

    /// Mauvais appelant : l'instance résolue d'alice ne compte pas pour bob.
    function test_Submit_OtherPlayersInstanceDoesNotCount() public {
        uint256 id = _createCTF(1);
        _buy(id, alice);
        _buy(id, bob);
        _toRunning(id);
        TestInstance aliceInst = _instance(id, 0, alice);
        vm.prank(alice);
        aliceInst.solve();
        _instance(id, 0, bob);

        vm.prank(bob);
        vm.expectRevert(ICTFPlatform.NotSolved.selector);
        platform.submit(id, 0);

        // Et alice reste libre de soumettre la sienne.
        vm.prank(alice);
        platform.submit(id, 0);
        assertEq(platform.getPlayer(id, alice).score, 1);
        assertEq(platform.getPlayer(id, bob).score, 0);
    }

    // ------------------------------------------------------------------
    // finalize
    // ------------------------------------------------------------------

    function test_Finalize_RevertsWhileRunning() public {
        uint256 id = _createCTF(1);
        _toRunning(id);
        vm.expectRevert(abi.encodeWithSelector(ICTFPlatform.WrongPhase.selector, ICTFPlatform.Phase.Running));
        platform.finalize(id);
    }

    function test_Finalize_RevertsDuringContestation() public {
        uint256 id = _createCTF(1);
        uint256 endsAt = platform.getCTF(id).endTime + CONTESTATION;
        vm.warp(endsAt - 1);
        vm.expectRevert(abi.encodeWithSelector(ICTFPlatform.ContestationNotOver.selector, endsAt));
        platform.finalize(id);
    }

    function test_Finalize_RevertsTwice() public {
        uint256 id = _createCTF(1);
        _toFinalizable(id);
        platform.finalize(id);
        vm.expectRevert(abi.encodeWithSelector(ICTFPlatform.WrongPhase.selector, ICTFPlatform.Phase.Finalized));
        platform.finalize(id);
        assertEq(platform.owed(organizer), CASH_PRIZE + BOND);
    }

    function test_Finalize_CallableByAnyone() public {
        uint256 id = _createCTF(1);
        _toFinalizable(id);
        vm.prank(makeAddr("stranger"));
        platform.finalize(id);
        assertEq(uint8(platform.phaseOf(id)), uint8(ICTFPlatform.Phase.Finalized));
    }

    // ------------------------------------------------------------------
    // claimRefund
    // ------------------------------------------------------------------

    function test_ClaimRefund_RevertsBeforeFinalize() public {
        uint256 id = _createCTF(1);
        _buy(id, alice);
        _toContestation(id);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(ICTFPlatform.WrongPhase.selector, ICTFPlatform.Phase.Contestation));
        platform.claimRefund(id);
    }

    function test_ClaimRefund_RevertsWhenThereIsAWinner() public {
        uint256 id = _createCTF(1);
        _buy(id, alice);
        _buy(id, bob);
        _toRunning(id);
        _solve(id, 0, alice);
        _toFinalizable(id);
        platform.finalize(id);
        vm.prank(bob);
        vm.expectRevert(ICTFPlatform.NothingToRefund.selector);
        platform.claimRefund(id);
    }

    function test_ClaimRefund_RevertsWithoutTicket() public {
        uint256 id = _createCTF(1);
        _toFinalizable(id);
        platform.finalize(id);
        vm.prank(alice);
        vm.expectRevert(ICTFPlatform.NothingToRefund.selector);
        platform.claimRefund(id);
    }

    function test_ClaimRefund_RevertsTwice() public {
        uint256 id = _createCTF(1);
        _buy(id, alice);
        _toFinalizable(id);
        platform.finalize(id);
        vm.prank(alice);
        platform.claimRefund(id);
        vm.prank(alice);
        vm.expectRevert(ICTFPlatform.NothingToRefund.selector);
        platform.claimRefund(id);
        assertEq(platform.owed(alice), TICKET);
    }

    // ------------------------------------------------------------------
    // withdraw
    // ------------------------------------------------------------------

    function test_Withdraw_RevertsWhenNothingOwed() public {
        vm.prank(alice);
        vm.expectRevert(ICTFPlatform.NothingToWithdraw.selector);
        platform.withdraw();
    }

    function test_Withdraw_RevertsSecondTime() public {
        uint256 id = _createCTF(1);
        _toFinalizable(id);
        platform.finalize(id);
        _withdraw(organizer);
        vm.prank(organizer);
        vm.expectRevert(ICTFPlatform.NothingToWithdraw.selector);
        platform.withdraw();
    }

    /// Un destinataire qui refuse l'ETH ne bloque que son propre retrait.
    function test_Withdraw_RevertsWhenReceiverRejects_OthersUnaffected() public {
        uint256 id = _createCTF(1);
        RejectingReceiver rejecting = new RejectingReceiver();
        vm.deal(address(rejecting), 1 ether);
        rejecting.buy{value: TICKET}(platform, id);
        _toRunning(id);
        TestInstance inst = TestInstance(rejecting.instance(platform, id));
        rejecting.solve(inst);
        rejecting.submit(platform, id);
        _toFinalizable(id);
        platform.finalize(id);

        uint256 prize = CASH_PRIZE + TICKET;
        assertEq(platform.owed(address(rejecting)), prize);
        vm.expectRevert(ICTFPlatform.TransferFailed.selector);
        rejecting.withdraw(platform);
        // Le solde reste dû, et l'organisateur peut toujours retirer.
        assertEq(platform.owed(address(rejecting)), prize);
        assertEq(_withdraw(organizer), BOND);
    }

    // ------------------------------------------------------------------
    // Litiges : pas encore implémentés
    // ------------------------------------------------------------------

    function test_Rule_RevertsWhenNotArbitrator() public {
        vm.prank(alice);
        vm.expectRevert(ICTFPlatform.NotArbitrator.selector);
        platform.rule(0, 1);
    }

    function test_DisputeFunctions_RevertNotImplemented() public {
        vm.prank(arbitrator);
        vm.expectRevert(ICTFPlatform.NotImplemented.selector);
        platform.rule(0, 1);
        vm.expectRevert(ICTFPlatform.NotImplemented.selector);
        platform.openDispute(0);
        vm.expectRevert(ICTFPlatform.NotImplemented.selector);
        platform.vote(0, true);
        vm.expectRevert(ICTFPlatform.NotImplemented.selector);
        platform.appeal(0);
        vm.expectRevert(ICTFPlatform.NotImplemented.selector);
        platform.applyVoteAfterTimeout(0);
    }
}
