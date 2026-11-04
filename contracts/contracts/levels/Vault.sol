// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Level} from "./Level.sol";

/// Épreuve 1, Coffre : `withdraw` envoie l'ETH avant de remettre le solde à zéro.
/// VOLONTAIREMENT VULNÉRABLE (réentrance). Ne pas réutiliser.
contract Vault {
    mapping(address => uint256) public balances;

    /// Reçoit le solde de départ fourni par la factory.
    constructor() payable {}

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        (bool ok, ) = msg.sender.call{value: amount}(""); // interaction AVANT l'effet
        require(ok);
        balances[msg.sender] = 0;
    }
}

/// Factory du Coffre. Chaque instance démarre avec `seed` wei, pris sur le solde
/// de la factory : l'organisateur l'alimente en lui envoyant de l'ETH.
contract VaultFactory is Level {
    /// Solde de départ de chaque coffre (décision n° 8, fixé au déploiement).
    uint256 public immutable seed;

    event Funded(address indexed from, uint256 amount);

    error ZeroSeed();
    error InsufficientFunds(uint256 available, uint256 needed);

    constructor(address platform_, uint256 seed_) Level(platform_) {
        if (seed_ == 0) revert ZeroSeed();
        seed = seed_;
    }

    receive() external payable {
        emit Funded(msg.sender, msg.value);
    }

    function _deploy(address) internal override returns (address) {
        if (address(this).balance < seed) {
            revert InsufficientFunds(address(this).balance, seed);
        }
        return address(new Vault{value: seed}());
    }

    function _isSolved(address instance, address) internal view override returns (bool) {
        return instance.balance == 0;
    }
}
