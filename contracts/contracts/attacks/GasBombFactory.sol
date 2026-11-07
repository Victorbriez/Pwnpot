// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {ILevel} from "../interfaces/ILevel.sol";

/// Test only: empty instance handed out by GasBombFactory. Never deploy it.
contract GasBombInstance {}

/// Test only: a level factory whose `validateInstance` never returns and burns
/// all the gas it is given. Never deploy it.
contract GasBombFactory is ILevel {
    function createInstance(address) external returns (address) {
        return address(new GasBombInstance());
    }

    function validateInstance(address, address) external view returns (bool) {
        uint256 i;
        while (gasleft() > 0) {
            ++i;
        }
        return i == 0;
    }
}
