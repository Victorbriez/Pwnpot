import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { network } from "hardhat"
import { getAddress, parseEventLogs, type Address } from "viem"

// Épreuve 2, Usurpateur : l'exploit joué comme un joueur, via un contrat intermédiaire.
describe("Épreuve 2 : Usurpateur (tx.origin)", async function () {
  const { viem, networkHelpers } = await network.create()
  const publicClient = await viem.getPublicClient()
  const [platform, player, other] = await viem.getWalletClients()

  async function deployFactory() {
    const factory = await viem.deployContract("ImpostorFactory", [
      platform.account.address,
    ])
    return { factory }
  }

  async function createInstance(who: Address) {
    const { factory } = await networkHelpers.loadFixture(deployFactory)
    const hash = await factory.write.createInstance([who])
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    const [created] = parseEventLogs({
      abi: factory.abi,
      logs: receipt.logs,
      eventName: "InstanceCreated",
    })
    const impostor = await viem.getContractAt(
      "Impostor",
      created.args.instance,
      { client: { wallet: player } }
    )
    return { factory, impostor }
  }

  it("appeler changeOwner depuis son wallet ne marche pas", async function () {
    const { factory, impostor } = await createInstance(player.account.address)

    await impostor.write.changeOwner([player.account.address])

    assert.equal(await impostor.read.owner(), getAddress(factory.address))
    assert.equal(
      await factory.read.validateInstance([
        impostor.address,
        player.account.address,
      ]),
      false
    )
  })

  it("prend la propriété via un contrat intermédiaire et valide l'épreuve", async function () {
    const { factory, impostor } = await createInstance(player.account.address)

    const attack = await viem.deployContract("ImpostorAttack", [], {
      client: { wallet: player },
    })
    await attack.write.run([impostor.address])

    assert.equal(
      await impostor.read.owner(),
      getAddress(player.account.address)
    )
    assert.equal(
      await factory.read.validateInstance([
        impostor.address,
        player.account.address,
      ]),
      true
    )
  })

  it("s'emparer de l'instance d'un autre ne valide rien", async function () {
    const { factory, impostor } = await createInstance(player.account.address)

    const attack = await viem.deployContract("ImpostorAttack", [], {
      client: { wallet: other },
    })
    await attack.write.run([impostor.address])

    assert.equal(
      await factory.read.validateInstance([
        impostor.address,
        other.account.address,
      ]),
      false
    )
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
