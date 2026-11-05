// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.34;

import {Test} from "forge-std/Test.sol";

import {CTFPlatform} from "./CTFPlatform.sol";
import {ICTFPlatform} from "./interfaces/ICTFPlatform.sol";
import {TestInstance, TestLevel} from "./mocks/TestLevel.sol";

/// Base commune des tests de CTFPlatform : déploiement, CTF par défaut et raccourcis.
/// L'exemple chiffré est celui de docs/DESIGN.md : 1 ETH de cash prize, 20 joueurs,
/// ticket à 0.01 ETH, caution 1,2 ETH.
abstract contract CTFPlatformBase is Test {
    uint256 internal constant CONTESTATION = 48 hours;
    uint256 internal constant VOTING = 48 hours;
    uint256 internal constant APPEAL = 24 hours;
    uint256 internal constant ARBITRATOR_TIMEOUT = 7 days;

    uint256 internal constant CASH_PRIZE = 1 ether;
    uint256 internal constant TICKET = 0.01 ether;
    uint256 internal constant MAX_PLAYERS = 20;
    uint256 internal constant BOND = CASH_PRIZE + MAX_PLAYERS * TICKET;
    uint256 internal constant START_DELAY = 1 hours;
    uint256 internal constant DURATION = 1 days;

    CTFPlatform internal platform;
    TestLevel internal level;
    address internal arbitrator = makeAddr("arbitrator");
    address internal organizer = makeAddr("organizer");

    function setUp() public virtual {
        vm.warp(1_000_000);
        platform = new CTFPlatform(arbitrator, CONTESTATION, VOTING, APPEAL, ARBITRATOR_TIMEOUT);
        level = new TestLevel();
        vm.deal(organizer, 1_000 ether);
    }

    function _params() internal view returns (ICTFPlatform.CTFParams memory) {
        return
            ICTFPlatform.CTFParams({
                title: "Test CTF",
                startTime: block.timestamp + START_DELAY,
                endTime: block.timestamp + START_DELAY + DURATION,
                ticketPrice: TICKET,
                maxPlayers: MAX_PLAYERS,
                cashPrize: CASH_PRIZE,
                organizerBond: BOND
            });
    }

    function _factories(uint256 count) internal view returns (address[] memory factories) {
        factories = new address[](count);
        for (uint256 i = 0; i < count; ++i) {
            factories[i] = address(level);
        }
    }

    function _createCTF(ICTFPlatform.CTFParams memory p, uint256 levels) internal returns (uint256) {
        vm.prank(organizer);
        return platform.createCTF{value: p.cashPrize + p.organizerBond}(p, _factories(levels));
    }

    function _createCTF(uint256 levels) internal returns (uint256) {
        return _createCTF(_params(), levels);
    }

    function _newPlayer(string memory name) internal returns (address player) {
        player = makeAddr(name);
        vm.deal(player, 10 ether);
    }

    function _buy(uint256 ctfId, address player) internal {
        uint256 price = platform.getCTF(ctfId).ticketPrice;
        vm.prank(player);
        platform.buyTicket{value: price}(ctfId);
    }

    function _instance(uint256 ctfId, uint256 levelIndex, address player) internal returns (TestInstance) {
        vm.prank(player);
        return TestInstance(platform.createInstance(ctfId, levelIndex));
    }

    /// Crée l'instance, la résout et la soumet.
    function _solve(uint256 ctfId, uint256 levelIndex, address player) internal {
        TestInstance inst = _instance(ctfId, levelIndex, player);
        vm.prank(player);
        inst.solve();
        vm.prank(player);
        platform.submit(ctfId, levelIndex);
    }

    function _toRunning(uint256 ctfId) internal {
        vm.warp(platform.getCTF(ctfId).startTime);
    }

    function _toContestation(uint256 ctfId) internal {
        vm.warp(platform.getCTF(ctfId).endTime);
    }

    function _toFinalizable(uint256 ctfId) internal {
        vm.warp(platform.getCTF(ctfId).endTime + CONTESTATION);
    }

    function _withdraw(address account) internal returns (uint256 received) {
        uint256 before = account.balance;
        vm.prank(account);
        platform.withdraw();
        received = account.balance - before;
    }
}
