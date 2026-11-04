import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { network } from "hardhat"
import { getAddress, parseEther, parseEventLogs, type Address } from "viem"

// Épreuve 1, Coffre : l'exploit joué comme un joueur, avec un contrat d'attaque.
describe("Épreuve 1 : Coffre (réentrance)", async function () {
  const { viem, networkHelpers } = await network.create()
  const publicClient = await viem.getPublicClient()
  const [platform, player, other] = await viem.getWalletClients()
  const SEED = parseEther("0.0001")

  async function deployFundedFactory() {
    const factory = await viem.deployContract("VaultFactory", [
      platform.account.address,
      SEED,
    ])
    // L'organisateur alimente la factory pour 5 instances.
    await platform.sendTransaction({ to: factory.address, value: SEED * 5n })
    return { factory }
  }

  async function createInstance(who: Address) {
    const { factory } = await networkHelpers.loadFixture(deployFundedFactory)
    const hash = await factory.write.createInstance([who])
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    const [created] = parseEventLogs({
      abi: factory.abi,
      logs: receipt.logs,
      eventName: "InstanceCreated",
    })
    const vault = await viem.getContractAt("Vault", created.args.instance)
    return { factory, vault }
  }

  it("crée un coffre avec le solde de départ, non résolu", async function () {
    const { factory, vault } = await createInstance(player.account.address)

    assert.equal(
      await publicClient.getBalance({ address: vault.address }),
      SEED
    )
    assert.equal(
      await factory.read.playerOf([vault.address]),
      getAddress(player.account.address)
    )
    assert.equal(
      await factory.read.validateInstance([
        vault.address,
        player.account.address,
      ]),
      false
    )
  })

  it("vide le coffre par réentrance et valide l'épreuve", async function () {
    const { factory, vault } = await createInstance(player.account.address)

    const attack = await viem.deployContract("VaultAttack", [vault.address], {
      client: { wallet: player },
    })
    await attack.write.run({
      value: await publicClient.getBalance({ address: vault.address }),
    })

    assert.equal(await publicClient.getBalance({ address: vault.address }), 0n)
    assert.equal(
      await factory.read.validateInstance([
        vault.address,
        player.account.address,
      ]),
      true
    )
  })

  it("ne valide pas l'instance d'un autre joueur", async function () {
    const { factory, vault } = await createInstance(player.account.address)

    const attack = await viem.deployContract("VaultAttack", [vault.address], {
      client: { wallet: other },
    })
    await attack.write.run({ value: SEED })

    assert.equal(
      await factory.read.validateInstance([
        vault.address,
        other.account.address,
      ]),
      false
    )
  })

  it("refuse createInstance hors de la plateforme", async function () {
    const { factory } = await networkHelpers.loadFixture(deployFundedFactory)

    await viem.assertions.revertWithCustomError(
      factory.write.createInstance([player.account.address], {
        account: other.account,
      }),
      factory,
      "OnlyPlatform"
    )
  })

  it("refuse de créer un coffre si la factory n'est pas alimentée", async function () {
    const empty = await viem.deployContract("VaultFactory", [
      platform.account.address,
      SEED,
    ])

    await viem.assertions.revertWithCustomErrorWithArgs(
      empty.write.createInstance([player.account.address]),
      empty,
      "InsufficientFunds",
      [0n, SEED]
    )
  })
})
