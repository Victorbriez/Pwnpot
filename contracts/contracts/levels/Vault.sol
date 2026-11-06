// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {ICTFPlatform} from "../interfaces/ICTFPlatform.sol";
import {ILevel} from "../interfaces/ILevel.sol";

/// Level 1, Vault: `withdraw` sends ETH before resetting the balance, so a
/// contract can re-enter from `receive()` and drain the vault.
/// INTENTIONALLY VULNERABLE (reentrancy). Do not reuse.
contract Vault {
    /// Balance received at creation, from the factory. A vault created with
    /// nothing in it can never count as drained.
    uint256 public immutable initialBalance;

    mapping(address account => uint256 amount) public balances;

    /// Set once a `withdraw` leaves the vault empty, and never reset: wei
    /// force-sent afterwards (selfdestruct) cannot make the vault unsolved again.
    bool public drained;

    constructor() payable {
        initialBalance = msg.value;
    }

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        (bool ok, ) = msg.sender.call{value: amount}(""); // interaction BEFORE the effect
        require(ok);
        if (address(this).balance == 0) drained = true;
        balances[msg.sender] = 0;
    }
}

/// Factory for the Vault level (docs/DESIGN.md decision 8: the vault balance is
/// handled here, not by CTFPlatform).
///
/// Lifecycle:
/// 1. The organizer deploys it and funds it with `maxPlayers * SEED`.
/// 2. The organizer creates the CTF with this factory, then calls `bind(ctfId)`
///    before the CTF starts.
/// 3. During the CTF, each ticket holder of that CTF gets one vault holding `SEED`.
///    What a player drains, they keep.
/// 4. Once the CTF has ended, the organizer pulls the rest with `recover()`.
///
/// ETH left in vaults that were never drained stays in them: nobody can
/// recover it except by exploiting the vault.
contract VaultFactory is ILevel {
    /// Starting balance of every vault.
    uint256 public constant SEED = 0.0001 ether;

    /// Only address allowed to create instances (CTFPlatform).
    address public immutable platform;

    /// Deployer of the factory: the only one who can bind it and recover its funds.
    address public immutable organizer;

    /// CTF this factory serves, set once by `bind`.
    uint256 public ctfId;
    bool public bound;

    /// Player each instance was created for.
    mapping(address instance => address player) public playerOf;

    /// Vault of each player: one per player, so at most `maxPlayers` vaults.
    mapping(address player => address instance) public instanceOf;

    event Funded(address indexed from, uint256 amount);
    event Bound(uint256 indexed ctfId);
    event InstanceCreated(address indexed player, address indexed instance);
    event Recovered(address indexed to, uint256 amount);

    error OnlyPlatform();
    error ZeroAddress();
    error NotOrganizer();
    error AlreadyBound();
    error NotBound();
    error InvalidCTF(uint256 ctfId);
    error CTFNotRunning();
    error NotAPlayer(address player);
    error AlreadyHasInstance(address player);
    error InsufficientFunds(uint256 available, uint256 needed);
    error CTFNotOver();
    error NothingToRecover();
    error TransferFailed();

    /// `msg.value` is the initial funding (`maxPlayers * SEED`); more can be sent later.
    constructor(address platform_) payable {
        if (platform_ == address(0)) revert ZeroAddress();
        platform = platform_;
        organizer = msg.sender;
        if (msg.value > 0) emit Funded(msg.sender, msg.value);
    }

    receive() external payable {
        emit Funded(msg.sender, msg.value);
    }

    /// Ties the factory to the organizer's CTF, before it starts. Once only; the
    /// CTF must list this factory exactly once, and the factory must already
    /// hold `maxPlayers * SEED`.
    function bind(uint256 ctfId_) external {
        if (msg.sender != organizer) revert NotOrganizer();
        if (bound) revert AlreadyBound();

        ICTFPlatform p = ICTFPlatform(platform);
        if (ctfId_ >= p.ctfCount()) revert InvalidCTF(ctfId_);
        ICTFPlatform.CTF memory c = p.getCTF(ctfId_);
        // Listed exactly once: one vault per player cannot serve two levels.
        if (c.organizer != organizer || _timesListed(p, ctfId_) != 1) revert InvalidCTF(ctfId_);
        // Every ticket holder must be able to get a vault. `recover` is locked
        // from now until the end, so this funding stays available.
        uint256 needed = c.maxPlayers * SEED;
        if (address(this).balance < needed) revert InsufficientFunds(address(this).balance, needed);

        bound = true;
        ctfId = ctfId_;
        emit Bound(ctfId_);
    }

    function createInstance(address player) external returns (address instance) {
        if (msg.sender != platform) revert OnlyPlatform();
        if (player == address(0)) revert ZeroAddress();
        if (!bound) revert NotBound();

        // Anyone can list this factory in their own CTF: only ticket holders of
        // the bound CTF get a vault, and only one each, so the funding is enough.
        ICTFPlatform p = ICTFPlatform(platform);
        if (p.phaseOf(ctfId) != ICTFPlatform.Phase.Running) revert CTFNotRunning();
        if (!p.getPlayer(ctfId, player).hasTicket) revert NotAPlayer(player);
        if (instanceOf[player] != address(0)) revert AlreadyHasInstance(player);
        if (address(this).balance < SEED) revert InsufficientFunds(address(this).balance, SEED);

        // Only deploys code from this file; never calls back into the caller.
        instance = address(new Vault{value: SEED}());
        playerOf[instance] = player;
        instanceOf[player] = instance;
        emit InstanceCreated(player, instance);
    }

    function validateInstance(address instance, address player) external view returns (bool) {
        // Another player's instance, or an unknown address, never validates.
        if (player == address(0) || playerOf[instance] != player) return false;
        // No need to check the balance: ETH can only leave a vault through
        // `withdraw`, which sets `drained` when it empties it. Wei force-sent
        // afterwards (selfdestruct) therefore cannot unsolve it.
        Vault vault = Vault(instance);
        return vault.initialBalance() > 0 && vault.drained();
    }

    /// Sends the remaining balance to the organizer once the CTF has ended, in
    /// the phases `Contestation`, `Finalized` or `Cheated` only. Before `bind`,
    /// no vault can exist, so the organizer can take the funds back at any time.
    function recover() external {
        if (msg.sender != organizer) revert NotOrganizer();
        if (bound) {
            ICTFPlatform.Phase phase = ICTFPlatform(platform).phaseOf(ctfId);
            if (
                phase != ICTFPlatform.Phase.Contestation &&
                phase != ICTFPlatform.Phase.Finalized &&
                phase != ICTFPlatform.Phase.Cheated
            ) revert CTFNotOver();
        }
        uint256 amount = address(this).balance;
        if (amount == 0) revert NothingToRecover();

        emit Recovered(msg.sender, amount);
        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    function _timesListed(ICTFPlatform p, uint256 id) private view returns (uint256 count) {
        ICTFPlatform.Level[] memory levels = p.getLevels(id);
        for (uint256 i = 0; i < levels.length; i++) {
            if (levels[i].factory == address(this)) count++;
        }
    }
}
