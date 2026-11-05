import {
  BaseError,
  ContractFunctionRevertedError,
  UserRejectedRequestError,
} from "viem"

/**
 * Message lisible pour une transaction échouée. Un revert du contrat donne le
 * nom de sa custom error (ex. « TicketPriceTooLow »), pas un message générique.
 */
export function describeTxError(error: unknown): string {
  if (error instanceof BaseError) {
    const reverted = error.walk(
      (e) => e instanceof ContractFunctionRevertedError
    )
    if (reverted instanceof ContractFunctionRevertedError) {
      if (reverted.data?.errorName) return reverted.data.errorName
      if (reverted.reason) return reverted.reason
    }
    if (error.walk((e) => e instanceof UserRejectedRequestError)) {
      return "Transaction refusée dans le wallet."
    }
    return error.shortMessage
  }
  return error instanceof Error ? error.message : "Erreur inconnue."
}

/** Étapes d'une transaction affichées à l'utilisateur. */
export type TxStatus = "idle" | "signing" | "confirming" | "success" | "error"
