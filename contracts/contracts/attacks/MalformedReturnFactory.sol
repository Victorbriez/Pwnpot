// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

/// Test only: empty instance handed out by MalformedReturnFactory. Never deploy it.
contract MalformedReturnInstance {}

/// Test only: a level factory whose `validateInstance` succeeds but returns
/// raw bytes chosen at construction instead of an ABI-encoded `bool`
/// (empty, too short, `2` instead of `true`, too long…). Never deploy it.
///
/// It does not inherit ILevel: `validateInstance` is answered by the fallback,
/// which returns `payload` as is, whatever the selector.
contract MalformedReturnFactory {
    bytes public payload;

    constructor(bytes memory payload_) {
        payload = payload_;
    }

    function createInstance(address) external returns (address) {
        return address(new MalformedReturnInstance());
    }

    /// Answers `validateInstance(address,address)` with `payload`, read-only so
    /// that it also runs inside the platform's `staticcall`.
    fallback() external {
        bytes memory out = payload;
        assembly ("memory-safe") {
            return(add(out, 0x20), mload(out))
        }
    }
}
