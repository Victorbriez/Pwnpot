import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { network } from "hardhat"
import { parseEther, zeroAddress } from "viem"

const HOUR = 3600n
const CONTESTATION = 48n * HOUR

// Parcours de bout en bout tel que le frontend le jouera : chaque étape passe
// par le wallet d'un acteur, et l'état est relu depuis le contrat et ses events.
describe("CTFPlatform (bout en bout)", async function () {
  const { viem, networkHelpers } = await network.create()
  const publicClient = await viem.getPublicClient()
  const [deployer, organizer, alice, bob, arbitrator] =
    await viem.getWalletClients()

  async function deploy() {
    const platform = await viem.deployContract("CTFPlatform", [
      arbitrator.account.address,
      CONTESTATION,
      48n * HOUR,
      24n * HOUR,
      7n * 24n * HOUR,
    ])
    const level = await viem.deployContract("TestLevel")
    return { platform, level }
  }

  it("crée un CTF, joue, finalise et paie au podium (67 / 33)", async function () {
    const { platform, level } = await networkHelpers.loadFixture(deploy)
    const now = BigInt(await networkHelpers.time.latest())
    const cashPrize = parseEther("1")
    const ticketPrice = parseEther("0.01")
    const maxPlayers = 20n
    const organizerBond = cashPrize + maxPlayers * ticketPrice
    const startTime = now + HOUR
    const endTime = startTime + 24n * HOUR

    await viem.assertions.emitWithArgs(
      platform.write.createCTF(
        [
          {
            title: "Demo",
            startTime,
            endTime,
            ticketPrice,
            maxPlayers,
            cashPrize,
            organizerBond,
          },
          [level.address],
        ],
        { account: organizer.account, value: cashPrize + organizerBond }
      ),
      platform,
      "CTFCreated",
      [0n, organizer.account.address]
    )

    for (const player of [alice, bob]) {
      await platform.write.buyTicket([0n], {
        account: player.account,
        value: ticketPrice,
      })
    }

    await networkHelpers.time.increaseTo(startTime)

    for (const player of [alice, bob]) {
      await platform.write.createInstance([0n, 0n], { account: player.account })
      const instanceAddress = await platform.read.instanceOf([
        0n,
        0n,
        player.account.address,
      ])
      const instance = await viem.getContractAt("TestInstance", instanceAddress)
      await instance.write.solve({ account: player.account })
      await platform.write.submit([0n, 0n], { account: player.account })
    }

    const podium = await platform.read.getPodium([0n])
    assert.equal(podium[0].toLowerCase(), alice.account.address.toLowerCase())
    assert.equal(podium[1].toLowerCase(), bob.account.address.toLowerCase())
    assert.equal(podium[2], zeroAddress)

    await networkHelpers.time.increaseTo(endTime + CONTESTATION)
    // N'importe qui peut finaliser, ici le déployeur.
    await viem.assertions.emitWithArgs(
      platform.write.finalize([0n], { account: deployer.account }),
      platform,
      "Finalized",
      [0n, false]
    )

    const pot = cashPrize + 2n * ticketPrice
    const second = (pot * 33n) / 100n
    const payouts = [
      [alice, pot - second],
      [bob, second],
      [organizer, organizerBond],
    ] as const
    for (const [account, amount] of payouts) {
      assert.equal(await platform.read.owed([account.account.address]), amount)
      await viem.assertions.emitWithArgs(
        platform.write.withdraw({ account: account.account }),
        platform,
        "Withdrawn",
        [
          (to: string) =>
            to.toLowerCase() === account.account.address.toLowerCase(),
          amount,
        ]
      )
    }

    assert.equal(
      await publicClient.getBalance({ address: platform.address }),
      0n
    )
    await viem.assertions.revertWithCustomError(
      platform.write.withdraw({ account: alice.account }),
      platform,
      "NothingToWithdraw"
    )
  })
})
