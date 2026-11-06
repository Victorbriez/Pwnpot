// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Test} from "forge-std/Test.sol";

import {IArbitrable} from "../interfaces/IArbitrable.sol";
import {IArbitrator} from "../interfaces/IArbitrator.sol";
import {MockArbitrator} from "./MockArbitrator.sol";

/// Contrat arbitrable qui enregistre la décision reçue.
contract RecordingArbitrable is IArbitrable {
    uint256 public lastDispute;
    uint256 public lastRuling;
    uint256 public calls;

    function open(MockArbitrator arbitrator) external payable returns (uint256) {
        return arbitrator.createDispute{value: msg.value}(2, "");
    }

    function rule(uint256 disputeID, uint256 ruling) external {
        lastDispute = disputeID;
        lastRuling = ruling;
        calls += 1;
    }
}

contract MockArbitratorTest is Test {
    uint256 constant FEE = 0.0005 ether;

    MockArbitrator arbitrator;
    RecordingArbitrable arbitrable;
    address ruler = makeAddr("ruler");

    function setUp() public {
        arbitrator = new MockArbitrator(FEE, ruler);
        arbitrable = new RecordingArbitrable();
    }

    function _open() internal returns (uint256) {
        return arbitrable.open{value: FEE}(arbitrator);
    }

    function test_Constructor_RejectsFeeAtOrAboveMinContestBond() public {
        vm.expectRevert(MockArbitrator.FeeTooHigh.selector);
        new MockArbitrator(0.001 ether, ruler);
    }

    function test_Constructor_RejectsZeroRuler() public {
        vm.expectRevert(MockArbitrator.ZeroRuler.selector);
        new MockArbitrator(FEE, address(0));
    }

    function test_CreateDispute_RequiresExactFee() public {
        vm.expectRevert(abi.encodeWithSelector(MockArbitrator.WrongFee.selector, FEE, FEE - 1));
        arbitrable.open{value: FEE - 1}(arbitrator);
    }

    function test_CreateDispute_StoresDispute() public {
        uint256 id = _open();
        assertEq(id, 0);
        assertEq(arbitrator.disputeCount(), 1);
        assertEq(uint256(arbitrator.disputeStatus(id)), uint256(IArbitrator.DisputeStatus.Waiting));
        assertEq(arbitrator.arbitrationCost(""), FEE);
        assertEq(address(arbitrator).balance, FEE);
    }

    function test_GiveRuling_CallsRuleOnArbitrable() public {
        uint256 id = _open();
        vm.prank(ruler);
        arbitrator.giveRuling(id, 1);
        assertEq(arbitrable.calls(), 1);
        assertEq(arbitrable.lastDispute(), id);
        assertEq(arbitrable.lastRuling(), 1);
        assertEq(arbitrator.currentRuling(id), 1);
        assertEq(uint256(arbitrator.disputeStatus(id)), uint256(IArbitrator.DisputeStatus.Solved));
    }

    function test_GiveRuling_OnlyRuler() public {
        uint256 id = _open();
        vm.expectRevert(MockArbitrator.NotRuler.selector);
        arbitrator.giveRuling(id, 1);
    }

    function test_GiveRuling_RejectsOutOfRangeRuling() public {
        uint256 id = _open();
        vm.prank(ruler);
        vm.expectRevert(abi.encodeWithSelector(MockArbitrator.InvalidRuling.selector, 3, 2));
        arbitrator.giveRuling(id, 3);
    }

    function test_GiveRuling_OnlyOnce() public {
        uint256 id = _open();
        vm.startPrank(ruler);
        arbitrator.giveRuling(id, 2);
        vm.expectRevert(abi.encodeWithSelector(MockArbitrator.AlreadySolved.selector, id));
        arbitrator.giveRuling(id, 1);
        vm.stopPrank();
    }

    function test_UnknownDispute() public {
        vm.expectRevert(abi.encodeWithSelector(MockArbitrator.UnknownDispute.selector, 7));
        arbitrator.disputeStatus(7);
    }

    function test_Appeal_NotPossible() public {
        uint256 id = _open();
        vm.expectRevert(MockArbitrator.NotAppealable.selector);
        arbitrator.appeal(id, "");
        assertEq(arbitrator.appealCost(id, ""), type(uint256).max);
    }

    function test_WithdrawFees_ToRuler() public {
        _open();
        vm.prank(ruler);
        arbitrator.withdrawFees();
        assertEq(ruler.balance, FEE);
        assertEq(address(arbitrator).balance, 0);

        vm.prank(ruler);
        vm.expectRevert(MockArbitrator.NothingToWithdraw.selector);
        arbitrator.withdrawFees();
    }

    function test_WithdrawFees_OnlyRuler() public {
        _open();
        vm.expectRevert(MockArbitrator.NotRuler.selector);
        arbitrator.withdrawFees();
    }
}
