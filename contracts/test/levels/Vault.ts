import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { network } from "hardhat"
import { encodeFunctionData, parseEther, type Hash } from "viem"

const HOUR = 3600n
const VALIDATION_GAS = 300_000n
const MAX_PLAYERS = 20n

// Level 1, Vault: the reentrancy exploit played as a player would, through
// CTFPlatform, with the vault funded by its factory (docs/DESIGN.md decision 8).
describe("Level 1: Vault (reentrancy)", async function () {
  const { viem, networkHelpers } = await network.create()
  const publicClient = await viem.getPublicClient()
  const [, organizer, alice, bob, arbitrator] = await viem.getWalletClients()

  /** Wei paid in gas by a mined transaction. */
  async function gasCost(hash: Hash) {
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    return receipt.gasUsed * receipt.effectiveGasPrice
  }

  /** CTF 0 with the Vault factory funded for `maxPlayers` vaults, bound, alice and bob in, running. */
  async function deploy() {
    const platform = await viem.deployContract("CTFPlatform", [
      arbitrator.account.address,
      48n * HOUR,
      48n * HOUR,
      24n * HOUR,
      7n * 24n * HOUR,
    ])
    const seed = await (
      await viem.deployContract("VaultFactory", [platform.address])
    ).read.SEED()
    const factory = await viem.deployContract(
      "VaultFactory",
      [platform.address],
      { client: { wallet: organizer }, value: MAX_PLAYERS * seed }
    )

    const now = BigInt(await networkHelpers.time.latest())
    const cashPrize = parseEther("1")
    const ticketPrice = parseEther("0.01")
    const organizerBond = cashPrize + MAX_PLAYERS * ticketPrice
    const startTime = now + HOUR
    const endTime = startTime + 24n * HOUR
    await platform.write.createCTF(
      [
        {
          title: "Vault",
          startTime,
          endTime,
          ticketPrice,
          maxPlayers: MAX_PLAYERS,
          cashPrize,
          organizerBond,
        },
        [factory.address],
      ],
      { account: organizer.account, value: cashPrize + organizerBond }
    )
    await factory.write.bind([0n], { account: organizer.account })
    for (const player of [alice, bob]) {
      await platform.write.buyTicket([0n], {
        account: player.account,
        value: ticketPrice,
      })
    }
    await networkHelpers.time.increaseTo(startTime)

    return { platform, factory, seed, endTime }
  }

  type Fixture = Awaited<ReturnType<typeof deploy>>

  /** Creates the caller's vault through the platform, as the frontend does. */
  async function createInstance({ platform }: Fixture, player: typeof alice) {
    await platform.write.createInstance([0n, 0n], { account: player.account })
    const address = await platform.read.instanceOf([
      0n,
      0n,
      player.account.address,
    ])
    return viem.getContractAt("Vault", address, {
      client: { wallet: player },
    })
  }

  /** Deploys the attack from `player` and runs it. Returns the gas paid. */
  async function attack(
    vault: { address: `0x${string}` },
    player: typeof alice,
    deposit: bigint
  ) {
    const { contract, deploymentTransaction } =
      await viem.sendDeploymentTransaction("VaultAttack", [vault.address], {
        client: { wallet: player },
      })
    const deployGas = await gasCost(deploymentTransaction.hash)
    const runHash = await contract.write.run({
      account: player.account,
      value: deposit,
    })
    return deployGas + (await gasCost(runHash))
  }

  it("drains the vault by reentrancy, validates and keeps the loot", async function () {
    const fixture = await networkHelpers.loadFixture(deploy)
    const { platform, factory, seed } = fixture
    const vault = await createInstance(fixture, alice)

    assert.equal(
      await publicClient.getBalance({ address: vault.address }),
      seed
    )
    assert.equal(await vault.read.initialBalance(), seed)
    assert.equal(
      await factory.read.validateInstance([
        vault.address,
        alice.account.address,
      ]),
      false
    )

    const before = await publicClient.getBalance({
      address: alice.account.address,
    })
    // Alice sends a margin above the vault balance: the excess comes back.
    const gas = await attack(vault, alice, 2n * seed)

    assert.equal(await publicClient.getBalance({ address: vault.address }), 0n)
    // To the wei: alice paid gas and got the whole seed back, deposit included.
    assert.equal(
      await publicClient.getBalance({ address: alice.account.address }),
      before - gas + seed
    )
    assert.equal(
      await factory.read.validateInstance([
        vault.address,
        alice.account.address,
      ]),
      true
    )

    await platform.write.submit([0n, 0n], { account: alice.account })
    assert.equal(
      await platform.read.isSolved([0n, 0n, alice.account.address]),
      true
    )
    assert.equal(
      (await platform.read.getPlayer([0n, alice.account.address])).score,
      1n
    )
  })

  it("still drains the vault when a rival force-sends 1 wei first", async function () {
    const fixture = await networkHelpers.loadFixture(deploy)
    const { platform, factory, seed } = fixture
    const vault = await createInstance(fixture, alice)

    // Stands for a `selfdestruct` front-running the exploit with 1 wei.
    await networkHelpers.setBalance(vault.address, seed + 1n)
    const before = await publicClient.getBalance({
      address: alice.account.address,
    })
    const gas = await attack(vault, alice, 2n * seed)

    assert.equal(await publicClient.getBalance({ address: vault.address }), 0n)
    assert.equal(
      await publicClient.getBalance({ address: alice.account.address }),
      before - gas + seed + 1n
    )
    assert.equal(
      await factory.read.validateInstance([
        vault.address,
        alice.account.address,
      ]),
      true
    )
    await platform.write.submit([0n, 0n], { account: alice.account })
    assert.equal(
      await platform.read.isSolved([0n, 0n, alice.account.address]),
      true
    )
  })

  it("stays solved when wei is force-sent to the drained vault", async function () {
    const fixture = await networkHelpers.loadFixture(deploy)
    const { platform, factory, seed } = fixture
    const vault = await createInstance(fixture, alice)
    await attack(vault, alice, seed)

    // Stands for a `selfdestruct` that force-sends 1 wei to the drained vault.
    await networkHelpers.setBalance(vault.address, 1n)

    assert.equal(await publicClient.getBalance({ address: vault.address }), 1n)
    assert.equal(await vault.read.drained(), true)
    assert.equal(
      await factory.read.validateInstance([
        vault.address,
        alice.account.address,
      ]),
      true
    )
    await platform.write.submit([0n, 0n], { account: alice.account })
    assert.equal(
      await platform.read.isSolved([0n, 0n, alice.account.address]),
      true
    )
  })

  it("does not validate without the exploit", async function () {
    const fixture = await networkHelpers.loadFixture(deploy)
    const { platform, factory } = fixture
    const vault = await createInstance(fixture, alice)

    // An honest deposit and withdraw leaves the seed in place.
    await vault.write.deposit({ value: parseEther("0.5") })
    await vault.write.withdraw()

    assert.equal(
      await factory.read.validateInstance([
        vault.address,
        alice.account.address,
      ]),
      false
    )
    await viem.assertions.revertWithCustomError(
      platform.write.submit([0n, 0n], { account: alice.account }),
      platform,
      "NotSolved"
    )
  })

  it("does not count another player's instance", async function () {
    const fixture = await networkHelpers.loadFixture(deploy)
    const { factory, seed } = fixture
    const theirs = await createInstance(fixture, bob)

    // Alice drains Bob's vault: solved for Bob, never for her.
    await attack(theirs, alice, seed)

    assert.equal(
      await factory.read.validateInstance([
        theirs.address,
        alice.account.address,
      ]),
      false
    )
    assert.equal(
      await factory.read.validateInstance([
        theirs.address,
        bob.account.address,
      ]),
      true
    )
  })

  it("reverts createInstance cleanly when the factory is dry", async function () {
    const { platform, factory, seed } = await networkHelpers.loadFixture(deploy)
    // `bind` checks the funding and `recover` is locked during the CTF, so the
    // factory cannot run dry normally: empty it by hand.
    await networkHelpers.setBalance(factory.address, 0n)

    await viem.assertions.revertWithCustomErrorWithArgs(
      platform.write.createInstance([0n, 0n], { account: bob.account }),
      factory,
      "InsufficientFunds",
      [0n, seed]
    )
    assert.equal(
      await platform.read.instanceOf([0n, 0n, bob.account.address]),
      "0x0000000000000000000000000000000000000000"
    )
  })

  it("lets only the organizer recover the rest, after the CTF", async function () {
    const fixture = await networkHelpers.loadFixture(deploy)
    const { factory, seed, endTime } = fixture
    await createInstance(fixture, alice)

    await viem.assertions.revertWithCustomError(
      factory.write.recover({ account: organizer.account }),
      factory,
      "CTFNotOver"
    )

    await networkHelpers.time.increaseTo(endTime)

    await viem.assertions.revertWithCustomError(
      factory.write.recover({ account: alice.account }),
      factory,
      "NotOrganizer"
    )

    const remaining = await publicClient.getBalance({
      address: factory.address,
    })
    assert.equal(remaining, (MAX_PLAYERS - 1n) * seed)
    const before = await publicClient.getBalance({
      address: organizer.account.address,
    })
    const hash = await factory.write.recover({ account: organizer.account })
    const gas = await gasCost(hash)

    assert.equal(
      await publicClient.getBalance({ address: organizer.account.address }),
      before - gas + remaining
    )
    assert.equal(
      await publicClient.getBalance({ address: factory.address }),
      0n
    )
  })

  it("rejects createInstance outside the platform", async function () {
    const { factory } = await networkHelpers.loadFixture(deploy)

    await viem.assertions.revertWithCustomError(
      factory.write.createInstance([alice.account.address], {
        account: alice.account,
      }),
      factory,
      "OnlyPlatform"
    )
  })

  it("keeps validateInstance under the platform gas limit", async function () {
    const fixture = await networkHelpers.loadFixture(deploy)
    const { platform, factory, seed } = fixture
    const vault = await createInstance(fixture, alice)
    await attack(vault, alice, seed)

    assert.equal(await platform.read.VALIDATION_GAS(), VALIDATION_GAS)
    // Upper bound: includes the 21,000 intrinsic gas of a transaction.
    const gas = await publicClient.estimateGas({
      account: alice.account.address,
      to: factory.address,
      data: encodeFunctionData({
        abi: factory.abi,
        functionName: "validateInstance",
        args: [vault.address, alice.account.address],
      }),
    })
    assert.ok(gas < VALIDATION_GAS, `validateInstance used ${gas} gas`)
  })
})
