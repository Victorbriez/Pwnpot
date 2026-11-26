// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {IArbitrable} from "../interfaces/IArbitrable.sol";
import {IArbitrator} from "../interfaces/IArbitrator.sol";

/// Test only: an ERC-792 arbitrator that misbehaves, to check what CTFPlatform
/// does when the arbitrator it trusts is hostile (docs/SECURITY.md § Arbitre).
/// Never deploy it.
contract MaliciousArbitrator is IArbitrator {
    enum Mode {
        /// Rules « cheated » from inside `createDispute`, before the platform
        /// has even stored the dispute ID (reentrancy into `rule`).
        RuleDuringCreate,
        /// Always answers dispute ID 0, so a second CTF's dispute collides
        /// with the first one.
        ReuseId
    }

    uint256 public constant FEE = 0.0005 ether;
    Mode public immutable mode;

    constructor(Mode mode_) {
        mode = mode_;
    }

    function createDispute(uint256, bytes calldata) external payable returns (uint256) {
        if (mode == Mode.RuleDuringCreate) IArbitrable(msg.sender).rule(0, 1);
        return 0;
    }

    /// Lets the test rule on a dispute it reused.
    function ruleOn(IArbitrable arbitrable, uint256 disputeID, uint256 ruling) external {
        arbitrable.rule(disputeID, ruling);
    }

    function arbitrationCost(bytes calldata) external pure returns (uint256) {
        return FEE;
    }

    function appeal(uint256, bytes calldata) external payable {}

    function appealCost(uint256, bytes calldata) external pure returns (uint256) {
        return type(uint256).max;
    }

    function appealPeriod(uint256) external pure returns (uint256, uint256) {
        return (0, 0);
    }

    function disputeStatus(uint256) external pure returns (DisputeStatus) {
        return DisputeStatus.Waiting;
    }

    function currentRuling(uint256) external pure returns (uint256) {
        return 0;
    }
}
