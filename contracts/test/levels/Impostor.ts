import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { network } from "hardhat"
import { encodeFunctionData, getAddress, parseEther } from "viem"

const HOUR = 3600n
const VALIDATION_GAS = 300_000n

// Level 2, Impostor: the exploit played as a player would, through CTFPlatform,
// with an intermediate contract between the wallet and `changeOwner`.
describe("Level 2: Impostor (tx.origin)", async function () {
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
    const factory = await viem.deployContract("ImpostorFactory", [
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
          title: "Impostor",
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
    return viem.getContractAt("Impostor", address, {
      client: { wallet: player },
    })
  }

  /** What a player does: deploy an attack contract and call it from their wallet. */
  async function exploit(target: `0x${string}`, player: typeof alice) {
    const attack = await viem.deployContract("ImpostorAttack", [], {
      client: { wallet: player },
    })
    await attack.write.run([target], { account: player.account })
  }

  it("takes ownership through a contract and validates the level", async function () {
    const fixture = await networkHelpers.loadFixture(deploy)
    const { platform, factory } = fixture
    const impostor = await createInstance(fixture, alice)

    assert.equal(await impostor.read.owner(), getAddress(factory.address))
    assert.equal(
      await factory.read.validateInstance([
        impostor.address,
        alice.account.address,
      ]),
      false
    )

    await exploit(impostor.address, alice)

    assert.equal(await impostor.read.owner(), getAddress(alice.account.address))
    assert.equal(
      await factory.read.validateInstance([
        impostor.address,
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

  it("does not change the owner on a direct call from the wallet", async function () {
    const fixture = await networkHelpers.loadFixture(deploy)
    const { platform, factory } = fixture
    const impostor = await createInstance(fixture, alice)

    await impostor.write.changeOwner([alice.account.address])

    assert.equal(await impostor.read.owner(), getAddress(factory.address))
    assert.equal(
      await factory.read.validateInstance([
        impostor.address,
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

  it("does not let a rival take Bob's instance before his exploit", async function () {
    const fixture = await networkHelpers.loadFixture(deploy)
    const { factory } = fixture
    const theirs = await createInstance(fixture, bob)

    // Alice goes through her own attack contract: `tx.origin` is not Bob.
    await exploit(theirs.address, alice)

    assert.equal(await theirs.read.owner(), getAddress(factory.address))
    assert.equal(
      await factory.read.validateInstance([
        theirs.address,
        alice.account.address,
      ]),
      false
    )
  })

  it("does not let a rival take Bob's instance after his exploit", async function () {
    const fixture = await networkHelpers.loadFixture(deploy)
    const { platform, factory } = fixture
    const theirs = await createInstance(fixture, bob)

    await exploit(theirs.address, bob)
    // Alice tries to overwrite the owner between Bob's exploit and his submit.
    await exploit(theirs.address, alice)

    assert.equal(await theirs.read.owner(), getAddress(bob.account.address))
    assert.equal(
      await factory.read.validateInstance([
        theirs.address,
        alice.account.address,
      ]),
      false
    )
    await platform.write.submit([0n, 0n], { account: bob.account })
    assert.equal(
      await platform.read.isSolved([0n, 0n, bob.account.address]),
      true
    )
  })

  it("does not count another player's solved instance", async function () {
    const fixture = await networkHelpers.loadFixture(deploy)
    const { factory } = fixture
    const theirs = await createInstance(fixture, bob)
    await exploit(theirs.address, bob)

    assert.equal(
      await factory.read.validateInstance([
        theirs.address,
        alice.account.address,
      ]),
      false
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
    const impostor = await createInstance(fixture, alice)
    await exploit(impostor.address, alice)

    // Upper bound: includes the 21,000 intrinsic gas of a transaction.
    const gas = await publicClient.estimateGas({
      account: alice.account.address,
      to: factory.address,
      data: encodeFunctionData({
        abi: factory.abi,
        functionName: "validateInstance",
        args: [impostor.address, alice.account.address],
      }),
    })
    assert.ok(gas < VALIDATION_GAS, `validateInstance used ${gas} gas`)
  })
})
