import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { network } from "hardhat"
import { keccak256, parseEventLogs, toHex, type Address } from "viem"

// Épreuve 3, Coffre-fort à code : l'exploit joué comme un joueur, en lisant le storage.
describe("Épreuve 3 : Coffre-fort à code (storage private)", async function () {
  const { viem, networkHelpers } = await network.create()
  const publicClient = await viem.getPublicClient()
  const [platform, player, other] = await viem.getWalletClients()

  async function deployFactory() {
    const factory = await viem.deployContract("CodeSafeFactory", [
      platform.account.address,
    ])
    return { factory }
  }

  type Factory = Awaited<ReturnType<typeof deployFactory>>["factory"]

  // Sans loadFixture : deux instances créées à la suite restent sur la même chaîne.
  async function createInstanceOn(factory: Factory, who: Address) {
    const hash = await factory.write.createInstance([who])
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    const [created] = parseEventLogs({
      abi: factory.abi,
      logs: receipt.logs,
      eventName: "InstanceCreated",
    })
    const safe = await viem.getContractAt("CodeSafe", created.args.instance, {
      client: { wallet: player },
    })
    return safe
  }

  async function createInstance(who: Address) {
    const { factory } = await networkHelpers.loadFixture(deployFactory)
    return { factory, safe: await createInstanceOn(factory, who) }
  }

  /** Ce que ferait le joueur avec `cast storage` : lire le slot 1. */
  async function readPassword(address: Address) {
    const value = await publicClient.getStorageAt({ address, slot: toHex(1) })
    assert.ok(value, "slot 1 vide")
    return value
  }

  it("un mauvais mot de passe ne déverrouille rien", async function () {
    const { factory, safe } = await createInstance(player.account.address)

    await safe.write.unlock([keccak256(toHex("devine"))])

    assert.equal(await safe.read.locked(), true)
    assert.equal(
      await factory.read.validateInstance([
        safe.address,
        player.account.address,
      ]),
      false
    )
  })

  it("lit le mot de passe dans le storage, déverrouille et valide l'épreuve", async function () {
    const { factory, safe } = await createInstance(player.account.address)

    await safe.write.unlock([await readPassword(safe.address)])

    assert.equal(await safe.read.locked(), false)
    assert.equal(
      await factory.read.validateInstance([
        safe.address,
        player.account.address,
      ]),
      true
    )
  })

  it("le mot de passe d'une autre instance ne sert à rien", async function () {
    const { factory } = await networkHelpers.loadFixture(deployFactory)
    const mine = await createInstanceOn(factory, player.account.address)
    const theirs = await createInstanceOn(factory, other.account.address)

    await mine.write.unlock([await readPassword(theirs.address)])

    assert.equal(await mine.read.locked(), true)
  })

  it("refuse createInstance hors de la plateforme", async function () {
    const { factory } = await networkHelpers.loadFixture(deployFactory)

    await viem.assertions.revertWithCustomError(
      factory.write.createInstance([player.account.address], {
        account: other.account,
      }),
      factory,
      "OnlyPlatform"
    )
  })
})
