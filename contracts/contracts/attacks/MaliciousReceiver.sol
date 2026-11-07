// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {ICTFPlatform} from "../interfaces/ICTFPlatform.sol";

/// Test only: a player whose `receive()` calls `withdraw` again while being
/// paid, to try to drain other accounts' funds. Never deploy it.
///
/// It re-enters as long as the platform still holds at least the amount just
/// received, like a real drain would, and stops cleanly otherwise.
/// - `catchReentry == false` (strict): the reentrant call is not caught, so a
///   rejected reentry makes the whole payment fail.
/// - `catchReentry == true`: the reentrant call is wrapped in try/catch and its
///   revert data is recorded, so the outer payment can still go through.
contract MaliciousReceiver {
    ICTFPlatform public immutable platform;
    bool public immutable catchReentry;

    /// Number of reentrant `withdraw` attempts made from `receive()`.
    uint256 public attempts;
    /// Revert data of the first reentrant attempt that failed (catching mode).
    bytes public firstReentryError;

    constructor(ICTFPlatform platform_, bool catchReentry_) {
        platform = platform_;
        catchReentry = catchReentry_;
    }

    function buyTicket(uint256 ctfId) external payable {
        platform.buyTicket{value: msg.value}(ctfId);
    }

    function claimRefund(uint256 ctfId) external {
        platform.claimRefund(ctfId);
    }

    function withdraw() external {
        platform.withdraw();
    }

    receive() external payable {
        if (address(platform).balance < msg.value) return;
        attempts += 1;
        if (!catchReentry) {
            platform.withdraw();
            return;
        }
        try platform.withdraw() {} catch (bytes memory err) {
            if (firstReentryError.length == 0) firstReentryError = err;
        }
    }
}
