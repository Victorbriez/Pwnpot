import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { network } from "hardhat"
import {
  encodeFunctionData,
  keccak256,
  parseEther,
  toHex,
  type Address,
} from "viem"

const HOUR = 3600n
const VALIDATION_GAS = 300_000n
const PASSWORD_SLOT = toHex(1, { size: 32 })

// Level 3, Code Safe: the exploit played as a player would, through CTFPlatform,
// by reading the "private" password straight from storage.
describe("Level 3: Code Safe (private storage)", async function () {
  const { viem, networkHelpers } = await network.create()
  const publicClient = await viem.getPublicClient()
  const [, organizer, alice, bob, arbitrator] = await viem.getWalletClients()

  async function deploy() {
    const platform = await viem.deployContract("CTFPlatform", [
      arbitrator.account.address,
      48n * HOUR,
      48n * HOUR,
      24n * HOUR,
      7n * 24n * HOUR,
    ])
    const factory = await viem.deployContract("CodeSafeFactory", [
      platform.address,
    ])

    const now = BigInt(await networkHelpers.time.latest())
    const cashPrize = parseEther("1")
    const ticketPrice = parseEther("0.01")
    const maxPlayers = 20n
    const organizerBond = cashPrize + maxPlayers * ticketPrice
    const startTime = now + HOUR
    await platform.write.createCTF(
      [
        {
          title: "Code Safe",
          startTime,
          endTime: startTime + 24n * HOUR,
          ticketPrice,
          maxPlayers,
          cashPrize,
          organizerBond,
        },
        [factory.address],
      ],
      { account: organizer.account, value: cashPrize + organizerBond }
    )
    for (const player of [alice, bob]) {
      await platform.write.buyTicket([0n], {
        account: player.account,
        value: ticketPrice,
      })
    }
    await networkHelpers.time.increaseTo(startTime)

    return { platform, factory }
  }

  type Fixture = Awaited<ReturnType<typeof deploy>>

  /** Creates the caller's instance through the platform, as the frontend does. */
  async function createInstance({ platform }: Fixture, player: typeof alice) {
    await platform.write.createInstance([0n, 0n], { account: player.account })
    const address = await platform.read.instanceOf([
      0n,
      0n,
      player.account.address,
    ])
    return viem.getContractAt("CodeSafe", address, {
      client: { wallet: player },
    })
  }

  /** What a player does with `cast storage`: read slot 1. */
  async function readPassword(address: Address) {
    const value = await publicClient.getStorageAt({
      address,
      slot: PASSWORD_SLOT,
    })
    assert.ok(value, "slot 1 is empty")
    return value
  }

  it("reads the password from storage, unlocks and validates the level", async function () {
    const fixture = await networkHelpers.loadFixture(deploy)
    const { platform, factory } = fixture
    const safe = await createInstance(fixture, alice)

    assert.equal(
      await factory.read.validateInstance([
        safe.address,
        alice.account.address,
      ]),
      false
    )

    await safe.write.unlock([await readPassword(safe.address)])

    assert.equal(await safe.read.locked(), false)
    assert.equal(
      await factory.read.validateInstance([
        safe.address,
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
    const safe = await createInstance(fixture, alice)

    await safe.write.unlock([keccak256(toHex("guess"))])

    assert.equal(await safe.read.locked(), true)
    assert.equal(
      await factory.read.validateInstance([
        safe.address,
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

  it("rejects the password of another instance", async function () {
    const fixture = await networkHelpers.loadFixture(deploy)
    const mine = await createInstance(fixture, alice)
    const theirs = await createInstance(fixture, bob)

    const myPassword = await readPassword(mine.address)
    const theirPassword = await readPassword(theirs.address)
    assert.notEqual(myPassword, theirPassword)

    await mine.write.unlock([theirPassword])

    assert.equal(await mine.read.locked(), true)
  })

  it("does not count another player's instance", async function () {
    const fixture = await networkHelpers.loadFixture(deploy)
    const { factory } = fixture
    const theirs = await createInstance(fixture, bob)

    // Alice unlocks Bob's safe: it is solved for Bob, never for her.
    await theirs.write.unlock([await readPassword(theirs.address)], {
      account: alice.account,
    })

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
    const { factory } = fixture
    const safe = await createInstance(fixture, alice)
    await safe.write.unlock([await readPassword(safe.address)])

    // Upper bound: includes the 21,000 intrinsic gas of a transaction.
    const gas = await publicClient.estimateGas({
      account: alice.account.address,
      to: factory.address,
      data: encodeFunctionData({
        abi: factory.abi,
        functionName: "validateInstance",
        args: [safe.address, alice.account.address],
      }),
    })
    assert.ok(gas < VALIDATION_GAS, `validateInstance used ${gas} gas`)
  })
})
