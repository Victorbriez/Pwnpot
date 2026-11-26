// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {ILevel} from "../interfaces/ILevel.sol";

/// Test only: empty instance handed out by RevertingFactory. Never deploy it.
contract RevertingInstance {}

/// Test only: a level factory that always reverts, on `createInstance` or on
/// `validateInstance` depending on how it is built. Never deploy it.
///
/// - `onCreate == true`: no player can ever get an instance of this level.
/// - `onCreate == false`: instances are created, but validation always reverts.
contract RevertingFactory is ILevel {
    error Broken();

    bool public immutable onCreate;

    constructor(bool onCreate_) {
        onCreate = onCreate_;
    }

    function createInstance(address) external returns (address) {
        if (onCreate) revert Broken();
        return address(new RevertingInstance());
    }

    function validateInstance(address, address) external pure returns (bool) {
        revert Broken();
    }
}
