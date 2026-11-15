// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

/// Test only: empty instance handed out by StateWritingFactory. Never deploy it.
contract StateWritingInstance {}

/// Test only: a level factory whose `validateInstance` writes to storage before
/// answering `true`. Never deploy it.
///
/// It does not inherit ILevel, which requires `validateInstance` to be `view`.
/// Called normally it returns `true`; inside the platform's `staticcall` the
/// write is forbidden, so the call fails.
contract StateWritingFactory {
    event Validated(address instance, address player);

    enum Write {
        Storage,
        Log,
        Value
    }

    Write public immutable write;
    uint256 public validations;

    constructor(Write write_) payable {
        write = write_;
    }

    function createInstance(address) external returns (address) {
        return address(new StateWritingInstance());
    }

    function validateInstance(address instance, address player) external returns (bool) {
        if (write == Write.Storage) {
            validations += 1;
        } else if (write == Write.Log) {
            emit Validated(instance, player);
        } else {
            (bool ok, ) = player.call{value: 1}("");
            ok;
        }
        return true;
    }
}
