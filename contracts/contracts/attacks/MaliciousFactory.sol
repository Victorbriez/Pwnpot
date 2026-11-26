// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {ICTFPlatform} from "../interfaces/ICTFPlatform.sol";
import {ILevel} from "../interfaces/ILevel.sol";

/// Test only: a level factory that calls back into CTFPlatform from
/// `createInstance` (reentrancy through organizer code). Never deploy it.
///
/// The attacker is set up so that the callback would succeed if the platform
/// did not block reentrancy: in `Submit` mode it holds a ticket and an
/// unsubmitted solved instance on another level, in `Withdraw` mode it is owed
/// ETH as the organizer of a finalized CTF.
contract MaliciousFactory is ILevel {
    enum Mode {
        None,
        Submit,
        Withdraw
    }

    ICTFPlatform public immutable platform;

    Mode public mode;
    uint256 public targetCtfId;
    uint256 public targetLevel;

    constructor(ICTFPlatform platform_) {
        platform = platform_;
    }

    // ---------------------------------------------------------------------
    // Setup, driven by the test
    // ---------------------------------------------------------------------

    function createCTF(
        ICTFPlatform.CTFParams calldata p,
        address[] calldata factories
    ) external payable returns (uint256) {
        return platform.createCTF{value: msg.value}(p, factories);
    }

    function buyTicket(uint256 ctfId) external payable {
        platform.buyTicket{value: msg.value}(ctfId);
    }

    function createOwnInstance(uint256 ctfId, uint256 levelIndex) external returns (address) {
        return platform.createInstance(ctfId, levelIndex);
    }

    /// Calls `target` with `data` as this contract (e.g. `TestInstance.solve`).
    function exec(address target, bytes calldata data) external {
        (bool ok, bytes memory ret) = target.call(data);
        if (!ok) {
            assembly ("memory-safe") {
                revert(add(ret, 0x20), mload(ret))
            }
        }
    }

    function arm(Mode mode_, uint256 ctfId, uint256 levelIndex) external {
        mode = mode_;
        targetCtfId = ctfId;
        targetLevel = levelIndex;
    }

    // ---------------------------------------------------------------------
    // ILevel
    // ---------------------------------------------------------------------

    /// The callback is not caught: if the platform rejects it, the whole
    /// `createInstance` transaction must revert.
    function createInstance(address) external returns (address) {
        if (mode == Mode.Submit) {
            platform.submit(targetCtfId, targetLevel);
        } else if (mode == Mode.Withdraw) {
            platform.withdraw();
        }
        return address(this);
    }

    function validateInstance(address, address) external pure returns (bool) {
        return false;
    }

    /// Accepts the payout of the reentrant `withdraw` if it ever goes through.
    receive() external payable {}
}
