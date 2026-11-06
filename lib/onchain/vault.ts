// Reconnaître une VaultFactory à son code. Chaque organisateur déploie la
// sienne : l'adresse change à chaque CTF, mais le code déployé est celui du
// repo, aux variables `immutable` près (platform, organizer).
import type { Hex } from "viem"

import {
  vaultFactoryDeployedBytecode,
  vaultFactoryImmutables,
} from "@/lib/onchain/level-artifacts"

/** Remplace par des zéros les octets des `immutable`. */
function maskImmutables(code: string): string {
  let masked = code.toLowerCase()
  for (const { start, length } of vaultFactoryImmutables) {
    // 2 caractères hex par octet, après le préfixe « 0x ».
    const from = 2 + start * 2
    masked =
      masked.slice(0, from) +
      "0".repeat(length * 2) +
      masked.slice(from + length * 2)
  }
  return masked
}

const expected = maskImmutables(vaultFactoryDeployedBytecode)

/** Vrai si `code` est celui de VaultFactory (hors `immutable`). */
export function isVaultFactoryCode(code: Hex | undefined): boolean {
  return (
    code !== undefined &&
    code.length === expected.length &&
    maskImmutables(code) === expected
  )
}
